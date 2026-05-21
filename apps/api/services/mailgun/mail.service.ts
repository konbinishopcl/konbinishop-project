import { Injectable } from '@nestjs/common';
import { MailgunService } from './mailgun.service';
import {
  welcomeTemplate,
  passwordResetTemplate,
  eventApprovedTemplate,
  eventRejectedTemplate,
  paymentConfirmedTemplate,
} from '../../utils/templates/mail.templates';

@Injectable()
export class MailService {
  constructor(private readonly mailgun: MailgunService) {}

  async sendWelcome(to: string, name: string): Promise<void> {
    const { subject, html } = welcomeTemplate(name);
    await this.mailgun.send({ to, subject, html });
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const { subject, html } = passwordResetTemplate(resetUrl);
    await this.mailgun.send({ to, subject, html });
  }

  async sendEventApproved(to: string, name: string, eventTitle: string, eventUrl: string): Promise<void> {
    const { subject, html } = eventApprovedTemplate(name, eventTitle, eventUrl);
    await this.mailgun.send({ to, subject, html });
  }

  async sendEventRejected(to: string, name: string, eventTitle: string, reason: string): Promise<void> {
    const { subject, html } = eventRejectedTemplate(name, eventTitle, reason);
    await this.mailgun.send({ to, subject, html });
  }

  async sendPaymentConfirmed(to: string, name: string, orderId: number, amount: number): Promise<void> {
    const { subject, html } = paymentConfirmedTemplate(name, orderId, amount);
    await this.mailgun.send({ to, subject, html });
  }
}
