import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  firstname: string;

  @IsString()
  @MinLength(1, { message: 'El apellido es obligatorio' })
  lastname: string;
}
