import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicationStatus } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { MailService } from '../../services/mailgun/mail.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateHeroDto } from './dto/create-hero.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';

@Injectable()
export class HeroesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
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

  /** Heroes owned by the current user (any status). */
  findMine(user: JwtUser) {
    return this.prisma.hero.findMany({
      where: { userId: user.sub },
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
  async create(dto: CreateHeroDto, user: JwtUser) {
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
        owner: { connect: { id: user.sub } },
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

  async approve(id: number) {
    const hero = await this.prisma.hero.update({
      where: { id },
      data: { status: PublicationStatus.APPROVED, statusReason: null },
      include: { owner: { select: { email: true, firstname: true } } },
    });
    if (hero.owner?.email) {
      await this.mail
        .sendContentApproved(hero.owner.email, hero.owner.firstname ?? hero.owner.email, hero.title)
        .catch(() => {});
    }
    return hero;
  }

  async reject(id: number, reason: string) {
    const hero = await this.prisma.hero.update({
      where: { id },
      data: { status: PublicationStatus.REJECTED, statusReason: reason },
      include: { owner: { select: { email: true, firstname: true } } },
    });
    if (hero.owner?.email) {
      await this.mail
        .sendContentRejected(hero.owner.email, hero.owner.firstname ?? hero.owner.email, hero.title, reason)
        .catch(() => {});
    }
    return hero;
  }

  async ban(id: number, reason: string) {
    const hero = await this.prisma.hero.update({
      where: { id },
      data: { status: PublicationStatus.BANNED, statusReason: reason },
      include: { owner: { select: { email: true, firstname: true } } },
    });
    if (hero.owner?.email) {
      await this.mail
        .sendContentBanned(hero.owner.email, hero.owner.firstname ?? hero.owner.email, hero.title, reason)
        .catch(() => {});
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
