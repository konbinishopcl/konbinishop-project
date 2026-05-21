import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token de recuperación recibido por email', minLength: 10 })
  @IsString()
  @MinLength(10)
  token: string;

  @ApiProperty({ example: 'nuevaContraseña123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
