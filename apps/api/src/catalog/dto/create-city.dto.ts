import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCityDto {
  @ApiProperty({ example: 'Santiago' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'santiago' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del estado/región al que pertenece' })
  @IsOptional()
  @IsInt()
  stateId?: number;
}
