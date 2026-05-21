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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar los eventos del usuario actual' })
  findMine(@CurrentUser() user: JwtUser) {
    return this.events.findMine(user);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detalle de un evento aprobado por slug' })
  findOne(@Param('slug') slug: string) {
    return this.events.findBySlug(slug);
  }

  // ── Mutaciones del organizador ──

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un evento (queda pendiente de moderación)' })
  create(@Body() dto: CreateEventDto, @CurrentUser() user: JwtUser) {
    return this.events.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un evento (dueño o admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.events.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un evento (dueño o admin)' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.events.remove(id, user);
  }

  // ── Moderación (ADMIN+) ──

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar un evento (ADMIN+)' })
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.events.approve(id, user);
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
  ) {
    return this.events.reject(id, dto.reason, user);
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
}
