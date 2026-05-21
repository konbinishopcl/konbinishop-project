import { Logger } from '@nestjs/common';
import mjml2html from 'mjml';

const logger = new Logger('MailTemplates');

interface TemplateOpts {
  title: string;
  greeting: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export function renderTemplate(opts: TemplateOpts): string {
  const ctaBlock = opts.ctaLabel && opts.ctaUrl
    ? `
      <mj-section>
        <mj-column>
          <mj-button background-color="#1a1a2e" color="#ffffff" href="${opts.ctaUrl}" font-size="16px" border-radius="6px" padding="12px 28px">
            ${opts.ctaLabel}
          </mj-button>
        </mj-column>
      </mj-section>`
    : '';

  const mjml = `
<mjml>
  <mj-head>
    <mj-title>${opts.title}</mj-title>
    <mj-attributes>
      <mj-all font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" />
      <mj-text font-size="16px" color="#333333" line-height="1.6" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#1a1a2e" padding="20px">
      <mj-column>
        <mj-text font-size="24px" color="#ffffff" font-weight="bold" align="center">
          Konbini
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="#ffffff" padding="30px 20px">
      <mj-column>
        <mj-text font-size="20px" font-weight="bold" color="#1a1a2e">
          ${opts.greeting}
        </mj-text>
        <mj-text>
          ${opts.body}
        </mj-text>
      </mj-column>
    </mj-section>
    ${ctaBlock}
    <mj-section background-color="#f4f4f4" padding="20px">
      <mj-column>
        <mj-text font-size="13px" color="#888888" align="center">
          © ${new Date().getFullYear()} Konbini — Todos los derechos reservados.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

  const { html, errors } = mjml2html(mjml, { validationLevel: 'soft' });
  if (errors && errors.length > 0) {
    logger.warn(`MJML errors for "${opts.title}": ${errors.map((e) => e.message).join(', ')}`);
  }
  return html;
}

// ─────────────────────── Plantillas ───────────────────────

export function welcomeTemplate(name: string): { subject: string; html: string } {
  return {
    subject: '¡Bienvenido/a a Konbini!',
    html: renderTemplate({
      title: 'Bienvenido a Konbini',
      greeting: `¡Hola, ${name}!`,
      body: `Nos alegra que te hayas unido a <strong>Konbini</strong>. Ya puedes explorar y publicar eventos en nuestra plataforma.<br/><br/>Si tienes alguna duda, no dudes en contactarnos. ¡Estamos aquí para ayudarte!`,
    }),
  };
}

export function passwordResetTemplate(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Recuperación de contraseña — Konbini',
    html: renderTemplate({
      title: 'Recuperación de contraseña',
      greeting: '¿Olvidaste tu contraseña?',
      body: `Recibimos una solicitud para restablecer la contraseña de tu cuenta en Konbini.<br/><br/>Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace es válido por <strong>1 hora</strong>.<br/><br/>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.`,
      ctaLabel: 'Restablecer contraseña',
      ctaUrl: resetUrl,
    }),
  };
}

export function eventApprovedTemplate(
  name: string,
  eventTitle: string,
  eventUrl: string,
): { subject: string; html: string } {
  return {
    subject: `¡Tu evento fue aprobado! — ${eventTitle}`,
    html: renderTemplate({
      title: 'Evento aprobado',
      greeting: `¡Buenas noticias, ${name}!`,
      body: `Tu evento <strong>${eventTitle}</strong> ha sido revisado y <strong>aprobado</strong> por nuestro equipo. Ya está visible al público en Konbini.<br/><br/>¡Mucha suerte con tu evento!`,
      ctaLabel: 'Ver mi evento',
      ctaUrl: eventUrl,
    }),
  };
}

export function eventRejectedTemplate(
  name: string,
  eventTitle: string,
  reason: string,
): { subject: string; html: string } {
  return {
    subject: `Actualización sobre tu evento — ${eventTitle}`,
    html: renderTemplate({
      title: 'Evento no aprobado',
      greeting: `Hola, ${name}`,
      body: `Lamentablemente, tu evento <strong>${eventTitle}</strong> no pudo ser aprobado en esta oportunidad.<br/><br/><strong>Motivo:</strong> ${reason}<br/><br/>Puedes editar tu evento y enviarlo nuevamente para revisión. Si tienes dudas, contáctanos.`,
    }),
  };
}

export function paymentConfirmedTemplate(
  name: string,
  orderId: number,
  amount: number,
): { subject: string; html: string } {
  const formattedAmount = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);

  return {
    subject: `Confirmación de pago #${orderId} — Konbini`,
    html: renderTemplate({
      title: 'Pago confirmado',
      greeting: `¡Gracias, ${name}!`,
      body: `Tu pago ha sido procesado exitosamente.<br/><br/><strong>Orden N.º:</strong> ${orderId}<br/><strong>Total:</strong> ${formattedAmount}<br/><br/>Hemos recibido tu compra y pronto recibirás más detalles. Si tienes alguna pregunta, contáctanos.`,
    }),
  };
}
