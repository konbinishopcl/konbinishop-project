import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

// Filtros y paginación del listado público de eventos.
export class QueryEventsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  q?: string; // texto libre sobre título y descripción

  @IsOptional()
  @IsString()
  category?: string; // slug de categoría

  @IsOptional()
  @IsString()
  region?: string; // slug de región
}
