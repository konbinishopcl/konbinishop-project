import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ example: '¿Cómo publico un evento?' })
  @IsString()
  @MinLength(5)
  question: string;

  @ApiProperty({ example: 'Para publicar un evento debes...' })
  @IsString()
  @MinLength(5)
  answer: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
