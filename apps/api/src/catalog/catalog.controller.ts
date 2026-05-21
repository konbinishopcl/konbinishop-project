import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Endpoints públicos de lectura para taxonomías y contenido de referencia.
// @Controller() sin prefijo → rutas directas: /api/regions, /api/categories, etc.
@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('regions')
  @ApiOperation({ summary: 'Listar regiones' })
  regions() {
    return this.catalog.regions();
  }

  @Get('communes')
  @ApiOperation({ summary: 'Listar comunas; filtro opcional ?region=<slug>' })
  communes(@Query('region') region?: string) {
    return this.catalog.communes(region);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorías' })
  categories() {
    return this.catalog.categories();
  }

  @Get('tags')
  @ApiOperation({ summary: 'Listar tags' })
  tags() {
    return this.catalog.tags();
  }

  // ── Artículos ──

  @Get('articles')
  @ApiOperation({ summary: 'Listar artículos' })
  articles() {
    return this.catalog.articles();
  }

  @Get('articles/:slug')
  @ApiOperation({ summary: 'Detalle de un artículo por slug' })
  article(@Param('slug') slug: string) {
    return this.catalog.articleBySlug(slug);
  }

  // ── Administración de artículos (ADMIN+) ──

  @Post('articles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un artículo (ADMIN+)' })
  createArticle(@Body() dto: CreateArticleDto) {
    return this.catalog.createArticle(dto);
  }

  @Patch('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un artículo (ADMIN+)' })
  updateArticle(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticleDto) {
    return this.catalog.updateArticle(id, dto);
  }

  @Delete('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un artículo (ADMIN+)' })
  removeArticle(@Param('id', ParseIntPipe) id: number) {
    return this.catalog.removeArticle(id);
  }
}
