---
phase: 12-suscripciones-y-carrito-v2
plan: "04"
subsystem: subscriptions
tags: [subscriptions, payments, transbank, notifications, callback]
dependency_graph:
  requires:
    - 12-01  # SubscriptionsModule core (create, findMine, cancelMine, findAll)
    - 11-01  # NotificationsService (fire-and-forget)
    - 11-03  # SettingsService (SUBSCRIPTION_CREDITS)
  provides:
    - GET /subscriptions/confirm (Transbank callback público)
    - POST /subscriptions/confirm (Transbank callback público)
    - SubscriptionsService.handleConfirmCallback
    - SUBSCRIPTION_ACTIVATED notification
  affects:
    - SubscriptionsController (guards movidos a nivel de método)
    - SubscriptionsService (nuevo método handleConfirmCallback)
tech_stack:
  added: []
  patterns:
    - Redirect callback con @Redirect() + { url, statusCode: 302 }
    - prisma.$transaction([order.update + subscription.create]) atómico
    - Fire-and-forget notification (void, no await)
    - Guard a nivel de método (no clase) para permitir callbacks públicos
    - Discriminated union para recipient (orgId vs userId) sin ambigüedad TS
key_files:
  created: []
  modified:
    - apps/api/src/subscriptions/subscriptions.service.ts
    - apps/api/src/subscriptions/subscriptions.controller.ts
decisions:
  - "Guards movidos de clase a método (Opción A del plan) — confirm endpoints públicos, los demás mantienen JwtAuthGuard + OrgContextGuard"
  - "recipient tipado como { orgId: number } | { userId: number } para evitar ambigüedad TS con campos nullable de Prisma"
  - "Idempotencia: Order PAID + Subscription existente → retorna success sin duplicar"
metrics:
  duration_minutes: 15
  completed_date: "2026-05-25"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 12 Plan 04: Subscription Payment Callback — SUMMARY

**One-liner:** Callback Transbank `/subscriptions/confirm` (GET+POST) con confirmación atómica vía `prisma.$transaction`, ciclo 30 días con `SUBSCRIPTION_CREDITS` desde Settings, y notificación `SUBSCRIPTION_ACTIVATED` fire-and-forget.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | SubscriptionsService — handleConfirmCallback | f67498c | subscriptions.service.ts |
| 2 | SubscriptionsController — GET/POST /confirm + refactor guards | f67498c | subscriptions.controller.ts |

## Endpoints Expuestos

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /subscriptions/confirm | Público | Callback Transbank (pago exitoso o abortado) |
| GET | /subscriptions/confirm | Público | Callback Transbank (timeout / flujo alternativo) |
| POST | /subscriptions | JWT + OrgContext | Iniciar suscripción (Plan 12-01) |
| GET | /subscriptions/me | JWT + OrgContext | Estado de suscripción (Plan 12-01) |
| DELETE | /subscriptions/me | JWT + OrgContext | Cancelar suscripción (Plan 12-01) |
| GET | /subscriptions | JWT + OrgContext + Roles | Admin: listar suscripciones (Plan 12-01) |

## Decisión: Guards a Nivel de Método (Opción A)

En Plan 12-01, `@UseGuards(JwtAuthGuard, OrgContextGuard)` estaba aplicado a nivel de **clase**. Eso bloqueaba los callbacks de Transbank que llegan sin JWT.

**Solución aplicada:** Se movieron los guards a cada método individual:
- `POST /confirm` y `GET /confirm` → sin guards (públicos)
- `POST /`, `GET /me`, `DELETE /me` → `@UseGuards(JwtAuthGuard, OrgContextGuard)`
- `GET /` → `@UseGuards(JwtAuthGuard, OrgContextGuard, RolesGuard)`

No se requirió `@SetMetadata('isPublic')` ni reflexión en guards.

## Flujo handleConfirmCallback

```
token_ws ausente → redirect /cuenta/suscripcion?status=aborted
Order no encontrado → redirect ?status=not_found
Order sin item SUBSCRIPTION → redirect ?status=invalid
Order PAID + sub existente → redirect ?status=success (idempotencia)
Order en status inesperado → redirect ?status=invalid
pg.confirm() falla → order.status=FAILED, redirect ?status=failed&code=X
pg.confirm() OK →
  prisma.$transaction([
    order.update(PAID),
    subscription.create(ACTIVE, cycleStart, cycleEnd=+30d, creditsTotal, creditsUsed=0)
  ])
  notifications.create(SUBSCRIPTION_ACTIVATED)  // fire-and-forget
  redirect ?status=success
```

## Cierre de Deferral Phase 11-02

Phase 11-02 dejó diferida la notificación `SUBSCRIPTION_ACTIVATED` porque el módulo de suscripciones no existía aún. Este plan cierra ese deferral: la notificación se emite en `handleConfirmCallback` tras crear la `Subscription` row con el ciclo activo y los créditos disponibles.

## Decisiones de Diseño Documentadas

**D-11 (must_have, no task):** Renovación automática fuera del scope — no hay cron job. El ciclo expira por tiempo (`cycleEnd < now`). El frontend detecta la expiración comparando `cycleEnd` con la fecha actual y muestra "Suscripción expirada".

**D-12 (must_have, no task):** Créditos no acumulan entre ciclos. Al crear una nueva `Subscription` tras re-suscripción, `creditsUsed` parte en 0. Los créditos del ciclo anterior se pierden al vencer (Design Brief §3.12).

## Recipient Typing

Para evitar ambigüedad TypeScript con campos nullable de Prisma, `recipient` se tipó como discriminated union:

```typescript
const recipient: { orgId: number } | { userId: number } = order.orgId
  ? { orgId: order.orgId }
  : order.userId
    ? { userId: order.userId }
    : (() => { throw new Error(`Order ${order.id} has no recipient`); })();
```

Esto permite spread limpio en `subscription.create({ data: { ...recipient, ... } })` y en `notifications.create({ ...recipient })`.

## Deviations from Plan

### Auto-applied Improvements

**1. [Rule 2 - Security/Correctness] Recipient typed as discriminated union**
- **Found during:** Task 1
- **Issue:** Plan's `const target = order.orgId ? { orgId: order.orgId } : { userId: order.userId }` produces `{ userId: number | null }` due to Prisma nullable fields, causing TS spread issues in `subscription.create` and `notifications.create`
- **Fix:** Used `{ orgId: number } | { userId: number }` with explicit null guard + throw for impossible case
- **Files modified:** subscriptions.service.ts
- **Commit:** f67498c

## Known Stubs

None — all data is wired from Transbank callback → Prisma → NotificationsService.

## Self-Check: PASSED
