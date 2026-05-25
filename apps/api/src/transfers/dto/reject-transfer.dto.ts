import { IsString, Length } from 'class-validator';

export class RejectTransferDto {
  @IsString() @Length(3, 500)
  reason!: string;
}
