import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

// Endpoints públicos de lectura para taxonomías y contenido de referencia.
// @Controller() sin prefijo → rutas directas: /api/regions, /api/categories, etc.
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('regions')
  regions() {
    return this.catalog.regions();
  }

  @Get('communes')
  communes(@Query('region') region?: string) {
    return this.catalog.communes(region);
  }

  @Get('categories')
  categories() {
    return this.catalog.categories();
  }

  @Get('tags')
  tags() {
    return this.catalog.tags();
  }

  @Get('heroes')
  heroes() {
    return this.catalog.heroes();
  }

  @Get('spots')
  spots() {
    return this.catalog.spots();
  }

  @Get('articles')
  articles() {
    return this.catalog.articles();
  }

  @Get('articles/:slug')
  article(@Param('slug') slug: string) {
    return this.catalog.articleBySlug(slug);
  }
}
