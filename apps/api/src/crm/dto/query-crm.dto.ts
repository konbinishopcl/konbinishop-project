import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CrmType, CrmStage } from '@prisma/client';

export class QueryCrmDto {
  @ApiPropertyOptional({ enum: CrmType })
  @IsOptional()
  @IsEnum(CrmType)
  type?: CrmType;

  @ApiPropertyOptional({ enum: CrmStage })
  @IsOptional()
  @IsEnum(CrmStage)
  stage?: CrmStage;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  assignedTo?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
