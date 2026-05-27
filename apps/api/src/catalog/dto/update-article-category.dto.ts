import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateArticleCategoryDto {
  @ApiPropertyOptional({ example: 'Noticias' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'noticias' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;

  @ApiPropertyOptional({ example: 'Artículos de noticias y novedades' })
  @IsOptional()
  @IsString()
  description?: string;
}
