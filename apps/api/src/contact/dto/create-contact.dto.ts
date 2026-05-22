import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Consulta sobre mi evento' })
  @IsString()
  @MinLength(3)
  subject: string;

  @ApiProperty({ example: 'Hola, quería consultar sobre...' })
  @IsString()
  @MinLength(10)
  message: string;
}
