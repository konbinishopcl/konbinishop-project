import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const ARTICLE_INCLUDE = { tags: true, _count: { select: { likes: true } } } as const;

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryArticlesDto = {}) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 12, 50);

    const where: Prisma.ArticleWhereInput = {
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

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({ where: { slug }, include: ARTICLE_INCLUDE });
    if (!article) throw new NotFoundException('Artículo no encontrado');
    return article;
  }

  async findById(id: number) {
    const article = await this.prisma.article.findUnique({ where: { id }, include: ARTICLE_INCLUDE });
    if (!article) throw new NotFoundException('Artículo no encontrado');
    return article;
  }

  async create(dto: CreateArticleDto) {
    const slug = dto.slug ?? slugify(dto.title);
    const existing = await this.prisma.article.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Ya existe un artículo con el slug "${slug}"`);
    return this.prisma.article.create({
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
  }

  async update(id: number, dto: UpdateArticleDto) {
    await this.findById(id);
    if (dto.slug) {
      const conflict = await this.prisma.article.findFirst({ where: { slug: dto.slug, NOT: { id } } });
      if (conflict) throw new ConflictException(`Ya existe un artículo con el slug "${dto.slug}"`);
    }
    return this.prisma.article.update({
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
  }

  async remove(id: number) {
    await this.findById(id);
    await this.prisma.article.delete({ where: { id } });
    return { deleted: true };
  }
}
