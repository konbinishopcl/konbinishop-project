import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum OrderItemType {
  EVENT = 'EVENT',
  SPOT = 'SPOT',
  HERO = 'HERO',
}

export class AddItemDto {
  @ApiProperty({ enum: OrderItemType, enumName: 'OrderItemType', example: OrderItemType.EVENT })
  @IsEnum(OrderItemType)
  type: OrderItemType;

  @ApiProperty({ example: 15, minimum: 1, description: 'Días de publicación (máx. 60 evento / 30 spot / 30 hero)' })
  @IsInt()
  @Min(1)
  days: number;

  @ApiPropertyOptional({ example: 1, description: 'ID del evento (requerido cuando type = EVENT)' })
  @IsOptional()
  @IsInt()
  eventId?: number;

  @ApiPropertyOptional({ example: 3, description: 'ID del spot en DRAFT (requerido cuando type = SPOT)' })
  @IsOptional()
  @IsInt()
  spotId?: number;

  @ApiPropertyOptional({ example: 2, description: 'ID del hero en DRAFT (requerido cuando type = HERO)' })
  @IsOptional()
  @IsInt()
  heroId?: number;
}
