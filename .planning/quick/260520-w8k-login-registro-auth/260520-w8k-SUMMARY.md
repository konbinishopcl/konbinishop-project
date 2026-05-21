---
phase: quick
plan: w8k
subsystem: auth-login-registro
tags: [auth, jwt, login, registro, roles, guards, nestjs, nextjs]
dependency_graph:
  requires: [260520-r3t]
  provides: [auth-endpoints, jwt-guards, role-access-control, registro-view]
  affects: [apps/api/src/auth, apps/api/src/users, apps/website/app/login, apps/website/app/registro]
tech_stack:
  added: ["@nestjs/jwt", class-validator, class-transformer]
  patterns: [jwt-guard, roles-guard, current-user-decorator, registro-2-pasos]
key_files:
  created:
    - apps/api/src/auth/ (controller, service, module, guards, decorators, DTOs)
    - apps/api/src/users/ (controller, service, module, DTOs)
    - apps/website/lib/api.ts
    - apps/website/app/registro/page.tsx
    - apps/website/components/admin/AdminGuard.tsx
  modified:
    - apps/api/src/main.ts (CORS + ValidationPipe)
    - apps/api/src/app.module.ts
    - apps/api/tsconfig.build.json (rootDir src + excluir prisma)
    - apps/website/components/providers.tsx (token + ready + setAuth/logout)
    - apps/website/lib/data.ts (User con id + role)
    - apps/website/app/login/page.tsx (conectado a la API, sin RRSS)
    - apps/website/components/Header.tsx
    - apps/website/components/admin/AdminSidebar.tsx
    - apps/website/app/admin/layout.tsx
    - apps/website/app/admin/users/page.tsx
decisions:
  - "Auth con @nestjs/jwt + JwtAuthGuard propio (sin passport) — menos dependencias"
  - "RolesGuard + @Roles() + @CurrentUser() para protección por rol"
  - "DTOs validados con class-validator + ValidationPipe global (whitelist + transform)"
  - "CORS abierto (origin: true) para el website local"
  - "Token JWT (7d) en localStorage del website; useUser maneja user + token + ready"
  - "Protección de /admin: AdminGuard de cliente en el layout admin (token en localStorage)"
  - "Gestión de usuarios: API completa (CRUD guardado), pero la UI sigue placeholder (sin diseño) — sólo se gatea el acceso a SUPER_ADMIN"
  - "Botones de RRSS (Google/Instagram/Apple) presentes en login y registro, sin conexión OAuth aún — se implementan después"
  - "Login también es de 2 pasos: paso 1 email, paso 2 contraseña"
  - "tsconfig.build.json: rootDir=src + excluir prisma para que nest build emita dist/main.js plano"
metrics:
  duration: "~35 minutes"
  completed: "2026-05-20T22:30:00Z"
  tasks_completed: 3
  files_changed: 24
---

# Quick Task w8k: Login + registro con auth full-stack

**One-liner:** Autenticación de punta a punta — endpoints reales de register/login/me con JWT y bcrypt en la API NestJS, guards por rol, gestión de usuarios protegida, y las vistas de login (conectada) + registro (2 pasos) en el website con control de acceso por rol.

## Tasks Completed

| # | Task | Files |
|---|------|-------|
| 1 | API — módulos auth y users | apps/api/src/auth, apps/api/src/users, main.ts, app.module.ts |
| 2 | Website — cliente API, estado de auth, login y registro | lib/api.ts, providers.tsx, login, registro |
| 3 | Website — control de acceso por rol | AdminGuard, admin/layout, AdminSidebar, admin/users, Header |

## What Was Built

### API

- **AuthModule**: `POST /api/auth/register`, `POST /api/auth/login` (JWT 7d + bcrypt), `GET /api/auth/me`.
- **Guards**: `JwtAuthGuard` (verifica el Bearer), `RolesGuard` + `@Roles()` + `@CurrentUser()`.
- **UsersModule**: `GET /api/users` (ADMIN+), `POST` / `PATCH /:id` / `PATCH /:id/ban` / `DELETE /:id` (sólo SUPER_ADMIN).
- `main.ts`: CORS habilitado + `ValidationPipe` global; DTOs validados con class-validator.

### Website

- **lib/api.ts**: cliente HTTP con token Bearer + mapper API→User.
- **providers.tsx**: `useUser` ahora maneja `token`, `ready`, `setAuth`, `logout`.
- **/login**: **2 pasos** — paso 1 email (+ botones RRSS), al Continuar aparece el paso 2 con la contraseña → `POST /auth/login`.
- **/registro**: copia del login en **2 pasos** — paso 1 email (+ botones RRSS); al Continuar aparece el paso 2 con password, confirmar, nombre y apellido → `POST /auth/register`.
- **Acceso por rol**: `AdminGuard` protege todo `/admin` (sólo ADMIN/SUPER_ADMIN); el ítem "Usuarios" del sidebar y la página `/admin/users` quedan restringidos a SUPER_ADMIN; el Header muestra el enlace al panel admin para esos roles.

## Verification

Prueba de integración contra la API + base local:
- `login admin` → rol `ADMIN` + token; `register` → usuario nuevo con rol `AUTHENTICATED`; `/auth/me` OK.
- login con password incorrecta → `401`.
- `GET /users` → sin token `401`, AUTHENTICATED `403`, ADMIN `200`.
- `POST /users` → ADMIN `403`, SUPER_ADMIN `201`.
- Website: `pnpm build` OK; `/`, `/login`, `/registro`, `/admin` responden `200`.

## Deviations from Plan

- `tsconfig.build.json` necesitó `rootDir: ./src` + excluir `prisma`: `nest build` compilaba `prisma/seed.ts` y eso anidaba la salida en `dist/src/`, rompiendo `node dist/main`. Además había un `tsconfig.build.tsbuildinfo` stale que hacía a tsc no emitir nada — eliminado.
- Hubo que reconstruir `.next` limpio del website (un build previo dejó un `routes-manifest.json` sin `dataRoutes`).

## Known Stubs / Follow-ups

- **UI de gestión de usuarios**: la API de users CRUD está lista y protegida, pero `/admin/users` sigue siendo placeholder — falta el diseño de esa tabla/CRUD para maquetarla.
- **RRSS**: los botones de Google/Instagram/Apple están en la UI de login/registro pero sin conexión OAuth — pendiente de implementar.
- **/me al cargar**: el website confía en el user/token de localStorage; no revalida el token contra `/auth/me` en cada carga.

## Self-Check: PASSED

- `apps/api/src/auth/` y `apps/api/src/users/` — FOUND
- `apps/website/app/registro/page.tsx` (2 pasos) — FOUND
- Endpoints de auth probados con JWT — CONFIRMED
- Guards por rol (403/200 según rol) — CONFIRMED
