---
phase: 21-dynamic-content-checkout
plan: "05"
subsystem: website/cart
tags: [cart, orders, api, payments, checkout]
dependency_graph:
  requires: [21-01]
  provides: [21-06]
  affects: [apps/website/app/(site)/carrito/CartView.tsx]
tech_stack:
  added: []
  patterns:
    - signal-via-zero credit detection (unitPrice===0 && subtotal===0)
    - optimistic local state + server reconciliation on debounced PUT
    - discount row gated on unitPrice < base price from settingsPublic
key_files:
  created: []
  modified:
    - apps/website/app/(site)/carrito/CartView.tsx
decisions:
  - "Discount row approach: fetch SPOT_PRICE_PER_DAY + HERO_PRICE_PER_DAY from api.settingsPublic(), compute savedAmount = sum((basePrice - unitPrice) * days) for spot/hero items where unitPrice < basePrice; render .sum-row.dis only when savedAmount > 0 — purely informational, order.total is authoritative"
  - "Day adjuster clamp [10, 30] applies to SPOT and HERO only; EVENT items with credit flag get no adjuster per design"
  - "Debounce: 400ms per-item setTimeout stored in useRef map, cleared on each ± click; optimistic localDays updated immediately, reconciled with server order on PUT response or reverted on error"
  - "Thumbnail resolution: spot?.image > hero?.image > event?.poster > event?.banner; gradient placeholder when all null"
  - "Filter SUBSCRIPTION items from visibleItems before render — both cart-grid and cart-side sum-rows"
  - "Pagar button disabled placeholder — payment trigger deferred to 21-06"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-28T20:54:00Z"
  tasks_completed: 2
  files_modified: 1
---

# Phase 21 Plan 05: Cart API Integration Summary

CartView fully rewritten to load and manage the real DRAFT order via the backend API, replacing all localStorage + mock data with live API calls.

## What Was Built

**CartView** (`apps/website/app/(site)/carrito/CartView.tsx`) — 380 lines, rewired from localStorage/mock to real order API.

### Core behaviors implemented

- **Auth gate:** `useUser()` provides `{ user, token, ready }`; when `!ready` → loading state; when `ready && !user` → `router.replace("/login?returnTo=/carrito")`
- **Load order:** `api.ordersDraft(token)` on mount after auth resolves; `loading` state shown until done
- **Item rendering:** Type→label map `EVENT→EVENTO, SPOT→AVISO, HERO→PORTADA`; credit detected via signal-via-zero (`type==='EVENT' && unitPrice===0 && subtotal===0`); credit class adds "EVENTO · CRÉDITO DE SUSCRIPCIÓN" label, $0 price, "CRÉDITO" unit, no day adjuster
- **Thumbnails:** `imageUrl(spot?.image ?? hero?.image ?? event?.poster ?? event?.banner)` with gradient fallback div
- **Day adjuster:** ± buttons clamped to [10, 30]; 400ms debounce via `useRef` map; optimistic `localDays` state updated immediately, reconciled with full server `ApiOrder` on PUT response
- **Remove:** `api.removeOrderItem()` with `busy` guard per-type to prevent double-clicks; toast on error
- **Summary sidebar:** One `.sum-row` per visible item, `.sum-row.dis` discount row (conditional), `.sum-row.tot` total from `order.total`
- **Discount row:** Fetches `SPOT_PRICE_PER_DAY` / `HERO_PRICE_PER_DAY` from `api.settingsPublic()`; renders `sum-row dis` only when `savedAmount > 0` — difference between base price and discounted `unitPrice` multiplied by days
- **Gateway selector:** WebPay Plus active (.on), Mercado Pago + Flow .coming (disabled) per design
- **Pagar button:** Disabled placeholder, `order.total` displayed; payment trigger wired in 21-06

## Discount Row Approach

The backend already bakes the subscriber discount into `unitPrice` when `resolveItem` is called (SUBSCRIPTION_SPOT/HERO_DISCOUNT from settings). There is no separate discount field on the order.

**Approach chosen:** Detect discount by comparing each spot/hero item's `unitPrice` against the base `SPOT_PRICE_PER_DAY` / `HERO_PRICE_PER_DAY` from `api.settingsPublic()`. If `unitPrice < basePrice`, the difference proves a discount was applied. `savedAmount = sum((base - unitPrice) * days)` across all discounted items. The `.sum-row.dis` row renders only when `savedAmount > 0`. This requires one extra `settingsPublic()` fetch on mount; failure is silently swallowed (discount row simply doesn't appear) — `order.total` remains authoritative for the Pagar amount regardless.

## Debounce Implementation

Per-item debounce uses a `useRef<Record<string, ReturnType<typeof setTimeout>>>` map keyed by item `type`. Each ± click:
1. Updates `localDays` optimistically (immediate UI feedback)
2. Clears any existing timer for that item type
3. Sets a 400ms timer that calls `api.addOrderItem()` with the clamped day count
4. On success: replaces entire `order` state with server response, reconciles `localDays` from server data
5. On error: reverts `localDays[type]` to `item.days` from last known server state + toast

## ApiOrderItem Fields Consumed

| Purpose | Field path |
|---------|-----------|
| Title | `spot?.title ?? hero?.title ?? event?.title ?? "Producto"` |
| Thumbnail | `spot?.image ?? hero?.image ?? event?.poster ?? event?.banner` |
| Type label | `type` → LABEL map |
| Credit detection | `type==='EVENT' && unitPrice===0 && subtotal===0` |
| Price display | `subtotal` (total for item), `unitPrice` (per-day rate) |
| Day count | `days` (server authoritative), `localDays[type]` (optimistic) |
| IDs for PUT | `spotId`, `heroId`, `eventId` |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 + 2 | `1fbfd0f` | feat(21-05): rewrite CartView — load draft order, render real items per design |

## Deviations from Plan

None — plan executed as written. Both tasks implemented in a single cohesive rewrite of CartView.tsx since they operate on the same file and the plan's actions are naturally sequential within one component.

## Known Stubs

- **Pagar button** (`apps/website/app/(site)/carrito/CartView.tsx:~316`): `disabled` placeholder — wired in plan 21-06. The button displays `order.total` correctly; it just does not trigger payment yet.

## Self-Check: PASSED

- [x] `apps/website/app/(site)/carrito/CartView.tsx` exists (380 lines, > 120 minimum)
- [x] Commit `1fbfd0f` exists in git log
- [x] No MOCK_ITEMS or kb-cart in CartView
- [x] `ordersDraft`, `removeOrderItem`, `addOrderItem`, `sum-row dis` all present
- [x] No CartView-specific TypeScript errors (other pre-existing errors in HomeView/CreateProductView are out of scope)
