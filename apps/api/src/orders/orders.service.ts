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
import { AddItemDto, OrderItemType } from './dto/add-item.dto';
import type { OrgContextDto } from '../common/org-context/org-context.types';

const ITEM_INCLUDE = {
  event: { include: { category: true } },
  spot: true,
  hero: { include: { category: true } },
  article: true,
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  private async maxDays(type: OrderItemType): Promise<number> {
    if (type === OrderItemType.EVENT) return this.settings.getNum('EVENT_MAX_DAYS');
    if (type === OrderItemType.HERO) return this.settings.getNum('HERO_MAX_DAYS');
    if (type === OrderItemType.SPOT) return this.settings.getNum('SPOT_MAX_DAYS');
    // ARTICLE y SUBSCRIPTION no tienen maxDays (precio fijo / 30 días fijos)
    return 0;
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
        userId: user.sub,
        orgId: orgContext?.orgId ?? null,
        status: OrderStatus.DRAFT,
      },
      include: { items: { include: ITEM_INCLUDE } },
    });
    if (existing) return existing;

    return this.prisma.order.create({
      data: {
        owner: { connect: { id: user.sub } },
        ...(orgContext && { org: { connect: { id: orgContext.orgId } } }),
      },
      include: { items: { include: ITEM_INCLUDE } },
    });
  }

  /** Agrega o reemplaza un ítem en el carrito. Valida cuota al momento de agregar. */
  async addItem(orderId: number, dto: AddItemDto, user: JwtUser, orgContext: OrgContextDto | null = null) {
    const order = await this.ensureDraft(orderId, user, orgContext);

    // Service-level validation: días requerido y >=1 para tipos por-día
    const needsDays = dto.type === OrderItemType.EVENT || dto.type === OrderItemType.SPOT || dto.type === OrderItemType.HERO;
    if (needsDays && (dto.days === undefined || dto.days < 1)) {
      throw new BadRequestException(`days es requerido y debe ser >= 1 para ítems de tipo ${dto.type}`);
    }

    const maxDays = await this.maxDays(dto.type);
    if (maxDays > 0 && dto.days! > maxDays) {
      throw new BadRequestException(`Máximo ${maxDays} días para ${dto.type.toLowerCase()}`);
    }

    // Validar cuota al agregar (no solo en checkout)
    if (dto.type === OrderItemType.SPOT) await this.assertSpotQuota();
    if (dto.type === OrderItemType.HERO) await this.assertHeroQuota();

    const { unitPrice, eventId, spotId, heroId, articleId } = await this.resolveItem(dto, user, orgContext);
    const days = dto.type === OrderItemType.ARTICLE ? 0 : (dto.days ?? 0);
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

  private async resolveItem(dto: AddItemDto, user: JwtUser, orgContext: OrgContextDto | null = null) {
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
      return { unitPrice, eventId: null, spotId: null, heroId: null, articleId: dto.articleId };
    }

    if (dto.type === OrderItemType.SPOT) {
      if (!dto.spotId) throw new BadRequestException('spotId es requerido para ítems de tipo SPOT');
      const spot = await this.prisma.spot.findUnique({ where: { id: dto.spotId } });
      if (!spot) throw new NotFoundException('Spot no encontrado');
      if (spot.userId !== ownerId) throw new ForbiddenException('Este spot no pertenece al contexto actual');
      if (spot.status !== PublicationStatus.DRAFT) {
        throw new BadRequestException('Solo se pueden agregar spots en estado DRAFT al carrito');
      }
      const unitPrice = await this.settings.getNum('SPOT_PRICE_PER_DAY');
      return { unitPrice, eventId: null, spotId: dto.spotId, heroId: null, articleId: null };
    }

    if (dto.type === OrderItemType.HERO) {
      if (!dto.heroId) throw new BadRequestException('heroId es requerido para ítems de tipo HERO');
      const hero = await this.prisma.hero.findUnique({ where: { id: dto.heroId } });
      if (!hero) throw new NotFoundException('Hero no encontrado');
      if (hero.userId !== ownerId) throw new ForbiddenException('Este hero no pertenece al contexto actual');
      if (hero.status !== PublicationStatus.DRAFT) {
        throw new BadRequestException('Solo se pueden agregar heroes en estado DRAFT al carrito');
      }
      const unitPrice = await this.settings.getNum('HERO_PRICE_PER_DAY');
      return { unitPrice, eventId: null, spotId: null, heroId: dto.heroId, articleId: null };
    }

    // EVENT
    if (!dto.eventId) throw new BadRequestException('eventId es requerido para ítems de tipo EVENT');
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { category: true },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    if (event.userId !== ownerId) throw new ForbiddenException('Este evento no pertenece al contexto actual');
    if (event.status !== PublicationStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden agregar eventos en estado DRAFT al carrito');
    }
    const unitPrice = event.category?.pricePerDay ?? 0;
    return { unitPrice, eventId: dto.eventId, spotId: null, heroId: null, articleId: null };
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
        where: { userId_orgId: { userId: user.sub, orgId: order.orgId } },
      });
      if (!member) throw new ForbiddenException('No tienes acceso a esta orden');
    } else {
      // Orden personal: verificar que el caller es el dueño
      if (order.userId !== user.sub) throw new ForbiddenException('No tienes acceso a esta orden');
    }

    return order;
  }
}
