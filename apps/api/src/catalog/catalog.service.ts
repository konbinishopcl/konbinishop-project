import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

/** Lectura de taxonomías y contenido de referencia (regiones, comunas, etc.). */
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  regions() {
    return this.prisma.region.findMany({ orderBy: { name: 'asc' } });
  }

  communes(regionSlug?: string) {
    return this.prisma.commune.findMany({
      where: regionSlug ? { region: { slug: regionSlug } } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  tags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  articles() {
    return this.prisma.article.findMany({
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async articleBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: { tags: true },
    });
    if (!article) throw new NotFoundException('Artículo no encontrado');
    return article;
  }

  // ── Administración de artículos (ADMIN+) ──

  async createArticle(dto: CreateArticleDto) {
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
      include: { tags: true },
    });
  }

  async updateArticle(id: number, dto: UpdateArticleDto) {
    await this.findArticleById(id);

    if (dto.slug) {
      const conflict = await this.prisma.article.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
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
        ...(dto.tagIds !== undefined && {
          tags: { set: dto.tagIds.map((tagId) => ({ id: tagId })) },
        }),
      },
      include: { tags: true },
    });
  }

  async removeArticle(id: number) {
    await this.findArticleById(id);
    return this.prisma.article.delete({ where: { id } });
  }

  private async findArticleById(id: number) {
    const article = await this.prisma.article.findUnique({ where: { id } });
    if (!article) throw new NotFoundException('Artículo no encontrado');
    return article;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
