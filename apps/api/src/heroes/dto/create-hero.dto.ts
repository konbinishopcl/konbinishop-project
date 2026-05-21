import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateHeroDto {
  @ApiProperty({ example: 'Festival de Verano', maxLength: 120, minLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: '2025', maxLength: 120, description: 'Parte destacada (acento) del título' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titleAccent?: string;

  @ApiPropertyOptional({ example: 'El mejor festival del año llega a Santiago.', maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  lead?: string;

  @ApiProperty({ example: '/uploads/hero-banner.jpg', minLength: 3 })
  @IsString()
  @MinLength(3)
  image: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Fecha ISO mostrada en el hero' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'Parque Bicentenario, Santiago', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  place?: string;

  @ApiPropertyOptional({ example: 'https://evento.ejemplo.com', description: 'URL de destino al hacer clic en el hero' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  link?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID de categoría asociada' })
  @IsOptional()
  @IsInt()
  categoryId?: number;
}
