---
plan: "10-01"
phase: 10
subsystem: auth
tags: [2fa, email, jwt, security, nestjs]
dependency_graph:
  requires: [phase-08-schema (twoFactorCode/twoFactorExpiry en User), mailgun-service, jwt-service]
  provides: [2fa-pending-flow, verify-2fa-endpoint, resend-2fa-endpoint]
  affects: [auth.service, auth.controller, jwt-auth.guard, login-flow, register-flow]
tech_stack:
  added: []
  patterns: [sha256-hash-tokens, pending-jwt-claims, guard-per-token-type]
key_files:
  created:
    - apps/api/src/auth/dto/verify-2fa.dto.ts
    - apps/api/src/auth/two-fa.guard.ts
  modified:
    - apps/api/src/auth/jwt-auth.guard.ts
    - apps/api/src/auth/auth.service.ts
    - apps/api/src/auth/auth.controller.ts
    - apps/api/services/mailgun/mail.service.ts
    - apps/api/utils/templates/mail.templates.ts
decisions:
  - "TwoFaUser exportado desde two-fa.guard.ts desde el inicio para evitar mismatch de tipos con JwtUser en el controller"
  - "TwoFaGuard no consulta DB — overhead evitado; blocked check ocurre en verifyTwoFa/resendTwoFa"
  - "issueTwoFaCode guarda código como SHA-256 (mismo patrón que resetToken) — código plano nunca persiste"
  - "pendingToken JWT 15min con claim twoFaPending:true — JwtAuthGuard rechaza explícitamente estos tokens"
metrics:
  duration: "3 minutos"
  completed_date: "2026-05-25"
  tasks_completed: 6
  files_changed: 7
---

# Phase 10 Plan 01: 2FA por email Summary

2FA por email implementado: login/register retornan `pendingToken` JWT de 15 min; usuario confirma con código 6 dígitos (SHA-256 en BD, expira 10 min) via `POST /auth/2fa/verify` para obtener JWT definitivo; `POST /auth/2fa/resend` reenvía código nuevo.

## What Was Built

- **`VerifyTwoFaDto`** — DTO con `@IsString`, `@Length(6,6)`, `@Matches(/^\d{6}$/)` para validar el código de verificación
- **`TwoFaGuard`** — guard independiente que exige `twoFaPending === true` en el JWT; rechaza cualquier otro token; exporta `TwoFaUser` type
- **`JwtAuthGuard` (modificado)** — rechaza explícitamente tokens con `twoFaPending` u `onboardingPending` antes de consultar DB
- **`AuthService` (modificado):**
  - `sign2FaPending()`: emite JWT 15 min con claim `twoFaPending: true`
  - `issueTwoFaCode()`: genera código 6 dígitos, guarda SHA-256 en BD con expiry de 10 min, envía email
  - `register()` y `login()` retornan `{ pendingToken, twoFaRequired: true }` en lugar del JWT definitivo
  - `verifyTwoFa()`: valida código SHA-256, limpia campos BD, emite JWT definitivo
  - `resendTwoFa()`: reenvía nuevo código 2FA
- **`mail.templates.ts`** — `twoFactorCodeTemplate(code)`: muestra el código en bloque visual estilizado
- **`mail.service.ts`** — `sendTwoFactorCode(to, code)`: método de envío usando la nueva plantilla
- **`AuthController`** — endpoints `POST /auth/2fa/verify` y `POST /auth/2fa/resend` protegidos por `TwoFaGuard`

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| T1 DTO | d2b109e | feat(10-01): crear VerifyTwoFaDto |
| T2 JwtAuthGuard | db4a13c | feat(10-01): JwtAuthGuard rechaza tokens pending |
| T3a TwoFaGuard | cd7d4c2 | feat(10-01): crear TwoFaGuard |
| T3b Mail | d5d6b33 | feat(10-01): template y método de email para código 2FA |
| T4 AuthService | aa8d934 | feat(10-01): AuthService 2FA helpers + login/register |
| T5 Controller | 0de68c1 | feat(10-01): AuthController endpoints /auth/2fa/* |
| T6 Final verify | (inline) | pnpm tsc --noEmit — 0 errores |

## Verification

```
cd /home/gab/Code/konbini-project/apps/api && pnpm tsc --noEmit
# Output: (none — 0 errors)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical type] `TwoFaUser` exportado desde el inicio**
- **Found during:** Task 5 planning (advisor review)
- **Issue:** `JwtUser = { sub, email, role }` — `role` es requerido pero el payload 2FA no lo incluye. Usar `JwtUser` en los handlers 2FA causaría mismatch de tipos en tiempo de ejecución.
- **Fix:** `TwoFaUser` type exportado desde `two-fa.guard.ts` y usado en los dos handlers del controller
- **Files modified:** `two-fa.guard.ts`, `auth.controller.ts`

### Plan Numbering Note

El plan tenía dos `### Task 3:` consecutivos (duplicate heading — error tipográfico del planner). Se ejecutaron como dos tareas separadas con commits distintos: T3a (TwoFaGuard) y T3b (mail template + sendTwoFactorCode). Total real: 6 tareas sustantivas.

## Known Stubs

None — todos los flujos están completamente conectados. El email se envía via `MailService` (silently no-ops si `MAILGUN_API_KEY` no está configurado). Los campos `twoFactorCode`/`twoFactorExpiry` ya existen en el schema de Phase 8.

## Self-Check: PASSED
