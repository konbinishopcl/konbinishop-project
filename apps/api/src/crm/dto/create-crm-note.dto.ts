import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCrmNoteDto {
  @ApiProperty({ example: 'Llamé al cliente, está interesado en el paquete básico.' })
  @IsString()
  @MinLength(3)
  content: string;
}
