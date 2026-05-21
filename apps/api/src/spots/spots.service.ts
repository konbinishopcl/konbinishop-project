import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';

@Injectable()
export class SpotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private maxActive(): number {
    return Number(this.config.get('SPOT_MAX_ACTIVE')) || 10;
  }

  private maxDays(): number {
    return Number(this.config.get('SPOT_MAX_DAYS')) || 30;
  }

  private pricePerDay(): number {
    return Number(this.config.get('SPOT_PRICE_PER_DAY')) || 8000;
  }

  private countActive(): Promise<number> {
    return this.prisma.spot.count({
      where: { status: PublicationStatus.APPROVED, expirationDate: { gte: new Date() } },
    });
  }

  /** Quota + pricing — para que el frontend muestre disponibilidad antes de crear. */
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

  /** Spots aprobados y no expirados — visibles públicamente. */
  findActive() {
    return this.prisma.spot.findMany({
      where: {
        status: PublicationStatus.APPROVED,
        OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Spots del usuario actual (cualquier estado). */
  findMine(user: JwtUser) {
    return this.prisma.spot.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Crea un spot en DRAFT. Los días y la expiración se asignan al confirmar el pago. */
  create(dto: CreateSpotDto, user: JwtUser) {
    return this.prisma.spot.create({
      data: {
        title: dto.title,
        image: dto.image,
        linkType: dto.linkType,
        linkValue: dto.linkValue,
        status: PublicationStatus.DRAFT,
        owner: { connect: { id: user.sub } },
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

  /** Valida que haya cupo disponible; lanza excepción si no. */
  async assertQuotaAvailable() {
    if ((await this.countActive()) >= this.maxActive()) {
      throw new BadRequestException('No hay cupos disponibles para spots en este momento');
    }
  }

  /** Valida que los días no superen el máximo permitido. */
  assertMaxDays(days: number) {
    const max = this.maxDays();
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
