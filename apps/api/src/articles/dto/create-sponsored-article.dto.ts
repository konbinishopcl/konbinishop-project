import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSponsoredArticleDto {
  @ApiProperty({ example: 'Los mejores festivales de verano en Santiago' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({
    example: 'los-mejores-festivales-de-verano',
    description: 'Slug único; se genera automáticamente desde el título si se omite',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  slug?: string;

  @ApiPropertyOptional({ example: 'Descubre los eventos imperdibles de esta temporada.' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({ example: '# Festivales de verano\n\nEste verano...' })
  @IsString()
  @MinLength(10)
  content: string;

  @ApiPropertyOptional({ example: '/uploads/articulo-festivales.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ type: [Number], example: [1, 4], description: 'IDs de tags a asociar' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];

  @ApiPropertyOptional({ example: 12, description: 'ID del evento relacionado (opcional)' })
  @IsOptional()
  @IsInt()
  eventId?: number;
}
