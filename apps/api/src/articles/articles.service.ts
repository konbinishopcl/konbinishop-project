import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

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

  findAll() {
    return this.prisma.article.findMany({
      include: ARTICLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
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
