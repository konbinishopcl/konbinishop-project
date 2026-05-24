import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({ example: 'Chile' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'chile' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;
}
