import { Injectable } from '@nestjs/common';
import { MailgunService } from './mailgun.service';
import {
  welcomeTemplate,
  passwordResetTemplate,
  contactReceivedTemplate,
  contactNotifyTemplate,
  eventApprovedTemplate,
  eventRejectedTemplate,
  contentApprovedTemplate,
  contentRejectedTemplate,
  contentBannedTemplate,
  paymentConfirmedTemplate,
  orgInvitationTemplate,
} from '../../utils/templates/mail.templates';

@Injectable()
export class MailService {
  constructor(private readonly mailgun: MailgunService) {}

  async sendContactReceived(to: string, name: string): Promise<void> {
    const { subject, html } = contactReceivedTemplate(name);
    await this.mailgun.send({ to, subject, html });
  }

  async sendContactNotify(to: string | string[], name: string, email: string, subject: string, message: string): Promise<void> {
    const { subject: sub, html } = contactNotifyTemplate(name, email, subject, message);
    const recipients = Array.isArray(to) ? to.join(',') : to;
    await this.mailgun.send({ to: recipients, subject: sub, html });
  }

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

  async sendContentApproved(to: string, name: string, contentName: string): Promise<void> {
    const { subject, html } = contentApprovedTemplate(name, contentName);
    await this.mailgun.send({ to, subject, html });
  }

  async sendContentRejected(to: string, name: string, contentName: string, reason: string): Promise<void> {
    const { subject, html } = contentRejectedTemplate(name, contentName, reason);
    await this.mailgun.send({ to, subject, html });
  }

  async sendContentBanned(to: string, name: string, contentName: string, reason: string): Promise<void> {
    const { subject, html } = contentBannedTemplate(name, contentName, reason);
    await this.mailgun.send({ to, subject, html });
  }

  async sendPaymentConfirmed(to: string, name: string, orderId: number, amount: number): Promise<void> {
    const { subject, html } = paymentConfirmedTemplate(name, orderId, amount);
    await this.mailgun.send({ to, subject, html });
  }

  async sendOrgInvitation(to: string, orgName: string, inviteUrl: string, expiresInHours = 72): Promise<void> {
    const { subject, html } = orgInvitationTemplate(orgName, inviteUrl, expiresInHours);
    await this.mailgun.send({ to, subject, html });
  }
}
