---
phase: 08-schema-v2
plan: "04"
subsystem: database-schema
tags: [prisma, mysql, schema, settings, notifications, subscriptions, transfers, saved-events]
dependency_graph:
  requires: ["08-03"]
  provides: ["SCH-04", "settings-model", "notification-model", "savedevent-model", "subscription-model", "transfer-model"]
  affects: ["phase-09", "phase-11", "phase-12", "phase-13"]
tech_stack:
  added: []
  patterns: ["key-value settings table", "polymorphic relation via enum+int", "idempotent upsert seed with update:{}"]
key_files:
  created:
    - apps/api/prisma/migrations/20260524234837_sch04_core_systems/migration.sql
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/prisma/seed.ts
decisions:
  - "KEY #5 locked: env vars de precios permanecen en código en Phase 8; migración env→Settings es scope de Phase 11"
  - "Settings.upsert con update:{} en seed: el valor admin-modificado no se sobreescribe en re-runs del seed"
  - "Transfer usa itemType enum + itemId Int sin FKs múltiples (patrón replicado de AuditLog)"
  - "Subscription.userId y orgId son @unique: máximo una suscripción activa por user y por org"
  - "XOR userId/orgId en Notification y Subscription se valida en service layer (MySQL no soporta CHECK sobre joins)"
metrics:
  duration_minutes: 10
  completed_date: "2026-05-24"
  tasks_completed: 2
  files_modified: 3
---

# Phase 8 Plan 04: v2 Core Systems Schema Summary

5 modelos transversales de v2 (Settings key-value, Notification, SavedEvent, Subscription, Transfer polimórfico) + 4 enums + seed de 12 defaults idempotente. Migración `sch04_core_systems` aplicada. `pnpm prisma validate`, `pnpm tsc --noEmit` y `pnpm prisma:seed` pasan sin errores.

## Tasks Completed

| # | Name | Commit |
|---|------|--------|
| 1 | Agregar Settings + Notification + SavedEvent + Subscription + Transfer al schema | `76641d0` |
| 2 | Seed de defaults de Settings (12 entries) | `5f4773a` |

## Models Added

### Settings
```prisma
model Settings {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```
Tabla key-value para configuración del sistema. En Phase 8 existe en DB pero el código sigue leyendo env vars — migración diferida a Phase 11.

### Notification
```prisma
model Notification {
  id        Int              @id @default(autoincrement())
  type      NotificationType
  title     String
  body      String?          @db.Text
  payload   Json             @default("{}")
  read      Boolean          @default(false)
  user      User?            @relation("UserNotifications", ...)
  userId    Int?
  org       User?            @relation("OrgNotifications", ...)
  orgId     Int?
  createdAt DateTime         @default(now())
  @@index([userId, read]), @@index([orgId, read]), @@index([createdAt])
}
```

### SavedEvent
```prisma
model SavedEvent {
  userId    Int
  eventId   Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([userId, eventId])
}
```
Join explícita con constraint único compuesto (sin duplicados por user+event).

### Subscription
```prisma
model Subscription {
  id              Int                @id @default(autoincrement())
  status          SubscriptionStatus @default(ACTIVE)
  user            User?              @relation("UserSubscription", ...)
  userId          Int?               @unique
  org             User?              @relation("OrgSubscription", ...)
  orgId           Int?               @unique
  cycleStart      DateTime
  cycleEnd        DateTime
  creditsUsed     Int                @default(0)
  creditsTotal    Int                @default(10)
  cancelledAt     DateTime?
  createdAt/updatedAt
}
```
Un máximo de una suscripción activa por user y por org (via @unique).

### Transfer (polymorphic)
```prisma
model Transfer {
  id          Int              @id @default(autoincrement())
  itemType    TransferItemType  // EVENT | SPOT | HERO | ARTICLE
  itemId      Int               // sin FK explícita — patrón AuditLog
  fromUser    User             @relation("TransferFrom", ...)
  fromUserId  Int
  toOrg       User             @relation("TransferTo", ...)
  toOrgId     Int
  status      TransferStatus   @default(PENDING)
  reason      String?
  resolvedBy  Int?
  resolvedAt  DateTime?
}
```

## Enums Added

| Enum | Values |
|------|--------|
| `NotificationType` | EVENT_APPROVED, EVENT_REJECTED, EVENT_BANNED, SPOT_APPROVED, SPOT_REJECTED, SPOT_BANNED, HERO_APPROVED, HERO_REJECTED, HERO_BANNED, ARTICLE_APPROVED, ARTICLE_REJECTED, ARTICLE_BANNED, ORG_INVITATION, TRANSFER_REQUEST, TRANSFER_ACCEPTED, TRANSFER_REJECTED, SUBSCRIPTION_ACTIVATED, SUBSCRIPTION_CANCELLED, SYSTEM |
| `SubscriptionStatus` | ACTIVE, CANCELLED, EXPIRED |
| `TransferStatus` | PENDING, ACCEPTED, REJECTED, AUTO_ACCEPTED, ADMIN_FORCED |
| `TransferItemType` | EVENT, SPOT, HERO, ARTICLE |

## Inverse Relations Added

### User model (7 new relations)
```prisma
notifications     Notification[] @relation("UserNotifications")
orgNotifications  Notification[] @relation("OrgNotifications")
savedEvents       SavedEvent[]
subscription      Subscription?  @relation("UserSubscription")
orgSubscription   Subscription?  @relation("OrgSubscription")
transfersFrom     Transfer[]     @relation("TransferFrom")
transfersTo       Transfer[]     @relation("TransferTo")
```

### Event model (1 new relation)
```prisma
savedBy   SavedEvent[]
```

## Settings Defaults (12 keys)

| Key | Value |
|-----|-------|
| `SPOT_PRICE_PER_DAY` | `8000` |
| `SPOT_MIN_DAYS` | `10` |
| `SPOT_MAX_DAYS` | `30` |
| `SPOT_MAX_ACTIVE` | `12` |
| `HERO_PRICE_PER_DAY` | `15000` |
| `HERO_MIN_DAYS` | `10` |
| `HERO_MAX_DAYS` | `30` |
| `HERO_MAX_ACTIVE` | `5` |
| `SUBSCRIPTION_PRICE` | `9990` |
| `SUBSCRIPTION_CREDITS` | `10` |
| `SUBSCRIPTION_SPOT_DISCOUNT` | `20` |
| `SUBSCRIPTION_HERO_DISCOUNT` | `20` |

Seed usa `update: {}` — si un admin cambió el valor en DB, el seed NO lo sobreescribe.

## Decisions Made

1. **KEY #5 locked — env vars permanecen en Phase 8:** Los servicios de spots, heroes y orders siguen leyendo de `process.env`. La migración a leer de `Settings` es responsabilidad de Phase 11. La tabla existe pero el código la ignora hasta entonces.

2. **Settings.upsert con `update: {}`:** El valor que el admin haya seteado en producción no se pierde al correr el seed. El seed solo garantiza que la clave exista con su valor default inicial.

3. **Transfer polymorphic sin FK al ítem:** `itemType enum + itemId Int` sin FKs múltiples (un FK por cada modelo destino). Mismo patrón que `AuditLog.entity/entityId`. Validación de existencia del ítem en service layer.

4. **XOR userId/orgId validado en service layer:** MySQL no puede enforcar CHECK sobre campos de tablas relacionadas. Notification y Subscription permiten ambos null a nivel de DB; el service garantiza que exactamente uno esté presente.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. Settings table exists and is populated. Code still reads env vars (intentional per KEY #5 decision — Phase 11 will migrate).

## Self-Check: PASSED
