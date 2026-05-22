import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { LikesService } from '../likes/likes.service';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly likes: LikesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar artículos con paginación y filtros opcionales (?q=&tag=&page=&pageSize=)' })
  findAll(@Query() query: QueryArticlesDto) {
    return this.articles.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalle de un artículo por slug' })
  findOne(@Param('slug') slug: string) {
    return this.articles.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un artículo (ADMIN+)' })
  create(@Body() dto: CreateArticleDto) {
    return this.articles.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un artículo (ADMIN+)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArticleDto) {
    return this.articles.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un artículo (ADMIN+)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.articles.remove(id);
  }

  // ── Likes ──

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dar like a un artículo' })
  like(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.likes.like('article', id, user);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar like de un artículo' })
  unlike(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.likes.unlike('article', id, user);
  }
}
