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

@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransfersController {
  constructor(private readonly service: TransfersService) {}

  /** POST /transfers — Crea una transferencia de ítem a una organización */
  @Post()
  create(
    @Body() dto: CreateTransferDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.create(dto, user, req);
  }

  /**
   * GET /transfers/incoming — Lista transferencias PENDING para la org del contexto.
   * Requiere header X-Org-Context con el ID de la organización.
   */
  @Get('incoming')
  @UseGuards(OrgContextGuard)
  listIncoming(@OrgContext() ctx: OrgContextDto | null) {
    if (!ctx) throw new BadRequestException('Header X-Org-Context requerido');
    return this.service.listIncoming(ctx);
  }

  /** POST /transfers/:id/accept — OWNER de la org destino acepta la transferencia */
  @Post(':id/accept')
  accept(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.accept(id, user, req);
  }

  /** POST /transfers/:id/reject — OWNER de la org destino rechaza la transferencia */
  @Post(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectTransferDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.reject(id, dto, user, req);
  }
}

@Controller('admin/transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminTransfersController {
  constructor(private readonly service: TransfersService) {}

  /** POST /admin/transfers — Admin fuerza una transferencia directa (ADMIN_FORCED) */
  @Post()
  adminCreate(
    @Body() dto: AdminCreateTransferDto,
    @CurrentUser() user: JwtUser,
    @Req() req: Request,
  ) {
    return this.service.adminCreate(dto, user, req);
  }
}
