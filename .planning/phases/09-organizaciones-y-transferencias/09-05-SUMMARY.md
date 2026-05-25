---
phase: 09-organizaciones-y-transferencias
plan: "05"
subsystem: api
tags: [organizations, org-context, events, spots, heroes, orders, cart]
dependency_graph:
  requires: [09-02]
  provides: [ORG-05]
  affects: [events, spots, heroes, orders]
tech_stack:
  added: []
  patterns: [OrgContextGuard, orgContext?.orgId ?? user.sub, carrito-por-contexto]
key_files:
  created: []
  modified:
    - apps/api/src/events/events.service.ts
    - apps/api/src/events/events.controller.ts
    - apps/api/src/spots/spots.service.ts
    - apps/api/src/spots/spots.controller.ts
    - apps/api/src/heroes/heroes.service.ts
    - apps/api/src/heroes/heroes.controller.ts
    - apps/api/src/orders/orders.service.ts
    - apps/api/src/orders/orders.controller.ts
decisions:
  - "ownerId = orgContext?.orgId ?? user.sub en create() de eventos, spots, heroes"
  - "audit.log() sigue usando user.sub (persona física); orgContext va en metadata"
  - "carrito identificado por tupla (userId, orgId, status=DRAFT) — orgId=null para carrito personal"
  - "ensureVisible() verifica membresía en org via OrgMember cuando order.orgId != null"
  - "Pitfall #6: validación type=ORGANIZATION en service layer antes de asignar orgId a Order"
  - "OrgContextGuard a nivel de clase en OrdersController (cubre todos los handlers automáticamente)"
metrics:
  duration: "4 minutos"
  completed_date: "2026-05-24"
  tasks_completed: 3
  files_changed: 8
---

# Phase 9 Plan 5: Integración OrgContext en Events, Spots, Heroes y Orders Summary

Integración del patrón `OrgContextGuard` + `@OrgContext()` en los 4 módulos de ownership: eventos, spots, heroes y órdenes. Cuando el header `X-Org-Context` está presente, el ownership se asigna a la org; sin header, el comportamiento personal anterior queda intacto.

## Tasks Completed

| # | Task | Commit | Files Modified |
|---|------|--------|----------------|
| 1 | EventsService + SpotsService + controllers | 92129e8 | events.service.ts, events.controller.ts, spots.service.ts, spots.controller.ts |
| 2 | HeroesService + HeroesController | ccf18d0 | heroes.service.ts, heroes.controller.ts |
| 3 | OrdersService (carrito por contexto) + OrdersController | 51113c5 | orders.service.ts, orders.controller.ts |

## What Was Built

### Events / Spots / Heroes (mismo patrón)

- `create(dto, user, orgContext = null)`: `ownerId = orgContext?.orgId ?? user.sub`. Ownership del recurso se asigna a la org cuando hay contexto.
- `findMine(user, orgContext = null)`: `where: { userId: ownerId }`. Lista filtra por org o por usuario según contexto.
- Controllers: `POST /events`, `POST /spots`, `POST /heroes`, `GET /events/mine`, `GET /spots/mine`, `GET /heroes/mine` usan `@UseGuards(JwtAuthGuard, OrgContextGuard)` y pasan `@OrgContext() ctx` al service.
- `audit.log()` sigue auditando con `user.sub` (persona física); `orgContext.orgId` va en `metadata`.

### Orders (patrón diferente — carrito por contexto)

- `getOrCreateDraft(user, orgContext = null)`:
  - Defensa Pitfall #6: si hay orgContext, valida `org.type === 'ORGANIZATION'` antes de continuar.
  - Query: `where: { userId: user.sub, orgId: orgContext?.orgId ?? null, status: DRAFT }` — carrito de la org vs personal.
  - Create: `owner: { connect: { id: user.sub } }` + `org: { connect: { id: orgContext.orgId } }` cuando hay contexto.
- `addItem/removeItem/findOne`: reciben `orgContext`, lo propagan a `resolveItem` y `ensureVisible`.
- `resolveItem`: ownership check usa `ownerId = orgContext?.orgId ?? user.sub`.
- `ensureVisible`: si `order.orgId != null` verifica membresía en OrgMember; si null verifica `order.userId === user.sub`.
- `OrdersController`: `@UseGuards(JwtAuthGuard, OrgContextGuard)` a nivel de clase, todos los handlers reciben `@OrgContext() ctx`.

## Verification

- `pnpm tsc --noEmit`: exit 0
- `pnpm build`: exit 0
- Todos los criterios de aceptación verificados

## Deviations from Plan

None — plan ejecutado exactamente como escrito.

## Known Stubs

None — todos los cambios conectan comportamiento real.

## Self-Check: PASSED

- apps/api/src/events/events.service.ts — FOUND
- apps/api/src/events/events.controller.ts — FOUND
- apps/api/src/spots/spots.service.ts — FOUND
- apps/api/src/spots/spots.controller.ts — FOUND
- apps/api/src/heroes/heroes.service.ts — FOUND
- apps/api/src/heroes/heroes.controller.ts — FOUND
- apps/api/src/orders/orders.service.ts — FOUND
- apps/api/src/orders/orders.controller.ts — FOUND
- Commits 92129e8, ccf18d0, 51113c5 — FOUND
