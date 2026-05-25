---
phase: 12-suscripciones-y-carrito-v2
plan: "03"
subsystem: subscriptions, orders, payments
tags: [subscriptions, credits, cart, discounts, atomic-transaction, nestjs, prisma]
dependency_graph:
  requires:
    - 12-suscripciones-y-carrito-v2/12-01
    - 12-suscripciones-y-carrito-v2/12-02
  provides:
    - COM-03: credits in cart (EVENT free with sub + SPOT/HERO discounted)
    - D-05/D-06/D-07/D-08 logic
  affects:
    - OrdersService.addItem (days validation order changed)
    - OrdersService.resolveItem (credit + discount logic)
    - PaymentsService.activateOrderItems (refactored to $transaction)
tech_stack:
  added: []
  patterns:
    - "Credit detection before days validation in addItem to support credit-exempt EVENT"
    - "Preloaded sub threaded through resolveItem to avoid redundant DB calls"
    - "PrismaPromise[] ops array for $transaction composition"
    - "Signal-via-zero: unitPrice===0 && subtotal===0 as credit-applied sentinel"
key_files:
  created: []
  modified:
    - apps/api/src/subscriptions/subscriptions.service.ts
    - apps/api/src/orders/orders.module.ts
    - apps/api/src/orders/orders.service.ts
    - apps/api/src/payments/payments.module.ts
    - apps/api/src/payments/payments.service.ts
decisions:
  - "Days cap for credit: Math.min(45, daysUntilCycleEnd, daysUntilEventExpiration?) — D-05 with 3 caps; expirationDate cap omitted when null (organizer hasn't set date yet)"
  - "Credit detection in activateOrderItems: unitPrice===0 && subtotal===0 (signal-via-zero) — no schema change needed, robust sentinel"
  - "Descuento SPOT/HERO no se persiste como columna separada: frontend deriva via comparación con GET /settings/public (SPOT_PRICE_PER_DAY, HERO_PRICE_PER_DAY)"
  - "PaymentsService accesses subscription via SubscriptionsService.getActiveForOwner, not prisma.subscription.findFirst directly — cross-module consistency with OrdersService"
  - "Edge case: si el ciclo expira entre add-to-cart y checkout, creditConsumed > 0 pero getActiveForOwner devuelve null — increment se omite defensivamente (no bloquea el pago)"
  - "Days validation reordered in addItem: getActiveSub called BEFORE needsDays check so EVENT with credit skips days requirement (frontend no envía days en ese caso)"
metrics:
  duration: "~25 minutes"
  completed_date: "2026-05-25"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 5
---

# Phase 12 Plan 03: Subscription Credits in Cart + SPOT/HERO Discounts + Atomic creditsUsed Increment Summary

**One-liner:** Créditos de suscripción aplicados en carrito para EVENT (price=0, days capped), descuentos para SPOT/HERO suscriptores, e incremento atómico de creditsUsed vía prisma.$transaction al confirmar pago.

## What Was Built

### Task 1: SubscriptionsService.getActiveForOwner + OrdersModule import

Added `getActiveForOwner(userId, orgId)` to `SubscriptionsService` — the single method that encapsulates the "CANCELLED with future cycleEnd still valid" rule (D-09). Returns null if no sub or cycle expired.

`OrdersModule` now imports `SubscriptionsModule` so `OrdersService` can inject `SubscriptionsService`.

### Task 2: OrdersService — Credit in EVENT, Discount in SPOT/HERO

**Critical fix (auto-detected per deviation rules):** The original `addItem` validated `days >= 1` before calling `resolveItem`. When a subscriber adds an EVENT, the frontend doesn't send `days` (D-05: selector disappears). The validation would throw before credit detection. Fixed by moving `getActiveSub` call before the days validation, making days optional for EVENT-with-credit.

Key changes:
- Private `getActiveSub(user, orgContext)` helper that delegates to `SubscriptionsService.getActiveForOwner`
- `resolveItem` signature extended with `preloadedSub` parameter to avoid redundant DB calls
- **EVENT branch:** If `sub && creditsUsed < creditsTotal` → `unitPrice=0, creditApplied=true` (D-05); else normal price (D-06)
- **SPOT branch:** If sub exists → `unitPrice = Math.round(SPOT_PRICE_PER_DAY * (1 - SUBSCRIPTION_SPOT_DISCOUNT/100))` (D-07)
- **HERO branch:** Analogous to SPOT with `HERO_PRICE_PER_DAY` and `SUBSCRIPTION_HERO_DISCOUNT` (D-07)
- **ARTICLE branch:** Unchanged, `creditApplied: false`
- `resolveItem` returns `creditApplied: boolean` in all branches
- `addItem`: when `creditApplied===true`, calculates `days = Math.min(45, daysUntilCycleEnd, [daysUntilEventExpiration])` — the 3 caps of D-05
- `expirationDate` cap uses a separate `prisma.event.findUnique` (select only `expirationDate`) and is omitted if null

### Task 3: PaymentsService — $transaction + creditsUsed increment

`PaymentsModule` now imports `SubscriptionsModule`.

`PaymentsService.activateOrderItems` refactored from `Promise.all(updates)` to `prisma.$transaction(ops)`:
- Builds `Prisma.PrismaPromise<unknown>[]` array by iterating items
- `SUBSCRIPTION` items are skipped (defensive guard — activation handled in Plan 12-04)
- `ARTICLE` items are activated to `PENDING_MODERATION`
- EVENT/SPOT/HERO activation unchanged
- If any EVENT has `unitPrice===0 && subtotal===0`, `creditConsumed += 1`
- After loop: if `creditConsumed > 0`, calls `this.subscriptions.getActiveForOwner(...)` and pushes `prisma.subscription.update({ data: { creditsUsed: { increment: creditConsumed } } })` into the same ops array
- All ops execute atomically via `prisma.$transaction(ops)`
- `handleTransbankCallback` order include now has `article: true`

## Decisions Made

### Days cap for EVENT with credit (D-05)

`days = Math.min(45, daysUntilCycleEnd, [daysUntilEventExpiration])`

- Cap de 45: Design Brief §3.13 especifica "45 días fijos"
- Cap cycleEnd: los créditos no deben otorgar cobertura más allá del ciclo activo (D-12)
- Cap expirationDate: si el organizador ya fijó la fecha límite del evento y cae antes de 45 días, no tiene sentido cobrar más días de lo que el evento dura
- Si `expirationDate` es null (organizador no la fijó), ese cap no aplica

### Signal-via-zero para detectar crédito en PaymentsService

`activateOrderItems` detecta que un EVENT usó crédito mediante `item.unitPrice === 0 && item.subtotal === 0`. Alternativas descartadas:
- Columna `creditApplied` en `OrderItem` — requeriría migración de schema (Rule 4 risk)
- Pasar flag vía parámetro — PaymentsService ya recibe la orden de DB; el signal-via-zero no requiere cambios de interfaz

Es una señal robusta: un EVENT legítimo con precio base = 0 requeriría que su categoría tenga `pricePerDay = 0`, lo cual no ocurre en producción. Documentado en SUMMARY para que futuros desarrolladores no lo eliminen.

### Descuento sin columna separada en OrderItem

El Design Brief §3.13 especifica que el descuento se muestra como línea separada en el frontend. El modelo `OrderItem` no tiene columna `discountAmount` — el frontend calcula el descuento comparando `unitPrice` del ítem con el precio base de `GET /settings/public` (`SPOT_PRICE_PER_DAY`, `HERO_PRICE_PER_DAY`). Agregar la columna se difiere: no es necesario para el modelo de negocio v2 y requeriría migración.

### Consistencia cross-módulo: SubscriptionsService.getActiveForOwner

PaymentsService accede a la sub activa vía `this.subscriptions.getActiveForOwner(...)` en lugar de una query Prisma directa. Razones:
1. Encapsula la regla de negocio "CANCELLED con cycleEnd futuro sigue válida" (D-09) en un único lugar
2. Si la regla cambia, cambia en `SubscriptionsService` y ambos servicios se benefician automáticamente
3. Mantiene paridad de patrón con `OrdersService.getActiveSub`

### Reorden de validación de días (desviación auto-corregida)

La validación original `if (needsDays && days < 1)` en `addItem` corría antes de detectar si había crédito. Con crédito activo, el frontend no envía `days` — el validador lanzaba `BadRequestException` antes de llegar al branch de crédito. Corrección: `getActiveSub` se llama primero; `hasCredit` determina si EVENT está exento de la validación de días.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Days validation order in addItem blocked EVENT-with-credit flow**
- **Found during:** Task 2 (pre-implementation analysis via advisor)
- **Issue:** The `needsDays` check ran before `resolveItem`, meaning `dto.days === undefined` threw before credit detection. Frontend sends no `days` for credited EVENT (Design Brief §3.13).
- **Fix:** Moved `getActiveSub` call before the days validation; `hasCredit` makes days optional for EVENT when credit applies. Sub is then threaded as `preloadedSub` into `resolveItem` to avoid an extra DB call.
- **Files modified:** `apps/api/src/orders/orders.service.ts`
- **Commit:** 6dcf82c

## Known Stubs

None — all logic is wired. The discount display as a separate line is a frontend concern; the backend correctly stores the discounted `unitPrice`.

## Self-Check: PASSED

- `apps/api/src/subscriptions/subscriptions.service.ts` — `getActiveForOwner` method present
- `apps/api/src/orders/orders.module.ts` — `SubscriptionsModule` in imports
- `apps/api/src/orders/orders.service.ts` — `getActiveSub` helper, `creditApplied` in resolveItem, `Math.min(...caps)` for days, `SUBSCRIPTION_SPOT_DISCOUNT`, `SUBSCRIPTION_HERO_DISCOUNT`
- `apps/api/src/payments/payments.module.ts` — `SubscriptionsModule` in imports
- `apps/api/src/payments/payments.service.ts` — `$transaction`, `creditsUsed: { increment }`, `subscriptions.getActiveForOwner`, `article: true` include, `OrderItemType.SUBSCRIPTION` guard
- Commit `6dcf82c` exists in git log
- `pnpm tsc --noEmit` exit 0
- `pnpm build` exit 0
