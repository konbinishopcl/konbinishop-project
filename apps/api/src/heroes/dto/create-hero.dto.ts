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
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title: string;

  // Second headline line — the accent (orange) part of the title in the design.
  @IsOptional()
  @IsString()
  @MaxLength(120)
  titleAccent?: string;

  // Short description shown under the title in the home hero.
  @IsOptional()
  @IsString()
  @MaxLength(240)
  lead?: string;

  @IsString()
  @MinLength(3)
  image: string;

  // Optional date label shown in the hero (ISO date).
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  place?: string;

  @IsEnum(SpotLinkType)
  linkType: SpotLinkType;

  // A URL, a phone number or an email, depending on linkType.
  @IsString()
  @MinLength(3)
  linkValue: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  // Days the placement runs; total price = days * HERO_PRICE_PER_DAY.
  @IsInt()
  @Min(1)
  @Max(365)
  days: number;
}
