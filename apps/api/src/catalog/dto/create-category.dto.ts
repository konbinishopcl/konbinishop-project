import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Música' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'musica' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({ example: 'Eventos de música en vivo' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1000, description: 'Precio por día en CLP' })
  @IsOptional()
  @IsInt()
  @Min(0)
  pricePerDay?: number;
}
