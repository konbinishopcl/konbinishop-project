import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PublicationStatus } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { MailService } from '../../services/mailgun/mail.service';
import { AuditService } from '../audit/audit.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto, SortBy } from './dto/query-events.dto';

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
  city: { include: { state: { include: { country: true } } } },
  category: true,
  prices: true,
  dates: true,
  socialLinks: true,
  videos: true,
  _count: { select: { likes: true } },
} satisfies Prisma.EventInclude;

// Para vistas de admin: además del contenido, el organizador.
const EVENT_INCLUDE_ADMIN = {
  ...EVENT_INCLUDE,
  owner: { select: { id: true, firstname: true, lastname: true, email: true } },
} satisfies Prisma.EventInclude;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
  ) {}

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
            { title: { contains: query.q } },
            { description: { contains: query.q } },
          ],
        }
      : {};

    const where: Prisma.EventWhereInput = {
      ...(!isAdmin && {
        status: PublicationStatus.APPROVED,
        OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
      }),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.state ? { city: { state: { slug: query.state } } } : {}),
      ...textFilter,
    };

    const include = isAdmin ? EVENT_INCLUDE_ADMIN : EVENT_INCLUDE;

    const orderBy: Prisma.EventOrderByWithRelationInput =
      query.sortBy === SortBy.LIKES
        ? { likes: { _count: 'desc' } }
        : { createdAt: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        include,
        orderBy,
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

  async create(dto: CreateEventDto, user: JwtUser, req?: Request) {
    const slug = await this.uniqueSlug(dto.title);
    const event = await this.prisma.event.create({
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
        city: dto.cityId ? { connect: { id: dto.cityId } } : undefined,
        category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
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
    this.audit.log({ userId: user.sub, action: 'CREATE', entity: 'EVENT', entityId: event.id, req });
    return event;
  }

  // ─────────────────────── Actualización ───────────────────────

  async update(id: number, dto: UpdateEventDto, user: JwtUser, req?: Request) {
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
    if (dto.cityId !== undefined) {
      data.city = dto.cityId ? { connect: { id: dto.cityId } } : { disconnect: true };
    }
    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
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

    const updated = await this.prisma.event.update({ where: { id }, data, include: EVENT_INCLUDE });
    this.audit.log({ userId: user.sub, action: 'UPDATE', entity: 'EVENT', entityId: id, req });
    return updated;
  }

  async remove(id: number, user: JwtUser, req?: Request) {
    const event = await this.ensure(id);
    this.assertCanManage(event, user);
    await this.prisma.event.delete({ where: { id } });
    this.audit.log({ userId: user.sub, action: 'DELETE', entity: 'EVENT', entityId: id, req });
    return { deleted: true };
  }

  // ─────────────────────── Moderación ───────────────────────

  async approve(id: number, user: JwtUser, req?: Request) {
    await this.ensure(id);
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        status: PublicationStatus.APPROVED,
        rejectedReason: null,
        approvedBy: { connect: { id: user.sub } },
        rejectedBy: { disconnect: true },
      },
      include: {
        ...EVENT_INCLUDE,
        owner: { select: { email: true, firstname: true } },
      },
    });
    this.audit.log({ userId: user.sub, action: 'APPROVE', entity: 'EVENT', entityId: id, req });
    if (event.owner?.email) {
      const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
      await this.mail.sendEventApproved(
        event.owner.email,
        event.owner.firstname ?? event.owner.email,
        event.title,
        `${frontendUrl}/eventos/${event.slug}`,
      );
    }
    return event;
  }

  async reject(id: number, reason: string, user: JwtUser, req?: Request) {
    await this.ensure(id);
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        status: PublicationStatus.REJECTED,
        rejectedReason: reason,
        rejectedBy: { connect: { id: user.sub } },
      },
      include: {
        ...EVENT_INCLUDE,
        owner: { select: { email: true, firstname: true } },
      },
    });
    this.audit.log({ userId: user.sub, action: 'REJECT', entity: 'EVENT', entityId: id, metadata: { reason }, req });
    if (event.owner?.email) {
      await this.mail.sendEventRejected(
        event.owner.email,
        event.owner.firstname ?? event.owner.email,
        event.title,
        reason,
      );
    }
    return event;
  }

  async ban(id: number, reason: string, user: JwtUser, req?: Request) {
    await this.ensure(id);
    const event = await this.prisma.event.update({
      where: { id },
      data: {
        status: PublicationStatus.BANNED,
        rejectedReason: reason,
        rejectedBy: { connect: { id: user.sub } },
      },
      include: {
        ...EVENT_INCLUDE,
        owner: { select: { email: true, firstname: true } },
      },
    });
    this.audit.log({ userId: user.sub, action: 'BAN', entity: 'EVENT', entityId: id, metadata: { reason }, req });
    if (event.owner?.email) {
      await this.mail
        .sendContentBanned(
          event.owner.email,
          event.owner.firstname ?? event.owner.email,
          event.title,
          reason,
        )
        .catch(() => {});
    }
    return event;
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
