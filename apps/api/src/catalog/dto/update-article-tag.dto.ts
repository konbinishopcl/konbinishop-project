import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateArticleTagDto {
  @ApiPropertyOptional({ example: 'Reseña' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'resena' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;
}
