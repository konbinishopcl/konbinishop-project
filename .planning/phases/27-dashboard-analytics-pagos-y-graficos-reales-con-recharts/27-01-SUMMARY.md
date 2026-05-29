---
phase: 27-dashboard-analytics-pagos-y-graficos-reales-con-recharts
plan: "01"
subsystem: api/payments
tags: [nestjs, payments, admin, endpoint]
dependency_graph:
  requires: []
  provides: [GET /payments admin endpoint, findAllForAdmin() service method]
  affects: [PaymentsSection (Plan 04), ReportsSection (Plan 05)]
tech_stack:
  added: []
  patterns: [JwtAuthGuard + RolesGuard guard chain, Prisma eager loading with include, principal resolution (org ?? owner)]
key_files:
  created: []
  modified:
    - apps/api/src/payments/payments.service.ts
    - apps/api/src/payments/payments.controller.ts
decisions:
  - "Hero title chain: titleAccent ?? title — titleAccent (optional accent line) preferred over title (always present) to match ApiPayment contract note"
  - "GET /payments placed ABOVE POST :orderId/checkout to prevent route ambiguity with NestJS router"
  - "org ?? owner principal resolution: org user (ORGANIZATION type) takes precedence when order.orgId is set"
metrics:
  duration: "10 minutes"
  completed: "2026-05-29"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 27 Plan 01: Admin GET /payments Endpoint Summary

Admin-only `GET /payments` endpoint returning PAID/FAILED orders normalized as `ApiPayment[]` with buyer identity and resolved item titles via Prisma eager loading.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add findAllForAdmin() to PaymentsService | d9791b5 | payments.service.ts |
| 2 | Add guarded GET /payments to PaymentsController | 63c9e55 | payments.controller.ts |

## What Was Built

### Task 1: PaymentsService.findAllForAdmin()

Added a public async method that:
- Queries `Order` with `status IN [PAID, FAILED]` ordered by `createdAt DESC`
- Eager-loads `owner`, `org`, and `items` with all item relations (event, spot, hero, article)
- Normalizes the response to the `ApiPayment` shape:
  - `buyer` derived from `org ?? owner` (org context takes precedence)
  - `buyer.name` built from `[firstname, lastname].filter(Boolean).join(' ') || email`
  - Item `title` resolved from relation chain: `event.title ?? spot.title ?? hero.titleAccent ?? hero.title ?? article.title ?? type`
  - `createdAt` serialized as ISO string

### Task 2: PaymentsController GET /payments

Added admin-protected route:
- Imported `RolesGuard` from `../auth/roles.guard` and `Roles` from `../auth/roles.decorator`
- Declared `@Get()` above `@Post(':orderId/checkout')` to prevent route ambiguity
- Guards: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN', 'SUPER_ADMIN')`
- Delegates to `this.payments.findAllForAdmin()`

## Verification

- `npx tsc --noEmit` exits 0 — no type errors in either file
- Route resolves to `GET /api/payments` (global `/api` prefix + `@Controller('payments')` + `@Get()`)
- Non-admin token → 403 (RolesGuard); no token → 401 (JwtAuthGuard)

## Deviations from Plan

None — plan executed exactly as written. Hero title chain adjusted per schema reality (`hero` has both `title` (required) and `titleAccent` (optional)) — `titleAccent ?? title` matches plan intent.

## Known Stubs

None — this is a pure backend plan. No frontend rendering stubs introduced.

## Self-Check: PASSED

- [x] `apps/api/src/payments/payments.service.ts` contains `async findAllForAdmin(`
- [x] `payments.service.ts` contains `prisma.order.findMany`
- [x] `payments.service.ts` contains `status: { in: [OrderStatus.PAID, OrderStatus.FAILED] }`
- [x] `payments.service.ts` contains `createdAt.toISOString()`
- [x] `payments.service.ts` contains `.filter(Boolean).join(' ')`
- [x] `payments.controller.ts` contains `@Get()` followed by `@Roles('ADMIN', 'SUPER_ADMIN')`
- [x] `payments.controller.ts` contains `import { RolesGuard }`
- [x] `payments.controller.ts` contains `import { Roles }`
- [x] `payments.controller.ts` contains `findAllForAdmin()`
- [x] `payments.controller.ts` contains `@UseGuards(JwtAuthGuard, RolesGuard)`
- [x] `npx tsc --noEmit` exits 0
