---
phase: 14-servicios-y-crm
plan: 01
subsystem: services
tags: [services, crm, public-endpoints, admin-crud, soft-delete, pagination]
dependency_graph:
  requires: []
  provides: [ServicesModule, ServicesService, ServicesController]
  affects: [app.module.ts, REQUIREMENTS.md]
tech_stack:
  added: []
  patterns: [soft-delete via active=false, paginated admin list, many-to-many connect]
key_files:
  created:
    - apps/api/src/services/services.module.ts
    - apps/api/src/services/services.service.ts
    - apps/api/src/services/services.controller.ts
    - apps/api/src/services/dto/create-service-request.dto.ts
    - apps/api/src/services/dto/create-service-option.dto.ts
    - apps/api/src/services/dto/update-service-option.dto.ts
    - apps/api/src/services/dto/query-service-requests.dto.ts
  modified:
    - apps/api/src/app.module.ts
    - .planning/REQUIREMENTS.md
decisions:
  - "ServicesModule no importa CrmModule — integración CRM via PrismaService directo en plan 14-04 (patrón D-19/D-23)"
  - "deleteOption() soft-delete cuando requests._count > 0, hard-delete si no hay vinculados"
  - "data: any en createRequest() para conditional many-to-many options.connect (plan pattern)"
metrics:
  duration: ~15min
  completed_date: "2026-05-25"
  tasks_completed: 3
  files_created: 7
  files_modified: 2
---

# Phase 14 Plan 01: ServicesModule — Endpoints Públicos y CRUD Admin Summary

**One-liner:** ServicesModule con 12 endpoints NestJS (4 públicos sin auth + 8 admin con JwtAuthGuard+RolesGuard), soft-delete en ServiceOption, y documentación SVC-01..05 en REQUIREMENTS.md.

## What Was Built

### Task 1 — ServicesModule + endpoints públicos SVC-01 (commit 55306b1)

Módulo `services` registrado en AppModule con:
- `POST /services/photography` — crea ServiceRequest type=PHOTOGRAPHY, responde `201 { id, type, name, email, createdAt }`
- `POST /services/content-creators` — crea ServiceRequest type=CONTENT
- `GET /services/photography/options` — devuelve opciones activas para fotografía ordenadas por `order` asc
- `GET /services/content-creators/options` — devuelve opciones activas para content-creators

Los 4 endpoints son públicos (sin auth). `CreateServiceRequestDto` valida con class-validator. Many-to-many `optionIds` se conecta via `options: { connect }`.

### Task 2 — CRUD admin ServiceOption + GET admin paginado SVC-02 (commit 0e7cbdf)

8 endpoints admin con `JwtAuthGuard + RolesGuard + @Roles('ADMIN', 'SUPER_ADMIN')`:
- `GET /services/photography` y `GET /services/content-creators` — solicitudes paginadas con opciones incluidas
- `POST/PATCH/DELETE /services/photography/options` — CRUD de opciones de fotografía
- `POST/PATCH/DELETE /services/content-creators/options` — CRUD de opciones de content-creators

Soft-delete en `deleteOption()`: si la opción tiene `requests._count > 0`, marca `active=false` en lugar de borrar. Si no tiene requests vinculados, borra físicamente. `PATCH` no expone campo `type` (no se puede cambiar post-creación). Paginación estándar del proyecto: `{ items, total, page, pageSize, totalPages }`.

### Task 3 — Documentar SVC-01..05 en REQUIREMENTS.md (commit 05a1c00)

Nueva sección "Servicios y CRM (Phase 14)" con 5 requirements SVC-01..05 documentados como checkboxes sin marcar (se marcarán en cada plan correspondiente). SVC-01 y SVC-02 corresponden a este plan. SVC-03..05 corresponden a planes 14-02, 14-03, 14-04.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — todos los endpoints están completamente implementados sin datos mock.

## Self-Check: PASSED

Files exist:
- apps/api/src/services/services.module.ts — FOUND
- apps/api/src/services/services.service.ts — FOUND
- apps/api/src/services/services.controller.ts — FOUND
- apps/api/src/services/dto/create-service-request.dto.ts — FOUND
- apps/api/src/services/dto/create-service-option.dto.ts — FOUND
- apps/api/src/services/dto/update-service-option.dto.ts — FOUND
- apps/api/src/services/dto/query-service-requests.dto.ts — FOUND

Commits exist:
- 55306b1 feat(14-01): crear ServicesModule con endpoints públicos SVC-01
- 0e7cbdf feat(14-01): CRUD admin ServiceOption + GET admin ServiceRequest SVC-02
- 05a1c00 docs(14-01): documentar SVC-01..05 en REQUIREMENTS.md (D-24)

TypeScript: pnpm tsc --noEmit — 0 errores en src/services/
