import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'admin@konbini.cl' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'contraseña123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(1)
  firstname: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(1)
  lastname: string;

  @ApiPropertyOptional({ enum: Role, enumName: 'Role', example: Role.AUTHENTICATED })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
