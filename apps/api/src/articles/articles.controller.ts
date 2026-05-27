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
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticlesDto } from './dto/query-articles.dto';
import { CreateSponsoredArticleDto } from './dto/create-sponsored-article.dto';
import { RejectArticleDto } from './dto/reject-article.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { OrgContextGuard } from '../common/org-context/org-context.guard';
import { OrgContext } from '../common/org-context/org-context.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';
import { LikesService } from '../likes/likes.service';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly likes: LikesService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar artículos. Público: solo APPROVED. Admin/SuperAdmin: todos los estados (?status=...).' })
  findAll(@Query() query: QueryArticlesDto, @CurrentUser() user: JwtUser | null) {
    return this.articles.findAll(query, user);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, OrgContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar artículos del usuario autenticado (u org si X-Org-Context)' })
  findMine(@CurrentUser() user: JwtUser, @OrgContext() ctx: OrgContextDto | null) {
    return this.articles.findMine(user, ctx);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de un artículo por slug. Público: solo APPROVED.' })
  findOne(@Param('slug') slug: string, @CurrentUser() user: JwtUser | null) {
    return this.articles.findBySlug(slug, user);
  }

  // ── Artículo patrocinado (organizador) ──
  // IMPORTANTE: @Post('sponsored') debe declararse ANTES de @Post() para evitar conflictos de ruta.

  @Post('sponsored')
  @UseGuards(JwtAuthGuard, OrgContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un artículo patrocinado (queda en DRAFT, requiere pago)' })
  createSponsored(
    @Body() dto: CreateSponsoredArticleDto,
    @CurrentUser() user: JwtUser,
    @OrgContext() ctx: OrgContextDto | null,
  ) {
    return this.articles.createSponsored(dto, user, ctx);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un artículo editorial (ADMIN+)' })
  create(@Body() dto: CreateArticleDto) {
    return this.articles.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, OrgContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar artículo (owner o ADMIN+)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: JwtUser,
    @OrgContext() ctx: OrgContextDto | null,
  ) {
    return this.articles.update(id, dto, user, ctx);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, OrgContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar artículo (owner o ADMIN+)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @OrgContext() ctx: OrgContextDto | null,
  ) {
    return this.articles.remove(id, user, ctx);
  }

  // ── Moderación (ADMIN+) ──

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar un artículo patrocinado (ADMIN+)' })
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.articles.approve(id, user);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechazar un artículo patrocinado con motivo (ADMIN+)' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectArticleDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.articles.reject(id, dto.reason, user);
  }

  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Banear un artículo patrocinado con motivo (ADMIN+)' })
  ban(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectArticleDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.articles.ban(id, dto.reason, user);
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
