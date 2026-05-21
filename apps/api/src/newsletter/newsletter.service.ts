import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsletterService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(email: string) {
    const exists = await this.prisma.subscriber.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Este email ya está suscrito');
    await this.prisma.subscriber.create({ data: { email } });
    return { ok: true };
  }
}
