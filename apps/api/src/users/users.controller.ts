import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
}
