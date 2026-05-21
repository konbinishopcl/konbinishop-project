import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ example: 'Región Metropolitana' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'region-metropolitana' })
  @IsString()
  @MinLength(2)
  slug: string;
}
