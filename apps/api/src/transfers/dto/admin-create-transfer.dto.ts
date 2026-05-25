import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { TransferItemType } from '@prisma/client';

export class AdminCreateTransferDto {
  @ApiProperty({
    enum: TransferItemType,
    example: TransferItemType.EVENT,
    description: 'Tipo de ítem a transferir forzosamente',
  })
  @IsEnum(TransferItemType)
  itemType!: TransferItemType;

  @ApiProperty({ example: 1, description: 'ID del ítem a transferir' })
  @IsInt() @Min(1)
  itemId!: number;

  @ApiProperty({ example: 3, description: 'ID del usuario dueño actual del ítem' })
  @IsInt() @Min(1)
  fromUserId!: number;

  @ApiProperty({ example: 5, description: 'ID de la organización destino' })
  @IsInt() @Min(1)
  toOrgId!: number;

  @ApiPropertyOptional({
    example: 'Transferencia administrativa por solicitud del organizador',
    description: 'Motivo de la transferencia forzada (opcional)',
    minLength: 3,
    maxLength: 500,
  })
  @IsOptional() @IsString() @Length(3, 500)
  reason?: string;
}
