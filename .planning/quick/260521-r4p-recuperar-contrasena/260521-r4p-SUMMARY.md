---
phase: quick
plan: r4p
subsystem: api-auth
tags: [api, nestjs, auth, password-reset]
status: complete
key_files:
  created:
    - apps/api/prisma/migrations/20260521134358_add_password_reset/
    - apps/api/src/auth/dto/forgot-password.dto.ts
    - apps/api/src/auth/dto/reset-password.dto.ts
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/src/auth/auth.service.ts
    - apps/api/src/auth/auth.controller.ts
metrics:
  completed: "2026-05-21"
---

# Quick Task r4p: Endpoints de recuperación de contraseña

**One-liner:** La API tiene el flujo de recuperación de contraseña — `POST /api/auth/forgot-password`
genera un token y `POST /api/auth/reset-password` lo canjea por una contraseña nueva.

## Qué se hizo

- **Schema** — el modelo `User` ganó `resetToken` y `resetTokenExpiry`; migración
  `20260521134358_add_password_reset` creada y aplicada.
- **DTOs** — `ForgotPasswordDto` (email) y `ResetPasswordDto` (token + password mín. 6).
- **AuthService**:
  - `forgotPassword(email)` — genera un token aleatorio, guarda su hash SHA-256 +
    expiración (1 h) en el usuario y lo registra en el log del servidor. Responde siempre
    `{ ok: true }` (no revela si el email existe).
  - `resetPassword(token, password)` — valida el token (hash + no expirado), fija la nueva
    `passwordHash` y limpia el token. Token inválido/expirado → `400`.
  - `sanitize()` ahora también descarta `resetToken` / `resetTokenExpiry`.
- **AuthController** — `POST /auth/forgot-password` y `POST /auth/reset-password`, con
  `@ApiOperation` (aparecen en Swagger).

## Verificación

`nest build` limpio. Smoke test (API en :3399):
- `forgot-password` → `{ok:true}`; el token aparece en el log del servidor.
- `reset-password` con token válido → `{ok:true}`; login con la clave nueva → `201`.
- `reset-password` con token inválido → `400`.
- `forgot-password` con email inexistente → `{ok:true}` (respuesta uniforme).
- Contraseña del usuario de seed restaurada a `konbini123`.

## Notas / Follow-ups

- **Sin email aún**: el token se registra en el log del servidor; el envío por correo es
  trabajo de v2. (Mientras tanto, para recuperar una clave hay que leer el log de la API.)
- Falta la UI en el website (página "¿olvidaste tu contraseña?") — no estaba en el alcance
  de este quick (solo se pidieron los endpoints).
