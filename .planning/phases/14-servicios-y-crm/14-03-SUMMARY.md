---
phase: 14-servicios-y-crm
plan: "03"
subsystem: api
tags: [nestjs, prisma, crm, contact, transaction]

# Dependency graph
requires:
  - phase: 14-02
    provides: CrmModule con CrmEntry CRUD y modelos Prisma crmEntry/crmNote disponibles
provides:
  - ContactService.create() con dual creation transaccional (ContactMessage + CrmEntry) usando prisma.$transaction callback form
  - Toda solicitud POST /contact genera automáticamente un CrmEntry type=CONTACT stage=NEW
  - Snapshot de contactName/contactEmail denormalizado en CrmEntry (independiente de borrado del mensaje)
affects: [14-04, crm-module, contact-module]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "D-18: prisma.$transaction(async (tx) => {...}) callback form para dual-create atómico"
    - "D-19: no acoplamiento de módulos — ContactModule usa PrismaService directamente en vez de importar CrmModule"
    - "D-20: response público no expone CrmEntry — backwards compatible con clientes existentes"
    - "Emails fuera de la transacción — idempotencia: fallo de email no revierte el guardado en DB"

key-files:
  created: []
  modified:
    - apps/api/src/contact/contact.service.ts

key-decisions:
  - "D-18: prisma.$transaction callback form (no batch array) para garantizar atomicidad ContactMessage + CrmEntry"
  - "D-19: ContactModule NO importa CrmModule — PrismaService directo evita acoplamiento"
  - "D-20: el endpoint POST /contact sigue retornando solo el ContactMessage (backwards compatible)"
  - "assignedTo y stageReason no incluidos en CrmEntry — diferidos a Phase 15 (D-17)"
  - "Envío de emails queda FUERA de la transacción — fallo de email no revierte el guardado"

patterns-established:
  - "Dual-create transaccional: tx.modelA.create() + tx.modelB.create() dentro de prisma.$transaction(async (tx) => {...})"
  - "Snapshot de datos de contacto en CrmEntry (contactName/contactEmail) para independencia de ciclo de vida del ContactMessage"

requirements-completed: [SVC-04]

# Metrics
duration: 5min
completed: "2026-05-25"
---

# Phase 14 Plan 03: Contact → CRM Integration Summary

**ContactService.create() extendido con prisma.$transaction dual-create: ContactMessage + CrmEntry atómicos sin acoplar ContactModule a CrmModule**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-25T16:03:00Z
- **Completed:** 2026-05-25T16:05:29Z
- **Tasks:** 1/1
- **Files modified:** 1

## Accomplishments

- POST /contact ahora crea ContactMessage + CrmEntry en la misma transacción Prisma (atómico)
- CrmEntry creada con type=CONTACT, stage=NEW, sourceType=CONTACT, sourceId=contactMsg.id — snapshot de contactName/contactEmail denormalizado
- ContactModule sigue sin importar CrmModule (D-19) — PrismaService directo en ContactService
- Response del endpoint público sin cambios — sigue retornando solo el ContactMessage (D-20)
- Emails de confirmación y notificación siguen funcionando fuera de la transacción

## Task Commits

1. **Task 1: Extender ContactService.create() con creación transaccional de CrmEntry (SVC-04)** - `c2aba33` (feat)

**Plan metadata:** pendiente (docs commit)

## Files Created/Modified

- `apps/api/src/contact/contact.service.ts` — método create() reemplazado con prisma.$transaction callback form que crea ContactMessage + CrmEntry atómicamente; emails fuera de transacción; retorna solo ContactMessage

## Decisions Made

- D-18 callback form: `prisma.$transaction(async (tx) => { ... })` en vez de batch array — necesario para usar `contactMsg.id` como `sourceId` en la CrmEntry dentro de la misma transacción
- D-19 no acoplamiento: `this.prisma.crmEntry.create` directamente en ContactService, sin importar ni inyectar CrmService/CrmModule
- D-20 backwards compatible: `return msg` retorna solo el ContactMessage, la CrmEntry es un side-effect interno
- `assignedTo` no incluido en este plan — diferido a Phase 15 (D-17)
- `stageReason` no incluido — stage=NEW no requiere reason

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CrmEntry se crea automáticamente para cada POST /contact — vista CRM unificada lista para recibir contactos
- Phase 14-04 puede leer CrmEntry type=CONTACT con stage=NEW para el pipeline de servicios
- ContactModule independiente de CrmModule — sin deuda técnica de acoplamiento
- `assignedTo` en CrmEntry disponible para Phase 15 (asignación de agente/staff)

---
*Phase: 14-servicios-y-crm*
*Completed: 2026-05-25*
