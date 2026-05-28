import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';
import { CreateEventTagDto } from './dto/create-event-tag.dto';
import { UpdateEventTagDto } from './dto/update-event-tag.dto';
import { CreateArticleCategoryDto } from './dto/create-article-category.dto';
import { UpdateArticleCategoryDto } from './dto/update-article-category.dto';
import { CreateArticleTagDto } from './dto/create-article-tag.dto';
import { UpdateArticleTagDto } from './dto/update-article-tag.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Countries ──

  findCountries() {
    return this.prisma.country.findMany({ orderBy: { name: 'asc' } });
  }

  async findCountry(id: number) {
    const country = await this.prisma.country.findUnique({ where: { id }, include: { states: true } });
    if (!country) throw new NotFoundException('País no encontrado');
    return country;
  }

  async createCountry(dto: CreateCountryDto) {
    const slug = dto.slug ?? dto.name.toLowerCase().replace(/\s+/g, '-');
    await this.assertUniqueSlug('country', slug);
    return this.prisma.country.create({ data: { name: dto.name, slug } });
  }

  async updateCountry(id: number, dto: UpdateCountryDto) {
    await this.findCountry(id);
    if (dto.slug) await this.assertUniqueSlug('country', dto.slug, id);
    return this.prisma.country.update({ where: { id }, data: dto });
  }

  async removeCountry(id: number) {
    await this.findCountry(id);
    await this.prisma.country.delete({ where: { id } });
    return { deleted: true };
  }

  // ── States ──

  findStates(countrySlug?: string) {
    return this.prisma.state.findMany({
      where: countrySlug ? { country: { slug: countrySlug } } : undefined,
      include: { country: true },
      orderBy: { name: 'asc' },
    });
  }

  async findState(id: number) {
    const state = await this.prisma.state.findUnique({ where: { id }, include: { country: true, cities: true } });
    if (!state) throw new NotFoundException('Estado/Región no encontrado');
    return state;
  }

  async createState(dto: CreateStateDto) {
    await this.assertUniqueSlug('state', dto.slug);
    if (!dto.countryId) throw new Error('countryId es requerido para crear un estado');
    return this.prisma.state.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        country: { connect: { id: dto.countryId } },
      },
      include: { country: true },
    });
  }

  async updateState(id: number, dto: UpdateStateDto) {
    await this.findState(id);
    if (dto.slug) await this.assertUniqueSlug('state', dto.slug, id);
    const { countryId, ...rest } = dto;
    return this.prisma.state.update({
      where: { id },
      data: {
        ...rest,
        ...(countryId !== undefined && { country: { connect: { id: countryId } } }),
      },
      include: { country: true },
    });
  }

  async removeState(id: number) {
    await this.findState(id);
    await this.prisma.state.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Cities ──

  findCities(stateSlug?: string) {
    return this.prisma.city.findMany({
      where: stateSlug ? { state: { slug: stateSlug } } : undefined,
      include: { state: true },
      orderBy: { name: 'asc' },
    });
  }

  async findCity(id: number) {
    const city = await this.prisma.city.findUnique({ where: { id }, include: { state: { include: { country: true } } } });
    if (!city) throw new NotFoundException('Ciudad/Comuna no encontrada');
    return city;
  }

  async createCity(dto: CreateCityDto) {
    await this.assertUniqueSlug('city', dto.slug);
    if (!dto.stateId) throw new Error('stateId es requerido para crear una ciudad');
    return this.prisma.city.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        state: { connect: { id: dto.stateId } },
      },
      include: { state: true },
    });
  }

  async updateCity(id: number, dto: UpdateCityDto) {
    await this.findCity(id);
    if (dto.slug) await this.assertUniqueSlug('city', dto.slug, id);
    const { stateId, ...rest } = dto;
    return this.prisma.city.update({
      where: { id },
      data: {
        ...rest,
        ...(stateId !== undefined && { state: { connect: { id: stateId } } }),
      },
      include: { state: true },
    });
  }

  async removeCity(id: number) {
    await this.findCity(id);
    await this.prisma.city.delete({ where: { id } });
    return { deleted: true };
  }

  // ── EventCategories ──

  eventCategories() {
    return this.prisma.eventCategory.findMany({ orderBy: [{ order: 'asc' }, { name: 'asc' }] });
  }

  async findEventCategory(id: number) {
    const c = await this.prisma.eventCategory.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Categoría de evento no encontrada');
    return c;
  }

  async createEventCategory(dto: CreateEventCategoryDto) {
    await this.assertUniqueSlug('eventCategory', dto.slug);
    return this.prisma.eventCategory.create({ data: dto });
  }

  async updateEventCategory(id: number, dto: UpdateEventCategoryDto) {
    await this.findEventCategory(id);
    if (dto.slug) await this.assertUniqueSlug('eventCategory', dto.slug, id);
    return this.prisma.eventCategory.update({ where: { id }, data: dto });
  }

  async removeEventCategory(id: number) {
    await this.findEventCategory(id);
    await this.prisma.eventCategory.delete({ where: { id } });
    return { deleted: true };
  }

  // ── EventTags ──

  eventTags() {
    return this.prisma.eventTag.findMany({ orderBy: { name: 'asc' } });
  }

  async findEventTag(id: number) {
    const t = await this.prisma.eventTag.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tag de evento no encontrado');
    return t;
  }

  async createEventTag(dto: CreateEventTagDto) {
    await this.assertUniqueSlug('eventTag', dto.slug);
    return this.prisma.eventTag.create({ data: dto });
  }

  async updateEventTag(id: number, dto: UpdateEventTagDto) {
    await this.findEventTag(id);
    if (dto.slug) await this.assertUniqueSlug('eventTag', dto.slug, id);
    return this.prisma.eventTag.update({ where: { id }, data: dto });
  }

  async removeEventTag(id: number) {
    await this.findEventTag(id);
    await this.prisma.eventTag.delete({ where: { id } });
    return { deleted: true };
  }

  // ── ArticleCategories ──

  articleCategories() {
    return this.prisma.articleCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findArticleCategory(id: number) {
    const c = await this.prisma.articleCategory.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Categoría de artículo no encontrada');
    return c;
  }

  async createArticleCategory(dto: CreateArticleCategoryDto) {
    await this.assertUniqueSlug('articleCategory', dto.slug);
    return this.prisma.articleCategory.create({ data: dto });
  }

  async updateArticleCategory(id: number, dto: UpdateArticleCategoryDto) {
    await this.findArticleCategory(id);
    if (dto.slug) await this.assertUniqueSlug('articleCategory', dto.slug, id);
    return this.prisma.articleCategory.update({ where: { id }, data: dto });
  }

  async removeArticleCategory(id: number) {
    await this.findArticleCategory(id);
    await this.prisma.articleCategory.delete({ where: { id } });
    return { deleted: true };
  }

  // ── ArticleTags ──

  articleTags() {
    return this.prisma.articleTag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: true } } },
    });
  }

  async findArticleTag(id: number) {
    const t = await this.prisma.articleTag.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Tag de artículo no encontrado');
    return t;
  }

  async createArticleTag(dto: CreateArticleTagDto) {
    await this.assertUniqueSlug('articleTag', dto.slug);
    return this.prisma.articleTag.create({ data: dto });
  }

  async updateArticleTag(id: number, dto: UpdateArticleTagDto) {
    await this.findArticleTag(id);
    if (dto.slug) await this.assertUniqueSlug('articleTag', dto.slug, id);
    return this.prisma.articleTag.update({ where: { id }, data: dto });
  }

  async removeArticleTag(id: number) {
    await this.findArticleTag(id);
    await this.prisma.articleTag.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Helper ──

  private async assertUniqueSlug(
    model: 'country' | 'state' | 'city' | 'eventCategory' | 'eventTag' | 'articleCategory' | 'articleTag',
    slug: string,
    excludeId?: number,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (this.prisma[model] as any).findUnique({ where: { slug } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Ya existe un registro con el slug "${slug}"`);
    }
  }
}
