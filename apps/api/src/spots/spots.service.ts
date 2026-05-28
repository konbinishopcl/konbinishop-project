import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublicationStatus, UserType } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../../services/mailgun/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import type { OrgContextDto } from '../common/org-context/org-context.types';

@Injectable()
export class SpotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private maxActive(): Promise<number> {
    return this.settings.getNum('SPOT_MAX_ACTIVE');
  }

  private maxDays(): Promise<number> {
    return this.settings.getNum('SPOT_MAX_DAYS');
  }

  private pricePerDay(): Promise<number> {
    return this.settings.getNum('SPOT_PRICE_PER_DAY');
  }

  private countActive(): Promise<number> {
    return this.prisma.spot.count({
      where: { status: PublicationStatus.APPROVED, expirationDate: { gte: new Date() } },
    });
  }

  /** Quota + pricing — para que el frontend muestre disponibilidad antes de crear. */
  async quota() {
    const [active, max, pricePerDay, maxDays] = await Promise.all([
      this.countActive(),
      this.maxActive(),
      this.pricePerDay(),
      this.maxDays(),
    ]);
    return {
      max,
      active,
      available: Math.max(0, max - active),
      pricePerDay,
      maxDays,
    };
  }

  /** List spots. Public: APPROVED + non-expired only. Admin: all statuses (or filtered by ?status=), includes owner. */
  async findAll(
    query: { status?: PublicationStatus; page?: number; pageSize?: number },
    user?: JwtUser | null,
  ) {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? (isAdmin ? 20 : 12), isAdmin ? 100 : 50);

    const where: Prisma.SpotWhereInput = {
      ...(!isAdmin && {
        status: PublicationStatus.APPROVED,
        OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
      }),
      ...(isAdmin && query.status
        ? { status: query.status }
        : isAdmin
          ? { status: { not: PublicationStatus.PENDING_PAYMENT } }
          : {}),
    };

    const include = isAdmin
      ? { owner: { select: { id: true, firstname: true, lastname: true, email: true, handle: true } } }
      : undefined;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.spot.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.spot.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /** Spots del usuario actual o de la org (cualquier estado). */
  findMine(user: JwtUser, orgContext: OrgContextDto | null = null) {
    const ownerId = orgContext?.orgId ?? user.sub;
    return this.prisma.spot.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Crea un spot en DRAFT. Los días y la expiración se asignan al confirmar el pago. */
  create(dto: CreateSpotDto, user: JwtUser, orgContext: OrgContextDto | null = null) {
    const ownerId = orgContext?.orgId ?? user.sub;
    return this.prisma.spot.create({
      data: {
        title: dto.title,
        image: dto.image,
        linkType: dto.linkType,
        linkValue: dto.linkValue,
        status: PublicationStatus.DRAFT,
        owner: { connect: { id: ownerId } },
      },
    });
  }

  async update(id: number, dto: UpdateSpotDto, user: JwtUser) {
    const spot = await this.ensure(id);
    this.assertCanManage(spot, user);
    return this.prisma.spot.update({
      where: { id },
      data: {
        title: dto.title,
        image: dto.image,
        linkType: dto.linkType,
        linkValue: dto.linkValue,
      },
    });
  }

  async remove(id: number, user: JwtUser) {
    const spot = await this.ensure(id);
    this.assertCanManage(spot, user);
    await this.prisma.spot.delete({ where: { id } });
    return { deleted: true };
  }

  // ─────────────────────── Moderación ───────────────────────

  async approve(id: number, actor: JwtUser, req?: Request) {
    const spot = await this.prisma.spot.update({
      where: { id },
      data: { status: PublicationStatus.APPROVED, statusReason: null },
      include: { owner: { select: { id: true, email: true, firstname: true, type: true } } },
    });
    this.audit.log({ userId: actor.sub, action: 'APPROVE', entity: 'AVISO', entityId: id, req });
    if (spot.owner?.email) {
      await this.mail
        .sendContentApproved(spot.owner.email, spot.owner.firstname ?? spot.owner.email, spot.title)
        .catch(() => {});
    }
    if (spot.owner) {
      const rcpt = spot.owner.type === UserType.ORGANIZATION
        ? { orgId: spot.owner.id }
        : { userId: spot.owner.id };
      this.notifications.create({
        type: 'SPOT_APPROVED',
        title: `Tu aviso "${spot.title}" fue aprobado`,
        payload: { spotId: id },
        ...rcpt,
      });
    }
    return spot;
  }

  async reject(id: number, reason: string, actor: JwtUser, req?: Request) {
    const spot = await this.prisma.spot.update({
      where: { id },
      data: { status: PublicationStatus.REJECTED, statusReason: reason },
      include: { owner: { select: { id: true, email: true, firstname: true, type: true } } },
    });
    this.audit.log({ userId: actor.sub, action: 'REJECT', entity: 'AVISO', entityId: id, metadata: { reason }, req });
    if (spot.owner?.email) {
      await this.mail
        .sendContentRejected(spot.owner.email, spot.owner.firstname ?? spot.owner.email, spot.title, reason)
        .catch(() => {});
    }
    if (spot.owner) {
      const rcpt = spot.owner.type === UserType.ORGANIZATION
        ? { orgId: spot.owner.id }
        : { userId: spot.owner.id };
      this.notifications.create({
        type: 'SPOT_REJECTED',
        title: `Tu aviso "${spot.title}" fue rechazado`,
        body: reason,
        payload: { spotId: id, reason },
        ...rcpt,
      });
    }
    return spot;
  }

  async ban(id: number, reason: string, actor: JwtUser, req?: Request) {
    const spot = await this.prisma.spot.update({
      where: { id },
      data: { status: PublicationStatus.BANNED, statusReason: reason },
      include: { owner: { select: { id: true, email: true, firstname: true, type: true } } },
    });
    this.audit.log({ userId: actor.sub, action: 'BAN', entity: 'AVISO', entityId: id, metadata: { reason }, req });
    if (spot.owner?.email) {
      await this.mail
        .sendContentBanned(spot.owner.email, spot.owner.firstname ?? spot.owner.email, spot.title, reason)
        .catch(() => {});
    }
    if (spot.owner) {
      const rcpt = spot.owner.type === UserType.ORGANIZATION
        ? { orgId: spot.owner.id }
        : { userId: spot.owner.id };
      this.notifications.create({
        type: 'SPOT_BANNED',
        title: `Tu aviso "${spot.title}" fue eliminado`,
        body: reason,
        payload: { spotId: id, reason },
        ...rcpt,
      });
    }
    return spot;
  }

  /** Valida que haya cupo disponible; lanza excepción si no. */
  async assertQuotaAvailable() {
    const [active, max] = await Promise.all([this.countActive(), this.maxActive()]);
    if (active >= max) {
      throw new BadRequestException('No hay cupos disponibles para spots en este momento');
    }
  }

  /** Valida que los días no superen el máximo permitido. */
  async assertMaxDays(days: number) {
    const max = await this.maxDays();
    if (days > max) {
      throw new BadRequestException(`Un spot se puede publicar por un máximo de ${max} días`);
    }
  }

  private async ensure(id: number) {
    const spot = await this.prisma.spot.findUnique({ where: { id } });
    if (!spot) throw new NotFoundException('Aviso no encontrado');
    return spot;
  }

  private assertCanManage(spot: { userId: number }, user: JwtUser) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isAdmin && spot.userId !== user.sub) {
      throw new ForbiddenException('No puedes gestionar este aviso');
    }
  }
}
