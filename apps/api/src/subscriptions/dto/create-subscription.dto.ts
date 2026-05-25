import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { GatewayType } from '../../payments/dto/checkout.dto';

export class CreateSubscriptionDto {
  @ApiPropertyOptional({
    enum: GatewayType,
    enumName: 'GatewayType',
    default: GatewayType.TRANSBANK,
    description: 'Pasarela de pago a usar (default TRANSBANK)',
  })
  @IsOptional()
  @IsEnum(GatewayType)
  gateway?: GatewayType = GatewayType.TRANSBANK;
}
