import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { EventDateDto, EventLinkDto, EventPriceDto } from './create-event.dto';

// Igual que CreateEventDto pero todos los campos opcionales. Se escribe a mano
// para no agregar la dependencia @nestjs/mapped-types.
export class UpdateEventDto {
  @ApiPropertyOptional({ example: 'Festival de Verano 2025', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Productora XYZ', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @ApiPropertyOptional({ example: 'Un festival al aire libre con música en vivo y gastronomía.' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({ example: 'Información adicional sobre el evento...' })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Fecha de expiración ISO (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  expirationDate?: string;

  @ApiPropertyOptional({ example: 'Av. Providencia' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  address?: string;

  @ApiPropertyOptional({ example: '1234' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  addressNumber?: string;

  @ApiPropertyOptional({ example: 'https://tickets.ejemplo.com/festival' })
  @IsOptional()
  @IsString()
  ticketUrl?: string;

  @ApiPropertyOptional({ example: '/uploads/banner-festival.jpg' })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({ example: '/uploads/poster-festival.jpg' })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional({ type: [String], example: ['/uploads/foto1.jpg', '/uploads/foto2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @ApiPropertyOptional({ example: 101, description: 'ID de la ciudad/comuna' })
  @IsOptional()
  @IsInt()
  cityId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de la categoría' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ type: [EventPriceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventPriceDto)
  prices?: EventPriceDto[];

  @ApiPropertyOptional({ type: [EventDateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDateDto)
  dates?: EventDateDto[];

  @ApiPropertyOptional({ type: [EventLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventLinkDto)
  socialLinks?: EventLinkDto[];

  @ApiPropertyOptional({ type: [EventLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventLinkDto)
  videos?: EventLinkDto[];
}
