import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RejectTransferDto {
  @ApiProperty({
    example: 'El contenido no cumple con los estándares de la organización',
    description: 'Motivo del rechazo (mínimo 3 caracteres)',
    minLength: 3,
    maxLength: 500,
  })
  @IsString() @Length(3, 500)
  reason!: string;
}
