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
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
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

// ── Categories ──

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías' })
  findAll() {
    return this.catalog.categories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una categoría' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findCategory(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una categoría (ADMIN+)' })
  create(@Body() dto: CreateCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar una categoría (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.catalog.updateCategory(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una categoría (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeCategory(id);
  }
}

// ── Tags ──

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tags' })
  findAll() {
    return this.catalog.tags();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un tag' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findTag(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un tag (ADMIN+)' })
  create(@Body() dto: CreateTagDto) {
    return this.catalog.createTag(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un tag (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTagDto) {
    return this.catalog.updateTag(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un tag (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeTag(id);
  }
}
