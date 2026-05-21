import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Konbini Events', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Organizador de eventos de anime en Santiago.', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: '/uploads/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: '/uploads/banner.jpg' })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({ example: 'konbini-events', description: 'Slug único para la URL pública (/u/:slug)' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'https://misitioweb.cl' })
  @IsOptional()
  @IsUrl()
  @MaxLength(200)
  website?: string;

  @ApiPropertyOptional({ example: 'konbini.cl' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  instagram?: string;

  @ApiPropertyOptional({ example: '@konbini' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tiktok?: string;

  @ApiPropertyOptional({ example: 'KonbiniEventos' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  facebook?: string;

  @ApiPropertyOptional({ example: '@konbini_cl' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  x?: string;

  @ApiPropertyOptional({ example: 'KonbiniTV' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  youtube?: string;

  @ApiPropertyOptional({ example: 'konbini_live' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  twitch?: string;

  @ApiPropertyOptional({ example: 'konbini-eventos' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  linkedin?: string;
}
