import { Body, Controller, Delete, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { AddItemDto, OrderItemType } from './dto/add-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('draft')
  @ApiOperation({ summary: 'Obtener o crear el carrito (DRAFT) del usuario actual' })
  getDraft(@CurrentUser() user: JwtUser) {
    return this.orders.getOrCreateDraft(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver una orden por ID' })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.orders.findOne(id, user);
  }

  @Put(':id/items')
  @ApiOperation({ summary: 'Agregar o reemplazar un ítem en el carrito (EVENT | SPOT | HERO)' })
  addItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddItemDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.orders.addItem(id, dto, user);
  }

  @Delete(':id/items/:type')
  @ApiOperation({ summary: 'Quitar un ítem del carrito por tipo' })
  @ApiParam({ name: 'type', enum: OrderItemType, enumName: 'OrderItemType' })
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('type') type: OrderItemType,
    @CurrentUser() user: JwtUser,
  ) {
    return this.orders.removeItem(id, type, user);
  }
}
