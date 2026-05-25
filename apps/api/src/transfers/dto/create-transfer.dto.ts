import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { TransferItemType } from '@prisma/client';

export class CreateTransferDto {
  @ApiProperty({
    enum: TransferItemType,
    example: TransferItemType.EVENT,
    description: 'Tipo de ítem a transferir',
  })
  @IsEnum(TransferItemType)
  itemType!: TransferItemType;

  @ApiProperty({ example: 1, description: 'ID del ítem a transferir' })
  @IsInt() @Min(1)
  itemId!: number;

  @ApiProperty({ example: 5, description: 'ID de la organización destino' })
  @IsInt() @Min(1)
  targetOrgId!: number;
}
