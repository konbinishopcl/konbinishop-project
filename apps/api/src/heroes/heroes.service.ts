import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateHeroDto } from './dto/create-hero.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';

@Injectable()
export class HeroesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Per-day price (CLP), from the env. */
  private pricePerDay(): number {
    return Number(this.config.get('HERO_PRICE_PER_DAY')) || 15000;
  }

  /** Global cap of active heroes, from the env. */
  private maxActive(): number {
    return Number(this.config.get('HERO_MAX_ACTIVE')) || 5;
  }

  /** Maximum run length (days) a hero can be published for, from the env. */
  private maxDays(): number {
    return Number(this.config.get('HERO_MAX_DAYS')) || 30;
  }

  private countActive(): Promise<number> {
    return this.prisma.hero.count({ where: { expirationDate: { gte: new Date() } } });
  }

  /** Active heroes — not expired. Shown in the home hero carousel. */
  findActive() {
    return this.prisma.hero.findMany({
      where: { expirationDate: { gte: new Date() } },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Heroes owned by the current user. */
  findMine(user: JwtUser) {
    return this.prisma.hero.findMany({
      where: { userId: user.sub },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Quota + pricing — for the UI to show availability before creating one. */
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

  /**
   * Any authenticated user can create a hero, as long as there is a free slot
   * (global quota). It is active right away; the amount is computed from the
   * number of days (payment is integrated later).
   */
  async create(dto: CreateHeroDto, user: JwtUser) {
    const maxDays = this.maxDays();
    if (dto.days > maxDays) {
      throw new BadRequestException(
        `Un hero se puede publicar por un máximo de ${maxDays} días`,
      );
    }
    if ((await this.countActive()) >= this.maxActive()) {
      throw new ConflictException('No hay cupos disponibles para heroes en este momento');
    }
    const expirationDate = new Date();
    expirationDate.setUTCDate(expirationDate.getUTCDate() + dto.days);

    return this.prisma.hero.create({
      data: {
        title: dto.title,
        lead: dto.lead,
        image: dto.image,
        date: dto.date ? new Date(dto.date) : null,
        place: dto.place,
        linkType: dto.linkType,
        linkValue: dto.linkValue,
        category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
        owner: { connect: { id: user.sub } },
        days: dto.days,
        amount: dto.days * this.pricePerDay(),
        expirationDate,
      },
      include: { category: true },
    });
  }

  async update(id: number, dto: UpdateHeroDto, user: JwtUser) {
    const hero = await this.ensure(id);
    this.assertCanManage(hero, user);
    return this.prisma.hero.update({
      where: { id },
      data: {
        title: dto.title,
        lead: dto.lead,
        image: dto.image,
        place: dto.place,
        linkType: dto.linkType,
        linkValue: dto.linkValue,
        ...(dto.date !== undefined ? { date: dto.date ? new Date(dto.date) : null } : {}),
        ...(dto.categoryId !== undefined
          ? {
              category: dto.categoryId
                ? { connect: { id: dto.categoryId } }
                : { disconnect: true },
            }
          : {}),
      },
      include: { category: true },
    });
  }

  async remove(id: number, user: JwtUser) {
    const hero = await this.ensure(id);
    this.assertCanManage(hero, user);
    await this.prisma.hero.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensure(id: number) {
    const hero = await this.prisma.hero.findUnique({ where: { id } });
    if (!hero) throw new NotFoundException('Hero no encontrado');
    return hero;
  }

  /** A hero can be managed by its owner or by an admin. */
  private assertCanManage(hero: { userId: number }, user: JwtUser) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isAdmin && hero.userId !== user.sub) {
      throw new ForbiddenException('No puedes gestionar este hero');
    }
  }
}
