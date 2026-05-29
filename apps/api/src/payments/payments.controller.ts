import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Redirect, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista las órdenes pagadas/fallidas para el dashboard admin' })
  findAll() {
    return this.payments.findAllForAdmin();
  }

  @Post(':orderId/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia el pago de una orden — devuelve redirectUrl a la pasarela' })
  checkout(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() dto: CheckoutDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.payments.initiate(orderId, dto.gateway, user);
  }

  // ── Callbacks de pasarelas ──

  @Post('transbank/callback')
  @Redirect()
  @ApiOperation({
    summary: 'Callback de Transbank WebPay Plus — confirma el pago y redirige al frontend',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token_ws: { type: 'string', description: 'Token de pago exitoso' },
        TBK_TOKEN: { type: 'string', description: 'Token de pago abortado por el usuario' },
      },
    },
  })
  async transbankCallback(
    @Body('token_ws') tokenWs?: string,
    @Body('TBK_TOKEN') tbkToken?: string,
  ) {
    const url = await this.payments.handleTransbankCallback(tokenWs, tbkToken);
    return { url, statusCode: 302 };
  }

  @Get('transbank/callback')
  @Redirect()
  @ApiOperation({ summary: 'Callback GET de Transbank (timeout / flujo alternativo)' })
  @ApiQuery({ name: 'token_ws', required: false })
  @ApiQuery({ name: 'TBK_TOKEN', required: false })
  async transbankCallbackGet(
    @Query('token_ws') tokenWs?: string,
    @Query('TBK_TOKEN') tbkToken?: string,
  ) {
    const url = await this.payments.handleTransbankCallback(tokenWs, tbkToken);
    return { url, statusCode: 302 };
  }
}
