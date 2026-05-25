import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { OrgContextGuard } from '../common/org-context/org-context.guard';
import { OrgContext } from '../common/org-context/org-context.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { RejectTransferDto } from './dto/reject-transfer.dto';
import { AdminCreateTransferDto } from './dto/admin-create-transfer.dto';

@ApiTags('transfers')
@ApiBearerAuth()
@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly service: TransfersService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear una transferencia de ítem hacia una organización',
    description:
      'El dueño del ítem (evento, aviso, portada o artículo) solicita transferirlo a una org. ' +
      'Si el usuario es OWNER de la org destino → auto-aprobada (APPROVED). ' +
      'Si es MEMBER → queda PENDING y se notifica al OWNER.',
  })
  @ApiResponse({ status: 201, description: 'Transferencia creada' })
  @ApiResponse({ status: 400, description: 'Ítem no encontrado o no pertenece al usuario' })
  @ApiResponse({ status: 403, description: 'El usuario no es miembro de la org destino' })
  create(
    @Body() dto: CreateTransferDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.create(dto, user, req);
  }

  @Get('incoming')
  @UseGuards(OrgContextGuard)
  @ApiOperation({
    summary: 'Listar transferencias PENDING para la organización del contexto',
    description:
      'Requiere el header `X-Org-Context` con el ID de la organización. ' +
      'Solo visible para miembros de esa org.',
  })
  @ApiHeader({
    name: 'X-Org-Context',
    description: 'ID de la organización (context switching)',
    required: true,
    example: '42',
  })
  @ApiResponse({ status: 200, description: 'Lista de transferencias pendientes' })
  @ApiResponse({ status: 400, description: 'Header X-Org-Context ausente' })
  @ApiResponse({ status: 401, description: 'No autenticado o no miembro de la org' })
  listIncoming(@OrgContext() ctx: OrgContextDto | null) {
    if (!ctx) throw new BadRequestException('Header X-Org-Context requerido');
    return this.service.listIncoming(ctx);
  }

  @Post(':id/accept')
  @ApiOperation({
    summary: 'Aceptar una transferencia pendiente (OWNER de la org destino)',
  })
  @ApiParam({ name: 'id', description: 'ID de la transferencia', example: 1 })
  @ApiResponse({ status: 200, description: 'Transferencia aceptada — ítem transferido' })
  @ApiResponse({ status: 403, description: 'No es OWNER de la org destino' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  accept(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.accept(id, user, req);
  }

  @Post(':id/reject')
  @ApiOperation({
    summary: 'Rechazar una transferencia pendiente (OWNER de la org destino)',
  })
  @ApiParam({ name: 'id', description: 'ID de la transferencia', example: 1 })
  @ApiResponse({ status: 200, description: 'Transferencia rechazada' })
  @ApiResponse({ status: 403, description: 'No es OWNER de la org destino' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectTransferDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.reject(id, dto, user, req);
  }
}

@ApiTags('admin / transfers')
@ApiBearerAuth()
@Controller('admin/transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminTransfersController {
  constructor(private readonly service: TransfersService) {}

  @Post()
  @ApiOperation({
    summary: 'Forzar una transferencia directa (ADMIN_FORCED) sin aprobación',
    description:
      'Solo ADMIN o SUPER_ADMIN. Transfiere cualquier ítem directamente entre cuentas ' +
      'sin pasar por el flujo de aprobación normal.',
  })
  @ApiResponse({ status: 201, description: 'Transferencia forzada creada y aplicada' })
  @ApiResponse({ status: 400, description: 'Ítem no encontrado o parámetros inválidos' })
  @ApiResponse({ status: 403, description: 'Requiere rol ADMIN o SUPER_ADMIN' })
  adminCreate(
    @Body() dto: AdminCreateTransferDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.adminCreate(dto, user, req);
  }
}
