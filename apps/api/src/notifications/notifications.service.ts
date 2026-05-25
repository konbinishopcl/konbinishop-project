import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import type { JwtUser } from '../auth/current-user.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';
import type { CreateNotificationParams } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una notificación — FIRE-AND-FORGET. Nunca lanza ni propaga.
   * Patrón idéntico a AuditService.log(): void, no Promise<void>.
   * Exactamente uno de userId/orgId debe estar presente; si no, se loguea warning y se omite.
   */
  create(params: CreateNotificationParams): void {
    if ((!params.userId && !params.orgId) || (params.userId && params.orgId)) {
      this.logger.warn(
        `Notification skipped: exactly one of userId/orgId required (type=${params.type})`,
      );
      return;
    }
    this.prisma.notification
      .create({
        data: {
          type: params.type,
          title: params.title,
          body: params.body ?? null,
          payload: (params.payload ?? {}) as Prisma.InputJsonValue,
          userId: params.userId ?? null,
          orgId: params.orgId ?? null,
        },
      })
      .catch((err: unknown) =>
        this.logger.error(
          'Notification insert failed',
          err instanceof Error ? err.stack : String(err),
        ),
      );
  }

  /**
   * Lista paginada de notificaciones del recipient (userId u orgId según orgContext).
   * Orden: más recientes primero.
   */
  async listMine(
    query: QueryNotificationsDto,
    user: JwtUser,
    orgContext: OrgContextDto | null,
  ) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const where: Prisma.NotificationWhereInput = orgContext
      ? { orgId: orgContext.orgId }
      : { userId: user.sub };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async unreadCount(
    user: JwtUser,
    orgContext: OrgContextDto | null,
  ): Promise<{ count: number }> {
    const where: Prisma.NotificationWhereInput = orgContext
      ? { orgId: orgContext.orgId, read: false }
      : { userId: user.sub, read: false };
    const count = await this.prisma.notification.count({ where });
    return { count };
  }

  /**
   * Marca una notificación como leída. Solo el destinatario puede hacerlo.
   * Si la notificación pertenece a otro usuario u org distinta, lanza 404.
   */
  async markRead(id: number, user: JwtUser, orgContext: OrgContextDto | null) {
    const n = await this.prisma.notification.findUnique({ where: { id } });
    if (!n) throw new NotFoundException('Notificación no encontrada');

    const isMine = orgContext ? n.orgId === orgContext.orgId : n.userId === user.sub;
    if (!isMine) throw new NotFoundException('Notificación no encontrada');

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(user: JwtUser, orgContext: OrgContextDto | null) {
    const where: Prisma.NotificationWhereInput = orgContext
      ? { orgId: orgContext.orgId, read: false }
      : { userId: user.sub, read: false };
    const { count } = await this.prisma.notification.updateMany({
      where,
      data: { read: true },
    });
    return { updated: count };
  }
}
