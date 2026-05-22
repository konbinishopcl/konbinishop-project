---
phase: 07-sistema-de-auditoria
plan: "02"
subsystem: database
tags: [prisma, mysql, audit, migration, enums]

# Dependency graph
requires: []
provides:
  - "Modelo AuditLog en schema.prisma con userId sin FK (preserva historial ante borrado de usuarios)"
  - "Enums AuditAction (CREATE/UPDATE/DELETE/APPROVE/REJECT/BAN/UNBAN) y AuditEntity (EVENT/USER/AVISO/PORTADA)"
  - "Migración 20260522194527_add_audit_log con tabla audit_logs y 4 índices"
  - "Cliente Prisma regenerado con prisma.auditLog y tipos AuditAction/AuditEntity"
affects:
  - "07-03 AuditService — depende de prisma.auditLog"
  - "07-04 AuditController — depende de tipos AuditAction/AuditEntity"
  - "07-05 integración en EventsService, UsersService, SpotsService, HeroesService"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "userId Int? sin @relation en tabla de auditoría — preserva historial ante borrado de entidad referenciada"
    - "@@map('audit_logs') para nombre de tabla en snake_case con modelo en PascalCase"
    - "Migración --create-only para entornos donde la DB de desarrollo no está disponible localmente"

key-files:
  created:
    - "apps/api/prisma/migrations/20260522194527_add_audit_log/migration.sql"
  modified:
    - "apps/api/prisma/schema.prisma"

key-decisions:
  - "AuditEntity usa AVISO y PORTADA (nombres comerciales del producto) — no SPOT/HERO — por decisión de producto LOCKED en D-Phase7"
  - "AuditAction NO incluye CHANGE_ROLE (user prompt lo mencionaba); el plan especifica 7 valores exactos; cambios de rol se rastrean como UPDATE con metadata { prevRole, newRole }"
  - "userId es Int? sin @relation FK — historial sobrevive al borrado de usuarios (compliance/trazabilidad)"
  - "Migración creada con --create-only — se aplica via prisma migrate deploy en start:prod en VPS; no se aplica localmente"
  - "ip y userAgent marcados como datos personales bajo Ley 21.719 con retención 24 meses"

patterns-established:
  - "Tabla de auditoría sin FK explícita en userId: permite borrado de usuarios sin perder trail de compliance"

requirements-completed: [AUD-01]

# Metrics
duration: 8min
completed: 2026-05-22
---

# Phase 7 Plan 02: AuditLog Schema Migration Summary

**Tabla `audit_logs` en MySQL vía Prisma con enums AuditAction/AuditEntity, 4 índices de rendimiento, userId sin FK para preservar historial, y cliente Prisma regenerado con `prisma.auditLog`**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-22T19:38:00Z
- **Completed:** 2026-05-22T19:46:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Enums `AuditAction` y `AuditEntity` agregados al schema con nomenclatura comercial (AVISO/PORTADA per decisión de producto)
- Modelo `AuditLog` con `userId Int?` sin FK declarada — el historial de auditoría sobrevive al borrado de usuarios (compliance/trazabilidad)
- Migración `20260522194527_add_audit_log` creada con `CREATE TABLE audit_logs` y los 4 índices de rendimiento
- Cliente Prisma regenerado: `prisma.auditLog` disponible con tipos `AuditAction` y `AuditEntity` desde `@prisma/client`
- `ip` y `userAgent` marcados con comentario de retención 24 meses (Ley 21.719)

## Task Commits

1. **Task 1: Agregar modelo AuditLog y enums al schema** - `ab2ab17` (feat)
2. **Task 2: Migración add_audit_log** - la migration.sql fue incluida en commit `6371970` (docs(07-01)) que se ejecutó concurrentemente en Wave 1; el cliente fue regenerado localmente

**Plan metadata:** pendiente (commit docs a continuación)

## Files Created/Modified
- `apps/api/prisma/schema.prisma` - Enums AuditAction, AuditEntity y modelo AuditLog agregados al final del schema
- `apps/api/prisma/migrations/20260522194527_add_audit_log/migration.sql` - SQL de creación de tabla audit_logs con 4 índices

## Decisions Made

1. **AuditEntity: AVISO/PORTADA (no SPOT/HERO)** — El user prompt mencionaba SPOT y HERO (nombres de modelos Prisma) pero el PLAN.md especifica AVISO y PORTADA (nombres comerciales del producto). El plan es el contrato canónico. Confirmado en commit `a3af368` que estableció AVISO/PORTADA como nombres oficiales de UI.

2. **AuditAction: 7 valores sin CHANGE_ROLE** — El user prompt incluía `CHANGE_ROLE` pero el PLAN.md especifica exactamente 7 valores. Cambios de rol se rastrean como `UPDATE` con `metadata: { prevRole, newRole }` — eso está documentado en 07-RESEARCH.md y es la decisión correcta.

3. **Migración con --create-only** — La DB de desarrollo está en VPS (165.22.12.106); no se puede aplicar la migración localmente sin SSH. Se usó `--create-only` per fallback documentado en el plan. La migración se aplicará en producción via `prisma migrate deploy` en `start:prod`.

## Deviations from Plan

### Noted Discrepancies (no accionadas — PLAN prevalece)

**1. [Noted] User prompt incluía CHANGE_ROLE en AuditAction**
- **Issue:** El user prompt listaba 8 valores: `CREATE, UPDATE, DELETE, APPROVE, REJECT, BAN, UNBAN, CHANGE_ROLE`
- **Resolución:** El PLAN.md especifica "EXACTAMENTE este bloque" con 7 valores (sin CHANGE_ROLE). El plan es el contrato canónico. Se siguió el PLAN.

**2. [Noted] migration.sql comprometida en commit de otro plan**
- **Issue:** La migration SQL fue comprometida en el commit `6371970` (docs(07-01)) que se ejecutó en Wave 1 concurrentemente
- **Resolución:** El archivo existe y está correctamente comprometido en el repositorio. No hay pérdida de código. Se creó un commit separado para el metadata del plan.

---

**Total deviations:** 0 auto-fixes aplicados (2 discrepancias notadas sin acción — PLAN prevalece)
**Impact on plan:** Ninguno — las discrepancias fueron resoluciones explícitas a favor del PLAN.md canónico.

## Issues Encountered

- La migration.sql fue comprometida por el plan 07-01 en Wave 1 concurrente. Funciona correctamente pero el commit no refleja el contexto 07-02. Sin impacto funcional.

## User Setup Required

None - no external service configuration required. La migración se aplicará automáticamente en el próximo deploy via `prisma migrate deploy` en `start:prod`.

## Known Stubs

None — no stubs en este plan. El schema está completo y el cliente Prisma está regenerado.

## Next Phase Readiness

- `prisma.auditLog` disponible en el cliente — listo para ser inyectado en `AuditService` (07-03)
- Tipos `AuditAction` y `AuditEntity` exportados desde `@prisma/client` — listos para uso en DTOs y servicios
- La migración se aplicará al VPS en el próximo deploy — no requiere acción manual previa a 07-03

---
*Phase: 07-sistema-de-auditoria*
*Completed: 2026-05-22*
