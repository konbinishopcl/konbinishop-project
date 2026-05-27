import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// ── Countries ──

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar países' })
  findAll() {
    return this.catalog.findCountries();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un país con sus estados/regiones' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findCountry(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un país (ADMIN+)' })
  create(@Body() dto: CreateCountryDto) {
    return this.catalog.createCountry(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un país (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCountryDto) {
    return this.catalog.updateCountry(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un país (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeCountry(id);
  }
}

// ── States ──

@ApiTags('states')
@Controller('states')
export class StatesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar estados/regiones; filtro opcional ?country=<slug>' })
  findAll(@Query('country') country?: string) {
    return this.catalog.findStates(country);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un estado/región con sus ciudades' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findState(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un estado/región (ADMIN+)' })
  create(@Body() dto: CreateStateDto) {
    return this.catalog.createState(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un estado/región (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStateDto) {
    return this.catalog.updateState(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un estado/región (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeState(id);
  }
}

// ── Cities ──

@ApiTags('cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar ciudades/comunas; filtro opcional ?state=<slug>' })
  findAll(@Query('state') state?: string) {
    return this.catalog.findCities(state);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una ciudad/comuna' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findCity(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una ciudad/comuna (ADMIN+)' })
  create(@Body() dto: CreateCityDto) {
    return this.catalog.createCity(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar una ciudad/comuna (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCityDto) {
    return this.catalog.updateCity(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una ciudad/comuna (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeCity(id);
  }
}

// ── EventCategories ──

@ApiTags('event-categories')
@Controller('event-categories')
export class EventCategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías de eventos' })
  findAll() {
    return this.catalog.eventCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una categoría de evento' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findEventCategory(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una categoría de evento (ADMIN+)' })
  create(@Body() dto: CreateEventCategoryDto) {
    return this.catalog.createEventCategory(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar una categoría de evento (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventCategoryDto) {
    return this.catalog.updateEventCategory(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una categoría de evento (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeEventCategory(id);
  }
}

// ── EventTags ──

@ApiTags('event-tags')
@Controller('event-tags')
export class EventTagsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tags de eventos' })
  findAll() {
    return this.catalog.eventTags();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un tag de evento' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findEventTag(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un tag de evento (ADMIN+)' })
  create(@Body() dto: CreateEventTagDto) {
    return this.catalog.createEventTag(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un tag de evento (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventTagDto) {
    return this.catalog.updateEventTag(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un tag de evento (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeEventTag(id);
  }
}

// ── ArticleCategories ──

@ApiTags('article-categories')
@Controller('article-categories')
export class ArticleCategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías de artículos' })
  findAll() {
    return this.catalog.articleCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una categoría de artículo' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findArticleCategory(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una categoría de artículo (ADMIN+)' })
  create(@Body() dto: CreateArticleCategoryDto) {
    return this.catalog.createArticleCategory(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar una categoría de artículo (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticleCategoryDto) {
    return this.catalog.updateArticleCategory(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una categoría de artículo (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeArticleCategory(id);
  }
}

// ── ArticleTags ──

@ApiTags('article-tags')
@Controller('article-tags')
export class ArticleTagsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tags de artículos' })
  findAll() {
    return this.catalog.articleTags();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un tag de artículo' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findArticleTag(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un tag de artículo (ADMIN+)' })
  create(@Body() dto: CreateArticleTagDto) {
    return this.catalog.createArticleTag(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un tag de artículo (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticleTagDto) {
    return this.catalog.updateArticleTag(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un tag de artículo (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeArticleTag(id);
  }
}
