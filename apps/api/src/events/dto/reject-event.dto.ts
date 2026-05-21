import { IsString, MinLength } from 'class-validator';

export class RejectEventDto {
  @IsString()
  @MinLength(3)
  reason: string;
}
