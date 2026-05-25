import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ChangeEmailRequestDto {
  @ApiProperty({ example: 'nuevo@correo.com', description: 'Nuevo email a confirmar' })
  @IsEmail()
  newEmail: string;
}
