import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrgRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: OrgRole,
    example: OrgRole.MEMBER,
    description: 'Nuevo rol del miembro (OWNER | MEMBER)',
  })
  @IsEnum(OrgRole)
  role!: OrgRole;
}
