import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PublicationStatus } from '@prisma/client';

// Filters and pagination for the heroes listing.
export class QueryHeroesDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 12, minimum: 1, description: 'Results per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({
    enum: PublicationStatus,
    description: 'Filter by status (ADMIN/SUPER_ADMIN only)',
  })
  @IsOptional()
  @IsEnum(PublicationStatus)
  status?: PublicationStatus;
}
