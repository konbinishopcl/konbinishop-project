import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OrderStatus, PublicationStatus } from '@prisma/client';

import { PrismaService } from '../../utils/prisma/prisma.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { SettingsService } from '../settings/settings.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AddItemDto, OrderItemType } from './dto/add-item.dto';
import type { OrgContextDto } from '../common/org-context/org-context.types';

const ITEM_INCLUDE = {
  event: { include: { eventCategory: true } },
  spot: true,
  hero: { include: { eventCategory: true } },
  article: true,
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  private async maxDays(type: OrderItemType): Promise<number> {
    if (type === OrderItemType.EVENT) return this.settings.getNum('EVENT_MAX_DAYS');
    if (type === OrderItemType.HERO) return this.settings.getNum('HERO_MAX_DAYS');
    if (type === OrderItemType.SPOT) return this.settings.getNum('SPOT_MAX_DAYS');
    // ARTICLE y SUBSCRIPTION no tienen maxDays (precio fijo / 30 días fijos)
    return 0;
  }

  /**
   * Helper privado para obtener la suscripción activa del contexto actual.
   * Delega a SubscriptionsService.getActiveForOwner para consistencia cross-módulo.
   */
  private async getActiveSub(user: JwtUser, orgContext: OrgContextDto | null) {
    const userId = orgContext ? null : user.sub;
    const orgId = orgContext?.orgId ?? null;
    return this.subscriptions.getActiveForOwner(userId, orgId);
  }

  /** Devuelve el borrador activo del usuario (o de la org); si no existe lo crea. */
  async getOrCreateDraft(user: JwtUser, orgContext: OrgContextDto | null = null) {
    // Pitfall #6: validar que el orgId apunta a un User con type=ORGANIZATION
    if (orgContext) {
      const org = await this.prisma.user.findUnique({
        where: { id: orgContext.orgId },
        select: { type: true },
      });
      if (!org || org.type !== 'ORGANIZATION') {
        throw new BadRequestException('orgContext.orgId no apunta a una organización');
      }
    }

    const existing = await this.prisma.order.findFirst({
      where: {
        userId: user.actingAs ?? user.sub,
        orgId: orgContext?.orgId ?? null,
        status: OrderStatus.DRAFT,
      },
      include: { items: { include: ITEM_INCLUDE } },
    });
    if (existing) return existing;

    return this.prisma.order.create({
      data: {
        owner: { connect: { id: user.actingAs ?? user.sub } },
        ...(orgContext && { org: { connect: { id: orgContext.orgId } } }),
      },
      include: { items: { include: ITEM_INCLUDE } },
    });
  }

  /** Agrega o reemplaza un ítem en el carrito. Valida cuota al momento de agregar. */
  async addItem(orderId: number, dto: AddItemDto, user: JwtUser, orgContext: OrgContextDto | null = null) {
    const order = await this.ensureDraft(orderId, user, orgContext);

    // D-05/D-06: para EVENT con crédito disponible, days es opcional (el frontend no lo envía).
    // Detectamos el crédito antes de la validación de días para no bloquear el flujo.
    const sub = await this.getActiveSub(user, orgContext);
    const hasCredit = !!sub && sub.creditsUsed < sub.creditsTotal && dto.type === OrderItemType.EVENT;

    // Service-level validation: días requerido y >=1 para tipos por-día
    // EVENT con crédito activo exime de esta validación (days se calcula internamente).
    const needsDays =
      dto.type === OrderItemType.SPOT ||
      dto.type === OrderItemType.HERO ||
      (dto.type === OrderItemType.EVENT && !hasCredit);

    // CNT-04 D-17: para EVENT sin crédito, cargar eventCategory para usar minDays/maxDays
    let categoryMinDays: number | null = null;
    let categoryMaxDays: number | null = null;
    if (dto.type === OrderItemType.EVENT && !hasCredit && dto.eventId) {
      const eventForCap = await this.prisma.event.findUnique({
        where: { id: dto.eventId },
        select: {
          eventCategory: { select: { minDays: true, maxDays: true } },
        },
      });
      categoryMinDays = eventForCap?.eventCategory?.minDays ?? null;
      categoryMaxDays = eventForCap?.eventCategory?.maxDays ?? null;
    }

    if (needsDays && (dto.days === undefined || dto.days < 1)) {
      throw new BadRequestException(`days es requerido y debe ser >= 1 para ítems de tipo ${dto.type}`);
    }

    // CNT-04 D-17: para EVENT sin crédito, cap = min(category.maxDays, EVENT_MAX_DAYS global)
    // Para SPOT/HERO el global aplica solo (no hay category cap por ahora)
    const globalMax = await this.maxDays(dto.type);
    let effectiveMax = globalMax;
    if (dto.type === OrderItemType.EVENT && !hasCredit && categoryMaxDays !== null) {
      effectiveMax = Math.min(globalMax, categoryMaxDays);
    }
    if (effectiveMax > 0 && dto.days !== undefined && dto.days > effectiveMax) {
      throw new BadRequestException(`Máximo ${effectiveMax} días para ${dto.type.toLowerCase()}`);
    }

    // CNT-04 D-17: minDays solo aplica a EVENT sin crédito
    if (dto.type === OrderItemType.EVENT && !hasCredit && categoryMinDays !== null && categoryMinDays > 1) {
      if (dto.days !== undefined && dto.days < categoryMinDays) {
        throw new BadRequestException(`Mínimo ${categoryMinDays} días para esta categoría de evento`);
      }
    }

    // Validar cuota al agregar (no solo en checkout)
    if (dto.type === OrderItemType.SPOT) await this.assertSpotQuota();
    if (dto.type === OrderItemType.HERO) await this.assertHeroQuota();

    const { unitPrice, eventId, spotId, heroId, articleId, creditApplied } = await this.resolveItem(dto, user, orgContext, sub);

    let days: number;
    if (creditApplied) {
      // D-05: días = min(45, daysUntilCycleEnd, daysUntilEventExpiration?)
      const today = new Date();
      const daysUntilCycleEnd = Math.max(1, Math.floor((sub!.cycleEnd.getTime() - today.getTime()) / 86_400_000));

      // Cargar event.expirationDate para el cap por evento (puede ser null)
      const eventForCap = await this.prisma.event.findUnique({
        where: { id: eventId! },
        select: { expirationDate: true },
      });
      const caps: number[] = [45, daysUntilCycleEnd];
      if (eventForCap?.expirationDate) {
        const daysUntilEvent = Math.max(1, Math.floor((eventForCap.expirationDate.getTime() - today.getTime()) / 86_400_000));
        caps.push(daysUntilEvent);
      }
      days = Math.min(...caps);
    } else if (dto.type === OrderItemType.ARTICLE) {
      days = 0;
    } else {
      days = dto.days!; // garantizado por validación service-level
    }

    const subtotal = dto.type === OrderItemType.ARTICLE ? unitPrice : days * unitPrice;

    await this.prisma.orderItem.upsert({
      where: { orderId_type: { orderId: order.id, type: dto.type } },
      create: { orderId: order.id, type: dto.type, days, unitPrice, subtotal, eventId, spotId, heroId, articleId },
      update: { days, unitPrice, subtotal, eventId, spotId, heroId, articleId },
    });

    return this.recalcAndReturn(orderId);
  }

  /** Quita un ítem del carrito por tipo. */
  async removeItem(orderId: number, type: OrderItemType, user: JwtUser, orgContext: OrgContextDto | null = null) {
    const order = await this.ensureDraft(orderId, user, orgContext);
    const item = await this.prisma.orderItem.findUnique({
      where: { orderId_type: { orderId: order.id, type } },
    });
    if (!item) throw new NotFoundException(`No hay ítem de tipo ${type} en este carrito`);
    await this.prisma.orderItem.delete({ where: { id: item.id } });
    return this.recalcAndReturn(orderId);
  }

  /** Consulta el carrito. */
  findOne(orderId: number, user: JwtUser, orgContext: OrgContextDto | null = null) {
    return this.ensureVisible(orderId, user, orgContext);
  }

  // ── Helpers privados ──

  private async resolveItem(
    dto: AddItemDto,
    user: JwtUser,
    orgContext: OrgContextDto | null = null,
    preloadedSub?: Awaited<ReturnType<typeof this.getActiveSub>> | null,
  ) {
    const ownerId = orgContext?.orgId ?? user.sub;

    if (dto.type === OrderItemType.ARTICLE) {
      if (!dto.articleId) throw new BadRequestException('articleId es requerido para ítems de tipo ARTICLE');
      const article = await this.prisma.article.findUnique({ where: { id: dto.articleId } });
      if (!article) throw new NotFoundException('Artículo no encontrado');
      if (article.userId !== ownerId) throw new ForbiddenException('Este artículo no pertenece al contexto actual');
      if (article.status !== PublicationStatus.DRAFT) {
        throw new BadRequestException('Solo se pueden agregar artículos en estado DRAFT al carrito');
      }
      const unitPrice = await this.settings.getNum('ARTICLE_PRICE');
      return { unitPrice, eventId: null, spotId: null, heroId: null, articleId: dto.articleId, creditApplied: false };
    }

    if (dto.type === OrderItemType.SPOT) {
      if (!dto.spotId) throw new BadRequestException('spotId es requerido para ítems de tipo SPOT');
      const spot = await this.prisma.spot.findUnique({ where: { id: dto.spotId } });
      if (!spot) throw new NotFoundException('Spot no encontrado');
      if (spot.userId !== ownerId) throw new ForbiddenException('Este spot no pertenece al contexto actual');
      if (spot.status !== PublicationStatus.DRAFT) {
        throw new BadRequestException('Solo se pueden agregar spots en estado DRAFT al carrito');
      }
      // D-07: descuento para suscriptores en SPOT
      const basePrice = await this.settings.getNum('SPOT_PRICE_PER_DAY');
      const sub = preloadedSub !== undefined ? preloadedSub : await this.getActiveSub(user, orgContext);
      let unitPrice = basePrice;
      if (sub) {
        const discount = await this.settings.getNum('SUBSCRIPTION_SPOT_DISCOUNT');
        unitPrice = Math.round(basePrice * (1 - discount / 100));
      }
      return { unitPrice, eventId: null, spotId: dto.spotId, heroId: null, articleId: null, creditApplied: false };
    }

    if (dto.type === OrderItemType.HERO) {
      if (!dto.heroId) throw new BadRequestException('heroId es requerido para ítems de tipo HERO');
      const hero = await this.prisma.hero.findUnique({ where: { id: dto.heroId } });
      if (!hero) throw new NotFoundException('Hero no encontrado');
      if (hero.userId !== ownerId) throw new ForbiddenException('Este hero no pertenece al contexto actual');
      if (hero.status !== PublicationStatus.DRAFT) {
        throw new BadRequestException('Solo se pueden agregar heroes en estado DRAFT al carrito');
      }
      // D-07: descuento para suscriptores en HERO
      const basePrice = await this.settings.getNum('HERO_PRICE_PER_DAY');
      const sub = preloadedSub !== undefined ? preloadedSub : await this.getActiveSub(user, orgContext);
      let unitPrice = basePrice;
      if (sub) {
        const discount = await this.settings.getNum('SUBSCRIPTION_HERO_DISCOUNT');
        unitPrice = Math.round(basePrice * (1 - discount / 100));
      }
      return { unitPrice, eventId: null, spotId: null, heroId: dto.heroId, articleId: null, creditApplied: false };
    }

    // EVENT
    if (!dto.eventId) throw new BadRequestException('eventId es requerido para ítems de tipo EVENT');
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { eventCategory: true },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    if (event.userId !== ownerId) throw new ForbiddenException('Este evento no pertenece al contexto actual');
    if (event.status !== PublicationStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden agregar eventos en estado DRAFT al carrito');
    }

    // D-05/D-06: detectar sub activa con crédito disponible
    const sub = preloadedSub !== undefined ? preloadedSub : await this.getActiveSub(user, orgContext);
    const hasCredit = sub && sub.creditsUsed < sub.creditsTotal;

    if (hasCredit) {
      // D-05: crédito auto-aplicado, unitPrice = 0, subtotal = 0
      // days se calcula en addItem con Math.min(45, daysUntilCycleEnd, daysUntilEventExpiration?)
      return {
        unitPrice: 0,
        eventId: dto.eventId,
        spotId: null,
        heroId: null,
        articleId: null,
        creditApplied: true,
      };
    }

    // D-06: sin crédito → cobro normal por eventCategory.
    const unitPrice = event.eventCategory?.pricePerDay ?? 0;
    return { unitPrice, eventId: dto.eventId, spotId: null, heroId: null, articleId: null, creditApplied: false };
  }

  private async assertSpotQuota() {
    const maxActive = await this.settings.getNum('SPOT_MAX_ACTIVE');
    const active = await this.prisma.spot.count({
      where: { status: PublicationStatus.APPROVED, expirationDate: { gte: new Date() } },
    });
    if (active >= maxActive) {
      throw new UnprocessableEntityException('No hay cupos disponibles para spots en este momento');
    }
  }

  private async assertHeroQuota() {
    const maxActive = await this.settings.getNum('HERO_MAX_ACTIVE');
    const active = await this.prisma.hero.count({
      where: { status: PublicationStatus.APPROVED, expirationDate: { gte: new Date() } },
    });
    if (active >= maxActive) {
      throw new UnprocessableEntityException('No hay cupos disponibles para heroes en este momento');
    }
  }

  private async recalcAndReturn(orderId: number) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { total },
      include: { items: { include: ITEM_INCLUDE } },
    });
  }

  private async ensureDraft(orderId: number, user: JwtUser, orgContext: OrgContextDto | null = null) {
    const order = await this.ensureVisible(orderId, user, orgContext);
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden modificar órdenes en estado DRAFT');
    }
    return order;
  }

  private async ensureVisible(orderId: number, user: JwtUser, orgContext: OrgContextDto | null = null) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: ITEM_INCLUDE } },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (isAdmin) return order;

    if (order.orgId !== null) {
      // Orden de organización: verificar que el caller es miembro de esa org
      const member = await this.prisma.orgMember.findUnique({
        where: { userId_orgId: { userId: user.actingAs ?? user.sub, orgId: order.orgId } },
      });
      if (!member) throw new ForbiddenException('No tienes acceso a esta orden');
    } else {
      // Orden personal: verificar que el caller es el dueño
      if (order.userId !== user.sub) throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return order;
  }
}
