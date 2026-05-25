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
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una organización (el creador queda como OWNER)' })
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.create(dto, user, req);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener una organización por ID (solo miembros o admins)' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una organización (solo OWNER o admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.update(id, dto, user, req);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una organización (solo OWNER o admin)' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.remove(id, user, req);
  }

  // ── Membresías e invitaciones ──

  /**
   * GET /organizations/:id/members
   * Lista los miembros de la org. Requiere ser miembro o ADMIN+.
   */
  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar miembros de una organización (miembro o admin)' })
  listMembers(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.listMembers(id, user);
  }

  /**
   * POST /organizations/:id/members/invite
   * Invita a un usuario por email. Solo OWNER o ADMIN+.
   */
  @Post(':id/members/invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invitar a un usuario por email (solo OWNER o admin)' })
  inviteMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.inviteMember(id, dto, user, req);
  }

  /**
   * POST /organizations/invitations/:token/accept
   * Acepta una invitación. El usuario autenticado se agrega como MEMBER.
   * Ruta estática declarada antes de las dinámicas para evitar colisiones.
   */
  @Post('invitations/:token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aceptar invitación por token' })
  acceptInvitation(
    @Param('token') token: string,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.acceptInvitation(token, user, req);
  }

  /**
   * PATCH /organizations/:id/members/:userId
   * Cambia el rol de un miembro. Solo OWNER o ADMIN+. No puede degradar al único OWNER.
   */
  @Patch(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar rol de un miembro (solo OWNER o admin)' })
  changeMemberRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.changeMemberRole(id, userId, dto, user, req);
  }

  /**
   * DELETE /organizations/:id/members/:userId
   * Elimina a un miembro. Solo OWNER o ADMIN+. No puede eliminar al único OWNER.
   */
  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un miembro de la organización (solo OWNER o admin)' })
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.removeMember(id, userId, user, req);
  }
}
