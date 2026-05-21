import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PublicationStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { AddItemDto, OrderItemType } from './dto/add-item.dto';

const ITEM_INCLUDE = {
  event: { include: { category: true } },
  spot: true,
  hero: { include: { category: true } },
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private maxDays(type: OrderItemType): number {
    if (type === OrderItemType.EVENT) return Number(this.config.get('EVENT_MAX_DAYS')) || 60;
    if (type === OrderItemType.HERO) return Number(this.config.get('HERO_MAX_DAYS')) || 30;
    return Number(this.config.get('SPOT_MAX_DAYS')) || 30;
  }

  /** Devuelve el borrador activo del usuario; si no existe lo crea. */
  async getOrCreateDraft(user: JwtUser) {
    const existing = await this.prisma.order.findFirst({
      where: { userId: user.sub, status: OrderStatus.DRAFT },
      include: { items: { include: ITEM_INCLUDE } },
    });
    if (existing) return existing;

    return this.prisma.order.create({
      data: { owner: { connect: { id: user.sub } } },
      include: { items: { include: ITEM_INCLUDE } },
    });
  }

  /** Agrega o reemplaza un ítem en el carrito. Valida cuota al momento de agregar. */
  async addItem(orderId: number, dto: AddItemDto, user: JwtUser) {
    const order = await this.ensureDraft(orderId, user);

    const maxDays = this.maxDays(dto.type);
    if (dto.days > maxDays) {
      throw new BadRequestException(`Máximo ${maxDays} días para ${dto.type.toLowerCase()}`);
    }

    // Validar cuota al agregar (no solo en checkout)
    if (dto.type === OrderItemType.SPOT) await this.assertSpotQuota();
    if (dto.type === OrderItemType.HERO) await this.assertHeroQuota();

    const { unitPrice, eventId, spotId, heroId } = await this.resolveItem(dto, user);
    const subtotal = dto.days * unitPrice;

    await this.prisma.orderItem.upsert({
      where: { orderId_type: { orderId: order.id, type: dto.type } },
      create: { orderId: order.id, type: dto.type, days: dto.days, unitPrice, subtotal, eventId, spotId, heroId },
      update: { days: dto.days, unitPrice, subtotal, eventId, spotId, heroId },
    });

    return this.recalcAndReturn(orderId);
  }

  /** Quita un ítem del carrito por tipo. */
  async removeItem(orderId: number, type: OrderItemType, user: JwtUser) {
    const order = await this.ensureDraft(orderId, user);
    const item = await this.prisma.orderItem.findUnique({
      where: { orderId_type: { orderId: order.id, type } },
    });
    if (!item) throw new NotFoundException(`No hay ítem de tipo ${type} en este carrito`);
    await this.prisma.orderItem.delete({ where: { id: item.id } });
    return this.recalcAndReturn(orderId);
  }

  /** Consulta el carrito. */
  findOne(orderId: number, user: JwtUser) {
    return this.ensureVisible(orderId, user);
  }

  // ── Helpers privados ──

  private async resolveItem(dto: AddItemDto, user: JwtUser) {
    if (dto.type === OrderItemType.SPOT) {
      if (!dto.spotId) throw new BadRequestException('spotId es requerido para ítems de tipo SPOT');
      const spot = await this.prisma.spot.findUnique({ where: { id: dto.spotId } });
      if (!spot) throw new NotFoundException('Spot no encontrado');
      if (spot.userId !== user.sub) throw new ForbiddenException('Este spot no te pertenece');
      if (spot.status !== PublicationStatus.DRAFT) {
        throw new BadRequestException('Solo se pueden agregar spots en estado DRAFT al carrito');
      }
      return { unitPrice: Number(this.config.get('SPOT_PRICE_PER_DAY')) || 8000, eventId: null, spotId: dto.spotId, heroId: null };
    }

    if (dto.type === OrderItemType.HERO) {
      if (!dto.heroId) throw new BadRequestException('heroId es requerido para ítems de tipo HERO');
      const hero = await this.prisma.hero.findUnique({ where: { id: dto.heroId } });
      if (!hero) throw new NotFoundException('Hero no encontrado');
      if (hero.userId !== user.sub) throw new ForbiddenException('Este hero no te pertenece');
      if (hero.status !== PublicationStatus.DRAFT) {
        throw new BadRequestException('Solo se pueden agregar heroes en estado DRAFT al carrito');
      }
      return { unitPrice: Number(this.config.get('HERO_PRICE_PER_DAY')) || 15000, eventId: null, spotId: null, heroId: dto.heroId };
    }

    // EVENT
    if (!dto.eventId) throw new BadRequestException('eventId es requerido para ítems de tipo EVENT');
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      include: { category: true },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    if (event.userId !== user.sub) throw new ForbiddenException('Este evento no te pertenece');
    if (event.status !== PublicationStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden agregar eventos en estado DRAFT al carrito');
    }
    const unitPrice = event.category?.pricePerDay ?? 0;
    return { unitPrice, eventId: dto.eventId, spotId: null, heroId: null };
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

  private async recalcAndReturn(orderId: number) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    const total = items.reduce((sum, i) => sum + i.subtotal, 0);
    return this.prisma.order.update({
      where: { id: orderId },
      data: { total },
      include: { items: { include: ITEM_INCLUDE } },
    });
  }

  private async ensureDraft(orderId: number, user: JwtUser) {
    const order = await this.ensureVisible(orderId, user);
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden modificar órdenes en estado DRAFT');
    }
    return order;
  }

  private async ensureVisible(orderId: number, user: JwtUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: ITEM_INCLUDE } },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isAdmin && order.userId !== user.sub) throw new ForbiddenException('No tienes acceso a esta orden');
    return order;
  }
}
