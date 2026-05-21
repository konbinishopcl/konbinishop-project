import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum GatewayType {
  TRANSBANK = 'TRANSBANK',
}

export class CheckoutDto {
  @ApiProperty({
    enum: GatewayType,
    enumName: 'GatewayType',
    example: GatewayType.TRANSBANK,
    description: 'Pasarela de pago a usar',
  })
  @IsEnum(GatewayType)
  gateway: GatewayType;
}
