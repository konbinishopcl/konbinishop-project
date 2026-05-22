import { Injectable, NotFoundException } from '@nestjs/common';
import { LegalDocumentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertLegalDto } from './dto/upsert-legal.dto';

@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(type: LegalDocumentType) {
    const doc = await this.prisma.legalDocument.findUnique({ where: { type } });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    return doc;
  }

  upsert(type: LegalDocumentType, dto: UpsertLegalDto) {
    return this.prisma.legalDocument.upsert({
      where: { type },
      create: { type, content: dto.content },
      update: { content: dto.content },
    });
  }
}
