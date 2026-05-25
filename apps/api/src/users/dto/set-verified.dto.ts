import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetVerifiedDto {
  @ApiProperty({ example: true, description: 'true = otorgar badge Verificado, false = revocar' })
  @IsBoolean()
  isVerified: boolean;
}
