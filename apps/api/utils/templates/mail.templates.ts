import { Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mjml2html = require('mjml') as (input: string, options?: object) => { html: string; errors: { message: string }[] };

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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
      greeting: `¡Hola, ${esc(name)}!`,
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
    subject: `¡Tu evento fue aprobado! — ${esc(eventTitle)}`,
    html: renderTemplate({
      title: 'Evento aprobado',
      greeting: `¡Buenas noticias, ${esc(name)}!`,
      body: `Tu evento <strong>${esc(eventTitle)}</strong> ha sido revisado y <strong>aprobado</strong> por nuestro equipo. Ya está visible al público en Konbini.<br/><br/>¡Mucha suerte con tu evento!`,
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
    subject: `Actualización sobre tu evento — ${esc(eventTitle)}`,
    html: renderTemplate({
      title: 'Evento no aprobado',
      greeting: `Hola, ${esc(name)}`,
      body: `Lamentablemente, tu evento <strong>${esc(eventTitle)}</strong> no pudo ser aprobado en esta oportunidad.<br/><br/><strong>Motivo:</strong> ${esc(reason)}<br/><br/>Puedes editar tu evento y enviarlo nuevamente para revisión. Si tienes dudas, contáctanos.`,
    }),
  };
}

export function contactReceivedTemplate(
  name: string,
): { subject: string; html: string } {
  return {
    subject: 'Hemos recibido tu mensaje — Konbini',
    html: renderTemplate({
      title: 'Mensaje recibido',
      greeting: `¡Hola, ${esc(name)}!`,
      body: `Hemos recibido tu mensaje y nos pondremos en contacto contigo a la brevedad.<br/><br/>¡Gracias por escribirnos!`,
    }),
  };
}

export function contactNotifyTemplate(
  name: string,
  email: string,
  subject: string,
  message: string,
): { subject: string; html: string } {
  return {
    subject: `Nuevo mensaje de contacto: ${esc(subject)}`,
    html: renderTemplate({
      title: 'Nuevo mensaje de contacto',
      greeting: 'Nuevo mensaje de contacto',
      body: `<strong>Nombre:</strong> ${esc(name)}<br/><strong>Email:</strong> ${esc(email)}<br/><strong>Asunto:</strong> ${esc(subject)}<br/><br/><strong>Mensaje:</strong><br/>${esc(message).replace(/\n/g, '<br/>')}`,
    }),
  };
}

export function contentApprovedTemplate(
  name: string,
  contentName: string,
): { subject: string; html: string } {
  return {
    subject: `¡Tu publicación fue aprobada! — ${esc(contentName)}`,
    html: renderTemplate({
      title: 'Publicación aprobada',
      greeting: `¡Buenas noticias, ${esc(name)}!`,
      body: `Tu publicación <strong>${esc(contentName)}</strong> ha sido revisada y <strong>aprobada</strong> por nuestro equipo. Ya está visible al público en Konbini.<br/><br/>¡Gracias por confiar en nosotros!`,
    }),
  };
}

export function contentRejectedTemplate(
  name: string,
  contentName: string,
  reason: string,
): { subject: string; html: string } {
  return {
    subject: `Actualización sobre tu publicación — ${esc(contentName)}`,
    html: renderTemplate({
      title: 'Publicación no aprobada',
      greeting: `Hola, ${esc(name)}`,
      body: `Lamentablemente, tu publicación <strong>${esc(contentName)}</strong> no pudo ser aprobada en esta oportunidad.<br/><br/><strong>Motivo:</strong> ${esc(reason)}<br/><br/>Puedes editar tu publicación y enviarla nuevamente para revisión. Si tienes dudas, contáctanos.`,
    }),
  };
}

export function contentBannedTemplate(
  name: string,
  contentName: string,
  reason: string,
): { subject: string; html: string } {
  return {
    subject: `Tu publicación ha sido suspendida — ${esc(contentName)}`,
    html: renderTemplate({
      title: 'Publicación suspendida',
      greeting: `Hola, ${esc(name)}`,
      body: `Tu publicación <strong>${esc(contentName)}</strong> ha sido <strong>suspendida</strong> por nuestro equipo de moderación.<br/><br/><strong>Motivo:</strong> ${esc(reason)}<br/><br/>Si crees que esto es un error, por favor contáctanos.`,
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
      greeting: `¡Gracias, ${esc(name)}!`,
      body: `Tu pago ha sido procesado exitosamente.<br/><br/><strong>Orden N.º:</strong> ${orderId}<br/><strong>Total:</strong> ${formattedAmount}<br/><br/>Hemos recibido tu compra y pronto recibirás más detalles. Si tienes alguna pregunta, contáctanos.`,
    }),
  };
}

export function orgInvitationTemplate(
  orgName: string,
  inviteUrl: string,
  expiresInHours: number,
): { subject: string; html: string } {
  return {
    subject: `Invitación a unirte a ${esc(orgName)} en Konbini`,
    html: renderTemplate({
      title: `Invitación a ${esc(orgName)}`,
      greeting: `Has sido invitado a ${esc(orgName)}`,
      body: `Has recibido una invitación para unirte a <strong>${esc(orgName)}</strong> en Konbini.<br/><br/>Haz clic en el botón de abajo para aceptar la invitación. Este enlace expira en <strong>${expiresInHours} horas</strong>.<br/><br/>Si no esperabas esta invitación, puedes ignorar este correo de forma segura.`,
      ctaLabel: 'Aceptar invitación',
      ctaUrl: inviteUrl,
    }),
  };
}

export function transferRequestTemplate(
  orgName: string,
  fromName: string,
  itemType: string,
  itemTitle: string,
  dashboardUrl: string,
): { subject: string; html: string } {
  return {
    subject: `Solicitud de transferencia: ${esc(itemTitle)}`,
    html: renderTemplate({
      title: 'Nueva solicitud de transferencia',
      greeting: 'Nueva solicitud de transferencia',
      body: `<strong>${esc(fromName)}</strong> quiere transferir el ${esc(itemType.toLowerCase())} <strong>"${esc(itemTitle)}"</strong> a tu organización <strong>${esc(orgName)}</strong>.`,
      ctaLabel: 'Revisar en el dashboard',
      ctaUrl: dashboardUrl,
    }),
  };
}

export function transferAcceptedTemplate(
  toName: string,
  orgName: string,
  itemTitle: string,
): { subject: string; html: string } {
  return {
    subject: `Tu transferencia fue aceptada`,
    html: renderTemplate({
      title: 'Transferencia aceptada',
      greeting: `¡Buenas noticias, ${esc(toName)}!`,
      body: `Tu transferencia de <strong>"${esc(itemTitle)}"</strong> a <strong>${esc(orgName)}</strong> fue aceptada.`,
    }),
  };
}

export function transferRejectedTemplate(
  toName: string,
  orgName: string,
  itemTitle: string,
  reason: string,
): { subject: string; html: string } {
  return {
    subject: `Tu transferencia fue rechazada`,
    html: renderTemplate({
      title: 'Transferencia rechazada',
      greeting: `Hola, ${esc(toName)}`,
      body: `Tu transferencia de <strong>"${esc(itemTitle)}"</strong> a <strong>${esc(orgName)}</strong> fue rechazada.<br/><br/><strong>Motivo:</strong> ${esc(reason)}`,
    }),
  };
}
