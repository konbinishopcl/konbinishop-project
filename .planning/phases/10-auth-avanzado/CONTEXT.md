---
phase: 10
slug: auth-avanzado
milestone: v2
created: 2026-05-25
source: autonomous
---

# Phase 10 — Auth avanzado: Context

## Phase Goal

Completar el módulo `auth` con:
1. **2FA por email** — tras login/registro local devolver un token "pendiente de 2FA"; el usuario confirma con código de 6 dígitos enviado por Mailgun.
2. **Google onboarding** — el flujo Google existente ya funciona para usuarios conocidos; añadir distinción nuevo/existente y mini-onboarding para nuevos (país, T&C) antes de emitir el JWT definitivo.
3. **Change email** — flujo `POST /auth/change-email/request` + `POST /auth/change-email/confirm` con token enviado por email.

## What Already Exists (DO NOT re-implement)

- `POST /auth/register` — registro local ✅
- `POST /auth/login` — login local ✅
- `POST /auth/forgot-password` + `POST /auth/reset-password` — recuperación de contraseña ✅
- `PATCH /auth/password` — cambio de contraseña (requiere token JWT + contraseña actual) ✅
- `POST /auth/google` — Google auth con access token ✅
- `POST /auth/google/onetap` — Google One Tap con ID token ✅
- `GET /auth/me` — obtener usuario autenticado ✅

## What Phase 10 Adds

### AUTH-01: 2FA por email
- `twoFactorCode: String?` y `twoFactorExpiry: DateTime?` ya están en el schema (Phase 8)
- Login/register devuelven `{ pendingToken, twoFaRequired: true }` en vez de JWT completo
- `pendingToken` es JWT de corta duración (15 min) con claim `{ sub, twoFaPending: true }`
- `POST /auth/2fa/verify` — valida código, emite JWT definitivo
- `POST /auth/2fa/resend` — reenvía el código al email (requiere `pendingToken`)
- Código de 6 dígitos numérico, válido 10 minutos
- Email: plantilla MJML existente en `mail.service.ts` (agregar método `sendTwoFactorCode`)

### AUTH-02: Google OAuth onboarding
- `POST /auth/google` y `POST /auth/google/onetap` detectan si el usuario es **nuevo**
- Usuario **existente** → comportamiento actual: JWT definitivo
- Usuario **nuevo** → devuelve `{ onboardingToken, onboardingRequired: true }` (no JWT completo)
- `onboardingToken` es JWT de corta duración (30 min) con claim `{ sub, onboardingPending: true, email }`
- `POST /auth/google/onboarding` — acepta `{ countryId, acceptedTerms }`, **valida** (country existe en DB, acceptedTerms === true), emite JWT definitivo
- Protegido con guard que requiere `onboardingPending: true` en el token
- **Scope Phase 10**: validación de entrada únicamente — NO persiste `countryId` ni `acceptedTermsAt` en User porque el schema no tiene esos campos. La persistencia se difiere a Phase 13 (perfiles avanzados) cuando se añadan esos campos al modelo. El frontend recibe el JWT definitivo y puede guardar la preferencia de país via `PATCH /users/me` (futuro endpoint de Phase 13).

### AUTH-03: Change email
- `POST /auth/change-email/request` — requiere JWT; acepta `{ newEmail }`; genera token (24h) y envía email de confirmación al **nuevo** email; graba `pendingEmail` + `emailChangeToken` + `emailChangeTokenExpiry` en User
- `POST /auth/change-email/confirm` — acepta `{ token }`; valida y actualiza `email`, limpia campos
- Los campos `pendingEmail`, `emailChangeToken`, `emailChangeTokenExpiry` ya están en User via sch01? Verificar; si no existen, agregar migración Prisma mínima (sch07_email_change)

## Existing Infrastructure to Reuse

- `MailService` en `apps/api/src/services/mailgun/mail.service.ts` — agregar métodos
- `JwtService` inyectado en `AuthService` — `sign()` y `verify()`
- `PrismaService` — ya inyectado
- Plantillas MJML: `renderTemplate()` en `mail.service.ts` — usar para código 2FA y confirmación email
- `randomBytes` y `createHash` ya importados en `auth.service.ts`
- Pattern de tokens (resetToken/resetTokenExpiry) ya implementado — replicar para emailChange

## Files to Modify

- `apps/api/src/auth/auth.service.ts` — agregar métodos 2FA, onboarding, change-email
- `apps/api/src/auth/auth.controller.ts` — agregar endpoints
- `apps/api/src/auth/dto/` — nuevos DTOs (verify-2fa, resend-2fa, google-onboarding, change-email-request, change-email-confirm)
- `apps/api/src/auth/auth.module.ts` — imports si se necesitan
- `apps/api/services/mailgun/mail.service.ts` — métodos `sendTwoFactorCode`, `sendEmailChangeConfirmation` (path real: `apps/api/services/mailgun/mail.service.ts`)
- `apps/api/utils/templates/mail.templates.ts` — agregar funciones `twoFactorCodeTemplate`, `emailChangeTemplate` al lado de los 14 templates existentes
- `apps/api/prisma/schema.prisma` — agregar `pendingEmail`, `emailChangeToken`, `emailChangeTokenExpiry` a User (migración sch07_email_change)

## Directory Structure Reference

```
apps/api/
├── src/           ← NestJS modules (controllers, services, guards, DTOs)
│   └── auth/      ← módulo auth existente
├── services/      ← shared services
│   └── mailgun/   ← MailService + MailgunService + types
└── utils/
    └── templates/
        └── mail.templates.ts  ← 14 plantillas MJML ya existentes
```

## Stack

- NestJS 11 + Prisma 6 + MySQL
- JWT: `@nestjs/jwt` / `jsonwebtoken`
- Email: Mailgun + MJML (`apps/api/src/services/mailgun/`)
- No añadir `passport` si la implementación actual funciona sin él — evitar dependencias innecesarias
- `pnpm` para instalar dependencias en `apps/api`

## Guard Pattern for Pending Tokens

Los endpoints de 2FA y onboarding necesitan un guard que:
1. Verifique la firma del JWT
2. Verifique el claim especial (`twoFaPending: true` o `onboardingPending: true`)
3. Rechace tokens definitivos (sin ese claim) → 401

Usar `@Injectable() export class TwoFaGuard implements CanActivate` y `OnboardingGuard` respectivamente.

## API Rules

- Seguir API-RULES.md: ResourceName + Method en controladores, DTOs con class-validator, ApiOperation en cada endpoint
- Swagger: agregar `@ApiOperation` a todos los nuevos endpoints

## Validation

- `pnpm tsc --noEmit` en `apps/api` debe pasar tras cada plan
- Si se agrega migración: `pnpm prisma migrate dev` + `pnpm prisma generate`
- No se necesitan tests e2e para esta fase (mismo patrón que Phase 9)
