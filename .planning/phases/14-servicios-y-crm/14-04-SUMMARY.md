---
phase: 14-servicios-y-crm
plan: "04"
subsystem: services-crm-integration
tags: [services, crm, transaction, prisma, integration]
dependency_graph:
  requires: [14-01, 14-02]
  provides: [SVC-05]
  affects: [CrmEntry, ServiceRequest]
tech_stack:
  added: []
  patterns:
    - "$transaction callback form (callback, not batch array — required for connect many-to-many)"
    - "crmTypeMap explícito { PHOTOGRAPHY, CONTENT } as const (D-21)"
    - "PrismaService directo sin import de CrmModule (D-23)"
key_files:
  modified:
    - apps/api/src/services/services.service.ts
decisions:
  - "D-21: crmTypeMap { PHOTOGRAPHY: 'PHOTOGRAPHY', CONTENT: 'CONTENT' } as const — aunque los valores sean iguales al enum, el mapa es explícito por spec"
  - "D-22: $transaction(async (tx) => {...}) callback form — batch form (array) no soporta connect para many-to-many options"
  - "D-23: ServicesModule no importa CrmModule — integración CRM vía this.prisma directamente"
metrics:
  duration: "5 minutes"
  completed_date: "2026-05-25"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 14 Plan 04: Services + CRM Integration (SVC-05) Summary

**One-liner:** Refactorizar `ServicesService.createRequest()` para crear `ServiceRequest` + `CrmEntry` atómicamente vía `$transaction` callback form, sin acoplar `ServicesModule` a `CrmModule`.

## What Was Built

Integración CRM para solicitudes de servicios (SVC-05): cuando llega un `POST /services/photography` o `POST /services/content-creators`, el sistema ahora crea dos registros en una sola transacción atómica:

1. `ServiceRequest` con `type`, datos del cliente, `eventName/eventDate/eventPlace`, y `options` conectadas vía many-to-many
2. `CrmEntry` con `type=crmTypeMap[ServiceType]`, `stage=NEW`, `sourceType=crmTypeMap[ServiceType]`, `sourceId=serviceReq.id`, `contactName`, `contactEmail`

Si la creación de `CrmEntry` falla, el `ServiceRequest` no se persiste (atomicidad garantizada). El response del endpoint público no cambió (`{ id, type, name, email, createdAt }`).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refactorizar createRequest() con $transaction callback + CrmEntry | 70a6426 | apps/api/src/services/services.service.ts |

## Key Decisions

- **D-21 (crmTypeMap):** Se usa `const crmTypeMap = { PHOTOGRAPHY: 'PHOTOGRAPHY', CONTENT: 'CONTENT' } as const` aunque los valores del enum `CrmType` coincidan literalmente con `ServiceType`. Explícito por spec, no inferido.

- **D-22 ($transaction callback form):** El many-to-many `options: { connect: [...] }` dentro de `data` requiere la forma callback de `$transaction`. La forma batch (array) no soporta `connect` en relaciones many-to-many — si se usara batch, las opciones no se vincularían silenciosamente.

- **D-23 (no acoplamiento CrmModule):** `ServicesService` accede a `tx.crmEntry.create` vía el cliente Prisma transaccional — no importa ni inyecta `CrmService` ni `CrmModule`. `ServicesModule` sigue importando solo `[AuthModule]`.

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `pnpm tsc --noEmit` pasa sin errores nuevos
- `grep '$transaction(async'` retorna 1 (callback form)
- `grep 'tx.serviceRequest.create'` retorna 1
- `grep 'tx.crmEntry.create'` retorna 1
- `grep 'sourceId: serviceReq.id'` retorna 1
- `grep "stage: 'NEW'"` retorna 1
- `grep 'crmTypeMap[type]'` retorna 2 (type + sourceType)
- `grep 'options.*connect'` retorna 1 (many-to-many preservado)
- `grep 'CrmModule|CrmService'` en `services.module.ts` retorna 0 (D-23 cumplido)
- `grep 'CrmService'` en `services.service.ts` retorna 0

## Known Stubs

None.

## Self-Check: PASSED

- File exists: `apps/api/src/services/services.service.ts` — FOUND
- Commit 70a6426 — FOUND
