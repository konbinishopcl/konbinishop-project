import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateArticleCategoryDto {
  @ApiProperty({ example: 'Noticias' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'noticias' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({ example: 'Artículos de noticias y novedades' })
  @IsOptional()
  @IsString()
  description?: string;
}
