---
phase: 13-contenido-avanzado
plan: "04"
subsystem: catalog-dtos + orders-validation
tags: [category, dto, validation, orders, cart, event]
dependency_graph:
  requires: []
  provides: [category-v2-dtos, event-cart-category-caps]
  affects: [catalog-module, orders-module]
tech_stack:
  added: []
  patterns: [class-validator-dto-extension, prisma-inline-select-cap]
key_files:
  created: []
  modified:
    - apps/api/src/catalog/dto/create-category.dto.ts
    - apps/api/src/catalog/dto/update-category.dto.ts
    - apps/api/src/orders/orders.service.ts
decisions:
  - "CatalogService usa data: dto (spread directo) — solo extender DTOs es suficiente para persistir campos v2 sin tocar el service"
  - "Query adicional en addItem solo cuando type=EVENT && !hasCredit — sin degradación para SPOT/HERO/ARTICLE"
  - "category.minDays solo valida si minDays > 1 — categorías con minDays=1 (default) no agregan overhead de validación"
  - "EVENT con crédito sigue sin validación de días — cap per-category no aplica a crédito de suscripción"
metrics:
  duration: "~10 min"
  completed_date: "2026-05-25"
  tasks: 2
  files_modified: 3
---

# Phase 13 Plan 04: Category v2 DTOs + Cart EVENT Validation Summary

**One-liner:** Category DTOs extendidos con icon/color/minDays/maxDays/order; OrdersService.addItem usa Math.min(globalMax, category.maxDays) como cap para EVENT sin crédito + valida category.minDays.

## What Was Built

### Task 1: Extender CreateCategoryDto y UpdateCategoryDto

Ambos DTOs extendidos con los 5 campos v2 ya presentes en el schema Prisma:

- `icon?: string` — nombre de icono Lucide (ej. "calendar", "music")
- `color?: string` — hex (#FF6B00) o clase CSS
- `minDays?: number` — mínimo de días para publicar evento de esta categoría (@Min(1))
- `maxDays?: number` — máximo de días para publicar evento de esta categoría (@Min(1))
- `order?: number` — orden manual en listados (@Min(0))

Todos marcados `@IsOptional()` con decoradores `class-validator` correspondientes y `@ApiPropertyOptional()` para Swagger. El service `CatalogService.createCategory/updateCategory` hace `data: dto` (spread directo), por lo que los campos llegan automáticamente a Prisma sin cambios al service.

### Task 2: Refactor OrdersService.addItem para EVENT con category caps

`addItem` modificado para integrar `category.minDays` y `category.maxDays` en la validación de días para EVENT sin crédito:

1. **Lookup liviano:** cuando `type=EVENT && !hasCredit && dto.eventId`, se hace un `findUnique` con `select: { category: { select: { minDays: true, maxDays: true } } }` — 1 query extra solo en ese path.
2. **Cap por categoría:** `effectiveMax = Math.min(globalMax, categoryMaxDays)` — si la categoría tiene maxDays menor al global, ese es el tope efectivo.
3. **Mínimo por categoría:** si `categoryMinDays > 1` y `dto.days < categoryMinDays` → `BadRequestException("Mínimo ${categoryMinDays} días para esta categoría de evento")`.
4. **Sin cambios para:** SPOT, HERO, ARTICLE, EVENT con crédito de suscripción.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `pnpm tsc --noEmit` exits 0
- `pnpm build` exits 0
- DTOs aceptan los 5 campos v2 con validaciones @IsOptional/@IsInt/@Min/@IsString
- `grep "categoryMaxDays"` y `grep "effectiveMax"` en orders.service.ts retornan las líneas esperadas
- No quedan referencias a `const maxDays` (local variable que sombreaba el método) — renombrada a `globalMax`

## Known Stubs

None — implementación completa, sin placeholders.

## Self-Check: PASSED

- `apps/api/src/catalog/dto/create-category.dto.ts` — FOUND (icon?, color?, minDays?, maxDays?, order?)
- `apps/api/src/catalog/dto/update-category.dto.ts` — FOUND (icon?, color?, minDays?, maxDays?, order?)
- `apps/api/src/orders/orders.service.ts` — FOUND (categoryMinDays, categoryMaxDays, effectiveMax, Math.min(globalMax, categoryMaxDays))
- TypeScript: PASSED (tsc --noEmit exits 0)
- Build: PASSED (nest build exits 0)
