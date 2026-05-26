import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PublicationStatus, UserType } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { MailService } from '../../services/mailgun/mail.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto, SortBy } from './dto/query-events.dto';
import type { OrgContextDto } from '../common/org-context/org-context.types';

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
  owner: {
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      handle: true,
      profile: { select: { displayName: true } },
    },
  },
} satisfies Prisma.EventInclude;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
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
      // Admin: muestra todo por defecto; filtra por estado si se pide.
      // Solo excluye PENDING_PAYMENT (flujo de pago en curso, sin valor para moderación).
      ...(isAdmin && query.status
        ? { status: query.status }
        : isAdmin
          ? { status: { not: PublicationStatus.PENDING_PAYMENT } }
          : {}),
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

    if (user?.sub && items.length > 0) {
      const ids = items.map(e => e.id);
      const saved = await this.prisma.savedEvent.findMany({
        where: { userId: user.sub, eventId: { in: ids } },
        select: { eventId: true },
      });
      const savedSet = new Set(saved.map(s => s.eventId));
      const itemsWithSaved = items.map(e => ({ ...e, isSaved: savedSet.has(e.id) }));
      return { items: itemsWithSaved, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findBySlug(slug: string, user?: JwtUser | null) {
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
    if (user?.sub) {
      const saved = await this.prisma.savedEvent.findUnique({
        where: { userId_eventId: { userId: user.sub, eventId: event.id } },
      });
      return { ...event, isSaved: saved !== null };
    }
    return event;
  }

  /** Detalle de un evento por ID, accesible solo para ADMIN+ (incluye owner). */
  async findByIdAdmin(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: EVENT_INCLUDE_ADMIN,
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  // ─────────────────────── Listados privados ───────────────────────

  /** Eventos del usuario autenticado o de la org (cualquier estado). */
  findMine(user: JwtUser, orgContext: OrgContextDto | null = null) {
    const ownerId = orgContext?.orgId ?? user.sub;
    return this.prisma.event.findMany({
      where: { userId: ownerId },
      include: EVENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────── Favoritos ───────────────────────

  async save(eventId: number, userId: number) {
    await this.ensure(eventId);
    try {
      await this.prisma.savedEvent.create({ data: { userId, eventId } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Evento ya guardado');
      }
      throw err;
    }
    return { saved: true };
  }

  async unsave(eventId: number, userId: number) {
    const existing = await this.prisma.savedEvent.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!existing) throw new NotFoundException('Evento no estaba guardado');
    await this.prisma.savedEvent.delete({ where: { userId_eventId: { userId, eventId } } });
    return { unsaved: true };
  }

  async findSavedByUser(userId: number, page = 1, pageSize = 12) {
    pageSize = Math.min(pageSize, 50);
    const [savedRows, total] = await this.prisma.$transaction([
      this.prisma.savedEvent.findMany({
        where: { userId },
        include: { event: { include: EVENT_INCLUDE } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.savedEvent.count({ where: { userId } }),
    ]);
    const items = savedRows.map(s => ({ ...s.event, isSaved: true }));
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ─────────────────────── Creación ───────────────────────

  async create(dto: CreateEventDto, user: JwtUser, orgContext: OrgContextDto | null = null, req?: Request) {
    const ownerId = orgContext?.orgId ?? user.sub;
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
        owner: { connect: { id: ownerId } },
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
    this.audit.log({ userId: user.sub, action: 'CREATE', entity: 'EVENT', entityId: event.id, metadata: { orgContext: orgContext?.orgId ?? null }, req });
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
        owner: { select: { id: true, email: true, firstname: true, type: true } },
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
    if (event.owner) {
      const rcpt = event.owner.type === UserType.ORGANIZATION
        ? { orgId: event.owner.id }
        : { userId: event.owner.id };
      this.notifications.create({
        type: 'EVENT_APPROVED',
        title: `Tu evento "${event.title}" fue aprobado`,
        payload: { eventId: id },
        ...rcpt,
      });
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
        owner: { select: { id: true, email: true, firstname: true, type: true } },
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
    if (event.owner) {
      const rcpt = event.owner.type === UserType.ORGANIZATION
        ? { orgId: event.owner.id }
        : { userId: event.owner.id };
      this.notifications.create({
        type: 'EVENT_REJECTED',
        title: `Tu evento "${event.title}" fue rechazado`,
        body: reason,
        payload: { eventId: id, reason },
        ...rcpt,
      });
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
        owner: { select: { id: true, email: true, firstname: true, type: true } },
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
    if (event.owner) {
      const rcpt = event.owner.type === UserType.ORGANIZATION
        ? { orgId: event.owner.id }
        : { userId: event.owner.id };
      this.notifications.create({
        type: 'EVENT_BANNED',
        title: `Tu evento "${event.title}" fue eliminado`,
        body: reason,
        payload: { eventId: id, reason },
        ...rcpt,
      });
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
