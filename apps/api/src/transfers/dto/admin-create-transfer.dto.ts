import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { TransferItemType } from '@prisma/client';

export class AdminCreateTransferDto {
  @IsEnum(TransferItemType)
  itemType!: TransferItemType;

  @IsInt() @Min(1)
  itemId!: number;

  @IsInt() @Min(1)
  fromUserId!: number; // dueño actual

  @IsInt() @Min(1)
  toOrgId!: number;

  @IsOptional() @IsString() @Length(3, 500)
  reason?: string; // motivo de la forzada
}
