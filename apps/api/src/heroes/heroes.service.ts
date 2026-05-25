import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicationStatus, UserType } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../../services/mailgun/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateHeroDto } from './dto/create-hero.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';
import type { OrgContextDto } from '../common/org-context/org-context.types';

@Injectable()
export class HeroesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private pricePerDay(): number {
    return Number(this.config.get('HERO_PRICE_PER_DAY')) || 15000;
  }

  private maxActive(): number {
    return Number(this.config.get('HERO_MAX_ACTIVE')) || 5;
  }

  private maxDays(): number {
    return Number(this.config.get('HERO_MAX_DAYS')) || 30;
  }

  private countActive(): Promise<number> {
    return this.prisma.hero.count({
      where: { status: PublicationStatus.APPROVED, expirationDate: { gte: new Date() } },
    });
  }

  /** Active heroes — approved and not expired. Shown in the home hero carousel. */
  findActive() {
    return this.prisma.hero.findMany({
      where: { status: PublicationStatus.APPROVED, expirationDate: { gte: new Date() } },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Heroes owned by the current user or org (any status). */
  findMine(user: JwtUser, orgContext: OrgContextDto | null = null) {
    const ownerId = orgContext?.orgId ?? user.sub;
    return this.prisma.hero.findMany({
      where: { userId: ownerId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Quota + pricing — for the UI to show availability before creating one. */
  async quota() {
    const active = await this.countActive();
    const max = this.maxActive();
    return {
      max,
      active,
      available: Math.max(0, max - active),
      pricePerDay: this.pricePerDay(),
      maxDays: this.maxDays(),
    };
  }

  /** Crea un hero en DRAFT. Los días, monto y expiración se asignan al confirmar el pago. */
  async create(dto: CreateHeroDto, user: JwtUser, orgContext: OrgContextDto | null = null) {
    const ownerId = orgContext?.orgId ?? user.sub;
    return this.prisma.hero.create({
      data: {
        title: dto.title,
        titleAccent: dto.titleAccent,
        lead: dto.lead,
        image: dto.image,
        date: dto.date ? new Date(dto.date) : null,
        place: dto.place,
        link: dto.link,
        category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
        owner: { connect: { id: ownerId } },
        status: PublicationStatus.DRAFT,
      },
      include: { category: true },
    });
  }

  async update(id: number, dto: UpdateHeroDto, user: JwtUser) {
    const hero = await this.ensure(id);
    this.assertCanManage(hero, user);
    return this.prisma.hero.update({
      where: { id },
      data: {
        title: dto.title,
        titleAccent: dto.titleAccent,
        lead: dto.lead,
        image: dto.image,
        place: dto.place,
        link: dto.link,
        ...(dto.date !== undefined ? { date: dto.date ? new Date(dto.date) : null } : {}),
        ...(dto.categoryId !== undefined
          ? {
              category: dto.categoryId
                ? { connect: { id: dto.categoryId } }
                : { disconnect: true },
            }
          : {}),
      },
      include: { category: true },
    });
  }

  async remove(id: number, user: JwtUser) {
    const hero = await this.ensure(id);
    this.assertCanManage(hero, user);
    await this.prisma.hero.delete({ where: { id } });
    return { deleted: true };
  }

  // ─────────────────────── Moderación ───────────────────────

  async approve(id: number, actor: JwtUser, req?: Request) {
    const hero = await this.prisma.hero.update({
      where: { id },
      data: { status: PublicationStatus.APPROVED, statusReason: null },
      include: { owner: { select: { id: true, email: true, firstname: true, type: true } } },
    });
    this.audit.log({ userId: actor.sub, action: 'APPROVE', entity: 'PORTADA', entityId: id, req });
    if (hero.owner?.email) {
      await this.mail
        .sendContentApproved(hero.owner.email, hero.owner.firstname ?? hero.owner.email, hero.title)
        .catch(() => {});
    }
    if (hero.owner) {
      const rcpt = hero.owner.type === UserType.ORGANIZATION
        ? { orgId: hero.owner.id }
        : { userId: hero.owner.id };
      this.notifications.create({
        type: 'HERO_APPROVED',
        title: `Tu portada "${hero.title}" fue aprobada`,
        payload: { heroId: id },
        ...rcpt,
      });
    }
    return hero;
  }

  async reject(id: number, reason: string, actor: JwtUser, req?: Request) {
    const hero = await this.prisma.hero.update({
      where: { id },
      data: { status: PublicationStatus.REJECTED, statusReason: reason },
      include: { owner: { select: { id: true, email: true, firstname: true, type: true } } },
    });
    this.audit.log({ userId: actor.sub, action: 'REJECT', entity: 'PORTADA', entityId: id, metadata: { reason }, req });
    if (hero.owner?.email) {
      await this.mail
        .sendContentRejected(hero.owner.email, hero.owner.firstname ?? hero.owner.email, hero.title, reason)
        .catch(() => {});
    }
    if (hero.owner) {
      const rcpt = hero.owner.type === UserType.ORGANIZATION
        ? { orgId: hero.owner.id }
        : { userId: hero.owner.id };
      this.notifications.create({
        type: 'HERO_REJECTED',
        title: `Tu portada "${hero.title}" fue rechazada`,
        body: reason,
        payload: { heroId: id, reason },
        ...rcpt,
      });
    }
    return hero;
  }

  async ban(id: number, reason: string, actor: JwtUser, req?: Request) {
    const hero = await this.prisma.hero.update({
      where: { id },
      data: { status: PublicationStatus.BANNED, statusReason: reason },
      include: { owner: { select: { id: true, email: true, firstname: true, type: true } } },
    });
    this.audit.log({ userId: actor.sub, action: 'BAN', entity: 'PORTADA', entityId: id, metadata: { reason }, req });
    if (hero.owner?.email) {
      await this.mail
        .sendContentBanned(hero.owner.email, hero.owner.firstname ?? hero.owner.email, hero.title, reason)
        .catch(() => {});
    }
    if (hero.owner) {
      const rcpt = hero.owner.type === UserType.ORGANIZATION
        ? { orgId: hero.owner.id }
        : { userId: hero.owner.id };
      this.notifications.create({
        type: 'HERO_BANNED',
        title: `Tu portada "${hero.title}" fue eliminada`,
        body: reason,
        payload: { heroId: id, reason },
        ...rcpt,
      });
    }
    return hero;
  }

  /** Valida que haya cupo disponible; lanza excepción si no. */
  async assertQuotaAvailable() {
    if ((await this.countActive()) >= this.maxActive()) {
      throw new BadRequestException('No hay cupos disponibles para heroes en este momento');
    }
  }

  /** Valida que los días no superen el máximo permitido. */
  assertMaxDays(days: number) {
    const max = this.maxDays();
    if (days > max) {
      throw new BadRequestException(`Un hero se puede publicar por un máximo de ${max} días`);
    }
  }

  private async ensure(id: number) {
    const hero = await this.prisma.hero.findUnique({ where: { id } });
    if (!hero) throw new NotFoundException('Hero no encontrado');
    return hero;
  }

  private assertCanManage(hero: { userId: number }, user: JwtUser) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isAdmin && hero.userId !== user.sub) {
      throw new ForbiddenException('No puedes gestionar este hero');
    }
  }
}
