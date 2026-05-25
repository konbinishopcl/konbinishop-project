import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsPositive, Equals } from 'class-validator';

export class GoogleOnboardingDto {
  @ApiProperty({ example: 1, description: 'ID del país seleccionado' })
  @IsInt()
  @IsPositive()
  countryId: number;

  @ApiProperty({ example: true, description: 'Aceptación de Términos y Condiciones (debe ser true)' })
  @IsBoolean()
  @Equals(true, { message: 'Debes aceptar los Términos y Condiciones' })
  acceptedTerms: boolean;
}
