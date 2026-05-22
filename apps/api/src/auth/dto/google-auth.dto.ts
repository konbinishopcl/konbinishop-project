import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google OAuth2 access token from the client' })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}
