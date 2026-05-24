---
phase: 08-schema-v2
plan: 05
subsystem: database
tags: [prisma, mysql, schema, orders, articles, categories]

# Dependency graph
requires:
  - phase: 08-04
    provides: Settings, Notification, SavedEvent, Subscription, Transfer models + 4 enums
provides:
  - Category v2 with icon, color, minDays, maxDays, order fields
  - OrderItemType ARTICLE (4th purchasable type)
  - OrderItem.articleId optional FK to Article
  - Order.orgId optional FK to User (OrgOrders relation)
  - User↔Order relations explicitly named (UserOrders, OrgOrders)
  - Article.status PublicationStatus + statusReason + userId (ArticleOwner) + orderItems[]
  - Migration 20260524235433_sch05_category_orders_v2
affects: [09-organizaciones, 12-suscripciones-carrito-v2, 13-contenido-avanzado]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Explicit relation naming when multiple relations exist between same two models (Pitfall #6)"
    - "Polymorphic self-referential FK: orgId in Order → User.type=ORGANIZATION enforced in service layer"
    - "Article sponsored flow mirrors Event/Spot/Hero: DRAFT→APPROVED with PublicationStatus enum reuse"

key-files:
  created:
    - apps/api/prisma/migrations/20260524235433_sch05_category_orders_v2/migration.sql
  modified:
    - apps/api/prisma/schema.prisma

key-decisions:
  - "KEY DECISION #4 locked: Article.status absorbed in SCH-05 (not a separate plan). Article v2 fields land here alongside Order/Category changes."
  - "Pitfall #5 locked: @@unique([orderId, type]) stays intact — maximum 1 ARTICLE item per order (same as EVENT, SPOT, HERO). Constraint change is future-phase scope."
  - "Pitfall #6 locked: enforcement of user.type=ORGANIZATION for Order.orgId is service-layer responsibility. MySQL cannot enforce cross-row CHECK constraints."
  - "Relation rename User↔Order: field names unchanged (owner/orders/orgOrders). Only Prisma internal metadata changes. No TS breaks expected."

patterns-established:
  - "Disambiguate multiple relations between same models: always give all relations explicit string names"
  - "OrgOrders pattern: nullable orgId Int? on Order + @relation(OrgOrders) for org-context cart"
  - "ArticleOwner pattern: nullable userId Int? on Article for sponsored content with editorial-null support"

requirements-completed: [SCH-05]

# Metrics
duration: 2min
completed: 2026-05-24
---

# Phase 8 Plan 05: Schema v2 — Category, Orders, Article Summary

**Category gains 5 UI/UX metadata fields; Order adds org-context (OrgOrders); OrderItem supports ARTICLE type with optional FK; Article gains sponsored-content flow (status, owner, orderItems) via PublicationStatus enum reuse; migration sch05_category_orders_v2 applied clean**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-24T23:53:13Z
- **Completed:** 2026-05-24T23:55:17Z
- **Tasks:** 2
- **Files modified:** 2 (schema.prisma + migration)

## Accomplishments
- Category model gains 5 v2 fields: `icon`, `color`, `minDays` (@default(1)), `maxDays` (@default(30)), `order` (@default(0))
- `ARTICLE` added to `OrderItemType` enum; `OrderItem.article` optional FK + `@@index([articleId])`
- Existing unnamed `User↔Order` relation explicitly named `"UserOrders"` on both sides (prerequisite for OrgOrders)
- `Order.orgId Int?` + `User?` @relation("OrgOrders") added for org-context cart; `User.orgOrders` inverse added
- `Article` gains sponsored-content fields: `status PublicationStatus @default(DRAFT)`, `statusReason String?`, `owner User? @relation("ArticleOwner")`, `userId Int?`, `orderItems OrderItem[]`; `User.articles` inverse added
- Migration `20260524235433_sch05_category_orders_v2` applied; `pnpm prisma validate`, `pnpm tsc --noEmit`, `pnpm prisma:seed` all exit 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Category v2 fields** - `931a634` (feat)
2. **Task 2: OrderItemType ARTICLE + OrgOrders + Article v2 + migration** - `285fe74` (feat)

**Plan metadata:** _(pending final docs commit)_

## Files Created/Modified
- `apps/api/prisma/schema.prisma` — Category (5 fields), OrderItemType (ARTICLE), OrderItem (article FK), Order (orgId + UserOrders rename + OrgOrders), User (UserOrders/OrgOrders/ArticleOwner inverses), Article (status/statusReason/owner/userId/orderItems)
- `apps/api/prisma/migrations/20260524235433_sch05_category_orders_v2/migration.sql` — Additive migration (new columns only; relation rename is schema-metadata-only, no DDL change)

## Decisions Made

1. **KEY DECISION #4 locked:** Article.status fields absorbed in SCH-05 rather than a future plan. Article sponsored workflow now fully mirrors Event/Spot/Hero.

2. **Pitfall #5 locked:** `@@unique([orderId, type])` constraint stays intact. One ARTICLE item maximum per order (consistent with EVENT/SPOT/HERO behavior). Breaking this constraint is out of scope for Phase 8.

3. **Pitfall #6 locked:** `Order.orgId` FK points to `User` with no MySQL-level CHECK on `user.type=ORGANIZATION`. Service layer in Phase 9+ is responsible for validating the referenced user is actually an ORGANIZATION.

4. **Relation rename transparency:** `owner` and `orders` field names in TS are unchanged. The rename from unnamed to `"UserOrders"` is Prisma internal metadata only — no migration DDL emitted for the rename, no TS callers broken.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The critical relation-naming pitfall (Pitfall #6) was successfully handled by making all schema edits to `Order`, `User`, and `Article` before running `prisma validate` for the first time, avoiding any intermediate "Ambiguous relation" error.

## Callers Note

- Code using `user.orders` (no discriminator) continues to compile — field name unchanged, only `@relation("UserOrders")` annotation added.
- Code using `order.owner` continues to compile — field name unchanged, only `@relation("UserOrders", ...)` annotation added.
- New fields (`Order.orgId`, `OrderItem.articleId`, `Article.status/userId`) are optional/nullable — no existing inserts/queries break.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema fully supports org-context orders: Phase 9 (Organizations and Transfers) can implement `OrdersService.createOrgOrder(orgId)` with type=ORGANIZATION validation.
- Schema fully supports Article sponsored flow: Phase 13 (Advanced Content) can wire `ArticlesService.createSponsored()` using `status=DRAFT` → payment → `PENDING_MODERATION` → admin approve.
- Phase 12 (Cart v2) can now add ARTICLE items to orders via `OrderItem.articleId`.
- Category UI metadata (icon, color, minDays/maxDays) ready for Phase 2/website frontend consumption.

---
*Phase: 08-schema-v2*
*Completed: 2026-05-24*
