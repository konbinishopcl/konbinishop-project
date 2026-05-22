import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { AuditAction, AuditEntity } from '@prisma/client';

// Filtros y paginación del endpoint GET /api/admin/audit-logs.
export class QueryAuditDto {
  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Número de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 50, minimum: 1, description: 'Resultados por página (máx 200)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @ApiPropertyOptional({ enum: AuditEntity, description: 'Filtrar por entidad auditada' })
  @IsOptional()
  @IsEnum(AuditEntity)
  entity?: AuditEntity;

  @ApiPropertyOptional({ enum: AuditAction, description: 'Filtrar por tipo de acción' })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({ example: 42, minimum: 1, description: 'Filtrar por ID de usuario actor' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Fecha de inicio del rango (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Fecha de fin del rango (ISO 8601, inclusivo)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
