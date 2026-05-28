---
phase: 21-dynamic-content-checkout
plan: "06"
subsystem: payments
tags: [transbank, checkout, webpay, frontend, redirect]
dependency_graph:
  requires: [21-05]
  provides: [PAY-05, PAY-06, PAY-07, PAY-08]
  affects: [carrito, payments]
tech_stack:
  added: []
  patterns: [window.location.href redirect, useEffect client-fetch, use(searchParams)]
key_files:
  modified:
    - apps/api/src/payments/payments.service.ts
    - apps/website/app/(site)/carrito/CartView.tsx
    - apps/website/app/(site)/carrito/exito/page.tsx
    - apps/website/app/(site)/carrito/error/page.tsx
decisions:
  - "checkoutBusy as separate boolean from busy (OrderItemKind) — avoids union type complexity"
  - "exito/page.tsx: client-side fetch via useEffect + useUser() because order needs JWT to fetch; falls back to generic copy on failure"
  - "error/page.tsx: use(searchParams) pattern consistent with exito page; reason/code map inline"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-28T21:00:10Z"
  tasks_completed: 2
  tasks_total: 3
  files_modified: 4
---

# Phase 21 Plan 06: Transbank Checkout Wiring Summary

Complete Transbank WebPay Plus payment flow: Pagar button initiates checkout, backend callback redirects to correct frontend routes, success/error pages show real dynamic data.

## Tasks Completed

### Task 1: Point backend callback redirects at existing frontend routes
**Commit:** bd2131b

Six string substitutions in `handleTransbankCallback`:

| Old path | New path |
|----------|----------|
| `/checkout/failed?reason=aborted` | `/carrito/error?reason=aborted` |
| `/checkout/failed?reason=not_found` | `/carrito/error?reason=not_found` |
| `/checkout/success?orderId=${order.id}` (duplicate-paid) | `/carrito/exito?orderId=${order.id}` |
| `/checkout/failed?reason=invalid_state` | `/carrito/error?reason=invalid_state` |
| `/checkout/failed?orderId=${order.id}&code=${confirmation.responseCode}` | `/carrito/error?orderId=${order.id}&code=${confirmation.responseCode}` |
| `/checkout/success?orderId=${order.id}` (final success) | `/carrito/exito?orderId=${order.id}` |

No activation logic, email send, or order status transitions were touched.

### Task 2: Wire Pagar button + dynamic success/error pages
**Commit:** 2b5d552

**CartView.tsx:**
- Added `checkoutBusy` boolean state (separate from item-level `busy: OrderItemKind | null`)
- Pagar button: `onClick` calls `api.checkout(order.id, "TRANSBANK", token)` then `window.location.href = redirectUrl`
- Button disabled when `checkoutBusy || !!busy || !order || !token`
- Label changes to "Redirigiendo…" during checkout; `toast.error` on failure

**exito/page.tsx:**
- Added `useUser()` for token access
- `useEffect` on mount: calls `api.getOrder(Number(orderId), token)` → stores in `order` state
- Dynamic copy: "Pagaste {formatCLP(order.total)} CLP. Un admin revisará tus N publicaciones…"
- Graceful fallback to generic copy if fetch fails or no token
- All existing layout preserved (green check, profile CTA, services strip, satisfaction form, CTA row)

**error/page.tsx:**
- Added `searchParams` prop + `use(searchParams)` to read `reason`, `code`, `orderId`
- Reason→message mapping:
  - `aborted` → "Cancelaste el pago antes de completarlo. No se cobró nada."
  - `not_found` → "No encontramos la transacción. Intenta nuevamente."
  - `invalid_state` → "Esta orden ya fue procesada o no está lista para pago."
  - `code` present → "Transbank rechazó el pago (código {code}). Tus datos están a salvo — no se cobró nada."
  - default → original generic Transbank message
- Preserved `.thanks-shell` markup and retry CTA row

### Task 3: Verify end-to-end Transbank sandbox payment
**Status:** AWAITING HUMAN VERIFICATION — checkpoint not yet reached

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired from real API responses. The exito page falls back to generic copy (not a stub) when fetch fails, which is intentional defensive behavior.

## Self-Check: PASSED

- [x] `apps/api/src/payments/payments.service.ts` — modified, committed bd2131b
- [x] `apps/website/app/(site)/carrito/CartView.tsx` — modified, committed 2b5d552
- [x] `apps/website/app/(site)/carrito/exito/page.tsx` — modified, committed 2b5d552
- [x] `apps/website/app/(site)/carrito/error/page.tsx` — modified, committed 2b5d552
- [x] No `/checkout/*` paths remain in payments.service.ts
- [x] TypeScript clean for both api and website
