import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SpotLinkType } from '@prisma/client';

export class CreateSpotDto {
  @ApiProperty({ example: 'Konbini Store', maxLength: 120, minLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: '/uploads/spot-banner.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ enum: SpotLinkType, enumName: 'SpotLinkType', example: SpotLinkType.URL })
  @IsEnum(SpotLinkType)
  linkType: SpotLinkType;

  @ApiProperty({ example: 'https://tienda.ejemplo.com', minLength: 3, description: 'URL, teléfono o email según linkType' })
  @IsString()
  @MinLength(3)
  linkValue: string;
}
