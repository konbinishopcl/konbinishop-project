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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { RejectEventDto } from './dto/reject-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { LikesService } from '../likes/likes.service';
import { OrgContextGuard } from '../common/org-context/org-context.guard';
import { OrgContext } from '../common/org-context/org-context.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly likes: LikesService,
  ) {}

  // ── Lectura ──

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Listar eventos. Público: solo APPROVED y activos. Admin/SuperAdmin: todos los estados.',
  })
  findAll(@Query() query: QueryEventsDto, @CurrentUser() user: JwtUser | null) {
    return this.events.findAll(query, user);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, OrgContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar los eventos del usuario actual o de la org' })
  findMine(@CurrentUser() user: JwtUser, @OrgContext() ctx: OrgContextDto | null) {
    return this.events.findMine(user, ctx);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de un evento aprobado por slug; incluye isSaved si hay sesión' })
  findOne(@Param('slug') slug: string, @CurrentUser() user: JwtUser | null) {
    return this.events.findBySlug(slug, user);
  }

  // ── Mutaciones del organizador ──

  @Post()
  @UseGuards(JwtAuthGuard, OrgContextGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un evento (queda pendiente de moderación)' })
  create(@Body() dto: CreateEventDto, @CurrentUser() user: JwtUser, @OrgContext() ctx: OrgContextDto | null, @Req() req: Request) {
    return this.events.create(dto, user, ctx, req);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un evento (dueño o admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.events.update(id, dto, user, req);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un evento (dueño o admin)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser, @Req() req: Request) {
    return this.events.remove(id, user, req);
  }

  // ── Moderación (ADMIN+) ──

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar un evento (ADMIN+)' })
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser, @Req() req: Request) {
    return this.events.approve(id, user, req);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechazar un evento con un motivo (ADMIN+)' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectEventDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.events.reject(id, dto.reason, user, req);
  }

  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bannear un evento con un motivo (ADMIN+)' })
  ban(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectEventDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.events.ban(id, dto.reason, user, req);
  }

  // ── Likes ──

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dar like a un evento' })
  like(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.likes.like('event', id, user);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar like de un evento' })
  unlike(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.likes.unlike('event', id, user);
  }

  // ── Favoritos ──

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Guardar un evento en favoritos' })
  save(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.events.save(id, user.sub);
  }

  @Delete(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar un evento de favoritos' })
  unsave(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.events.unsave(id, user.sub);
  }
}
