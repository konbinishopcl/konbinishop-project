import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class UpdateOrganizerDto {
  @ApiPropertyOptional({ example: 'Organizamos festivales de música electrónica desde 2015.', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://miorganizacion.cl' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  website?: string;
}
