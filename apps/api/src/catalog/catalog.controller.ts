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
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { CreateCommuneDto } from './dto/create-commune.dto';
import { UpdateCommuneDto } from './dto/update-commune.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// ── Regions ──

@ApiTags('regions')
@Controller('regions')
export class RegionsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar regiones' })
  findAll() {
    return this.catalog.regions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una región con sus comunas' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findRegion(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una región (ADMIN+)' })
  create(@Body() dto: CreateRegionDto) {
    return this.catalog.createRegion(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar una región (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRegionDto) {
    return this.catalog.updateRegion(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una región (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeRegion(id);
  }
}

// ── Communes ──

@ApiTags('communes')
@Controller('communes')
export class CommunesController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Listar comunas; filtro opcional ?region=<slug>' })
  findAll(@Query('region') region?: string) {
    return this.catalog.communes(region);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una comuna' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.findCommune(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una comuna (ADMIN+)' })
  create(@Body() dto: CreateCommuneDto) {
    return this.catalog.createCommune(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar una comuna (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommuneDto) {
    return this.catalog.updateCommune(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una comuna (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeCommune(id);
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
