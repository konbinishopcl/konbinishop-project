import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({
    example: 'colaborador@example.com',
    description: 'Email del usuario a invitar',
  })
  @IsEmail()
  email!: string;
}
