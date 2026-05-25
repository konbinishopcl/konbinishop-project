import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Transfer, TransferItemType, TransferStatus } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { JwtUser } from '../auth/current-user.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';
import { MailService } from '../../services/mailgun/mail.service';
import { AdminCreateTransferDto } from './dto/admin-create-transfer.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { RejectTransferDto } from './dto/reject-transfer.dto';

interface ResolvedItem {
  id: number;
  title: string;
  ownerEmail?: string | null;
  ownerFirstname?: string | null;
}

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─────────────────────── Endpoints de usuario ───────────────────────

  /**
   * Crea una transferencia. Si el caller es OWNER de la org destino → AUTO_ACCEPTED
   * y se aplica el cambio de dueño inmediatamente. Si es MEMBER → PENDING + email a OWNERs.
   */
  async create(dto: CreateTransferDto, user: JwtUser, req?: Request): Promise<Transfer> {
    // 1. Validar membresía del caller en la org destino
    const member = await this.prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: user.sub, orgId: dto.targetOrgId } },
      select: { role: true },
    });
    if (!member) throw new ForbiddenException('No eres miembro de esa organización');

    // 2. Validar que la org destino existe y es de tipo ORGANIZATION
    const org = await this.prisma.user.findUnique({
      where: { id: dto.targetOrgId },
      select: { type: true, firstname: true },
    });
    if (!org || org.type !== 'ORGANIZATION') throw new NotFoundException('Organización no encontrada');

    // 3. Resolver el ítem y verificar ownership del caller
    const item = await this.resolveAndAssertOwnership(dto.itemType, dto.itemId, user.sub);

    // 4. Verificar que no haya transferencia PENDING duplicada
    const existing = await this.prisma.transfer.findFirst({
      where: {
        itemType: dto.itemType,
        itemId: dto.itemId,
        toOrgId: dto.targetOrgId,
        status: TransferStatus.PENDING,
      },
    });
    if (existing) throw new ConflictException('Ya existe una transferencia pendiente para este ítem');

    // 5. Auto-aprobación si el caller es OWNER
    const isOwner = member.role === 'OWNER';
    const status: TransferStatus = isOwner ? TransferStatus.AUTO_ACCEPTED : TransferStatus.PENDING;

    const transfer = await this.prisma.$transaction(async (tx) => {
      const t = await tx.transfer.create({
        data: {
          itemType: dto.itemType,
          itemId: dto.itemId,
          fromUserId: user.sub,
          toOrgId: dto.targetOrgId,
          status,
          resolvedBy: isOwner ? user.sub : null,
          resolvedAt: isOwner ? new Date() : null,
        },
      });
      if (isOwner) {
        await this.applyOwnershipUpdate(tx, dto.itemType, dto.itemId, dto.targetOrgId);
      }
      return t;
    });

    // 6. Si PENDING → notificar a todos los OWNERs de la org (email) + 1 notificación interna al orgId
    if (!isOwner) {
      const owners = await this.prisma.orgMember.findMany({
        where: { orgId: dto.targetOrgId, role: 'OWNER' },
        include: { user: { select: { email: true, firstname: true } } },
      });
      const dashboardUrl = `${this.config.get('FRONTEND_URL', 'http://localhost:3000')}/dashboard/transfers`;
      for (const o of owners) {
        if (o.user.email) {
          await this.mail
            .sendTransferRequest(
              o.user.email,
              org.firstname ?? 'Konbini',
              user.email,
              dto.itemType,
              item.title,
              dashboardUrl,
            )
            .catch(() => {});
        }
      }

      // UNA notificación al orgId — cualquier OWNER la verá vía X-Org-Context
      this.notifications.create({
        type: 'TRANSFER_REQUEST',
        title: `Nueva solicitud de transferencia recibida`,
        body: `${user.email} quiere transferir "${item.title}" a tu organización.`,
        payload: {
          transferId: transfer.id,
          itemType: dto.itemType,
          itemId: dto.itemId,
          fromUserId: user.sub,
        },
        orgId: dto.targetOrgId,
      });
    }
    // NOTA: transferencias AUTO_ACCEPTED (caller=OWNER) NO emiten notificación —
    // no hay nada que avisar, la decisión la tomó el mismo OWNER al crear.

    // 7. Auditoría
    this.audit.log({
      userId: user.sub,
      action: 'CREATE',
      entity: this.itemTypeToAuditEntity(dto.itemType),
      entityId: dto.itemId,
      metadata: { transferId: transfer.id, toOrgId: dto.targetOrgId, status },
      req,
    });

    return transfer;
  }

  /**
   * Lista las transferencias PENDING para la org del contexto.
   */
  async listIncoming(orgContext: OrgContextDto): Promise<Transfer[]> {
    return this.prisma.transfer.findMany({
      where: { toOrgId: orgContext.orgId, status: TransferStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Acepta una transferencia PENDING. Solo el OWNER de la org destino puede hacerlo.
   * Aplica el cambio de dueño en la misma transacción.
   */
  async accept(id: number, user: JwtUser, req?: Request): Promise<Transfer> {
    const transfer = await this.prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Esta transferencia ya fue resuelta');
    }

    // Verificar que el caller sea OWNER de la org destino
    await this.assertOrgOwner(transfer.toOrgId, user);

    const updated = await this.prisma.$transaction(async (tx) => {
      const t = await tx.transfer.update({
        where: { id },
        data: { status: TransferStatus.ACCEPTED, resolvedBy: user.sub, resolvedAt: new Date() },
      });
      await this.applyOwnershipUpdate(tx, transfer.itemType, transfer.itemId, transfer.toOrgId);
      return t;
    });

    // Notificar al fromUser (notificación interna + email)
    this.notifications.create({
      type: 'TRANSFER_ACCEPTED',
      title: `Tu transferencia fue aceptada`,
      payload: {
        transferId: transfer.id,
        itemType: transfer.itemType,
        itemId: transfer.itemId,
        toOrgId: transfer.toOrgId,
      },
      userId: transfer.fromUserId,
    });
    await this.notifyFromUser(transfer, 'accepted');

    this.audit.log({
      userId: user.sub,
      action: 'APPROVE',
      entity: this.itemTypeToAuditEntity(transfer.itemType),
      entityId: transfer.itemId,
      metadata: { transferId: transfer.id, toOrgId: transfer.toOrgId },
      req,
    });

    return updated;
  }

  /**
   * Rechaza una transferencia PENDING. Solo el OWNER de la org destino puede hacerlo.
   * El ítem permanece con su dueño original.
   */
  async reject(id: number, dto: RejectTransferDto, user: JwtUser, req?: Request): Promise<Transfer> {
    const transfer = await this.prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('Transferencia no encontrada');
    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Esta transferencia ya fue resuelta');
    }

    await this.assertOrgOwner(transfer.toOrgId, user);

    const updated = await this.prisma.transfer.update({
      where: { id },
      data: {
        status: TransferStatus.REJECTED,
        reason: dto.reason,
        resolvedBy: user.sub,
        resolvedAt: new Date(),
      },
    });

    // Notificar al fromUser (notificación interna + email)
    this.notifications.create({
      type: 'TRANSFER_REJECTED',
      title: `Tu transferencia fue rechazada`,
      body: dto.reason,
      payload: {
        transferId: transfer.id,
        itemType: transfer.itemType,
        itemId: transfer.itemId,
        toOrgId: transfer.toOrgId,
        reason: dto.reason,
      },
      userId: transfer.fromUserId,
    });
    await this.notifyFromUser(transfer, 'rejected', dto.reason);

    this.audit.log({
      userId: user.sub,
      action: 'REJECT',
      entity: this.itemTypeToAuditEntity(transfer.itemType),
      entityId: transfer.itemId,
      metadata: { transferId: transfer.id, toOrgId: transfer.toOrgId, reason: dto.reason },
      req,
    });

    return updated;
  }

  /**
   * Transferencia forzada por admin: sin aprobación, status=ADMIN_FORCED.
   */
  async adminCreate(dto: AdminCreateTransferDto, user: JwtUser, req?: Request): Promise<Transfer> {
    // Re-validar rol por defensa en profundidad
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Solo administradores pueden forzar transferencias');
    }

    // Validar que la org destino existe y es ORGANIZATION
    const org = await this.prisma.user.findUnique({
      where: { id: dto.toOrgId },
      select: { type: true, firstname: true },
    });
    if (!org || org.type !== 'ORGANIZATION') throw new NotFoundException('Organización no encontrada');

    // Validar el ítem y su dueño declarado
    await this.resolveItemForAdmin(dto.itemType, dto.itemId, dto.fromUserId);

    const transfer = await this.prisma.$transaction(async (tx) => {
      const t = await tx.transfer.create({
        data: {
          itemType: dto.itemType,
          itemId: dto.itemId,
          fromUserId: dto.fromUserId,
          toOrgId: dto.toOrgId,
          status: TransferStatus.ADMIN_FORCED,
          resolvedBy: user.sub,
          resolvedAt: new Date(),
          reason: dto.reason ?? null,
        },
      });
      await this.applyOwnershipUpdate(tx, dto.itemType, dto.itemId, dto.toOrgId);
      return t;
    });

    this.audit.log({
      userId: user.sub,
      action: 'UPDATE',
      entity: this.itemTypeToAuditEntity(dto.itemType),
      entityId: dto.itemId,
      metadata: {
        transferId: transfer.id,
        toOrgId: dto.toOrgId,
        adminForced: true,
        reason: dto.reason,
      },
      req,
    });

    return transfer;
  }

  // ─────────────────────── Helpers privados ───────────────────────

  /**
   * Resuelve el ítem polimórficamente y verifica que el caller sea el dueño.
   */
  private async resolveAndAssertOwnership(
    itemType: TransferItemType,
    itemId: number,
    expectedOwnerId: number,
  ): Promise<ResolvedItem> {
    switch (itemType) {
      case TransferItemType.EVENT: {
        const e = await this.prisma.event.findUnique({
          where: { id: itemId },
          include: { owner: { select: { email: true, firstname: true } } },
        });
        if (!e) throw new NotFoundException('Evento no encontrado');
        if (e.userId == null) throw new ForbiddenException('Este ítem no tiene dueño asignado, no se puede transferir');
        if (e.userId !== expectedOwnerId) throw new ForbiddenException('No eres dueño de este evento');
        return { id: e.id, title: e.title, ownerEmail: e.owner?.email, ownerFirstname: e.owner?.firstname };
      }
      case TransferItemType.SPOT: {
        const s = await this.prisma.spot.findUnique({
          where: { id: itemId },
          include: { owner: { select: { email: true, firstname: true } } },
        });
        if (!s) throw new NotFoundException('Aviso no encontrado');
        if (s.userId !== expectedOwnerId) throw new ForbiddenException('No eres dueño de este aviso');
        return { id: s.id, title: s.title, ownerEmail: s.owner?.email, ownerFirstname: s.owner?.firstname };
      }
      case TransferItemType.HERO: {
        const h = await this.prisma.hero.findUnique({
          where: { id: itemId },
          include: { owner: { select: { email: true, firstname: true } } },
        });
        if (!h) throw new NotFoundException('Portada no encontrada');
        if (h.userId !== expectedOwnerId) throw new ForbiddenException('No eres dueño de esta portada');
        return { id: h.id, title: h.title, ownerEmail: h.owner?.email, ownerFirstname: h.owner?.firstname };
      }
      case TransferItemType.ARTICLE: {
        const a = await this.prisma.article.findUnique({
          where: { id: itemId },
          include: { owner: { select: { email: true, firstname: true } } },
        });
        if (!a) throw new NotFoundException('Artículo no encontrado');
        if (a.userId == null) throw new ForbiddenException('Este ítem no tiene dueño asignado, no se puede transferir');
        if (a.userId !== expectedOwnerId) throw new ForbiddenException('No eres dueño de este artículo');
        return { id: a.id, title: a.title, ownerEmail: a.owner?.email, ownerFirstname: a.owner?.firstname };
      }
    }
  }

  /**
   * Variante para admin: verifica el ítem y que su dueño sea fromUserId.
   */
  private async resolveItemForAdmin(
    itemType: TransferItemType,
    itemId: number,
    expectedOwnerId: number,
  ): Promise<ResolvedItem> {
    return this.resolveAndAssertOwnership(itemType, itemId, expectedOwnerId);
  }

  /**
   * Actualiza el userId del ítem al toOrgId dentro de una transacción Prisma.
   */
  private async applyOwnershipUpdate(
    tx: Prisma.TransactionClient,
    itemType: TransferItemType,
    itemId: number,
    toOrgId: number,
  ): Promise<void> {
    switch (itemType) {
      case TransferItemType.EVENT:
        await tx.event.update({ where: { id: itemId }, data: { userId: toOrgId } });
        break;
      case TransferItemType.SPOT:
        await tx.spot.update({ where: { id: itemId }, data: { userId: toOrgId } });
        break;
      case TransferItemType.HERO:
        await tx.hero.update({ where: { id: itemId }, data: { userId: toOrgId } });
        break;
      case TransferItemType.ARTICLE:
        await tx.article.update({ where: { id: itemId }, data: { userId: toOrgId } });
        break;
    }
  }

  /**
   * Verifica que el caller sea OWNER de la org. Lanza ForbiddenException si no.
   */
  private async assertOrgOwner(orgId: number, user: JwtUser): Promise<void> {
    const m = await this.prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: user.sub, orgId } },
      select: { role: true },
    });
    if (!m || m.role !== 'OWNER') {
      throw new ForbiddenException('Solo el OWNER de la organización puede realizar esta acción');
    }
  }

  /**
   * Mapea TransferItemType al enum AuditEntity.
   * SPOT → AVISO, HERO → PORTADA, ARTICLE/EVENT → EVENT (AuditEntity no tiene ARTICLE).
   */
  private itemTypeToAuditEntity(t: TransferItemType): 'EVENT' | 'USER' | 'AVISO' | 'PORTADA' {
    switch (t) {
      case TransferItemType.EVENT:   return 'EVENT';
      case TransferItemType.SPOT:    return 'AVISO';
      case TransferItemType.HERO:    return 'PORTADA';
      case TransferItemType.ARTICLE: return 'EVENT'; // no hay ARTICLE en AuditEntity; tipo real en metadata
    }
  }

  /**
   * Carga datos del fromUser y envía la notificación de resultado al solicitante.
   */
  private async notifyFromUser(
    transfer: Transfer,
    outcome: 'accepted' | 'rejected',
    reason?: string,
  ): Promise<void> {
    const fromUser = await this.prisma.user.findUnique({
      where: { id: transfer.fromUserId },
      select: { email: true, firstname: true },
    });
    const org = await this.prisma.user.findUnique({
      where: { id: transfer.toOrgId },
      select: { firstname: true },
    });

    if (!fromUser?.email) return;

    const orgName = org?.firstname ?? 'la organización';
    const fromName = fromUser.firstname ?? fromUser.email;

    // Obtener el título del ítem para la notificación
    let itemTitle = `Ítem #${transfer.itemId}`;
    try {
      const resolved = await this.resolveItemTitle(transfer.itemType, transfer.itemId);
      if (resolved) itemTitle = resolved;
    } catch {
      // Si el ítem ya no existe (edge case), usar el ID como fallback
    }

    if (outcome === 'accepted') {
      await this.mail.sendTransferAccepted(fromUser.email, fromName, orgName, itemTitle).catch(() => {});
    } else {
      await this.mail
        .sendTransferRejected(fromUser.email, fromName, orgName, itemTitle, reason ?? '')
        .catch(() => {});
    }
  }

  /**
   * Obtiene el título de un ítem por tipo e ID, sin verificar ownership.
   */
  private async resolveItemTitle(itemType: TransferItemType, itemId: number): Promise<string | null> {
    switch (itemType) {
      case TransferItemType.EVENT: {
        const e = await this.prisma.event.findUnique({ where: { id: itemId }, select: { title: true } });
        return e?.title ?? null;
      }
      case TransferItemType.SPOT: {
        const s = await this.prisma.spot.findUnique({ where: { id: itemId }, select: { title: true } });
        return s?.title ?? null;
      }
      case TransferItemType.HERO: {
        const h = await this.prisma.hero.findUnique({ where: { id: itemId }, select: { title: true } });
        return h?.title ?? null;
      }
      case TransferItemType.ARTICLE: {
        const a = await this.prisma.article.findUnique({ where: { id: itemId }, select: { title: true } });
        return a?.title ?? null;
      }
    }
  }
}
