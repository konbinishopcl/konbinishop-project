import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateEventTagDto {
  @ApiProperty({ example: 'Gastronomía' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'gastronomia' })
  @IsString()
  @MinLength(2)
  slug: string;
}
