import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRegionDto {
  @ApiPropertyOptional({ example: 'Región Metropolitana' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'region-metropolitana' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;
}
