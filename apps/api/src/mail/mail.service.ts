import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import {
  welcomeTemplate,
  passwordResetTemplate,
  eventApprovedTemplate,
  eventRejectedTemplate,
  paymentConfirmedTemplate,
} from './templates';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly enabled: boolean;
  private readonly domain: string;
  private readonly from: string;
  private readonly client: ReturnType<InstanceType<typeof Mailgun>['client']> | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('MAILGUN_API_KEY');
    this.domain = this.config.get<string>('MAILGUN_DOMAIN', '');
    this.from = this.config.get<string>('MAIL_FROM', 'Konbini <no-reply@konbini.cl>');

    if (apiKey && this.domain) {
      this.enabled = true;
      const mg = new Mailgun(FormData);
      this.client = mg.client({ username: 'api', key: apiKey });
    } else {
      this.enabled = false;
      this.logger.warn(
        'MailService deshabilitado: faltan MAILGUN_API_KEY/MAILGUN_DOMAIN. ' +
          'Los emails no serán enviados.',
      );
    }
  }

  /** Envía el email. Nunca lanza excepción — todo error se loguea y se absorbe. */
  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.enabled || !this.client) {
      this.logger.debug(`[MailService disabled] Skipping email to ${to}: ${subject}`);
      return;
    }
    try {
      await this.client.messages.create(this.domain, {
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to} (${subject})`, err);
    }
  }

  // ─────────────────────── Métodos públicos ───────────────────────

  async sendWelcome(to: string, name: string): Promise<void> {
    const { subject, html } = welcomeTemplate(name);
    await this.send(to, subject, html);
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    const { subject, html } = passwordResetTemplate(resetUrl);
    await this.send(to, subject, html);
  }

  async sendEventApproved(
    to: string,
    name: string,
    eventTitle: string,
    eventUrl: string,
  ): Promise<void> {
    const { subject, html } = eventApprovedTemplate(name, eventTitle, eventUrl);
    await this.send(to, subject, html);
  }

  async sendEventRejected(
    to: string,
    name: string,
    eventTitle: string,
    reason: string,
  ): Promise<void> {
    const { subject, html } = eventRejectedTemplate(name, eventTitle, reason);
    await this.send(to, subject, html);
  }

  async sendPaymentConfirmed(
    to: string,
    name: string,
    orderId: number,
    amount: number,
  ): Promise<void> {
    const { subject, html } = paymentConfirmedTemplate(name, orderId, amount);
    await this.send(to, subject, html);
  }
}
