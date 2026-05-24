import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateStateDto {
  @ApiProperty({ example: 'Región Metropolitana de Santiago' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'region-metropolitana-de-santiago' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del país al que pertenece' })
  @IsOptional()
  @IsInt()
  countryId?: number;
}
