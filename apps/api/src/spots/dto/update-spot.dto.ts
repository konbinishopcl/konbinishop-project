import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { SpotLinkType } from '@prisma/client';

// Same fields as CreateSpotDto but all optional. Written by hand to avoid
// adding the @nestjs/mapped-types dependency.
export class UpdateSpotDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsEnum(SpotLinkType)
  linkType?: SpotLinkType;

  @IsOptional()
  @IsString()
  @MinLength(3)
  linkValue?: string;

  @IsOptional()
  @IsString()
  expirationDate?: string;
}
