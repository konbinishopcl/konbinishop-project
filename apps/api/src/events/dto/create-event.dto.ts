import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

// ── Componentes anidados del evento ──

export class EventPriceDto {
  @ApiProperty({ example: 'General' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 15000, minimum: 0, description: 'Precio en pesos; 0 = gratis' })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;
}

export class EventDateDto {
  @ApiPropertyOptional({ example: '2025-12-31', description: 'Fecha ISO (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ example: '19:00', description: 'Hora de inicio (HH:mm)' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '23:00', description: 'Hora de término (HH:mm)' })
  @IsOptional()
  @IsString()
  endTime?: string;
}

export class EventLinkDto {
  @ApiPropertyOptional({ example: 'https://instagram.com/konbini' })
  @IsOptional()
  @IsString()
  link?: string;
}

// ── DTO de creación de evento ──

export class CreateEventDto {
  @ApiProperty({ example: 'Festival de Verano 2025', maxLength: 200, minLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Productora XYZ', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @ApiProperty({ example: 'Un festival al aire libre con música en vivo y gastronomía.', minLength: 10 })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiPropertyOptional({ example: 'Información adicional sobre el evento...' })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Fecha de expiración ISO (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  expirationDate?: string;

  @ApiProperty({ example: 'Av. Providencia', minLength: 2 })
  @IsString()
  @MinLength(2)
  address: string;

  @ApiPropertyOptional({ example: '1234' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  addressNumber?: string;

  @ApiPropertyOptional({ example: 'https://tickets.ejemplo.com/festival' })
  @IsOptional()
  @IsString()
  ticketUrl?: string;

  @ApiPropertyOptional({ example: '/uploads/banner-festival.jpg', description: 'URL o ruta de la imagen banner' })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({ example: '/uploads/poster-festival.jpg', description: 'URL o ruta del poster' })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiPropertyOptional({ type: [String], example: ['/uploads/foto1.jpg', '/uploads/foto2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @ApiPropertyOptional({ example: 10, description: 'ID de la región' })
  @IsOptional()
  @IsInt()
  regionId?: number;

  @ApiPropertyOptional({ example: 101, description: 'ID de la comuna' })
  @IsOptional()
  @IsInt()
  communeId?: number;

  @ApiPropertyOptional({ type: [Number], example: [1, 3], description: 'IDs de categorías' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];

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
