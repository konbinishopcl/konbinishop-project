import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';

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

  @Get('heroes')
  @ApiOperation({ summary: 'Listar banners destacados vigentes' })
  heroes() {
    return this.catalog.heroes();
  }

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
}
