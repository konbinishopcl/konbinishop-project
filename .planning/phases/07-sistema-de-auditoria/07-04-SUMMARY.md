---
phase: 07-sistema-de-auditoria
plan: "04"
subsystem: api, audit
tags: [nestjs, prisma, audit, events, fire-and-forget]

# Dependency graph
requires:
  - phase: 07-03
    provides: AuditModule exportando AuditService con log() fire-and-forget listo para inyección
provides:
  - EventsService instrumentado con 6 llamadas a AuditService.log() (CREATE, UPDATE, DELETE, APPROVE, REJECT, BAN)
  - EventsController pasa @Req() req a los 6 handlers de mutación
  - EventsModule importa AuditModule para resolver la inyección de AuditService
affects:
  - 07-05..07-06: mismo patrón aplicado a UsersService, SpotsService, HeroesService

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AuditService.log() fire-and-forget colocado ANTES del bloque de mail — fallo de mail no impide registro"
    - "req?: Request como último parámetro opcional en métodos de servicio — controller pasa req, tests omiten"
    - "metadata solo para REJECT y BAN ({ reason }) — ningún método lleva dto completo ni req.body"
    - "Captura de entityId: create usa event.id del resultado; update/remove/approve/reject/ban usan el id del parámetro"

key-files:
  created: []
  modified:
    - apps/api/src/events/events.service.ts
    - apps/api/src/events/events.controller.ts
    - apps/api/src/events/events.module.ts

key-decisions:
  - "log() llamado sin await — es void/fire-and-forget por diseño, precedente establecido en 07-03"
  - "req pasado como objeto completo a AuditService (no desestructurado) — AuditService extrae ip/userAgent/url internamente"
  - "create() convierte return directo a variable local para capturar event.id antes del log"

requirements-completed: [AUD-02]

# Metrics
duration: 6min
completed: 2026-05-22
---

# Phase 7 Plan 04: Instrumentar EventsService con auditoría Summary

**EventsService con 6 puntos de auditoría (CREATE/UPDATE/DELETE/APPROVE/REJECT/BAN), controller pasando @Req() a todos los handlers de mutación, y EventsModule importando AuditModule**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-22T20:01:01Z
- **Completed:** 2026-05-22T20:07:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- `EventsService` instrumentado: `AuditService` inyectado en constructor, parámetro `req?: Request` añadido al final de los 6 métodos de mutación, `this.audit.log()` fire-and-forget llamado tras cada operación de escritura exitosa
- Ubicación del log: siempre ANTES del bloque de envío de mail — fallo de mail no impide el registro de auditoría
- `EventsController`: `@Req() req: Request` agregado a los 6 handlers de mutación y propagado a los métodos de servicio; handlers de lectura y likes sin cambios
- `EventsModule`: importa `AuditModule` para que NestJS pueda resolver la inyección de `AuditService` en `EventsService`
- `npx tsc --noEmit` compila con código 0

## Task Commits

1. **Task 1: Instrumentar EventsService con AuditService.log()** - `8b7df05` (feat)
2. **Task 2: Pasar el Request en EventsController e importar AuditModule** - `d107445` (feat)

**Plan metadata:** pendiente (este commit)

## Files Created/Modified

- `apps/api/src/events/events.service.ts` — Inyección de AuditService + 6 llamadas log() + parámetro req? en create/update/remove/approve/reject/ban
- `apps/api/src/events/events.controller.ts` — @Req() req: Request en 6 handlers de mutación, propagado al service
- `apps/api/src/events/events.module.ts` — AuditModule añadido al array imports

## Decisions Made

1. **log() sin await**: La función es `void` por diseño (07-03). Llamarla sin await garantiza fire-and-forget y evita propagación de errores a la operación principal.

2. **req pasado como objeto completo**: No se desestructura ip/userAgent en el controller — `AuditService.log()` extrae internamente `req.ip`, `req.get('user-agent')` y `req.originalUrl`. Esto mantiene la interfaz simple y consistent con la firma del servicio.

3. **create() requiere variable local**: El método `create` originalmente hacía `return this.prisma.event.create(...)` directamente. Se cambió a `const event = await ... ; this.audit.log({ entityId: event.id }); return event;` para capturar el `id` generado por la base de datos.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no se requiere configuración de servicios externos para este plan.

## Next Phase Readiness

- `EventsService` completamente instrumentado — 6 puntos de auditoría activos
- Patrón establecido: `req?: Request` como último parámetro en el service + `@Req() req` en el controller + `AuditModule` en el módulo
- Listo para aplicar el mismo patrón en 07-05 (UsersService) y 07-06 (SpotsService + HeroesService)

## Self-Check: PASSED

- [x] `apps/api/src/events/events.service.ts` — FOUND
- [x] `apps/api/src/events/events.controller.ts` — FOUND
- [x] `apps/api/src/events/events.module.ts` — FOUND
- [x] `07-04-SUMMARY.md` — FOUND
- [x] Commit `8b7df05` — Task 1 (EventsService)
- [x] Commit `d107445` — Task 2 (EventsController + EventsModule)
- [x] `grep -c 'this.audit.log' events.service.ts` → 6 (PASS)
- [x] All 6 action types present: CREATE, UPDATE, DELETE, APPROVE, REJECT, BAN
- [x] No `await` on `this.audit.log` calls
- [x] No `metadata: { dto` or `req.body` in events.service.ts
- [x] `npx tsc --noEmit` → exit code 0

---
*Phase: 07-sistema-de-auditoria*
*Completed: 2026-05-22*
