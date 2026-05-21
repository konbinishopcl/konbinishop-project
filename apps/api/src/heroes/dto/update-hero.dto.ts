import { IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SpotLinkType } from '@prisma/client';

// Only the content fields are editable. Duration (days), amount and
// expiration are set at creation and not changed through this DTO.
export class UpdateHeroDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  titleAccent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  lead?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  image?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  place?: string;

  @IsOptional()
  @IsEnum(SpotLinkType)
  linkType?: SpotLinkType;

  @IsOptional()
  @IsString()
  @MinLength(3)
  linkValue?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;
}
