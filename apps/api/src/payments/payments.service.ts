import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, OrderStatus, PublicationStatus } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { MailService } from '../../services/mailgun/mail.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { GatewayFactory } from './gateway.factory';
import { GatewayType } from './dto/checkout.dto';
import { OrderItemType } from '../orders/dto/add-item.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly gatewayFactory: GatewayFactory,
    private readonly mail: MailService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  /**
   * Inicia el pago de una orden DRAFT.
   * Valida cuota, llama a la pasarela y transiciona la orden a PENDING_PAYMENT.
   * Devuelve la URL de redirección al frontend.
   */
  async initiate(orderId: number, gateway: GatewayType, user: JwtUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { spot: true, hero: true, event: true } } },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.userId !== (user.actingAs ?? user.sub)) throw new ForbiddenException('No tienes acceso a esta orden');
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden pagar órdenes en estado DRAFT');
    }
    if (!order.items.length) {
      throw new UnprocessableEntityException('El carrito está vacío');
    }

    // Validar cuota en el momento del pago
    const hasSpot = order.items.some((i) => i.type === OrderItemType.SPOT);
    const hasHero = order.items.some((i) => i.type === OrderItemType.HERO);
    if (hasSpot) await this.assertSpotQuota();
    if (hasHero) await this.assertHeroQuota();

    const apiBase = this.config.get<string>('API_BASE_URL', 'http://localhost:3333');
    const returnUrl = `${apiBase}/api/payments/${gateway.toLowerCase()}/callback`;

    const pg = this.gatewayFactory.get(gateway);
    const result = await pg.initiate({ orderId, amount: order.total, returnUrl });

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PENDING_PAYMENT,
        gateway: gateway,
        externalId: result.externalId,
      },
    });

    this.logger.log(`Order ${orderId} → PENDING_PAYMENT via ${gateway}`);
    return { redirectUrl: result.redirectUrl, externalId: result.externalId };
  }

  /**
   * Callback de Transbank — confirma el pago y activa los ítems de la orden.
   * Devuelve la URL del frontend a la que se debe redirigir el navegador.
   */
  async handleTransbankCallback(tokenWs?: string, tbkToken?: string): Promise<string> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    // tbkToken presente = transacción abortada por el usuario
    if (!tokenWs) {
      this.logger.warn('Transbank callback without token_ws (aborted)');
      // Revert order back to DRAFT so the cart can be used again
      if (tbkToken) {
        const abortedOrder = await this.prisma.order.findFirst({
          where: { externalId: tbkToken },
        });
        if (abortedOrder && abortedOrder.status === OrderStatus.PENDING_PAYMENT) {
          await this.prisma.order.update({
            where: { id: abortedOrder.id },
            data: { status: OrderStatus.DRAFT, externalId: null },
          });
          this.logger.log(`Order ${abortedOrder.id} reverted to DRAFT after user abort`);
        }
      }
      return `${frontendUrl}/carrito?reason=aborted`;
    }

    const order = await this.prisma.order.findFirst({
      where: { externalId: tokenWs },
      include: {
        owner: { select: { email: true, firstname: true } },
        items: {
          include: { event: true, spot: true, hero: true, article: true },
        },
      },
    });

    if (!order) {
      this.logger.error(`No order found for Transbank token: ${tokenWs}`);
      return `${frontendUrl}/carrito/error?reason=not_found`;
    }

    // Idempotencia: si el callback llega duplicado después de un pago exitoso,
    // devolvemos success sin volver a llamar a Transbank (evita que marque como FAILED).
    if (order.status === OrderStatus.PAID) {
      this.logger.warn(`Duplicate callback for already-paid order ${order.id}`);
      return `${frontendUrl}/carrito/exito?orderId=${order.id}`;
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      this.logger.warn(`Callback for order ${order.id} in unexpected status: ${order.status}`);
      return `${frontendUrl}/carrito/error?reason=invalid_state`;
    }

    const pg = this.gatewayFactory.get(GatewayType.TRANSBANK);
    const confirmation = await pg.confirm(tokenWs);

    if (!confirmation.success) {
      // Revert to DRAFT so the user can retry with the same cart
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.DRAFT, externalId: null },
      });
      this.logger.warn(`Order ${order.id} payment failed — code ${confirmation.responseCode} — reverted to DRAFT`);
      return `${frontendUrl}/carrito?reason=failed&code=${confirmation.responseCode}`;
    }

    // Pago exitoso → activar ítems (incluye increment de creditsUsed si aplica)
    await this.activateOrderItems(order);
    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID },
    });

    this.logger.log(`Order ${order.id} → PAID`);

    if (order.owner?.email) {
      await this.mail.sendPaymentConfirmed(
        order.owner.email,
        order.owner.firstname ?? order.owner.email,
        order.id,
        order.total,
      );
    }

    return `${frontendUrl}/carrito/exito?orderId=${order.id}`;
  }

  // ── Activación de ítems al confirmar el pago ──

  /**
   * Activa los ítems de la orden dentro de una $transaction atómica.
   * D-08: si hay ítems EVENT con unitPrice=0 && subtotal=0 (crédito aplicado),
   * incrementa creditsUsed de la suscripción activa en la misma transacción.
   * Accede a la sub vía SubscriptionsService.getActiveForOwner para coherencia
   * cross-módulo (mismo patrón que OrdersService.getActiveSub).
   */
  private async activateOrderItems(order: {
    id: number;
    userId: number;
    orgId: number | null;
    items: Array<{
      type: string;
      days: number;
      subtotal: number;
      unitPrice: number;
      eventId: number | null;
      spotId: number | null;
      heroId: number | null;
      articleId: number | null;
    }>;
  }) {
    const expirationDate = (days: number) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + days);
      return d;
    };

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    let creditConsumed = 0;

    for (const item of order.items) {
      // Defensive guard: items SUBSCRIPTION no se activan aquí
      // (van por /subscriptions/confirm — Plan 12-04)
      if (item.type === OrderItemType.SUBSCRIPTION) continue;

      if (item.type === OrderItemType.EVENT && item.eventId) {
        ops.push(
          this.prisma.event.update({
            where: { id: item.eventId },
            data: {
              status: PublicationStatus.PENDING_MODERATION,
              expirationDate: expirationDate(item.days),
            },
          }),
        );
        // D-08: si el EVENT fue cubierto por crédito (unitPrice=0 && subtotal=0), incrementar creditsUsed
        if (item.unitPrice === 0 && item.subtotal === 0) {
          creditConsumed += 1;
        }
      } else if (item.type === OrderItemType.SPOT && item.spotId) {
        ops.push(
          this.prisma.spot.update({
            where: { id: item.spotId },
            data: {
              status: PublicationStatus.PENDING_MODERATION,
              days: item.days,
              amount: item.subtotal,
              expirationDate: expirationDate(item.days),
            },
          }),
        );
      } else if (item.type === OrderItemType.HERO && item.heroId) {
        ops.push(
          this.prisma.hero.update({
            where: { id: item.heroId },
            data: {
              status: PublicationStatus.PENDING_MODERATION,
              days: item.days,
              amount: item.subtotal,
              expirationDate: expirationDate(item.days),
            },
          }),
        );
      } else if (item.type === OrderItemType.ARTICLE && item.articleId) {
        ops.push(
          this.prisma.article.update({
            where: { id: item.articleId },
            data: { status: PublicationStatus.PENDING_MODERATION },
          }),
        );
      }
    }

    // D-08: añadir el incremento al transaction si aplica.
    // Usa SubscriptionsService.getActiveForOwner para coherencia con OrdersService
    // (mismo entry point cross-módulo a la sub viva — encapsula la regla CANCELLED+cycleEnd futuro).
    if (creditConsumed > 0) {
      const sub = await this.subscriptions.getActiveForOwner(
        order.orgId ? null : order.userId,
        order.orgId,
      );
      if (sub) {
        ops.push(
          this.prisma.subscription.update({
            where: { id: sub.id },
            data: { creditsUsed: { increment: creditConsumed } },
          }),
        );
      }
      // Si sub no existe ya (edge case: cycle expired entre add-to-cart y pay), saltamos increment
    }

    await this.prisma.$transaction(ops);
  }

  async findAllForAdmin() {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: [OrderStatus.PAID, OrderStatus.FAILED] } },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { firstname: true, lastname: true, email: true, handle: true } },
        org:   { select: { firstname: true, lastname: true, email: true, handle: true } },
        items: {
          include: {
            event:   { select: { title: true } },
            spot:    { select: { title: true } },
            hero:    { select: { title: true, titleAccent: true } },
            article: { select: { title: true } },
          },
        },
      },
    });

    const userName = (u: { firstname: string | null; lastname: string | null; email: string }) =>
      [u.firstname, u.lastname].filter(Boolean).join(' ') || u.email;

    return orders.map((o) => {
      const principal = o.org ?? o.owner;
      return {
        id: o.id,
        status: o.status as 'PAID' | 'FAILED',
        total: o.total,
        gateway: o.gateway,
        createdAt: o.createdAt.toISOString(),
        buyer: {
          name: userName(principal),
          handle: principal.handle,
          email: principal.email,
        },
        items: o.items.map((it) => ({
          type: it.type,
          title:
            it.event?.title ??
            it.spot?.title ??
            it.hero?.titleAccent ??
            it.hero?.title ??
            it.article?.title ??
            it.type,
          days: it.days,
          subtotal: it.subtotal,
        })),
      };
    });
  }

  private async assertSpotQuota() {
    const maxActive = Number(this.config.get('SPOT_MAX_ACTIVE')) || 10;
    const active = await this.prisma.spot.count({
      where: { status: PublicationStatus.APPROVED, expirationDate: { gte: new Date() } },
    });
    if (active >= maxActive) {
      throw new UnprocessableEntityException('No hay cupos disponibles para spots en este momento');
    }
  }

  private async assertHeroQuota() {
    const maxActive = Number(this.config.get('HERO_MAX_ACTIVE')) || 5;
    const active = await this.prisma.hero.count({
      where: { status: PublicationStatus.APPROVED, expirationDate: { gte: new Date() } },
    });
    if (active >= maxActive) {
      throw new UnprocessableEntityException('No hay cupos disponibles para heroes en este momento');
    }
  }
}
