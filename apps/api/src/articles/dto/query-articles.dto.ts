import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PublicationStatus } from '@prisma/client';

export class QueryArticlesDto {
  @ApiPropertyOptional({ description: 'Búsqueda por texto en título o extracto' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filtrar por slug de article-tag' })
  @IsOptional()
  @IsString()
  articleTag?: string;

  @ApiPropertyOptional({ description: 'Filtrar por slug de article-category' })
  @IsOptional()
  @IsString()
  articleCategory?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({ enum: PublicationStatus, description: 'Filtro de estado (solo admin)' })
  @IsOptional()
  @IsEnum(PublicationStatus)
  status?: PublicationStatus;
}
