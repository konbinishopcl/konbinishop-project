---
phase: quick-260521-mkj
plan: 01
subsystem: api/mail
tags: [email, mailgun, mjml, transactional, nestjs]
dependency_graph:
  requires: []
  provides: [MailModule, MailService]
  affects: [AuthService, EventsService, PaymentsService]
tech_stack:
  added: [mailgun.js, form-data, mjml]
  patterns: [@Global NestJS module, graceful fire-and-forget email sending, MJML responsive templates]
key_files:
  created:
    - apps/api/src/mail/mail.module.ts
    - apps/api/src/mail/mail.service.ts
    - apps/api/src/mail/templates.ts
  modified:
    - apps/api/src/app.module.ts
    - apps/api/src/auth/auth.service.ts
    - apps/api/src/events/events.service.ts
    - apps/api/src/payments/payments.service.ts
    - apps/api/.env.example
    - apps/api/package.json
decisions:
  - "MailService builds Mailgun client only when both MAILGUN_API_KEY and MAILGUN_DOMAIN are set — prevents startup errors in local dev"
  - "Dev fallback: console.log token in forgotPassword only when MAILGUN_API_KEY is absent, preserving local debuggability"
  - "approve/reject in EventsService fetch owner inline using spread of EVENT_INCLUDE + owner select — avoids touching EVENT_INCLUDE_ADMIN or creating new constants"
  - "sendPaymentConfirmed placed after activateOrderItems and order PAID update — email is best-effort and never blocks the payment success path"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-05-21"
  tasks_completed: 2
  files_changed: 9
---

# Quick Task 260521-mkj: Email transaccional con Mailgun + MJML

**One-liner:** MailService global con 5 métodos graceful (bienvenida, reset password, evento aprobado/rechazado, pago confirmado) usando mailgun.js + plantillas MJML responsivas en español.

## What Was Built

A reusable `MailModule` (`@Global`) that provides `MailService` with 5 transactional email methods. The service gracefully absorbs all failures — if Mailgun credentials are missing or the API call fails, it logs the error and returns without throwing, so callers need no try/catch.

Templates are compiled with MJML at call time: a shared `renderTemplate` layout (Konbini header, body, optional CTA button, footer) drives 5 Spanish-language templates.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Crear MailModule + MailService + plantillas MJML | 878a8c9 | mail.module.ts, mail.service.ts, templates.ts, app.module.ts, .env.example, package.json |
| 2 | Cablear MailService en auth, events y payments | 0316abd | auth.service.ts, events.service.ts, payments.service.ts |

## Email Coverage

| Trigger | Method | Called from |
|---------|--------|-------------|
| Registro de usuario | `sendWelcome` | `AuthService.register` |
| Olvidé mi contraseña | `sendPasswordReset` | `AuthService.forgotPassword` |
| Evento aprobado | `sendEventApproved` | `EventsService.approve` |
| Evento rechazado | `sendEventRejected` | `EventsService.reject` |
| Pago Transbank exitoso | `sendPaymentConfirmed` | `PaymentsService.handleTransbankCallback` |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all 5 email triggers are fully wired to real data.

## User Setup Required

To activate email delivery, set these env vars (see `.env.example`):

```
MAILGUN_API_KEY=       # Mailgun Dashboard -> Settings -> API Keys
MAILGUN_DOMAIN=        # Mailgun Dashboard -> Sending -> Domains
MAIL_FROM="Konbini <no-reply@tudominio.cl>"
```

Without these, MailService runs in disabled mode: all `sendX()` calls are no-ops, logged at `debug` level. The `forgotPassword` endpoint still logs the reset token to the console for local development.

## Self-Check: PASSED
