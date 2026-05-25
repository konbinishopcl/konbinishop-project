import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangeEmailConfirmDto {
  @ApiProperty({ example: 'a1b2c3...', description: 'Token de confirmación recibido por email' })
  @IsString()
  @MinLength(32)
  token: string;
}
