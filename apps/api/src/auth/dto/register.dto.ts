import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'contraseña123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  firstname: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(1, { message: 'El apellido es obligatorio' })
  lastname: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del país del usuario' })
  @IsOptional()
  @IsInt()
  @Min(1)
  countryId?: number;
}
