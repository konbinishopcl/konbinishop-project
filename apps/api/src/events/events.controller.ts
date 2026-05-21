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
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { RejectEventDto } from './dto/reject-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  // ── Lectura pública ──

  @Get()
  findAll(@Query() query: QueryEventsDto) {
    return this.events.findPublic(query);
  }

  // Rutas estáticas declaradas antes de :slug para que no las capture el param.
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  findForAdmin(@Query() query: QueryEventsDto) {
    return this.events.findForAdmin(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: JwtUser) {
    return this.events.findMine(user);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.events.findBySlug(slug);
  }

  // ── Mutaciones del organizador ──

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateEventDto, @CurrentUser() user: JwtUser) {
    return this.events.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.events.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.events.remove(id, user);
  }

  // ── Moderación (ADMIN+) ──

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.events.approve(id, user);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectEventDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.events.reject(id, dto.reason, user);
  }
}
