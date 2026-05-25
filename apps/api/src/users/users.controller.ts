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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { SetVerifiedDto } from './dto/set-verified.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('recent')
  @ApiOperation({ summary: 'Últimos 10 usuarios registrados — solo nombre y avatar (público)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios recientes', schema: { example: [{ id: 1, firstname: 'Ana', lastname: 'García', profile: { avatar: '/uploads/avatar.jpg' } }] } })
  findRecent() {
    return this.users.findRecent();
  }

  @Get('me/saved-events')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar eventos guardados del usuario autenticado (paginado)' })
  findSavedEvents(
    @CurrentUser() user: JwtUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 12;
    return this.users.findSavedEventsForUser(user.sub, p, ps);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar usuarios (ADMIN+)' })
  findAll() {
    return this.users.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Crear un usuario (SUPER_ADMIN)' })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch('me/organizer')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Actualizar bio y website del organizador autenticado' })
  updateOrganizer(@Body() dto: UpdateOrganizerDto, @CurrentUser() user: JwtUser) {
    return this.users.updateOrganizer(user.sub, dto);
  }

  @Patch(':id/verified')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Asignar o revocar el badge Verificado (SUPER_ADMIN)' })
  setVerified(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetVerifiedDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.users.setVerified(id, dto.isVerified, user, req);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Editar un usuario (SUPER_ADMIN)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.users.update(id, dto, user, req);
  }

  @Patch(':id/ban')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Banear o desbanear un usuario (SUPER_ADMIN)' })
  ban(
    @Param('id', ParseIntPipe) id: number,
    @Body('blocked') blocked: boolean | undefined,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.users.setBanned(id, blocked ?? true, user, req);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Eliminar un usuario (SUPER_ADMIN)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.users.remove(id, user, req);
  }

  @Get(':handle')
  @ApiOperation({ summary: 'Perfil público por handle (persona u organización)' })
  findByHandle(@Param('handle') handle: string) {
    return this.users.findByHandle(handle);
  }
}
