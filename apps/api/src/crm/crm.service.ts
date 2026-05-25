import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmStage, CrmType } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { QueryCrmDto } from './dto/query-crm.dto';
import { UpdateCrmStageDto } from './dto/update-crm-stage.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  // SVC-03 (D-11): GET /crm paginado + filtros, sin notas en el listado.
  async list(query: QueryCrmDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.stage) where.stage = query.stage;
    if (query.assignedTo !== undefined) where.assignedTo = query.assignedTo;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.crmEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          stage: true,
          stageReason: true,
          sourceType: true,
          sourceId: true,
          contactName: true,
          contactEmail: true,
          assignedTo: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.crmEntry.count({ where }),
    ]);
    return { items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  // SVC-03 (D-12): GET /crm/:id — entrada + notas + datos del source.
  async findOne(id: number) {
    const entry = await this.prisma.crmEntry.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!entry) throw new NotFoundException('Entrada CRM no encontrada');

    // Resolver source polymorphicamente
    let source: unknown = null;
    if (entry.sourceType === CrmType.CONTACT) {
      source = await this.prisma.contactMessage.findUnique({
        where: { id: entry.sourceId },
      });
    } else {
      // PHOTOGRAPHY | CONTENT → ServiceRequest
      source = await this.prisma.serviceRequest.findUnique({
        where: { id: entry.sourceId },
        include: { options: { select: { id: true, label: true } } },
      });
    }

    return { ...entry, source };
  }

  // SVC-03 (D-13): PATCH /crm/:id/stage — si stage=LOST, stageReason requerido.
  async updateStage(id: number, dto: UpdateCrmStageDto) {
    if (dto.stage === CrmStage.LOST && !dto.stageReason) {
      throw new BadRequestException('stageReason es requerido cuando stage=LOST');
    }
    const existing = await this.prisma.crmEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Entrada CRM no encontrada');
    return this.prisma.crmEntry.update({
      where: { id },
      data: {
        stage: dto.stage,
        stageReason: dto.stageReason ?? null,
      },
    });
  }
}
