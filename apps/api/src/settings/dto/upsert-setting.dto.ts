import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertSettingDto {
  @ApiProperty({ example: 'SPOT_PRICE_PER_DAY' })
  @IsString() @MinLength(1) @MaxLength(100)
  key!: string;

  @ApiProperty({ example: '8000' })
  @IsString() @MaxLength(1000)
  value!: string;
}
