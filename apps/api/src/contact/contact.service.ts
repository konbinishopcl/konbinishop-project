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
    // D-18: ContactMessage + CrmEntry en la misma transacción (callback form).
    // D-19: usar PrismaService directamente — no se importa CrmModule.
    const msg = await this.prisma.$transaction(async (tx) => {
      const contactMsg = await tx.contactMessage.create({ data: dto });
      await tx.crmEntry.create({
        data: {
          type: 'CONTACT',
          stage: 'NEW',
          sourceType: 'CONTACT',
          sourceId: contactMsg.id,
          contactName: dto.name,
          contactEmail: dto.email,
        },
      });
      return contactMsg;
    });

    // Email de confirmación al remitente (sin tocar)
    await this.mail.sendContactReceived(dto.email, dto.name).catch(() => {});

    // Notificación a los emails configurados en CONTACT_NOTIFY_EMAILS (sin tocar)
    const raw = this.config.get<string>('CONTACT_NOTIFY_EMAILS', '');
    const recipients = raw.split(',').map((e) => e.trim()).filter(Boolean);
    if (recipients.length) {
      await this.mail
        .sendContactNotify(recipients, dto.name, dto.email, dto.subject, dto.message)
        .catch(() => {});
    }

    // D-20: retornar solo el ContactMessage — no exponer la CrmEntry al remitente.
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
