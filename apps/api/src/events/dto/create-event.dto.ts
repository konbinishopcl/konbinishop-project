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
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;
}

export class EventDateDto {
  @IsOptional()
  @IsString()
  date?: string; // fecha ISO (YYYY-MM-DD)

  @IsOptional()
  @IsString()
  startTime?: string; // "HH:mm"

  @IsOptional()
  @IsString()
  endTime?: string;
}

export class EventLinkDto {
  @IsOptional()
  @IsString()
  link?: string;
}

// ── DTO de creación de evento ──

export class CreateEventDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsString()
  expirationDate?: string; // fecha ISO

  @IsString()
  @MinLength(2)
  address: string;

  @IsString()
  @MinLength(1)
  addressNumber: string;

  @IsOptional()
  @IsString()
  ticketUrl?: string;

  @IsOptional()
  @IsString()
  banner?: string;

  @IsOptional()
  @IsString()
  poster?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @IsOptional()
  @IsInt()
  regionId?: number;

  @IsOptional()
  @IsInt()
  communeId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventPriceDto)
  prices?: EventPriceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDateDto)
  dates?: EventDateDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventLinkDto)
  socialLinks?: EventLinkDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventLinkDto)
  videos?: EventLinkDto[];
}
