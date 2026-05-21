import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectEventDto {
  @ApiProperty({ example: 'El evento no cumple con las políticas de la plataforma.', minLength: 3 })
  @IsString()
  @MinLength(3)
  reason: string;
}
