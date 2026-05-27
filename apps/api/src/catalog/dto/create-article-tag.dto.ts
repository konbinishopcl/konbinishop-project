import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateArticleTagDto {
  @ApiProperty({ example: 'Reseña' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'resena' })
  @IsString()
  @MinLength(2)
  slug: string;
}
