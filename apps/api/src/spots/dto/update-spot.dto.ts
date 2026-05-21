import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SpotLinkType } from '@prisma/client';

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
}
