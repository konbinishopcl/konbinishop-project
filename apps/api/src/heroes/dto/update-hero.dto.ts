import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SpotLinkType } from '@prisma/client';

// Only the content fields are editable. Duration (days), amount and
// expiration are set at creation and not changed through this DTO.
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

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Fecha ISO mostrada en el hero' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: 'Parque Bicentenario, Santiago', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  place?: string;

  @ApiPropertyOptional({ enum: SpotLinkType, enumName: 'SpotLinkType' })
  @IsOptional()
  @IsEnum(SpotLinkType)
  linkType?: SpotLinkType;

  @ApiPropertyOptional({ example: 'https://evento.ejemplo.com', description: 'URL, teléfono o email según linkType' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  linkValue?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID de categoría asociada' })
  @IsOptional()
  @IsInt()
  categoryId?: number;
}
