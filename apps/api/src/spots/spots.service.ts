import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

  /** Maximum run length (days) a spot can be published for, from the env. */
  private maxDays(): number {
    return Number(this.config.get('SPOT_MAX_DAYS')) || 30;
  }

  /**
   * Rejects an expiration date that runs past the allowed window
   * (today + SPOT_MAX_DAYS). A null/undefined date (no expiration) is allowed.
   */
  private assertWithinMaxDays(expirationDate?: string) {
    if (!expirationDate) return;
    const maxDays = this.maxDays();
    const limit = new Date();
    limit.setUTCHours(0, 0, 0, 0);
    limit.setUTCDate(limit.getUTCDate() + maxDays);
    if (new Date(expirationDate) > limit) {
      throw new BadRequestException(
        `Un aviso se puede publicar por un máximo de ${maxDays} días`,
      );
    }
  }

  /** Active spots — no expiration date or not expired yet. Shown among the event cards. */
  findActive() {
    const now = new Date();
    return this.prisma.spot.findMany({
      where: { OR: [{ expirationDate: null }, { expirationDate: { gte: now } }] },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Spots owned by the current user. */
  findMine(user: JwtUser) {
    return this.prisma.spot.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Any authenticated user can create a spot; it is active right away. */
  create(dto: CreateSpotDto, user: JwtUser) {
    this.assertWithinMaxDays(dto.expirationDate);
    return this.prisma.spot.create({
      data: {
        title: dto.title,
        image: dto.image,
        linkType: dto.linkType,
        linkValue: dto.linkValue,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        owner: { connect: { id: user.sub } },
      },
    });
  }

  async update(id: number, dto: UpdateSpotDto, user: JwtUser) {
    const spot = await this.ensure(id);
    this.assertCanManage(spot, user);
    this.assertWithinMaxDays(dto.expirationDate);
    return this.prisma.spot.update({
      where: { id },
      data: {
        title: dto.title,
        image: dto.image,
        linkType: dto.linkType,
        linkValue: dto.linkValue,
        ...(dto.expirationDate !== undefined
          ? { expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null }
          : {}),
      },
    });
  }

  async remove(id: number, user: JwtUser) {
    const spot = await this.ensure(id);
    this.assertCanManage(spot, user);
    await this.prisma.spot.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensure(id: number) {
    const spot = await this.prisma.spot.findUnique({ where: { id } });
    if (!spot) throw new NotFoundException('Aviso no encontrado');
    return spot;
  }

  /** A spot can be managed by its owner or by an admin. */
  private assertCanManage(spot: { userId: number }, user: JwtUser) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isAdmin && spot.userId !== user.sub) {
      throw new ForbiddenException('No puedes gestionar este aviso');
    }
  }
}
