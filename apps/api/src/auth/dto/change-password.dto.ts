import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'contraseña-actual' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'nueva-contraseña', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
