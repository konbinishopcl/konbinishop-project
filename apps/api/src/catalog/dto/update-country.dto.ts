import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCountryDto {
  @ApiPropertyOptional({ example: 'Chile' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'chile' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;
}
