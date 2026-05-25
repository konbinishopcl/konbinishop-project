import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import type { JwtUser } from '../auth/current-user.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';
import { GatewayFactory } from '../payments/gateway.factory';
import { GatewayType } from '../payments/dto/checkout.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly gatewayFactory: GatewayFactory,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Inicia el flujo de suscripción: crea una Order especial con item type=SUBSCRIPTION
   * y la envía a la pasarela de pago. NO crea la Subscription row (eso ocurre en /confirm).
   * D-01, D-03, D-04
   */
  async create(
    user: JwtUser,
    orgContext: OrgContextDto | null,
    dto: CreateSubscriptionDto,
  ): Promise<{ redirectUrl: string; externalId: string }> {
    const target = orgContext ? { orgId: orgContext.orgId } : { userId: user.sub };

    // D-04: 409 si ya tiene suscripción ACTIVE
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: { ...target, status: SubscriptionStatus.ACTIVE },
    });
    if (activeSubscription) {
      throw new ConflictException('Ya tienes una suscripción activa');
    }

    // Re-suscripción: borrar sub CANCELLED/EXPIRED existente para sortear el @unique en userId/orgId
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: target,
    });
    if (existingSubscription) {
      await this.prisma.subscription.delete({ where: { id: existingSubscription.id } });
      this.logger.log(
        `Subscription ${existingSubscription.id} deleted for re-subscription (status=${existingSubscription.status})`,
      );
    }

    // Leer precio desde Settings
    const amount = await this.settings.getNum('SUBSCRIPTION_PRICE');

    // Crear Order especial con item type=SUBSCRIPTION
    const order = await this.prisma.order.create({
      data: {
        userId: user.sub,
        orgId: orgContext?.orgId ?? null,
        total: amount,
        status: OrderStatus.DRAFT,
        items: {
          create: [
            {
              type: 'SUBSCRIPTION',
              days: 30,
              unitPrice: amount,
              subtotal: amount,
            },
          ],
        },
      },
    });

    // Iniciar pago con la pasarela
    const apiBase = this.config.get<string>('API_BASE_URL', 'http://localhost:3333');
    const returnUrl = `${apiBase}/api/subscriptions/confirm`;
    const gateway = dto.gateway ?? GatewayType.TRANSBANK;
    const pg = this.gatewayFactory.get(gateway);
    const result = await pg.initiate({ orderId: order.id, amount, returnUrl });

    // Actualizar la orden con datos de la pasarela
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PENDING_PAYMENT,
        gateway: gateway,
        externalId: result.externalId,
      },
    });

    this.logger.log(`Subscription order ${order.id} → PENDING_PAYMENT via ${gateway}`);
    return { redirectUrl: result.redirectUrl, externalId: result.externalId };
  }

  /**
   * Devuelve el estado de la suscripción del usuario/org actual.
   * D-14: { active: false } si no hay sub; objeto completo si existe.
   */
  async findMine(user: JwtUser, orgContext: OrgContextDto | null) {
    const target = orgContext ? { orgId: orgContext.orgId } : { userId: user.sub };
    const sub = await this.prisma.subscription.findFirst({ where: target });

    if (!sub) {
      return { active: false };
    }

    return {
      active: sub.status === SubscriptionStatus.ACTIVE,
      status: sub.status,
      creditsUsed: sub.creditsUsed,
      creditsTotal: sub.creditsTotal,
      cycleStart: sub.cycleStart,
      cycleEnd: sub.cycleEnd,
      cancelledAt: sub.cancelledAt,
    };
  }

  /**
   * Cancela la suscripción del usuario/org actual.
   * D-09: marca cancelledAt + status=CANCELLED; el ciclo sigue vigente hasta cycleEnd.
   */
  async cancelMine(user: JwtUser, orgContext: OrgContextDto | null) {
    const target = orgContext ? { orgId: orgContext.orgId } : { userId: user.sub };
    const sub = await this.prisma.subscription.findFirst({ where: target });

    if (!sub) {
      throw new NotFoundException('No tienes una suscripción activa');
    }

    if (sub.status === SubscriptionStatus.CANCELLED || sub.status === SubscriptionStatus.EXPIRED) {
      throw new BadRequestException('La suscripción ya está cancelada');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Notificación fire-and-forget
    this.notifications.create({
      type: 'SUBSCRIPTION_CANCELLED',
      title: 'Suscripción cancelada',
      body: `Vigente hasta ${sub.cycleEnd.toISOString()}`,
      ...target,
    });

    return updated;
  }

  /**
   * Callback de Transbank para suscripciones.
   * Confirma el pago, crea la Subscription row con ciclo de 30 días y créditos desde Settings,
   * marca el Order como PAID, y emite notificación SUBSCRIPTION_ACTIVATED.
   * D-01, D-02, D-03, D-11, D-12
   */
  async handleConfirmCallback(tokenWs?: string, _tbkToken?: string): Promise<string> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    // Caso 1: usuario abortó en Transbank (TBK_TOKEN presente, no token_ws)
    if (!tokenWs) {
      this.logger.warn('Subscription callback without token_ws (aborted)');
      return `${frontendUrl}/cuenta/suscripcion?status=aborted`;
    }

    // Caso 2: buscar Order por externalId
    const order = await this.prisma.order.findFirst({
      where: { externalId: tokenWs },
      include: { items: true },
    });

    if (!order) {
      this.logger.error(`No subscription order found for Transbank token: ${tokenWs}`);
      return `${frontendUrl}/cuenta/suscripcion?status=not_found`;
    }

    // Validar que es un Order de suscripción (tiene al menos 1 item SUBSCRIPTION)
    const subItem = order.items.find((i) => i.type === 'SUBSCRIPTION');
    if (!subItem) {
      this.logger.error(`Order ${order.id} is not a subscription order`);
      return `${frontendUrl}/cuenta/suscripcion?status=invalid`;
    }

    // Recipient discriminado con tipo estricto para evitar ambigüedad TS
    const recipient: { orgId: number } | { userId: number } = order.orgId
      ? { orgId: order.orgId }
      : order.userId
        ? { userId: order.userId }
        : (() => {
            throw new Error(`Order ${order.id} has no recipient (orgId/userId both null)`);
          })();

    // Idempotencia: si Order ya está PAID y la Subscription existe, no duplicar
    if (order.status === 'PAID') {
      const existing = await this.prisma.subscription.findFirst({ where: recipient });
      if (existing) {
        this.logger.warn(`Duplicate callback for already-paid subscription order ${order.id}`);
        return `${frontendUrl}/cuenta/suscripcion?status=success`;
      }
    }

    if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PAID') {
      this.logger.warn(
        `Subscription callback for order ${order.id} in unexpected status: ${order.status}`,
      );
      return `${frontendUrl}/cuenta/suscripcion?status=invalid`;
    }

    // Confirmar pago con Transbank
    const pg = this.gatewayFactory.get(GatewayType.TRANSBANK);
    const confirmation = await pg.confirm(tokenWs);

    if (!confirmation.success) {
      // D-03: pago rechazado → Order=FAILED, NO crear Subscription
      await this.prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
      this.logger.warn(
        `Subscription order ${order.id} payment failed — code ${confirmation.responseCode}`,
      );
      return `${frontendUrl}/cuenta/suscripcion?status=failed&code=${confirmation.responseCode}`;
    }

    // Pago exitoso — crear Subscription + marcar Order=PAID en una transacción
    const creditsTotal = await this.settings.getNum('SUBSCRIPTION_CREDITS');
    const cycleStart = new Date();
    const cycleEnd = new Date(cycleStart);
    cycleEnd.setUTCDate(cycleEnd.getUTCDate() + 30);

    const [, subscription] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      }),
      this.prisma.subscription.create({
        data: {
          ...recipient,
          status: 'ACTIVE',
          cycleStart,
          cycleEnd,
          creditsTotal,
          creditsUsed: 0,
        },
      }),
    ]);

    const recipientDesc =
      'orgId' in recipient
        ? `org ${recipient.orgId}`
        : `user ${(recipient as { userId: number }).userId}`;
    this.logger.log(`Subscription ${subscription.id} ACTIVE for ${recipientDesc}`);

    // Fire-and-forget notification (patrón Phase 11 — void, no await)
    this.notifications.create({
      type: 'SUBSCRIPTION_ACTIVATED',
      title: 'Suscripción activada',
      body: `Tu plan está activo hasta ${cycleEnd.toISOString().slice(0, 10)}. Tienes ${creditsTotal} créditos disponibles.`,
      payload: {
        subscriptionId: subscription.id,
        cycleEnd: cycleEnd.toISOString(),
        creditsTotal,
      },
      ...recipient,
    });

    return `${frontendUrl}/cuenta/suscripcion?status=success`;
  }

  /**
   * Lee la suscripción "viva" del owner (userId si personal, orgId si org).
   * Una sub CANCELLED con cycleEnd futuro sigue contando (D-09): cancelar
   * no termina el ciclo, solo previene renovación.
   * Devuelve null si no hay sub o si el ciclo expiró.
   */
  async getActiveForOwner(userId: number | null, orgId: number | null) {
    const target = orgId ? { orgId } : { userId };
    return this.prisma.subscription.findFirst({
      where: {
        ...target,
        status: { in: ['ACTIVE', 'CANCELLED'] },
        cycleEnd: { gte: new Date() },
      },
    });
  }

  /**
   * Lista paginada de suscripciones — solo para ADMIN/SUPER_ADMIN.
   * D-18
   */
  async findAll(query: QuerySubscriptionsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const where = query.status ? { status: query.status } : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, type: true, handle: true } },
          org: { select: { id: true, email: true, handle: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
