import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateEventTagDto {
  @ApiPropertyOptional({ example: 'Gastronomía' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'gastronomia' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;
}
