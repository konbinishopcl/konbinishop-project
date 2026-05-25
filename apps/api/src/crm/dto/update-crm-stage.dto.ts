import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CrmStage } from '@prisma/client';

export class UpdateCrmStageDto {
  @ApiProperty({ enum: CrmStage })
  @IsEnum(CrmStage)
  stage: CrmStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  stageReason?: string;
}
