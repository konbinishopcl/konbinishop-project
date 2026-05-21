import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

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

  @ApiPropertyOptional({ example: 'metropolitana', description: 'Slug de región' })
  @IsOptional()
  @IsString()
  region?: string;
}
