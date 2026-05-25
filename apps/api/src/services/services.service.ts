import { Injectable } from '@nestjs/common';
import { ServiceType } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  // SVC-01 (D-01, D-02). Devuelve solo {id, type, name, email, createdAt}.
  async createRequest(dto: CreateServiceRequestDto, type: ServiceType) {
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
    const req = await this.prisma.serviceRequest.create({
      data,
      select: { id: true, type: true, name: true, email: true, createdAt: true },
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
}
