import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class SwitchOrgDto {
  @ApiProperty({ example: 42, description: 'ID de la organización (User con type=ORGANIZATION) a la que cambiar' })
  @IsNumber()
  orgId: number;
}
