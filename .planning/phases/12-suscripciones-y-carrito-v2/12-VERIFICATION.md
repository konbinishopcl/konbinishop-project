---
phase: 12-suscripciones-y-carrito-v2
verified: 2026-05-25T00:00:00Z
status: passed
score: 17/17 must-haves verified
re_verification: false
---

# Phase 12: Suscripciones y Carrito v2 — Verification Report

**Phase Goal:** Implementar suscripciones mensuales con créditos de eventos, descuentos en spots/heroes para suscriptores, y carrito actualizado con tipo ARTICLE y lógica de créditos.
**Verified:** 2026-05-25
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | POST /subscriptions crea Order con SUBSCRIPTION item, devuelve redirectUrl (no Subscription row aún) | VERIFIED | `subscriptions.service.ts:37-105` — crea order con item `type='SUBSCRIPTION'`, llama `gatewayFactory.initiate`, NO crea fila Subscription |
| 2  | POST /subscriptions con sub ACTIVE existente devuelve 409 | VERIFIED | `subscriptions.service.ts:45-50` — `ConflictException('Ya tienes una suscripción activa')` |
| 3  | GET /subscriptions/me devuelve `{active: false}` o `{active, status, creditsUsed, creditsTotal, cycleEnd}` | VERIFIED | `subscriptions.service.ts:111-128` — ambas ramas implementadas |
| 4  | DELETE /subscriptions/me marca `cancelledAt` + `status=CANCELLED` (D-09) | VERIFIED | `subscriptions.service.ts:134-163` — `status: SubscriptionStatus.CANCELLED, cancelledAt: new Date()` |
| 5  | GET /subscriptions (admin) devuelve lista paginada | VERIFIED | `subscriptions.service.ts:302-328` — paginación con `skip`/`take`, `include user + org`, retorna `{items, total, page, limit, totalPages}` |
| 6  | POST /subscriptions/confirm crea Subscription + marca Order PAID en `$transaction` | VERIFIED | `subscriptions.service.ts:242-257` — `prisma.$transaction([order.update(PAID), subscription.create(...)])` |
| 7  | GET /subscriptions/confirm con TBK_TOKEN (abort) redirige a `/cuenta/suscripcion?status=aborted` | VERIFIED | `subscriptions.service.ts:175-178` + `subscriptions.controller.ts:68-81` — `@Get('confirm')` público, retorna `{url, statusCode: 302}` |
| 8  | Callback duplicado para Order ya PAID es idempotente | VERIFIED | `subscriptions.service.ts:208-214` — si `order.status === 'PAID'` y Subscription ya existe, devuelve URL de success sin duplicar |
| 9  | `SUBSCRIPTION_ACTIVATED` emitida fire-and-forget | VERIFIED | `subscriptions.service.ts:266-276` — `this.notifications.create({type: 'SUBSCRIPTION_ACTIVATED', ...})` sin await |
| 10 | ARTICLE en carrito: `days=0`, `unitPrice=ARTICLE_PRICE`, `subtotal=ARTICLE_PRICE` | VERIFIED | `orders.service.ts:173-183` — branch ARTICLE en `resolveItem`; `days=0` forzado en `addItem:130-131`; `subtotal = unitPrice` en línea 136 |
| 11 | EVENT/SPOT/HERO sin days retorna 400 | VERIFIED* | `orders.service.ts:93-100` — validación `needsDays && days < 1` → `BadRequestException`. *Excepción deliberada (12-03): EVENT con crédito activo exime la validación (días calculados via `Math.min` caps) |
| 12 | EVENT con sub activa + créditos: `unitPrice=0`, `days=Math.min(45, daysUntilCycleEnd, daysUntilEventExpiration?)`, `subtotal=0` | VERIFIED | `orders.service.ts:114-129` — 3 caps implementados; `expirationDate` omitido si null |
| 13 | SPOT/HERO con sub activa: `unitPrice = base * (1 - discount/100)` | VERIFIED | `orders.service.ts:194-200` (SPOT), `213-219` (HERO) — leen `SUBSCRIPTION_SPOT_DISCOUNT` / `SUBSCRIPTION_HERO_DISCOUNT` desde SettingsService |
| 14 | `activateOrderItems` usa `prisma.$transaction` con `creditsUsed` increment atómico para EVENT con crédito | VERIFIED | `payments.service.ts:179-254` — acumula `ops[]`, detecta `unitPrice===0 && subtotal===0` para incrementar, llama `prisma.$transaction(ops)` |
| 15 | `SubscriptionsService.getActiveForOwner` usado (no query Prisma directa) en `PaymentsService` | VERIFIED | `payments.service.ts:239` — `this.subscriptions.getActiveForOwner(...)`. Confirmado: 0 ocurrencias de `prisma.subscription.findFirst` en `payments.service.ts` |
| 16 | `pnpm tsc --noEmit` exit 0 | VERIFIED | Ejecutado — sin errores `error TS` |
| 17 | `pnpm build` exit 0 | VERIFIED | Ejecutado — build completado sin errores |

**Score:** 17/17 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/subscriptions/subscriptions.service.ts` | create, findMine, cancelMine, findAll, handleConfirmCallback, getActiveForOwner | VERIFIED | 329 líneas, todos los métodos presentes |
| `apps/api/src/subscriptions/subscriptions.controller.ts` | POST /, GET /me, DELETE /me, GET /, GET confirm, POST confirm | VERIFIED | 6 endpoints, guards a nivel de método |
| `apps/api/src/subscriptions/subscriptions.module.ts` | `exports: [SubscriptionsService]` | VERIFIED | Línea 14: `exports: [SubscriptionsService]` |
| `apps/api/src/orders/orders.service.ts` | ARTICLE branch + SettingsService + crédito/descuento lógica | VERIFIED | 318 líneas, ConfigService eliminado |
| `apps/api/src/orders/dto/add-item.dto.ts` | ARTICLE + SUBSCRIPTION en enum, days opcional | VERIFIED | 5 tipos en enum, `days?: number` con `@IsOptional @Min(0)` |
| `apps/api/src/payments/payments.service.ts` | `$transaction` + `creditsUsed` increment | VERIFIED | `activateOrderItems` con `Prisma.PrismaPromise[]` |
| `apps/api/prisma/schema.prisma` | `SUBSCRIPTION` en `OrderItemType` | VERIFIED | Línea 299: `SUBSCRIPTION` |
| `apps/api/prisma/seed.ts` | `ARTICLE_PRICE`, `EVENT_MAX_DAYS` | VERIFIED | Líneas 673-674: ambas claves con valores `'5000'` y `'60'` |
| `.planning/REQUIREMENTS.md` | COM-01..04 documentados | VERIFIED | Sección "Comercio: Suscripciones y Carrito v2 (Phase 12)" con los 4 IDs |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SubscriptionsService.create` | `GatewayFactory.initiate` | `gatewayFactory.get(gateway).initiate(...)` | WIRED | `subscriptions.service.ts:90-91` |
| `SubscriptionsModule` | `AppModule.imports` | `app.module.ts` | WIRED | `app.module.ts:33,63` |
| `OrdersService.resolveItem (EVENT)` | `SubscriptionsService.getActiveForOwner` | `getActiveSub` helper → `subscriptions.getActiveForOwner` | WIRED | `orders.service.ts:44-48, 236` |
| `OrdersService.resolveItem (SPOT/HERO)` | `SettingsService.getNum (SUBSCRIPTION_*_DISCOUNT)` | directamente en branch | WIRED | `orders.service.ts:198, 217` |
| `PaymentsService.activateOrderItems` | `prisma.$transaction` + `creditsUsed increment` | `ops[]` con `creditsUsed: {increment: creditConsumed}` | WIRED | `payments.service.ts:244-254` |
| `SubscriptionsService.getActiveForOwner` | `PaymentsService` (cross-módulo) | `SubscriptionsModule` importado en `PaymentsModule` | WIRED | `payments.module.ts:4,9` |
| `SubscriptionsService.handleConfirmCallback` | `GatewayFactory.confirm + prisma.$transaction` | confirm → `$transaction([order.update, subscription.create])` | WIRED | `subscriptions.service.ts:224-257` |
| `SubscriptionsService.handleConfirmCallback` | `NotificationsService.create` (SUBSCRIPTION_ACTIVATED) | fire-and-forget, no await | WIRED | `subscriptions.service.ts:266` |
| `SubscriptionsController.confirm{Post,Get}` | `SubscriptionsService.handleConfirmCallback` | `@Post('confirm')` + `@Get('confirm')` sin guards | WIRED | `subscriptions.controller.ts:42-81` |

---

### Requirements Coverage

| Requirement | Source Plan | Description (resumen) | Status |
|-------------|-------------|----------------------|--------|
| COM-01 | 12-01 | CRUD suscripciones: POST/GET-me/DELETE-me/GET-admin, SUBSCRIPTION en OrderItemType, re-suscripción, 409 si ACTIVE | SATISFIED |
| COM-02 | 12-02 | ARTICLE operativo en carrito, days opcional, OrdersService→SettingsService, seed ARTICLE_PRICE/EVENT_MAX_DAYS | SATISFIED |
| COM-03 | 12-03 | Créditos en EVENT, descuentos SPOT/HERO, creditsUsed increment atómico en $transaction | SATISFIED |
| COM-04 | 12-04 | Callback /subscriptions/confirm, $transaction Order=PAID + Subscription.create, SUBSCRIPTION_ACTIVATED, idempotencia | SATISFIED |

---

### Anti-Patterns Found

No se encontraron TODO/FIXME/PLACEHOLDER ni implementaciones stub en los archivos modificados del phase. Scan ejecutado sobre: `subscriptions.service.ts`, `subscriptions.controller.ts`, `orders.service.ts`, `payments.service.ts`, `add-item.dto.ts`.

**Nota de deferred explícito (Info — no bloqueante):**

| Archivo | Líneas | Patrón | Severidad | Impacto |
|---------|--------|--------|-----------|---------|
| `payments.service.ts` | 258, 268 | `ConfigService` para `SPOT_MAX_ACTIVE`/`HERO_MAX_ACTIVE` en `assertSpotQuota`/`assertHeroQuota` | Info | Plan 12-02 documentó explícitamente este deferral: "la migración de ConfigService allí queda fuera de scope". Los valores tienen fallback hardcoded (`|| 10`, `|| 5`) que coinciden con los defaults del seed. No impacta el objetivo del phase. |

---

### Notas técnicas

**Atomicidad en `PaymentsService.handleTransbankCallback`:** El `$transaction` en `activateOrderItems` cubre las actualizaciones de ítems + el incremento de `creditsUsed`. La actualización `Order→PAID` ocurre en una operación separada posterior (líneas 130-134). Esto es el patrón preexistente; el plan 12-03 D-08 solo requería atomicidad para el par creditsUsed+activaciones, no para el cambio de estado de la Order.

**Excepción deliberada en validación de days (truth #11):** `orders.service.ts:89-100` — la validación `needsDays && days < 1 → 400` tiene una excepción: cuando `type === EVENT` y el usuario tiene crédito activo, `needsDays` se evalúa como `false` y los días se calculan internamente por el service con `Math.min(45, daysUntilCycleEnd, daysUntilEventExpiration?)`. Este es el comportamiento correcto según COM-03 / D-05.

---

### Human Verification Required

No hay ítems de verificación humana obligatoria. Los smoke tests en los planes están marcados como "opcional, no bloqueante". El objetivo del phase es verificable programáticamente.

---

## Gaps Summary

No se encontraron gaps. Todos los 17 checklist items del plan están implementados y verificados en el código.

---

_Verified: 2026-05-25_
_Verifier: Claude (gsd-verifier)_
