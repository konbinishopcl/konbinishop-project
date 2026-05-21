import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'Festival' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'festival' })
  @IsString()
  @MinLength(2)
  slug: string;
}
