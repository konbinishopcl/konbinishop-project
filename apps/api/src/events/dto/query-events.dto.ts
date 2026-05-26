import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PublicationStatus } from '@prisma/client';

export enum SortBy {
  LIKES = 'likes',
}

// Filtros y paginación del listado público de eventos.
export class QueryEventsDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Número de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 12, minimum: 1, description: 'Resultados por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({ example: 'festival', description: 'Búsqueda libre sobre título y descripción' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'musica', description: 'Slug de categoría' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'region-metropolitana-de-santiago', description: 'Slug de estado/región' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ enum: SortBy, description: 'Ordenar por: "likes" = más likeados primero' })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @ApiPropertyOptional({
    enum: PublicationStatus,
    description: 'Filtrar por estado (solo ADMIN/SUPER_ADMIN)',
  })
  @IsOptional()
  @IsEnum(PublicationStatus)
  status?: PublicationStatus;
}
