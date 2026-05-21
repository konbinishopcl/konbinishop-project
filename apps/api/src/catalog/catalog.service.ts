import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { CreateCommuneDto } from './dto/create-commune.dto';
import { UpdateCommuneDto } from './dto/update-commune.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Regions ──

  regions() {
    return this.prisma.region.findMany({ orderBy: { name: 'asc' } });
  }

  async findRegion(id: number) {
    const region = await this.prisma.region.findUnique({ where: { id }, include: { communes: true } });
    if (!region) throw new NotFoundException('Región no encontrada');
    return region;
  }

  async createRegion(dto: CreateRegionDto) {
    await this.assertUnique('region', dto.slug);
    return this.prisma.region.create({ data: { name: dto.name, slug: dto.slug } });
  }

  async updateRegion(id: number, dto: UpdateRegionDto) {
    await this.findRegion(id);
    if (dto.slug) await this.assertUnique('region', dto.slug, id);
    return this.prisma.region.update({ where: { id }, data: dto });
  }

  async removeRegion(id: number) {
    await this.findRegion(id);
    await this.prisma.region.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Communes ──

  communes(regionSlug?: string) {
    return this.prisma.commune.findMany({
      where: regionSlug ? { region: { slug: regionSlug } } : undefined,
      include: { region: true },
      orderBy: { name: 'asc' },
    });
  }

  async findCommune(id: number) {
    const commune = await this.prisma.commune.findUnique({ where: { id }, include: { region: true } });
    if (!commune) throw new NotFoundException('Comuna no encontrada');
    return commune;
  }

  async createCommune(dto: CreateCommuneDto) {
    await this.assertUnique('commune', dto.slug);
    return this.prisma.commune.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        region: dto.regionId ? { connect: { id: dto.regionId } } : undefined,
      },
      include: { region: true },
    });
  }

  async updateCommune(id: number, dto: UpdateCommuneDto) {
    await this.findCommune(id);
    if (dto.slug) await this.assertUnique('commune', dto.slug, id);
    const { regionId, ...rest } = dto;
    return this.prisma.commune.update({
      where: { id },
      data: {
        ...rest,
        ...(regionId !== undefined && { region: { connect: { id: regionId } } }),
      },
      include: { region: true },
    });
  }

  async removeCommune(id: number) {
    await this.findCommune(id);
    await this.prisma.commune.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Categories ──

  categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findCategory(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    await this.assertUnique('category', dto.slug);
    return this.prisma.category.create({ data: dto });
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    await this.findCategory(id);
    if (dto.slug) await this.assertUnique('category', dto.slug, id);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async removeCategory(id: number) {
    await this.findCategory(id);
    await this.prisma.category.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Tags ──

  tags() {
    return this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
  }

  async findTag(id: number) {
    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException('Tag no encontrado');
    return tag;
  }

  async createTag(dto: CreateTagDto) {
    await this.assertUnique('tag', dto.slug);
    return this.prisma.tag.create({ data: dto });
  }

  async updateTag(id: number, dto: UpdateTagDto) {
    await this.findTag(id);
    if (dto.slug) await this.assertUnique('tag', dto.slug, id);
    return this.prisma.tag.update({ where: { id }, data: dto });
  }

  async removeTag(id: number) {
    await this.findTag(id);
    await this.prisma.tag.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Helper ──

  private async assertUnique(model: 'region' | 'commune' | 'category' | 'tag', slug: string, excludeId?: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (this.prisma[model] as any).findUnique({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Ya existe un registro con el slug "${slug}"`);
    }
  }
}
