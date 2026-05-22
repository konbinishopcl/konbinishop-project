import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpsertLegalDto {
  @ApiProperty({ description: 'Contenido HTML del documento legal' })
  @IsString()
  @MinLength(10)
  content: string;
}
