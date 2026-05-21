---
phase: 1
plan: "01-02"
subsystem: api-catalog
tags: [api, nestjs, prisma, taxonomies, read-only]
status: complete
provides: [catalog-endpoints]
affects: [apps/api/src/catalog, apps/api/src/app.module.ts]
key_files:
  created:
    - apps/api/src/catalog/catalog.module.ts
    - apps/api/src/catalog/catalog.controller.ts
    - apps/api/src/catalog/catalog.service.ts
  modified:
    - apps/api/src/app.module.ts
metrics:
  completed: "2026-05-20"
  files_changed: 4
  endpoints_added: 8
---

# Phase 1 · Summary 01-02: Endpoints de catálogo

**One-liner:** El módulo `catalog` expone 8 endpoints `GET` públicos para las taxonomías y el
contenido de referencia — regiones, comunas, categorías, tags, heroes, spots y artículos;
verificado con un smoke test contra la base local.

## Qué se construyó

Un único módulo `catalog` (`catalog.module.ts`, `catalog.controller.ts`,
`catalog.service.ts`) — un `@Controller()` sin prefijo que agrupa los endpoints de lectura, y
un `CatalogService` con las consultas Prisma. Registrado en `app.module.ts`.

| Método | Ruta | Resultado |
|--------|------|-----------|
| GET | `/api/regions` | 16 regiones, orden alfabético |
| GET | `/api/communes` | 346 comunas; filtro `?region=<slug>` |
| GET | `/api/categories` | Categorías |
| GET | `/api/tags` | Tags |
| GET | `/api/heroes` | Banners vigentes (`expirationDate` futura) |
| GET | `/api/spots` | Spots vigentes (sin expiración o futura) |
| GET | `/api/articles` | Artículos con sus tags |
| GET | `/api/articles/:slug` | Detalle de artículo; `404` si no existe |

## Verification

`nest build` limpio. Smoke test con la API + base local (seed):

- `GET /api/regions` → 16 ✓
- `GET /api/communes?region=valparaiso` → 38 comunas; sin filtro → 346 ✓
- `GET /api/categories` → 5 · `/tags` → 5 · `/heroes` → 2 · `/spots` → 3 · `/articles` → 3 ✓
- `GET /api/articles/guia-primera-convencion-anime` → `200`; slug inexistente → `404` ✓

## Deviations from Plan

Ninguna. Como anticipaba el plan, se usó un solo módulo `catalog` en vez de 7 módulos por
recurso — son lecturas triviales sobre datos de referencia.

## Known Stubs / Follow-ups

- **Plan 01-03:** endpoint de subida de imágenes (`POST`). El almacenamiento ya está decidido
  y operativo — disco local en `apps/api/uploads/`, servido en `/uploads` (hecho junto con el
  seed). Falta solo el endpoint que recibe el archivo.
- Con 01-03, la API de contenido (Phase 1) queda completa para empezar Phase 2 (conectar el
  sitio público).

## Self-Check: PASSED

- `apps/api/src/catalog/` (module, controller, service) — FOUND
- `CatalogModule` registrado en `app.module.ts` — CONFIRMED
- `nest build` → `dist/` limpio — CONFIRMED
- 8 endpoints probados con datos del seed (200/404) — CONFIRMED
