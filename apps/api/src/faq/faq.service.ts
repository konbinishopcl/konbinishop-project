import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.faq.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }] });
  }

  async findOne(id: number) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('Pregunta no encontrada');
    return faq;
  }

  create(dto: CreateFaqDto) {
    return this.prisma.faq.create({ data: { question: dto.question, answer: dto.answer, order: dto.order ?? 0 } });
  }

  async update(id: number, dto: UpdateFaqDto) {
    await this.findOne(id);
    return this.prisma.faq.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.faq.delete({ where: { id } });
    return { deleted: true };
  }
}
