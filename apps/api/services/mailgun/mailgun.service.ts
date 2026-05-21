import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import type { MailgunSendParams } from './mailgun.types';

@Injectable()
export class MailgunService {
  private readonly logger = new Logger(MailgunService.name);
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
        'MailgunService deshabilitado: faltan MAILGUN_API_KEY o MAILGUN_DOMAIN. ' +
          'Los emails no serán enviados.',
      );
    }
  }

  /** Envía un email. Nunca lanza excepción — errores se loguean y se absorben. */
  async send(params: MailgunSendParams): Promise<void> {
    if (!this.enabled || !this.client) {
      this.logger.debug(`[disabled] Skipping email to ${params.to}: ${params.subject}`);
      return;
    }
    try {
      await this.client.messages.create(this.domain, {
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      this.logger.log(`Email sent to ${params.to}: ${params.subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${params.to} (${params.subject})`, err);
    }
  }
}
