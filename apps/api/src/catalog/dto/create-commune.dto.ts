import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCommuneDto {
  @ApiProperty({ example: 'Santiago' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'santiago' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({ example: 1, description: 'ID de la región a la que pertenece' })
  @IsOptional()
  @IsInt()
  regionId?: number;
}
