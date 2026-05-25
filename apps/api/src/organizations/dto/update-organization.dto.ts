import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    example: 'Productora Konbini',
    description: 'Nombre de la organización (se guarda en User.firstname)',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({
    example: 'contacto@konbini.cl',
    description: 'Email de contacto de la organización',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: 'productora-konbini',
    description: 'Handle único global slug-like [a-z0-9-]+, 3-30 caracteres',
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-z0-9-]+$/, { message: 'handle solo puede contener letras minúsculas, números y guiones' })
  handle?: string;

  @ApiPropertyOptional({
    example: 'Konbini',
    description: 'Nombre (firstname) legal de la organización',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstname?: string;

  @ApiPropertyOptional({
    example: 'Producciones SpA',
    description: 'Apellido / razón social adicional de la organización',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastname?: string;
}
