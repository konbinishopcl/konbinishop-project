---
plan: "10-03"
phase: 10
subsystem: auth
tags: [email-change, tokens, prisma-migration, mailgun]
dependency_graph:
  requires: [10-01, 10-02]
  provides: [change-email-flow]
  affects: [auth.service, auth.controller, prisma-schema]
tech_stack:
  added: []
  patterns: [sha256-token-hash, 24h-expiry, race-condition-guard]
key_files:
  created:
    - apps/api/prisma/migrations/20260525014932_sch07_email_change/migration.sql
    - apps/api/src/auth/dto/change-email-request.dto.ts
    - apps/api/src/auth/dto/change-email-confirm.dto.ts
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/src/auth/auth.service.ts
    - apps/api/src/auth/auth.controller.ts
    - apps/api/services/mailgun/mail.service.ts
    - apps/api/utils/templates/mail.templates.ts
decisions:
  - "pendingEmail sin @unique — un email puede estar pendiente en un usuario y ser email actual de otro hasta confirmar; validación en service layer"
  - "confirm endpoint sin JwtAuthGuard — token actúa como única prueba de propiedad del nuevo email; permite confirmar desde otro dispositivo"
  - "Manejo de race condition en confirmEmailChange — si pendingEmail fue tomado entre request y confirm, se limpian los campos y se lanza ConflictException"
  - "sanitize() actualizado para excluir pendingEmail, emailChangeToken, emailChangeTokenExpiry de todas las respuestas auth"
metrics:
  duration: "12 minutes"
  completed: "2026-05-25"
  tasks_completed: 6
  files_modified: 7
---

# Phase 10 Plan 03: Change Email Summary

**One-liner:** Flujo de cambio de email en dos pasos con token SHA-256 de 24h enviado al nuevo email, incluyendo migración Prisma, DTOs, template MJML y endpoints protegidos.

## What Was Built

Implementación completa del flujo AUTH-03 (cambio de email):

1. **Migración Prisma `sch07_email_change`** — 3 campos nuevos en el modelo `User`: `pendingEmail`, `emailChangeToken`, `emailChangeTokenExpiry`
2. **DTOs** — `ChangeEmailRequestDto` (valida `newEmail` como email) y `ChangeEmailConfirmDto` (valida `token` con mínimo 32 caracteres)
3. **Template de email** — `emailChangeTemplate()` con MJML, CTA "Confirmar nuevo email" y texto con validez de 24h; `sendEmailChangeConfirmation()` en MailService
4. **AuthService** — `sanitize()` actualizado; `requestEmailChange()` y `confirmEmailChange()` implementados
5. **AuthController** — `POST /auth/change-email/request` (con JwtAuthGuard) y `POST /auth/change-email/confirm` (público)

## Verification Gate Result

```
pnpm tsc --noEmit: PASSED
pnpm prisma migrate status: Database schema is up to date! (13 migrations)
Migration sch07_email_change: APPLIED
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — todos los campos fluyen desde la base de datos real; no hay datos mock ni placeholders.

## Self-Check: PASSED
