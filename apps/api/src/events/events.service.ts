import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PublicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';

/** Genera un slug url-safe: minúsculas, sin acentos, separado por guiones. */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Relaciones y componentes que se devuelven con cada evento.
const EVENT_INCLUDE = {
  region: true,
  commune: true,
  categories: true,
  prices: true,
  dates: true,
  socialLinks: true,
  videos: true,
} satisfies Prisma.EventInclude;

// Para vistas de admin: además del contenido, el organizador.
const EVENT_INCLUDE_ADMIN = {
  ...EVENT_INCLUDE,
  owner: { select: { id: true, firstname: true, lastname: true, email: true } },
} satisfies Prisma.EventInclude;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────── Lectura ───────────────────────

  /**
   * Listado paginado de eventos.
   * - Admin/SuperAdmin: todos los estados, pageSize máx 100, incluye owner.
   * - Público: solo APPROVED y no expirados, pageSize máx 50.
   */
  async findAll(query: QueryEventsDto, user?: JwtUser | null) {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? (isAdmin ? 20 : 12), isAdmin ? 100 : 50);

    const textFilter: Prisma.EventWhereInput = query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};

    const where: Prisma.EventWhereInput = {
      ...(!isAdmin && {
        status: PublicationStatus.APPROVED,
        OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
      }),
      ...(query.category ? { categories: { some: { slug: query.category } } } : {}),
      ...(query.region ? { region: { slug: query.region } } : {}),
      ...textFilter,
    };

    const include = isAdmin ? EVENT_INCLUDE_ADMIN : EVENT_INCLUDE;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.event.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: EVENT_INCLUDE,
    });
    if (!event || event.status !== PublicationStatus.APPROVED) {
      throw new NotFoundException('Evento no encontrado');
    }
    if (event.expirationDate && event.expirationDate < new Date()) {
      throw new NotFoundException('Evento no encontrado');
    }
    return event;
  }

  // ─────────────────────── Listados privados ───────────────────────

  /** Eventos del usuario autenticado (cualquier estado). */
  findMine(user: JwtUser) {
    return this.prisma.event.findMany({
      where: { userId: user.sub },
      include: EVENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────── Creación ───────────────────────

  async create(dto: CreateEventDto, user: JwtUser) {
    const slug = await this.uniqueSlug(dto.title);
    return this.prisma.event.create({
      data: {
        title: dto.title,
        company: dto.company,
        slug,
        description: dto.description,
        about: dto.about,
        address: dto.address,
        addressNumber: dto.addressNumber ?? null,
        ticketUrl: dto.ticketUrl,
        banner: dto.banner,
        poster: dto.poster,
        gallery: dto.gallery ?? [],
        status: PublicationStatus.DRAFT,
        owner: { connect: { id: user.sub } },
        region: dto.regionId ? { connect: { id: dto.regionId } } : undefined,
        commune: dto.communeId ? { connect: { id: dto.communeId } } : undefined,
        categories: dto.categoryIds?.length
          ? { connect: dto.categoryIds.map((id) => ({ id })) }
          : undefined,
        prices: dto.prices?.length
          ? { create: dto.prices.map((p) => ({ name: p.name, price: p.price ?? 0 })) }
          : undefined,
        dates: dto.dates?.length
          ? {
              create: dto.dates.map((d) => ({
                date: d.date ? new Date(d.date) : null,
                startTime: d.startTime,
                endTime: d.endTime,
              })),
            }
          : undefined,
        socialLinks: dto.socialLinks?.length
          ? { create: dto.socialLinks.map((s) => ({ link: s.link })) }
          : undefined,
        videos: dto.videos?.length
          ? { create: dto.videos.map((v) => ({ link: v.link })) }
          : undefined,
      },
      include: EVENT_INCLUDE,
    });
  }

  // ─────────────────────── Actualización ───────────────────────

  async update(id: number, dto: UpdateEventDto, user: JwtUser) {
    const event = await this.ensure(id);
    this.assertCanManage(event, user);

    const data: Prisma.EventUpdateInput = {
      title: dto.title,
      company: dto.company,
      description: dto.description,
      about: dto.about,
      address: dto.address,
      addressNumber: dto.addressNumber,
      ticketUrl: dto.ticketUrl,
      banner: dto.banner,
      poster: dto.poster,
      gallery: dto.gallery,
    };
    if (dto.expirationDate !== undefined) {
      data.expirationDate = dto.expirationDate ? new Date(dto.expirationDate) : null;
    }
    if (dto.regionId !== undefined) {
      data.region = dto.regionId ? { connect: { id: dto.regionId } } : { disconnect: true };
    }
    if (dto.communeId !== undefined) {
      data.commune = dto.communeId ? { connect: { id: dto.communeId } } : { disconnect: true };
    }
    if (dto.categoryIds !== undefined) {
      data.categories = { set: dto.categoryIds.map((cid) => ({ id: cid })) };
    }
    if (dto.prices !== undefined) {
      data.prices = {
        deleteMany: {},
        create: dto.prices.map((p) => ({ name: p.name, price: p.price ?? 0 })),
      };
    }
    if (dto.dates !== undefined) {
      data.dates = {
        deleteMany: {},
        create: dto.dates.map((d) => ({
          date: d.date ? new Date(d.date) : null,
          startTime: d.startTime,
          endTime: d.endTime,
        })),
      };
    }
    if (dto.socialLinks !== undefined) {
      data.socialLinks = {
        deleteMany: {},
        create: dto.socialLinks.map((s) => ({ link: s.link })),
      };
    }
    if (dto.videos !== undefined) {
      data.videos = {
        deleteMany: {},
        create: dto.videos.map((v) => ({ link: v.link })),
      };
    }

    return this.prisma.event.update({ where: { id }, data, include: EVENT_INCLUDE });
  }

  async remove(id: number, user: JwtUser) {
    const event = await this.ensure(id);
    this.assertCanManage(event, user);
    await this.prisma.event.delete({ where: { id } });
    return { deleted: true };
  }

  // ─────────────────────── Moderación ───────────────────────

  async approve(id: number, user: JwtUser) {
    await this.ensure(id);
    return this.prisma.event.update({
      where: { id },
      data: {
        status: PublicationStatus.APPROVED,
        rejectedReason: null,
        approvedBy: { connect: { id: user.sub } },
        rejectedBy: { disconnect: true },
      },
      include: EVENT_INCLUDE,
    });
  }

  async reject(id: number, reason: string, user: JwtUser) {
    await this.ensure(id);
    return this.prisma.event.update({
      where: { id },
      data: {
        status: PublicationStatus.REJECTED,
        rejectedReason: reason,
        rejectedBy: { connect: { id: user.sub } },
      },
      include: EVENT_INCLUDE,
    });
  }

  // ─────────────────────── Helpers ───────────────────────

  private async ensure(id: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  private assertCanManage(event: { userId: number | null }, user: JwtUser) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isAdmin && event.userId !== user.sub) {
      throw new ForbiddenException('No puedes gestionar este evento');
    }
  }

  /** Slug a partir del título, con sufijo numérico si ya existe. */
  private async uniqueSlug(title: string): Promise<string> {
    const base = slugify(title) || 'evento';
    let slug = base;
    let n = 1;
    while (await this.prisma.event.findUnique({ where: { slug } })) {
      slug = `${base}-${++n}`;
    }
    return slug;
  }
}
