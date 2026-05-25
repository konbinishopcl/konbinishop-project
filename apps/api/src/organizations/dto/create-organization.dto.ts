import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({
    example: 'Productora Konbini',
    description: 'Nombre de la organización (se guarda en User.firstname)',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: 'contacto@konbini.cl',
    description: 'Email de contacto de la organización (único en User.email)',
  })
  @IsEmail()
  email: string;

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
}
