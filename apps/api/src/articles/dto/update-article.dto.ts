import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateArticleDto {
  @ApiPropertyOptional({ example: 'Los mejores festivales de verano en Santiago' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional({ example: 'los-mejores-festivales-de-verano' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  slug?: string;

  @ApiPropertyOptional({ example: 'Descubre los eventos imperdibles de esta temporada.' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({ example: '# Festivales de verano\n\nEste verano...' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;

  @ApiPropertyOptional({ example: '/uploads/articulo-festivales.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 4],
    description: 'IDs de tags a asociar (reemplaza los actuales)',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}
