import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuditAction, AuditEntity } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { QueryAuditDto } from './dto/query-audit.dto';

// Parámetros para registrar una entrada de auditoría.
export interface AuditLogParams {
  userId: number | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: number;
  metadata?: Record<string, unknown>;
  req?: Request;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una entrada de auditoría — FIRE-AND-FORGET.
   * Nunca lanza ni propaga errores: el fallo de auditoría no debe revertir
   * la operación de negocio que la originó.
   */
  log(params: AuditLogParams): void {
    const ip = params.req?.ip ?? null;
    const userAgent = params.req?.get('user-agent') ?? null;
    const url = params.req?.originalUrl ?? null;

    this.prisma.auditLog
      .create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
          ip,
          userAgent,
          url,
        },
      })
      .catch((err: unknown) =>
        this.logger.error('AuditLog insert failed', err instanceof Error ? err.stack : String(err)),
      );
  }

  /**
   * Consulta paginada de logs de auditoría con filtros opcionales.
   * Ordenados por fecha descendente (más reciente primero).
   */
  async findAll(query: QueryAuditDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 50, 200);

    const where: Prisma.AuditLogWhereInput = {};

    if (query.entity !== undefined) {
      where.entity = query.entity;
    }
    if (query.action !== undefined) {
      where.action = query.action;
    }
    if (query.userId !== undefined) {
      where.userId = query.userId;
    }

    if (query.dateFrom !== undefined || query.dateTo !== undefined) {
      where.createdAt = {};
      if (query.dateFrom !== undefined) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo !== undefined) {
        // Fijar la hora al final del día para que el filtro sea inclusivo.
        const endOfDay = new Date(query.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
