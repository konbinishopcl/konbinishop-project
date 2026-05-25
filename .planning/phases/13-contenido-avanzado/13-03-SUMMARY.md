---
phase: 13-contenido-avanzado
plan: "03"
subsystem: users
tags: [public-profile, handle, organizer, verified, super-admin, audit]
dependency_graph:
  requires: [13-02]
  provides: [GET /users/:handle, PATCH /users/me/organizer, PATCH /users/:id/verified]
  affects: [UsersModule, UsersService, UsersController]
tech_stack:
  added: []
  patterns: [prisma.profile.upsert, role-based guard SUPER_ADMIN, audit conditional on change]
key_files:
  created:
    - apps/api/src/users/dto/update-organizer.dto.ts
    - apps/api/src/users/dto/set-verified.dto.ts
  modified:
    - apps/api/src/users/users.service.ts
    - apps/api/src/users/users.controller.ts
decisions:
  - "UpdateOrganizerDto usa @IsUrl({ require_protocol: true }) para validar website"
  - "findByHandle usa _blocked en destructuring para evitar exponer campo blocked en response"
  - "setVerified solo llama audit.log cuando el valor realmente cambia (before.isVerified !== isVerified)"
  - "updateOrganizer usa profile.upsert con fallbackSlug=user-{userId} para crear Profile si no existe"
  - "articles tipados como any[] en findByHandle (Prisma include result) — noUnusedLocals no habilitado"
  - "No se emite notificación en setVerified — NotificationType.VERIFICATION_GRANTED no existe en enum (decisión D-13)"
  - "USER_SELECT extendido con type, handle, isVerified para que findAll y update devuelvan campos v2"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-25T15:34:14Z"
  tasks_completed: 3
  files_changed: 4
---

# Phase 13 Plan 03: Perfil público v2 (CNT-03) Summary

**One-liner:** Perfil público por handle con eventos aprobados + DTOs UpdateOrganizerDto/SetVerifiedDto + endpoints autenticado y SUPER_ADMIN para actualizar perfil y badge verificado.

## What Was Built

Tres endpoints nuevos en el módulo Users:

1. **`GET /users/:handle`** (público, sin guards) — busca usuario por handle único, devuelve datos públicos del perfil (sin campo `blocked`), sus últimos 12 eventos APPROVED con include de city/category/dates, y si el usuario es `ORGANIZATION`, sus últimos 12 artículos patrocinados APPROVED con tags. Retorna 404 si el handle no existe o si el usuario tiene `blocked=true`.

2. **`PATCH /users/me/organizer`** (JwtAuthGuard) — permite al usuario autenticado actualizar `bio` y `website` de su Profile. Usa `prisma.profile.upsert` con `where: { userId }` (constraint @unique) para crear el Profile si no existía, usando `slug=user-{userId}` como fallback slug.

3. **`PATCH /users/:id/verified`** (JwtAuthGuard + RolesGuard + @Roles('SUPER_ADMIN')) — permite a SUPER_ADMIN asignar o revocar el badge Verificado (`isVerified: boolean`). Audita el cambio vía `AuditService.log` solo cuando el valor efectivamente cambia (`before.isVerified !== isVerified`). Devuelve 403 para roles ADMIN o AUTHENTICATED.

**DTOs creados:**
- `UpdateOrganizerDto`: `bio?: string (maxLength 500)` + `website?: string (@IsUrl require_protocol)`
- `SetVerifiedDto`: `isVerified: boolean (@IsBoolean)`

**USER_SELECT extendido** con `type`, `handle`, `isVerified` — ahora los endpoints `findAll` y `update` también exponen los campos v2.

**Orden de rutas en controller** declarado explícitamente:
1. `@Get('recent')` — público
2. `@Get('me/saved-events')` — JWT
3. `@Get()` — ADMIN+
4. `@Post()` — SUPER_ADMIN
5. `@Patch('me/organizer')` — JWT (nuevo)
6. `@Patch(':id/verified')` — SUPER_ADMIN (nuevo)
7. `@Patch(':id')` — SUPER_ADMIN
8. `@Patch(':id/ban')` — SUPER_ADMIN
9. `@Delete(':id')` — SUPER_ADMIN
10. `@Get(':handle')` — público (nuevo, al final)

## Deviations from Plan

None — plan executed exactly as written.

## Known Deviations / Deferred Issues

**MySQL collation vs case-sensitivity:** La propiedad `must_haves.truths` del plan indica que la búsqueda por handle es "case-sensitive (matching exact en Prisma findUnique)". Sin embargo, MySQL con collation `utf8mb4_unicode_ci` o `utf8mb4_general_ci` (default) es case-INsensitive, por lo que `findUnique({ where: { handle: 'AnaGarcia' } })` también matcheará `anagarcia`. Esto no es un bug introducido por este plan (el campo `handle @unique` ya existía), pero la garantía de case-sensitivity requeriría cambiar la collation a `utf8mb4_bin` vía migración. Diferido para evaluación futura.

## Known Stubs

None — todos los endpoints están completamente implementados y conectados.

## Self-Check: PASSED

- `apps/api/src/users/dto/update-organizer.dto.ts` — FOUND
- `apps/api/src/users/dto/set-verified.dto.ts` — FOUND
- `apps/api/src/users/users.service.ts` — FOUND (findByHandle, updateOrganizer, setVerified)
- `apps/api/src/users/users.controller.ts` — FOUND (GET :handle, PATCH me/organizer, PATCH :id/verified)
- Commit `a1159e7` — feat(13-03): public profile GET /users/:handle + PATCH /me/organizer + PATCH /:id/verified (CNT-03)
- `pnpm tsc --noEmit` — PASSED (no output = no errors)
- `pnpm build` — PASSED
