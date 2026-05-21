import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { SpotLinkType } from '@prisma/client';

export class CreateHeroDto {
  @ApiProperty({ example: 'Festival de Verano', maxLength: 120, minLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title: string;

  // Second headline line — the accent (orange) part of the title in the design.
  @ApiPropertyOptional({ example: '2025', maxLength: 120, description: 'Parte destacada (acento) del título' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titleAccent?: string;

  // Short description shown under the title in the home hero.
  @ApiPropertyOptional({ example: 'El mejor festival del año llega a Santiago.', maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  lead?: string;

  @ApiProperty({ example: '/uploads/hero-banner.jpg', minLength: 3 })
  @IsString()
  @MinLength(3)
  image: string;

  // Optional date label shown in the hero (ISO date).
  @ApiPropertyOptional({ example: '2025-12-31', description: 'Fecha ISO mostrada en el hero' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'Parque Bicentenario, Santiago', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  place?: string;

  @ApiProperty({ enum: SpotLinkType, enumName: 'SpotLinkType', example: SpotLinkType.URL })
  @IsEnum(SpotLinkType)
  linkType: SpotLinkType;

  // A URL, a phone number or an email, depending on linkType.
  @ApiProperty({ example: 'https://evento.ejemplo.com', minLength: 3, description: 'URL, teléfono o email según linkType' })
  @IsString()
  @MinLength(3)
  linkValue: string;

  @ApiPropertyOptional({ example: 1, description: 'ID de categoría asociada' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  // Days the placement runs; total price = days * HERO_PRICE_PER_DAY.
  @ApiProperty({ example: 7, minimum: 1, maximum: 365, description: 'Días de duración del placement' })
  @IsInt()
  @Min(1)
  @Max(365)
  days: number;
}
