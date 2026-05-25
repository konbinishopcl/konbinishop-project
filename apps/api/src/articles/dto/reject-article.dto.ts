import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectArticleDto {
  @ApiProperty({ example: 'Contenido no cumple con las normas comunitarias' })
  @IsString()
  @MinLength(3)
  reason: string;
}
