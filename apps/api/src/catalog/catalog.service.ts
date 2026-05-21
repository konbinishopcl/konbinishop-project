import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}
