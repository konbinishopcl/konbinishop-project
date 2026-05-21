import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SpotLinkType } from '@prisma/client';

export class CreateSpotDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsEnum(SpotLinkType)
  linkType: SpotLinkType;

  // A URL, a phone number or an email, depending on linkType.
  @IsString()
  @MinLength(3)
  linkValue: string;

  @IsOptional()
  @IsString()
  expirationDate?: string; // ISO date
}
