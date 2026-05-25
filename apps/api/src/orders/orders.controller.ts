import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { AddItemDto, OrderItemType } from './dto/add-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { OrgContextGuard } from '../common/org-context/org-context.guard';
import { OrgContext } from '../common/org-context/org-context.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrgContextGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('draft')
  @ApiOperation({ summary: 'Obtener o crear el carrito (DRAFT) del usuario actual o de la org' })
  getDraft(@CurrentUser() user: JwtUser, @OrgContext() ctx: OrgContextDto | null) {
    return this.orders.getOrCreateDraft(user, ctx);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una orden por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @OrgContext() ctx: OrgContextDto | null,
  ) {
    return this.orders.findOne(id, user, ctx);
  }

  @Put(':id/items')
  @ApiOperation({ summary: 'Agregar o reemplazar un ítem en el carrito (EVENT | SPOT | HERO)' })
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddItemDto,
    @CurrentUser() user: JwtUser,
    @OrgContext() ctx: OrgContextDto | null,
  ) {
    return this.orders.addItem(id, dto, user, ctx);
  }

  @Delete(':id/items/:type')
  @ApiOperation({ summary: 'Quitar un ítem del carrito por tipo' })
  @ApiParam({ name: 'type', enum: OrderItemType, enumName: 'OrderItemType' })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('type') type: OrderItemType,
    @CurrentUser() user: JwtUser,
    @OrgContext() ctx: OrgContextDto | null,
  ) {
    return this.orders.removeItem(id, type, user, ctx);
  }
}
