import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SpotLinkType } from '@prisma/client';

// Same fields as CreateSpotDto but all optional. Written by hand to avoid
// adding the @nestjs/mapped-types dependency.
export class UpdateSpotDto {
  @ApiPropertyOptional({ example: 'Konbini Store', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ example: '/uploads/spot-banner.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ enum: SpotLinkType, enumName: 'SpotLinkType' })
  @IsOptional()
  @IsEnum(SpotLinkType)
  linkType?: SpotLinkType;

  @ApiPropertyOptional({ example: 'https://tienda.ejemplo.com', description: 'URL, teléfono o email según linkType' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  linkValue?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Fecha de expiración ISO (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  expirationDate?: string;
}
