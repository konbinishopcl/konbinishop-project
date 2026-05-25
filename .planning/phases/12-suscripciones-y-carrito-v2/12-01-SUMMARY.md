---
phase: 12-suscripciones-y-carrito-v2
plan: "01"
subsystem: subscriptions
tags: [subscriptions, payments, prisma, nestjs, gateway]
dependency_graph:
  requires: [PaymentsModule (GatewayFactory), SettingsModule, NotificationsModule, AuthModule, TransbankModule]
  provides: [SubscriptionsService (exported), POST /subscriptions, GET /subscriptions/me, DELETE /subscriptions/me, GET /subscriptions]
  affects: [app.module.ts, prisma schema OrderItemType enum, add-item.dto.ts]
tech_stack:
  added: []
  patterns: [GatewayFactory.initiate() reutilizado para Order especial SUBSCRIPTION, delete-then-create para re-suscripción]
key_files:
  created:
    - apps/api/src/subscriptions/subscriptions.service.ts
    - apps/api/src/subscriptions/subscriptions.controller.ts
    - apps/api/src/subscriptions/subscriptions.module.ts
    - apps/api/src/subscriptions/dto/create-subscription.dto.ts
    - apps/api/src/subscriptions/dto/query-subscriptions.dto.ts
    - apps/api/prisma/migrations/20260525140232_com01_subscription_orderitem/migration.sql
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/src/orders/dto/add-item.dto.ts
    - apps/api/src/app.module.ts
    - .planning/REQUIREMENTS.md
decisions:
  - "Re-suscripción: borrar sub CANCELLED/EXPIRED antes de crear nueva Order (sortea @unique en userId/orgId)"
  - "OrderItemType.SUBSCRIPTION agregado a Prisma enum + DTO TS; ARTICLE solo al DTO (ya estaba en Prisma)"
  - "GatewayFactory provisto en SubscriptionsModule (no importar PaymentsModule para evitar acoplamiento)"
  - "Subscription row NO se crea en POST /subscriptions — solo la Order especial. Creación real en Plan 12-04 /confirm callback"
  - "DELETE /me: marca cancelledAt + status=CANCELLED, ciclo vigente hasta cycleEnd (D-09)"
metrics:
  duration: "~30 min"
  completed: "2026-05-25"
  tasks: 3
  files: 9
---

# Phase 12 Plan 01: SubscriptionsModule Core + SUBSCRIPTION Enum Summary

JWT auth + Prisma-backed SubscriptionsModule con CRUD completo (POST/GET-me/DELETE-me/GET-admin), Order especial con item type=SUBSCRIPTION que reutiliza GatewayFactory para initiate(). Migración Prisma agrega SUBSCRIPTION al enum OrderItemType.

## What Was Built

### Task 1: Migración Prisma — OrderItemType.SUBSCRIPTION

- Agregado `SUBSCRIPTION` al enum `OrderItemType` en `schema.prisma` (línea 294-300)
- Migración `20260525140232_com01_subscription_orderitem` generada y aplicada
- Cliente Prisma regenerado con el nuevo valor del enum
- DTO `add-item.dto.ts` actualizado: agrega tanto `ARTICLE = 'ARTICLE'` como `SUBSCRIPTION = 'SUBSCRIPTION'` (ARTICLE ya existía en Prisma pero faltaba en el DTO TS)

### Task 2: SubscriptionsModule Completo

**SubscriptionsService** (4 métodos públicos, >120 líneas):

- `create(user, orgContext, dto)`: resuelve target userId/orgId, valida 409 si ACTIVE, borra sub CANCELLED/EXPIRED para sortear @unique, crea Order especial con item SUBSCRIPTION, llama GatewayFactory.initiate(), actualiza order a PENDING_PAYMENT
- `findMine(user, orgContext)`: devuelve `{ active: false }` o datos completos del ciclo
- `cancelMine(user, orgContext)`: marca cancelledAt + CANCELLED, emite notificación SUBSCRIPTION_CANCELLED fire-and-forget
- `findAll(query)`: lista paginada para ADMIN/SUPER_ADMIN con include user/org

**SubscriptionsController** (4 endpoints):

- `POST /subscriptions` — inicia flujo, devuelve `{ redirectUrl, externalId }`
- `GET /subscriptions/me` — estado de suscripción del caller
- `DELETE /subscriptions/me` — cancela (no termina ciclo)
- `GET /subscriptions` — admin, paginado, filtro por status

**AppModule**: `SubscriptionsModule` registrado en `imports`

### Task 3: REQUIREMENTS.md — COM-01..04

Nueva sección "Comercio: Suscripciones y Carrito v2 (Phase 12)" con definición completa de:
- COM-01: SubscriptionsModule CRUD (este plan)
- COM-02: Orders v2 con ARTICLE y migración a SettingsService (Plan 12-02)
- COM-03: Créditos de suscripción en carrito (Plan 12-03)
- COM-04: Callback de pago /subscriptions/confirm (Plan 12-04)

Tabla Traceability extendida con `COM-01..04 | Phase 12 | Pending`.

## Decisions Made

1. **Re-suscripción (delete-then-create)**: Al detectar sub CANCELLED/EXPIRED existente, se borra con `prisma.subscription.delete()` antes de continuar. El `@unique` en `userId`/`orgId` impide múltiples rows sin importar el status, así que borrar es la única opción limpia. No hay FKs inbound en Subscription.

2. **OrderItemType.SUBSCRIPTION en ambos lados**: El enum TS en `add-item.dto.ts` es la fuente de verdad para validación de DTOs en NestJS. El enum Prisma es la fuente de verdad para la DB. Ambos deben estar sincronizados — ahora incluyen EVENT, SPOT, HERO, ARTICLE, SUBSCRIPTION.

3. **GatewayFactory en SubscriptionsModule (no PaymentsModule)**: Para evitar acoplamiento circular o dependencia de PaymentsModule, GatewayFactory + TransbankModule se importan directamente en SubscriptionsModule. Mismo patrón que PaymentsModule (no hay exports de GatewayFactory desde allí).

4. **NO crear Subscription row en POST /subscriptions (D-03)**: Solo Order especial + initiate(). La fila `Subscription` se crea en Plan 12-04 tras confirmar el pago con Transbank.

5. **Cancelación no-destructiva (D-09)**: DELETE /me marca `status=CANCELLED` + `cancelledAt=now`. El ciclo sigue activo hasta `cycleEnd`. Los créditos restantes se pueden usar mientras la fecha no haya vencido.

## Deviations from Plan

None - plan executed exactly as written.

## Pending (Future Plans)

- **Plan 12-02**: ARTICLE operativo en OrdersService + migración de ConfigService a SettingsService
- **Plan 12-03**: Créditos de suscripción aplicados automáticamente en carrito (EVENT gratis, descuentos SPOT/HERO)
- **Plan 12-04**: Callback `POST /subscriptions/confirm` + creación de Subscription row + refactor de guards para endpoints públicos

## Commits

| Hash | Message |
|------|---------|
| af7640b | feat(12-01): add SUBSCRIPTION+ARTICLE to OrderItemType enum + Prisma migration |
| a360bde | feat(12-01): create SubscriptionsModule with CRUD endpoints |
| abf919a | docs(12-01): add COM-01..04 to REQUIREMENTS.md (Phase 12) |

## Self-Check: PASSED
