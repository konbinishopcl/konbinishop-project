import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'Festival' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'festival' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  slug?: string;
}
