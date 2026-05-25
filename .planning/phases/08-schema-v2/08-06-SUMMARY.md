---
phase: 08-schema-v2
plan: 06
subsystem: database
tags: [prisma, mysql, crm, services, photography, content-creators, schema]

# Dependency graph
requires:
  - phase: 08-05
    provides: Article.status, órdenes con contexto de org, schema v2 casi completo
provides:
  - ServiceType enum (PHOTOGRAPHY | CONTENT)
  - CrmType enum (CONTACT | PHOTOGRAPHY | CONTENT)
  - CrmStage enum (NEW | CONTACTED | NEGOTIATING | WON | LOST)
  - ServiceOption model (opciones configurables de formularios de cotización)
  - ServiceRequest model (solicitudes de cotización pública, many-to-many con ServiceOption)
  - CrmEntry model (pipeline CRM unificado, independiente de ContactMessage)
  - CrmNote model (notas internas del pipeline con FK Cascade)
  - Migración sch06_services_crm (6ª y última migración de Phase 8)
affects:
  - Phase 14 (Servicios y CRM — service layer que consume estos modelos)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Polymorphic source sin FK: CrmEntry.sourceType+sourceId apunta a ContactMessage o ServiceRequest por tipo, sin FKs directas. Validación de existencia en service layer (mismo patrón que AuditLog y Transfer)."
    - "Many-to-many implícito Prisma: ServiceRequest.options ↔ ServiceOption.requests — Prisma genera la tabla de unión automáticamente."
    - "KEY DECISION #2: CrmEntry es modelo independiente. ContactMessage NO se modifica para preservar backwards compat con endpoint /contact."

key-files:
  created:
    - apps/api/prisma/migrations/20260525000034_sch06_services_crm/migration.sql
  modified:
    - apps/api/prisma/schema.prisma

key-decisions:
  - "KEY DECISION #2 LOCKED: CrmEntry es modelo NUEVO e independiente. ContactMessage se mantiene sin cambios (7 campos, sin stage ni notes). El service layer de Phase 14 será responsable de crear ContactMessage + CrmEntry en una sola transacción al recibir POST /contact."
  - "ServiceRequest NO tiene campo status — el estado del pipeline vive en CrmEntry.stage (CrmStage), no en la solicitud entrante."
  - "CrmEntry.sourceType duplica el campo type para permitir queries directas por origen sin JOIN."

patterns-established:
  - "Polymorphic CRM: sourceType (CrmType enum) + sourceId (Int) sin FKs — el join lógico se hace en service layer o con dos queries separadas."
  - "Snapshot denormalizado en CrmEntry: contactName/contactEmail copiados al crear para listados del kanban sin JOIN a ContactMessage o ServiceRequest."

requirements-completed: [SCH-06]

# Metrics
duration: 2min
completed: 2026-05-25
---

# Phase 8 Plan 06: Servicios y CRM — Schema v2 Completo

**4 modelos nuevos (ServiceOption, ServiceRequest, CrmEntry, CrmNote) + 3 enums nuevos; CrmEntry independiente de ContactMessage (KEY DECISION #2); 6 migraciones de Phase 8 aplicadas; phase gate pnpm validate + tsc + seed todos exit 0.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-24T23:59:07Z
- **Completed:** 2026-05-25T00:01:17Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- 3 enums nuevos: ServiceType (PHOTOGRAPHY|CONTENT), CrmType (CONTACT|PHOTOGRAPHY|CONTENT), CrmStage (NEW|CONTACTED|NEGOTIATING|WON|LOST)
- ServiceOption y ServiceRequest con many-to-many implícito Prisma (tabla de unión autogenerada)
- CrmEntry pipeline CRM unificado con patrón polymorphic (sourceType+sourceId sin FKs), snapshot denormalizado (contactName/contactEmail), assignedTo y back-relation a CrmNote
- CrmNote con FK Cascade a CrmEntry (notas internas con historial de autor)
- ContactMessage INTOCADO: 7 campos exactos, sin stage, sin notes — KEY DECISION #2 preservada
- Migración sch06_services_crm aplicada — completando las 6 migraciones de Phase 8
- Phase gate completo: pnpm prisma validate + pnpm tsc --noEmit + pnpm prisma:seed todos exit 0

## Task Commits

1. **Task 1: Agregar enums + ServiceOption + ServiceRequest** - `511508a` (feat)
2. **Task 2: Agregar CrmEntry + CrmNote + migración sch06_services_crm** - `ba0d3cb` (feat)

## Files Created/Modified

- `apps/api/prisma/schema.prisma` — 4 modelos nuevos + 3 enums nuevos agregados al final (sección "v2 Servicios y CRM")
- `apps/api/prisma/migrations/20260525000034_sch06_services_crm/migration.sql` — DDL para las 4 nuevas tablas y la tabla de unión ServiceOption↔ServiceRequest

## Deviations from Plan

None — plan executed exactly as written.

## Confirmación crítica: KEY DECISION #2

ContactMessage NO fue modificada. Verificación ejecutada:

```
model ContactMessage {
  id        Int      @id @default(autoincrement())  // campo 1
  name      String                                   // campo 2
  email     String                                   // campo 3
  subject   String                                   // campo 4
  message   String   @db.Text                        // campo 5
  read      Boolean  @default(false)                 // campo 6
  createdAt DateTime @default(now())                 // campo 7
}
```

- Campos con 2-space indent: **7** (exacto)
- `stage` field: NO EXISTE
- `notes` field: NO EXISTE

## Las 6 migraciones de Phase 8

| # | Nombre | Contenido |
|---|--------|-----------|
| 1 | `20260524183711_sch01_user_v2` | User v2: handle, isVerified, 2FA, UserType, Profile |
| 2 | `20260524233307_sch02_geography_v2` | País → Estado → Ciudad (jerarquía 3 niveles) |
| 3 | `20260524234414_sch03_organizations` | OrgMember, OrgInvitation, OrgRole enum |
| 4 | `20260524234837_sch04_core_systems` | Settings, Notification, SavedEvent, Subscription, Transfer |
| 5 | `20260524235433_sch05_category_orders_v2` | Category v2, Orders con orgId, Article.status, OrderItem.articleId |
| 6 | `20260525000034_sch06_services_crm` | ServiceOption, ServiceRequest, CrmEntry, CrmNote + enums |

## Phase Gate Confirmado

```bash
cd apps/api
pnpm prisma validate   # exit 0 ✓
pnpm tsc --noEmit      # exit 0 ✓ (sin output)
pnpm prisma:seed       # exit 0 ✓ (seed completo: countries/states/cities/categories/tags/articles/heroes/spots/events/users/profiles/likes)
```

## Pendiente Phase 14 (Servicios y CRM)

El service layer de Phase 14 debe implementar:

1. `POST /contact` → crear `ContactMessage` + `CrmEntry(sourceType=CONTACT, sourceId=cm.id)` en una transacción Prisma
2. `POST /services/photography` → crear `ServiceRequest(type=PHOTOGRAPHY)` + `CrmEntry(sourceType=PHOTOGRAPHY, sourceId=sr.id)` en transacción
3. `POST /services/content-creators` → crear `ServiceRequest(type=CONTENT)` + `CrmEntry(sourceType=CONTENT, sourceId=sr.id)` en transacción
4. `PATCH /crm/:id/stage` → validar que si `stage=LOST` entonces `stageReason` es requerido (validación service layer, no schema)

## Known Stubs

None — este plan es schema-only. No hay código de aplicación ni datos hardcodeados.

## Self-Check: PASSED

- FOUND: apps/api/prisma/schema.prisma
- FOUND: apps/api/prisma/migrations/20260525000034_sch06_services_crm/migration.sql
- FOUND: .planning/phases/08-schema-v2/08-06-SUMMARY.md
- FOUND: commit 511508a (Task 1 — enums + ServiceOption + ServiceRequest)
- FOUND: commit ba0d3cb (Task 2 — CrmEntry + CrmNote + migration)
- All 9 success criteria grep checks PASS
- ContactMessage integrity: 7 fields, no stage, no notes
