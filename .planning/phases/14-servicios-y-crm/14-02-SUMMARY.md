---
phase: 14-servicios-y-crm
plan: "02"
subsystem: crm
tags: [crm, pipeline, kanban, nestjs, prisma, admin]
dependency_graph:
  requires: [14-01]
  provides: [CrmModule, CrmService, CrmController]
  affects: [apps/api/src/app.module.ts]
tech_stack:
  added: []
  patterns: [polymorphic-source, pagination, admin-guard, fire-and-forget-notes]
key_files:
  created:
    - apps/api/src/crm/crm.module.ts
    - apps/api/src/crm/crm.service.ts
    - apps/api/src/crm/crm.controller.ts
    - apps/api/src/crm/dto/query-crm.dto.ts
    - apps/api/src/crm/dto/update-crm-stage.dto.ts
    - apps/api/src/crm/dto/create-crm-note.dto.ts
  modified:
    - apps/api/src/app.module.ts
decisions:
  - CrmService no se exporta — Contact/Services usan PrismaService directamente (D-19/D-23)
  - Sin endpoint DELETE /crm/:id — historial preservado, admin mueve a LOST (D-16)
  - Sin endpoint PATCH /crm/:id/assigned-to — diferido a Phase 15 (D-17)
  - Validación LOST+stageReason en service layer, no en DTO (D-13)
  - source polymorphic: CONTACT→ContactMessage, PHOTOGRAPHY|CONTENT→ServiceRequest con options
metrics:
  duration: "124s"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
  completed_date: "2026-05-25"
---

# Phase 14 Plan 02: CrmModule Summary

**One-liner:** CrmModule con 5 endpoints ADMIN+ (list paginado+filtros, detalle+source polymorphic, updateStage LOST-guard, addNote con authorId, listNotes) registrado en AppModule.

## What Was Built

CrmModule completo que centraliza la gestión comercial de leads de Contact + Services en un pipeline tipo kanban. El módulo expone 5 endpoints bajo `/crm`, todos protegidos con `JwtAuthGuard + RolesGuard` restringidos a `ADMIN` y `SUPER_ADMIN`.

### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `crm/crm.module.ts` | NestJS module — imports AuthModule, no exporta CrmService |
| `crm/crm.service.ts` | 5 métodos: list, findOne, updateStage, addNote, listNotes |
| `crm/crm.controller.ts` | 5 endpoints ADMIN+ con @ApiOperation Swagger |
| `crm/dto/query-crm.dto.ts` | QueryCrmDto: page, limit, type?, stage?, assignedTo? |
| `crm/dto/update-crm-stage.dto.ts` | UpdateCrmStageDto: stage (enum), stageReason? |
| `crm/dto/create-crm-note.dto.ts` | CreateCrmNoteDto: content (MinLength 3) |

### Archivo modificado

- `app.module.ts`: import + entry `CrmModule` añadido después de `ServicesModule`

## Endpoints expuestos

| Método | Path | Descripción |
|--------|------|-------------|
| GET | /crm | Lista paginada con filtros opcionales type/stage/assignedTo |
| GET | /crm/:id | Detalle con notas y source polymorphic |
| PATCH | /crm/:id/stage | Actualiza stage; LOST requiere stageReason (400 si ausente) |
| POST | /crm/:id/notes | Crea CrmNote con authorId=actor.sub |
| GET | /crm/:id/notes | Lista notas ordenadas createdAt asc |

## Decisions Made

- **D-13 (stageReason):** Validación cross-field en service layer (`if dto.stage === LOST && !dto.stageReason → BadRequestException`), no en DTO — patrón consistente con D-03/D-04 del proyecto.
- **D-16 (sin DELETE):** Las entradas CRM no se eliminan para conservar historial comercial. El admin puede mover a LOST con stageReason.
- **D-19/D-23 (sin export):** CrmService no se exporta — planes 14-03 y 14-04 crean CrmEntry directamente vía PrismaService para evitar acoplamiento circular.
- **D-17 (assignedTo diferido):** Campo `assignedTo` existe en schema pero el endpoint de asignación queda para Phase 15.

## Deviations from Plan

None — plan ejecutado exactamente como estaba escrito.

## Known Stubs

None — CrmModule es la fuente de datos real. Los planes 14-03 (Contact→CRM) y 14-04 (Services→CRM) poblarán la tabla CrmEntry cuando lleguen requests reales.

## Self-Check

### Files
- apps/api/src/crm/crm.module.ts: creado
- apps/api/src/crm/crm.service.ts: creado
- apps/api/src/crm/crm.controller.ts: creado
- apps/api/src/crm/dto/query-crm.dto.ts: creado
- apps/api/src/crm/dto/update-crm-stage.dto.ts: creado
- apps/api/src/crm/dto/create-crm-note.dto.ts: creado

### Commits
- 5351e3b: feat(14-02): crear CrmModule + Service + DTOs (list/findOne/updateStage)
- ea23ed8: feat(14-02): añadir endpoints CRM + notas (addNote, listNotes)
