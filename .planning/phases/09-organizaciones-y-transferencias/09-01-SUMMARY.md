---
phase: 09-organizaciones-y-transferencias
plan: "01"
subsystem: organizations
tags: [organizations, crud, nestjs, prisma, transaction, ownership]
dependency_graph:
  requires: []
  provides: [OrganizationsService, POST /organizations, GET /organizations/:id, PATCH /organizations/:id, DELETE /organizations/:id]
  affects: [AppModule]
tech_stack:
  added: []
  patterns: [prisma.$transaction, assertOwnerOrAdmin helper, ORG_PUBLIC_SELECT constant, P2002 ConflictException]
key_files:
  created:
    - apps/api/src/organizations/dto/create-organization.dto.ts
    - apps/api/src/organizations/dto/update-organization.dto.ts
    - apps/api/src/organizations/organizations.service.ts
    - apps/api/src/organizations/organizations.controller.ts
    - apps/api/src/organizations/organizations.module.ts
  modified:
    - apps/api/src/app.module.ts
decisions:
  - "ORG_PUBLIC_SELECT via Prisma select en vez de post-query deletion — más seguro y tipado"
  - "dto.name tiene prioridad sobre dto.firstname en update — semántica intencional"
  - "handlePrismaError() helper centraliza P2002 con detección de campo (email/handle)"
  - "assertOrg() separado de assertOwnerOrAdmin() para permitir reutilización limpia"
metrics:
  duration: "4 minutes"
  completed_date: "2026-05-25"
  tasks_completed: 3
  files_created: 5
  files_modified: 1
---

# Phase 09 Plan 01: OrganizationsModule CRUD Summary

**One-liner:** Módulo NestJS `organizations` con CRUD sobre User{type=ORGANIZATION} y creación atómica de OrgMember{OWNER} vía `prisma.$transaction`.

## What Was Built

### Task 1: DTOs

`CreateOrganizationDto` con `name` (2-100 chars, requerido), `email` (@IsEmail, requerido) y `handle` (slug `[a-z0-9-]+`, opcional). `UpdateOrganizationDto` con todos los campos opcionales más `firstname` y `lastname` para actualizaciones del nombre legal.

### Task 2: OrganizationsService

Servicio con 4 métodos:

- **`create()`**: usa `prisma.$transaction` para crear `User{type=ORGANIZATION, passwordHash: null}` + `OrgMember{role: OWNER}` atómicamente. Captura P2002 → `ConflictException` con nombre del campo en conflicto (email o handle). Audita CREATE post-transacción.
- **`findOne()`**: verifica type=ORGANIZATION, estado blocked, y membresía del caller (ForbiddenException si no es miembro ni admin). Devuelve campos públicos via `ORG_PUBLIC_SELECT` (sin passwordHash, twoFactorCode, resetToken).
- **`update()`**: usa `assertOwnerOrAdmin()` para verificar OWNER o ADMIN+. Merge de `dto.name ?? dto.firstname` en User.firstname. Captura P2002.
- **`remove()`**: usa `assertOwnerOrAdmin()`, elimina con `prisma.user.delete` — el cascade del schema elimina OrgMember y OrgInvitation automáticamente.

Helper `assertOwnerOrAdmin(orgId, user)`: reutilizado por update y remove.

### Task 3: Controller, Module, AppModule

- `OrganizationsController`: 4 endpoints `@Post`, `@Get(':id')`, `@Patch(':id')`, `@Delete(':id')` con `JwtAuthGuard` y `ParseIntPipe`.
- `OrganizationsModule`: imports `[AuthModule, MailgunModule, AuditModule]`, exports `OrganizationsService` (disponible para 09-03/09-04).
- `AppModule`: import `OrganizationsModule` debajo de `AuditModule`.

## Verification

- `pnpm tsc --noEmit` → exit 0
- `pnpm build` → exit 0
- Todas las aceptación criteria verificadas con grep

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — todos los endpoints conectados a lógica real con Prisma.

## Self-Check: PASSED

Files verified:
- FOUND: apps/api/src/organizations/dto/create-organization.dto.ts
- FOUND: apps/api/src/organizations/dto/update-organization.dto.ts
- FOUND: apps/api/src/organizations/organizations.service.ts
- FOUND: apps/api/src/organizations/organizations.controller.ts
- FOUND: apps/api/src/organizations/organizations.module.ts

Commits verified:
- 22b9fc9 feat(09-01): crear DTOs
- 4acea0a feat(09-01): implementar OrganizationsService
- d83f701 feat(09-01): crear OrganizationsController + OrganizationsModule + registrar en AppModule
