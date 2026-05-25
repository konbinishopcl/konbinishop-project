---
phase: 11-notificaciones-y-settings
plan: "03"
subsystem: settings
tags: [settings, config, spots, heroes, crud, admin]
dependency_graph:
  requires: [11-notificaciones-y-settings-02]
  provides: [SettingsModule, GET /settings/public, GET /settings (admin), PATCH /settings (admin)]
  affects: [SpotsModule, HeroesModule, AppModule, seed.ts]
tech_stack:
  added: [SettingsModule, SettingsService, SettingsController, UpsertSettingDto]
  patterns: [PUBLIC_PREFIXES filter, async getNum via PrismaService, Promise.all for quota]
key_files:
  created:
    - apps/api/src/settings/settings.module.ts
    - apps/api/src/settings/settings.service.ts
    - apps/api/src/settings/settings.controller.ts
    - apps/api/src/settings/dto/upsert-setting.dto.ts
  modified:
    - apps/api/src/app.module.ts
    - apps/api/src/spots/spots.module.ts
    - apps/api/src/spots/spots.service.ts
    - apps/api/src/heroes/heroes.module.ts
    - apps/api/src/heroes/heroes.service.ts
    - apps/api/prisma/seed.ts
decisions:
  - "PUBLIC_PREFIXES = ['SPOT_', 'HERO_'] hard-coded — SUBSCRIPTION_* y otras claves NO se exponen públicamente"
  - "getNum() lanza NotFoundException si la clave no existe o no es parseable — el seed garantiza presencia"
  - "SPOT_MAX_ACTIVE corregido de 12 a 10 en seed.ts (decisión bloqueada en 11-CONTEXT.md gana sobre Phase 8 default)"
  - "Extras del seed preservadas: SPOT_MIN_DAYS, HERO_MIN_DAYS, SUBSCRIPTION_SPOT_DISCOUNT, SUBSCRIPTION_HERO_DISCOUNT"
  - "quota() usa Promise.all para paralelizar las 4 queries de Settings en paralelo"
  - "assertQuotaAvailable() y assertMaxDays() ahora son async — migrados de síncrono a Promise"
metrics:
  duration: 245s
  completed: "2026-05-25"
  tasks_completed: 3
  files_changed: 10
---

# Phase 11 Plan 03: SettingsModule + Migración Spots/Heroes Summary

SettingsModule autocontenido (module/controller/service/DTO) con CRUD admin y endpoint público; SpotsService y HeroesService migrados de ConfigService a SettingsService como única fuente de verdad para SPOT_*/HERO_* en runtime.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Crear SettingsModule + Service + Controller + DTO + fix seed | fcb894b | settings/* (4 nuevos) + app.module.ts + seed.ts |
| 2 | Migrar SpotsService a SettingsService | fae8b8b | spots.module.ts + spots.service.ts |
| 3 | Migrar HeroesService a SettingsService + verificación final | a8a2992 | heroes.module.ts + heroes.service.ts |

## What Was Built

### SettingsModule

**`apps/api/src/settings/settings.service.ts`** — 5 métodos:
- `get(key)` — Lee clave como string, lanza NotFoundException si falta
- `getNum(key)` — Lee clave y parsea como integer, lanza si no parseable
- `set(key, value)` — Upsert de clave (admin only, validado en controller)
- `getAll()` — Lista completa ordenada por key (admin only)
- `getPublic()` — Mapa `{key: value}` filtrado por `PUBLIC_PREFIXES = ['SPOT_', 'HERO_']`

**`apps/api/src/settings/settings.controller.ts`** — 3 endpoints:
- `GET /settings/public` — Sin auth, devuelve `{[key]: value}` de SPOT_* y HERO_* únicamente
- `GET /settings` — ADMIN+ required, lista completa `{key, value, updatedAt}`
- `PATCH /settings` — ADMIN+ required, upsert de una clave con `UpsertSettingDto`

**Orden de rutas crítico:** `GET /public` declarado ANTES de `GET /` para evitar que NestJS trate "public" como parámetro dinámico.

### SpotsService Migration

Eliminado `ConfigService` del constructor e imports. Inyectado `SettingsService`. Los 3 helpers privados pasan de síncrono a async:
- `maxActive() → Promise<number>` via `getNum('SPOT_MAX_ACTIVE')`
- `maxDays() → Promise<number>` via `getNum('SPOT_MAX_DAYS')`
- `pricePerDay() → Promise<number>` via `getNum('SPOT_PRICE_PER_DAY')`

`quota()`, `assertQuotaAvailable()` y `assertMaxDays()` actualizados con `await`/`Promise.all`.

### HeroesService Migration

Mismo patrón que SpotsService con claves HERO_*:
- `pricePerDay() → Promise<number>` via `getNum('HERO_PRICE_PER_DAY')`
- `maxActive() → Promise<number>` via `getNum('HERO_MAX_ACTIVE')`
- `maxDays() → Promise<number>` via `getNum('HERO_MAX_DAYS')`

### Seed Fix

`SPOT_MAX_ACTIVE` corregido de `'12'` a `'10'` en `apps/api/prisma/seed.ts`. Decisión bloqueada en `11-CONTEXT.md` (`SPOT_MAX_ACTIVE=10`) tiene prioridad sobre el valor que Phase 8-04 dejó (12). El `upsert update: {}` preserva valores que el admin ya haya modificado en producción; las instalaciones frescas reciben el default correcto de 10.

Las 4 claves extra del seed Phase 8-04 se mantienen intactas:
`SPOT_MIN_DAYS`, `HERO_MIN_DAYS`, `SUBSCRIPTION_SPOT_DISCOUNT`, `SUBSCRIPTION_HERO_DISCOUNT`.

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **PUBLIC_PREFIXES hard-coded:** `['SPOT_', 'HERO_']` definido como constante en el módulo. `SUBSCRIPTION_*` y cualquier clave futura admin-only no se expone. Phase 12 (subscriptions) accede directamente via `SettingsService.getNum('SUBSCRIPTION_*')` desde su propio servicio.

2. **getNum() lanza, no devuelve null:** Si una clave falta en DB, `getNum()` lanza `NotFoundException`. Esto hace el error visible (no silencioso). El seed garantiza que las 8 claves requeridas existan en cualquier instalación.

3. **SPOT_MAX_ACTIVE=10:** Decisión bloqueada en 11-CONTEXT.md. El valor de Phase 8 (12) era un draft; el phase_scope definitivo establece 10 spots activos máximos simultáneos.

4. **Promise.all en quota():** Los 4 valores (active, max, pricePerDay, maxDays) se leen en paralelo para minimizar latencia. Patrón aplicado tanto en Spots como en Heroes.

## Phase 11 Completion

Con este plan se cierran los 3 requirements de Phase 11:
- **CFG-01**: NotificationsModule con endpoints GET/PATCH — completado en 11-01
- **CFG-02**: Integración de notificaciones en Events/Spots/Heroes/Orgs/Transfers — completado en 11-02
- **CFG-03**: SettingsModule + migración Spots/Heroes de ConfigService a DB — completado en 11-03

## Next Consumers

- **Phase 12 (Suscripciones):** `SettingsService.getNum('SUBSCRIPTION_PRICE')` y `SettingsService.getNum('SUBSCRIPTION_CREDITS')` para leer precios de suscripción desde DB
- **Phase 12:** `SettingsService.getNum('SUBSCRIPTION_SPOT_DISCOUNT')` y `SettingsService.getNum('SUBSCRIPTION_HERO_DISCOUNT')` para descuentos de suscriptores

## Verification

Triple gate ejecutado y verificado:
- `pnpm tsc --noEmit` → exit 0
- `pnpm prisma:seed` → exit 0 (12 defaults upserted, idempotente)
- `pnpm build` → exit 0 (NestJS DI graph completo)

## Self-Check: PASSED
