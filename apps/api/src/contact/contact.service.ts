import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { MailService } from '../../services/mailgun/mail.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateContactDto) {
    const msg = await this.prisma.contactMessage.create({ data: dto });

    // Email de confirmación al remitente
    await this.mail.sendContactReceived(dto.email, dto.name).catch(() => {});

    // Notificación a los emails configurados en CONTACT_NOTIFY_EMAILS
    const raw = this.config.get<string>('CONTACT_NOTIFY_EMAILS', '');
    const recipients = raw.split(',').map((e) => e.trim()).filter(Boolean);
    if (recipients.length) {
      await this.mail
        .sendContactNotify(recipients, dto.name, dto.email, dto.subject, dto.message)
        .catch(() => {});
    }

    return msg;
  }

  findAll() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: number) {
    const msg = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!msg) throw new NotFoundException('Mensaje no encontrado');
    return msg;
  }

  async markRead(id: number, read: boolean) {
    await this.findOne(id);
    return this.prisma.contactMessage.update({ where: { id }, data: { read } });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.contactMessage.delete({ where: { id } });
    return { deleted: true };
  }
}
