import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateHeroDto {
  @ApiPropertyOptional({ example: 'Festival de Verano', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ example: '2025', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titleAccent?: string;

  @ApiPropertyOptional({ example: 'El mejor festival del año llega a Santiago.', maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  lead?: string;

  @ApiPropertyOptional({ example: '/uploads/hero-banner.jpg' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  image?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'Parque Bicentenario, Santiago', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  place?: string;

  @ApiPropertyOptional({ example: 'https://evento.ejemplo.com' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  link?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de la categoría de evento que reutiliza Hero (Phase 18+)' })
  @IsOptional()
  @IsInt()
  eventCategoryId?: number;
}
