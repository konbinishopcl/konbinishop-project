import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

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
    await this.assertUniqueSlug('category', dto.slug);
    return this.prisma.category.create({ data: dto });
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    await this.findCategory(id);
    if (dto.slug) await this.assertUniqueSlug('category', dto.slug, id);
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
    await this.assertUniqueSlug('tag', dto.slug);
    return this.prisma.tag.create({ data: dto });
  }

  async updateTag(id: number, dto: UpdateTagDto) {
    await this.findTag(id);
    if (dto.slug) await this.assertUniqueSlug('tag', dto.slug, id);
    return this.prisma.tag.update({ where: { id }, data: dto });
  }

  async removeTag(id: number) {
    await this.findTag(id);
    await this.prisma.tag.delete({ where: { id } });
    return { deleted: true };
  }

  // ── Helper ──

  private async assertUniqueSlug(
    model: 'country' | 'state' | 'city' | 'category' | 'tag',
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
