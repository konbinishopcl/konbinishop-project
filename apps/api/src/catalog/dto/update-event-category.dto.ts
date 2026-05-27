import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateEventCategoryDto {
  @ApiPropertyOptional({ example: 'Anime' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'anime' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @ApiPropertyOptional({ example: 'Eventos de cultura anime y manga' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1000, description: 'Precio por día en CLP' })
  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerDay?: number;

  @ApiPropertyOptional({ example: 'calendar', description: 'Nombre de icono Lucide' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#FF6B00', description: 'Color en hex o clase CSS' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 1, description: 'Mínimo de días' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minDays?: number;

  @ApiPropertyOptional({ example: 30, description: 'Máximo de días' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDays?: number;

  @ApiPropertyOptional({ example: 0, description: 'Orden manual en listados' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
