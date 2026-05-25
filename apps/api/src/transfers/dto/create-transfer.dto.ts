import { IsEnum, IsInt, Min } from 'class-validator';
import { TransferItemType } from '@prisma/client';

export class CreateTransferDto {
  @IsEnum(TransferItemType)
  itemType!: TransferItemType;

  @IsInt() @Min(1)
  itemId!: number;

  @IsInt() @Min(1)
  targetOrgId!: number;
}
