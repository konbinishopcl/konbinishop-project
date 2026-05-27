import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PublicationStatus } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { JwtUser } from '../auth/current-user.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { CreateSponsoredArticleDto } from './dto/create-sponsored-article.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const ARTICLE_INCLUDE = {
  tags: true,
  _count: { select: { likes: true } },
} as const;

// Incluye el primer evento vinculado (APPROVED) para la vista de detalle
const ARTICLE_DETAIL_INCLUDE = {
  tags: true,
  _count: { select: { likes: true } },
  events: {
    where: { status: PublicationStatus.APPROVED },
    take: 1,
    select: {
      id: true,
      slug: true,
      title: true,
      poster: true,
      banner: true,
      dates: { take: 1, select: { id: true, date: true } },
      city: { select: { name: true } },
      category: { select: { name: true, slug: true } },
    },
  },
} as const;

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: QueryArticlesDto = {}, user?: JwtUser | null) {
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 12, 50);

    const where: Prisma.ArticleWhereInput = {
      // Público: solo APPROVED. Admin: todos los estados (o filtrado por ?status=)
      ...(!isAdmin && { status: PublicationStatus.APPROVED }),
      ...(isAdmin && query.status !== undefined && { status: query.status }),
      ...(query.q && { OR: [{ title: { contains: query.q } }, { excerpt: { contains: query.q } }] }),
      ...(query.tag && { tags: { some: { slug: query.tag } } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        include: ARTICLE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: items.map((a) => ({ ...a, isSponsored: a.userId !== null })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findBySlug(slug: string, user?: JwtUser | null) {
    const article = await this.prisma.article.findUnique({ where: { slug }, include: ARTICLE_DETAIL_INCLUDE });
    if (!article) throw new NotFoundException('Artículo no encontrado');
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    // Seguridad: visitantes públicos no pueden leer artículos que no estén APPROVED
    if (!isAdmin && article.status !== PublicationStatus.APPROVED) {
      throw new NotFoundException('Artículo no encontrado');
    }
    return { ...article, isSponsored: article.userId !== null };
  }

  async findById(id: number) {
    const article = await this.prisma.article.findUnique({ where: { id }, include: ARTICLE_INCLUDE });
    if (!article) throw new NotFoundException('Artículo no encontrado');
    // NO gate de status — findById se usa internamente (approve/reject/ban requieren ver todos los estados)
    return { ...article, isSponsored: article.userId !== null };
  }

  async findMine(user: JwtUser, orgContext: OrgContextDto | null = null) {
    const ownerId = orgContext?.orgId ?? user.sub;
    const items = await this.prisma.article.findMany({
      where: { userId: ownerId },
      include: ARTICLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return items.map((a) => ({ ...a, isSponsored: a.userId !== null }));
  }

  private assertOwnerOrAdmin(
    article: { userId: number | null },
    user: JwtUser,
    orgContext: OrgContextDto | null = null,
  ): void {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (isAdmin) return;
    if (article.userId === null) {
      throw new ForbiddenException('Solo administradores pueden modificar artículos editoriales');
    }
    const effectiveUserId = orgContext?.orgId ?? user.sub;
    if (article.userId !== effectiveUserId) {
      throw new ForbiddenException('No tienes permiso para modificar este artículo');
    }
  }

  async create(dto: CreateArticleDto) {
    const slug = dto.slug ?? slugify(dto.title);
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Ya existe un artículo con el slug "${slug}"`);
    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: dto.content,
        image: dto.image,
        tags: dto.tagIds?.length ? { connect: dto.tagIds.map((id) => ({ id })) } : undefined,
      },
      include: ARTICLE_INCLUDE,
    });
    return { ...article, isSponsored: article.userId !== null };
  }

  async update(id: number, dto: UpdateArticleDto, user: JwtUser, orgContext: OrgContextDto | null = null) {
    const article = await this.findById(id);
    this.assertOwnerOrAdmin(article, user, orgContext);
    if (dto.slug) {
      const conflict = await this.prisma.article.findFirst({ where: { slug: dto.slug, NOT: { id } } });
      if (conflict) throw new ConflictException(`Ya existe un artículo con el slug "${dto.slug}"`);
    }
    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.tagIds !== undefined && { tags: { set: dto.tagIds.map((tagId) => ({ id: tagId })) } }),
      },
      include: ARTICLE_INCLUDE,
    });
    return { ...updated, isSponsored: updated.userId !== null };
  }

  async remove(id: number, user: JwtUser, orgContext: OrgContextDto | null = null) {
    const article = await this.findById(id);
    this.assertOwnerOrAdmin(article, user, orgContext);
    await this.prisma.article.delete({ where: { id } });
    return { deleted: true };
  }

  // ─────────────────────── Artículos patrocinados ───────────────────────

  /**
   * Crea un artículo patrocinado con status=DRAFT.
   * El organizador autenticado (o su org) es el owner.
   * La transición DRAFT→PENDING_MODERATION ocurre en el pago (Phase 12-03 activateOrderItems).
   */
  async createSponsored(dto: CreateSponsoredArticleDto, user: JwtUser, orgContext: OrgContextDto | null = null) {
    const ownerId = orgContext?.orgId ?? user.sub;
    const slug = dto.slug ?? slugify(dto.title);
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Ya existe un artículo con el slug "${slug}"`);

    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: dto.content,
        image: dto.image,
        status: PublicationStatus.DRAFT,
        owner: { connect: { id: ownerId } },
        tags: dto.tagIds?.length ? { connect: dto.tagIds.map((id) => ({ id })) } : undefined,
        events: dto.eventId ? { connect: { id: dto.eventId } } : undefined,
      },
      include: ARTICLE_INCLUDE,
    });
    return { ...article, isSponsored: true };
  }

  // ─────────────────────── Moderación (ADMIN+) ───────────────────────

  /**
   * Aprueba un artículo patrocinado (userId != null).
   * D-04: simplificación intencional — siempre notificar al userId del artículo,
   * sin verificar User.type. Diferente al patrón Events/Spots/Heroes a propósito
   * (Article no tiene campo orgId, solo userId).
   */
  async approve(id: number, user: JwtUser) {
    const article = await this.findById(id);
    if (article.userId === null) {
      throw new BadRequestException('Solo artículos patrocinados pueden ser moderados');
    }
    const updated = await this.prisma.article.update({
      where: { id },
      data: { status: PublicationStatus.APPROVED, statusReason: null },
      include: ARTICLE_INCLUDE,
    });
    // D-04: siempre al userId del artículo
    this.notifications.create({
      type: 'ARTICLE_APPROVED',
      title: `Tu artículo "${article.title}" fue aprobado`,
      payload: { articleId: id },
      userId: article.userId,
    });
    return { ...updated, isSponsored: updated.userId !== null };
  }

  /**
   * Rechaza un artículo patrocinado con motivo.
   * D-04: simplificación intencional — ver approve().
   */
  async reject(id: number, reason: string, user: JwtUser) {
    const article = await this.findById(id);
    if (article.userId === null) {
      throw new BadRequestException('Solo artículos patrocinados pueden ser moderados');
    }
    const updated = await this.prisma.article.update({
      where: { id },
      data: { status: PublicationStatus.REJECTED, statusReason: reason },
      include: ARTICLE_INCLUDE,
    });
    // D-04: siempre al userId del artículo
    this.notifications.create({
      type: 'ARTICLE_REJECTED',
      title: `Tu artículo "${article.title}" fue rechazado`,
      body: reason,
      payload: { articleId: id, reason },
      userId: article.userId,
    });
    return { ...updated, isSponsored: updated.userId !== null };
  }

  /**
   * Banea un artículo patrocinado con motivo.
   * D-04: simplificación intencional — ver approve().
   */
  async ban(id: number, reason: string, user: JwtUser) {
    const article = await this.findById(id);
    if (article.userId === null) {
      throw new BadRequestException('Solo artículos patrocinados pueden ser moderados');
    }
    const updated = await this.prisma.article.update({
      where: { id },
      data: { status: PublicationStatus.BANNED, statusReason: reason },
      include: ARTICLE_INCLUDE,
    });
    // D-04: siempre al userId del artículo
    this.notifications.create({
      type: 'ARTICLE_BANNED',
      title: `Tu artículo "${article.title}" fue eliminado`,
      body: reason,
      payload: { articleId: id, reason },
      userId: article.userId,
    });
    return { ...updated, isSponsored: updated.userId !== null };
  }
}
