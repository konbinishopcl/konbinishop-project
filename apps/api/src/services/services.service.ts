import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { CreateServiceOptionDto } from './dto/create-service-option.dto';
import { UpdateServiceOptionDto } from './dto/update-service-option.dto';
import { QueryServiceRequestsDto } from './dto/query-service-requests.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // SVC-01 (D-01, D-02). Devuelve solo {id, type, name, email, createdAt}.
  // SVC-05 (D-21, D-22, D-23): ServiceRequest + CrmEntry en la misma transacción.
  async createRequest(dto: CreateServiceRequestDto, type: ServiceType) {
    // D-22: callback form de $transaction — batch form (array) no soporta `connect` para many-to-many.
    // D-23: usar PrismaService directamente (this.prisma) — sin importar CrmModule.
    const data: any = {
      type,
      name: dto.name,
      email: dto.email,
      eventName: dto.eventName ?? null,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
      eventPlace: dto.eventPlace ?? null,
    };
    if (dto.optionIds && dto.optionIds.length) {
      data.options = { connect: dto.optionIds.map((id) => ({ id })) };
    }

    // D-21: ServiceRequest + CrmEntry en la misma transacción.
    // D-21 LOCKED: usar crmTypeMap explícito aunque los valores sean iguales (D-21 lo especifica así).
    const crmTypeMap = { PHOTOGRAPHY: 'PHOTOGRAPHY', CONTENT: 'CONTENT' } as const;
    const req = await this.prisma.$transaction(async (tx) => {
      const serviceReq = await tx.serviceRequest.create({
        data,
        select: { id: true, type: true, name: true, email: true, createdAt: true },
      });
      await tx.crmEntry.create({
        data: {
          type: crmTypeMap[type], // CrmType explícito via crmTypeMap (D-21)
          stage: 'NEW',
          sourceType: crmTypeMap[type],
          sourceId: serviceReq.id,
          contactName: dto.name,
          contactEmail: dto.email,
        },
      });
      return serviceReq;
    });

    return req;
  }

  // SVC-01 (D-03). Público — solo active=true ordenado por order asc.
  async getActiveOptions(type: ServiceType) {
    return this.prisma.serviceOption.findMany({
      where: { type, active: true },
      orderBy: { order: 'asc' },
      select: { id: true, label: true, order: true },
    });
  }

  // SVC-02 (D-04): GET admin paginado con options incluidas.
  async listRequests(type: ServiceType, query: QueryServiceRequestsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceRequest.findMany({
        where: { type },
        include: { options: { select: { id: true, label: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.serviceRequest.count({ where: { type } }),
    ]);
    return { items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  // SVC-02 (D-06): CREATE option.
  async createOption(dto: CreateServiceOptionDto, type: ServiceType) {
    return this.prisma.serviceOption.create({
      data: {
        type,
        label: dto.label,
        active: dto.active ?? true,
        order: dto.order ?? 0,
      },
    });
  }

  // SVC-02 (D-07): UPDATE option (no permite cambiar type).
  async updateOption(id: number, dto: UpdateServiceOptionDto) {
    const existing = await this.prisma.serviceOption.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Opción no encontrada');
    return this.prisma.serviceOption.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.active !== undefined && { active: dto.active }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  // SVC-02 (D-08): DELETE option — soft-delete si tiene requests vinculados.
  async deleteOption(id: number) {
    const existing = await this.prisma.serviceOption.findUnique({
      where: { id },
      include: { _count: { select: { requests: true } } },
    });
    if (!existing) throw new NotFoundException('Opción no encontrada');
    if (existing._count.requests > 0) {
      await this.prisma.serviceOption.update({ where: { id }, data: { active: false } });
      return { softDeleted: true, requestsCount: existing._count.requests };
    }
    await this.prisma.serviceOption.delete({ where: { id } });
    return { deleted: true };
  }
}
