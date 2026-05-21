import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 'hola@ejemplo.com' })
  @IsEmail()
  email: string;
}
