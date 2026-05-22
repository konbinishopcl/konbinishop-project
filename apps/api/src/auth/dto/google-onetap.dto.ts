import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleOneTapDto {
  @ApiProperty({ description: 'Google ID token from One Tap credential response' })
  @IsString()
  @IsNotEmpty()
  credential!: string;
}
