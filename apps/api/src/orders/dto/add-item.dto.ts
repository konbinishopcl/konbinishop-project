import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum OrderItemType {
  EVENT = 'EVENT',
  SPOT = 'SPOT',
  HERO = 'HERO',
  ARTICLE = 'ARTICLE',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export class AddItemDto {
  @ApiProperty({ enum: OrderItemType, enumName: 'OrderItemType', example: OrderItemType.EVENT })
  @IsEnum(OrderItemType)
  type: OrderItemType;

  @ApiPropertyOptional({
    example: 15,
    minimum: 0,
    description: 'Días de publicación. Requerido (>=1) para EVENT/SPOT/HERO; ignorado para ARTICLE (forzado a 0).',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  days?: number;

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

  @ApiPropertyOptional({ example: 5, description: 'ID del artículo en DRAFT (requerido cuando type = ARTICLE)' })
  @IsOptional()
  @IsInt()
  articleId?: number;
}
