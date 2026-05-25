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
