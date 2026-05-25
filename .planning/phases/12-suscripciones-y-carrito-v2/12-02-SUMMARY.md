---
phase: 12-suscripciones-y-carrito-v2
plan: "02"
subsystem: orders
tags: [orders, carrito, article, settings, migration]
dependency_graph:
  requires: [12-01]
  provides: [COM-02]
  affects: [orders, payments]
tech_stack:
  added: []
  patterns: [settings-service-migration, optional-dto-field, service-level-validation]
key_files:
  created: []
  modified:
    - apps/api/src/orders/dto/add-item.dto.ts
    - apps/api/src/orders/orders.service.ts
    - apps/api/src/orders/orders.module.ts
    - apps/api/prisma/seed.ts
decisions:
  - "D-15: ARTICLE en carrito sigue patrón upsert existente (@@unique[orderId,type])"
  - "D-16: days=0 para ARTICLE (precio fijo, no por día); subtotal = unitPrice"
  - "D-17: OrdersService migrado completamente de ConfigService a SettingsService"
  - "days opcional en DTO + validación >=1 movida al service para EVENT/SPOT/HERO"
  - "PaymentsService NO migrado a SettingsService en este plan (deferred)"
metrics:
  duration: "~15min"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
  completed_date: "2026-05-25"
---

# Phase 12 Plan 02: ARTICLE in Cart + OrdersService → SettingsService Migration Summary

**One-liner:** OrderItemType.ARTICLE operativo en carrito con precio fijo desde Settings; ConfigService completamente removido de OrdersService a favor de SettingsService; days opcional en DTO con validación >=1 movida al service layer.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Agregar ARTICLE_PRICE y EVENT_MAX_DAYS al seed | d454e65 | apps/api/prisma/seed.ts |
| 2 | AddItemDto days opcional + OrdersService migrar a SettingsService + ARTICLE branch | d454e65 | add-item.dto.ts, orders.service.ts, orders.module.ts |

## Changes Made

### Task 1: Seed

Added 2 new entries to `settingsDefaults` array in `seed.ts` (14 total):
- `EVENT_MAX_DAYS = '60'`
- `ARTICLE_PRICE = '5000'`

The log message already used `${settingsDefaults.length}` dynamically — no change needed.

### Task 2: DTO, Service, Module

**`add-item.dto.ts`:**
- `days` changed from `@IsInt() @Min(1) days: number` to `@IsOptional() @IsInt() @Min(0) days?: number`
- Added new optional field `articleId?: number` (was missing — Plan 12-01 added ARTICLE to enum but not this field)
- Now has 5 `@IsOptional()` decorators: days, eventId, spotId, heroId, articleId

**`orders.module.ts`:**
- Added `import { SettingsModule }` and included it in `imports: [AuthModule, SettingsModule]`

**`orders.service.ts`:**
- **ConfigService fully removed** — all reads migrated to `this.settings.getNum(key)`
- Migrated keys: `EVENT_MAX_DAYS`, `HERO_MAX_DAYS`, `SPOT_MAX_DAYS`, `SPOT_MAX_ACTIVE`, `HERO_MAX_ACTIVE`, `SPOT_PRICE_PER_DAY`, `HERO_PRICE_PER_DAY`, `ARTICLE_PRICE` (8 total `getNum` calls)
- `maxDays()` converted to `async` returning `Promise<number>`; returns `0` for ARTICLE/SUBSCRIPTION
- `ITEM_INCLUDE` extended with `article: true`
- **Service-level validation added:** `needsDays` guard throws `BadRequestException` when `days` undefined or < 1 for EVENT/SPOT/HERO types
- **ARTICLE branch in `resolveItem`:** validates `articleId` present, article exists, article belongs to owner, article is DRAFT; reads `ARTICLE_PRICE` from Settings; returns `{ unitPrice, eventId: null, spotId: null, heroId: null, articleId }`
- All other `resolveItem` branches updated to include `articleId: null` in return shape
- `addItem` upsert updated to include `articleId` in create/update, normalizes `days = 0` for ARTICLE, calculates `subtotal = unitPrice` (not `days * unitPrice`) for ARTICLE

## Key Decisions

### D-16: days = 0 for ARTICLE (precio fijo)
ARTICLE items use `unitPrice` as the full `subtotal`. There is no concept of publication days — a sponsored article costs a flat fee of `ARTICLE_PRICE`. This is enforced in `addItem` via:
```typescript
const days = dto.type === OrderItemType.ARTICLE ? 0 : (dto.days ?? 0);
const subtotal = dto.type === OrderItemType.ARTICLE ? unitPrice : days * unitPrice;
```

### DTO optional + service validation pattern
Making `days?: number` in the DTO with `@Min(0)` allows ARTICLE (and future types without days) to omit the field entirely. The `>=1` requirement for per-day types (EVENT/SPOT/HERO) is enforced in the service layer with a clear error message, keeping the DTO permissive while the business rule is enforced where it belongs.

### ConfigService fully removed from OrdersService
The advisor flagged that accepting only `*_MAX_DAYS` migration while leaving `SPOT_PRICE_PER_DAY` and `HERO_PRICE_PER_DAY` on ConfigService would fail the acceptance criterion (`grep "ConfigService" ... NO encuentra match`). Both price-per-day keys are already seeded so the migration is safe — `getNum` throws `NotFoundException` if missing, consistent with how SpotsService/HeroesService were migrated in Phase 11.

### PaymentsService NOT migrated (deferred)
`PaymentsService` still reads settings via ConfigService. This was explicitly out of scope per plan to avoid expanding blast radius. Documented here for Phase 13 or later.

### articleId field added to DTO
The DTO was missing `articleId` (Plan 12-01 added ARTICLE to the enum but not the field). Added as:
```typescript
@ApiPropertyOptional({ example: 5, description: 'ID del artículo en DRAFT (requerido cuando type = ARTICLE)' })
@IsOptional()
@IsInt()
articleId?: number;
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Migrated SPOT_PRICE_PER_DAY and HERO_PRICE_PER_DAY to SettingsService**
- **Found during:** Task 2 (acceptance criteria review)
- **Issue:** Plan action only enumerated `*_MAX_DAYS` and `*_MAX_ACTIVE` for migration, but `resolveItem` also read `SPOT_PRICE_PER_DAY` and `HERO_PRICE_PER_DAY` via `this.config.get(...)`. Leaving these would fail the acceptance criterion requiring ConfigService fully absent.
- **Fix:** Migrated both to `await this.settings.getNum('SPOT_PRICE_PER_DAY')` and `await this.settings.getNum('HERO_PRICE_PER_DAY')`. Both keys are seeded since Phase 8. Removed fallback `|| 8000` / `|| 15000` — consistent with how SettingsService signals missing keys via NotFoundException.
- **Files modified:** apps/api/src/orders/orders.service.ts
- **Commit:** d454e65

**2. [Rule 2 - Missing Critical Functionality] Added articleId field to AddItemDto**
- **Found during:** Task 2 review
- **Issue:** Plan noted `articleId` "ya debería existir" in the DTO, but it was not present. Plan 12-01 added ARTICLE to the enum but did not add the field.
- **Fix:** Added `@IsOptional() @IsInt() articleId?: number` with `@ApiPropertyOptional`.
- **Files modified:** apps/api/src/orders/dto/add-item.dto.ts
- **Commit:** d454e65

## Known Stubs

None — all functionality is fully wired. `ARTICLE_PRICE` is seeded with value `5000` and read from `SettingsService` at runtime.

## Deferred Items

- `PaymentsService` migration from ConfigService to SettingsService (explicitly deferred per plan)
- Subscription credits in cart (EVENT with active subscription → price=0, days=45) — Phase 12-03 or 12-04

## Verification

```
✓ pnpm tsc --noEmit  → exit 0 (no TS errors)
✓ pnpm build        → exit 0
✓ pnpm prisma:seed  → Settings seeded: 14 defaults
✓ grep "ConfigService" orders.service.ts → no match (fully removed)
✓ grep "this.settings.getNum" | wc -l → 8 (exceeds minimum 5)
✓ grep "@IsOptional()" add-item.dto.ts | wc -l → 5 (exceeds minimum 4)
✓ SettingsModule imported in OrdersModule
✓ prisma.article.findUnique present in resolveItem
✓ articleId in upsert create + update + return shape (9 occurrences)
```

## Self-Check: PASSED

- `apps/api/src/orders/orders.service.ts` — exists, ConfigService removed, 8x settings.getNum, ARTICLE branch present
- `apps/api/src/orders/orders.module.ts` — exists, SettingsModule imported
- `apps/api/src/orders/dto/add-item.dto.ts` — exists, days optional, articleId added
- `apps/api/prisma/seed.ts` — exists, ARTICLE_PRICE + EVENT_MAX_DAYS present
- Commit `d454e65` — exists in git log
