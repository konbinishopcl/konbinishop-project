---
phase: 18-separar-taxonomia-eventos-articulos
plan: "02"
subsystem: api-catalog-services
tags: [taxonomy, migration, backwards-compat, catalog, events, articles, heroes, orders]
dependency_graph:
  requires: [18-01]
  provides: [18-03, 18-04]
  affects: [catalog, events, articles, heroes, orders]
tech_stack:
  added: []
  patterns:
    - "Dual-write pattern: escribir en relación legacy Y nueva simultáneamente durante transición"
    - "Alias endpoint pattern: GET /categories lee eventCategory, GET /tags lee articleTag"
    - "Fallback chain: event.eventCategory?.pricePerDay ?? event.category?.pricePerDay ?? 0"
key_files:
  created:
    - apps/api/src/catalog/dto/create-event-category.dto.ts
    - apps/api/src/catalog/dto/update-event-category.dto.ts
    - apps/api/src/catalog/dto/create-event-tag.dto.ts
    - apps/api/src/catalog/dto/update-event-tag.dto.ts
    - apps/api/src/catalog/dto/create-article-category.dto.ts
    - apps/api/src/catalog/dto/update-article-category.dto.ts
    - apps/api/src/catalog/dto/create-article-tag.dto.ts
    - apps/api/src/catalog/dto/update-article-tag.dto.ts
  modified:
    - apps/api/src/catalog/catalog.service.ts
    - apps/api/src/catalog/catalog.controller.ts
    - apps/api/src/catalog/catalog.module.ts
    - apps/api/src/events/dto/create-event.dto.ts
    - apps/api/src/events/dto/update-event.dto.ts
    - apps/api/src/events/dto/query-events.dto.ts
    - apps/api/src/events/events.service.ts
    - apps/api/src/articles/dto/create-article.dto.ts
    - apps/api/src/articles/dto/update-article.dto.ts
    - apps/api/src/articles/dto/query-articles.dto.ts
    - apps/api/src/articles/dto/create-sponsored-article.dto.ts
    - apps/api/src/articles/articles.service.ts
    - apps/api/src/heroes/dto/create-hero.dto.ts
    - apps/api/src/heroes/dto/update-hero.dto.ts
    - apps/api/src/heroes/heroes.service.ts
    - apps/api/src/orders/orders.service.ts
decisions:
  - "aliases /categories y /tags apuntan a eventCategory/articleTag en lectura; escritura sigue en tablas legacy hasta plan 18-04"
  - "dual-write en create/update: ambas FKs (category + eventCategory) se escriben con el mismo ID para garantizar compat hacia atrás"
  - "unitPrice en OrdersService usa fallback chain eventCategory?.pricePerDay ?? category?.pricePerDay ?? 0"
  - "EventTag endpoint y modelo creados; UI de asignación diferida a Phase 19+ (sin picker en EventForm)"
metrics:
  duration: "~45 minutos"
  completed: "2026-05-27T21:53:24Z"
  tasks: 2
  files_modified: 21
---

# Phase 18 Plan 02: Backend Migration — Nuevos Modelos de Taxonomía

Migración del backend NestJS para leer y escribir desde los nuevos modelos `EventCategory`, `EventTag`, `ArticleCategory`, `ArticleTag` creados en 18-01. Endpoints REST nuevos en `/event-categories`, `/event-tags`, `/article-categories`, `/article-tags`. Aliases `/categories` y `/tags` redirigen a los nuevos modelos en lectura. Todos los servicios (events, heroes, articles, orders) actualizados con patrón de dual-write para backwards compatibility mientras el frontend migra en 18-03.

## Objective

Migrar todo el backend para leer y escribir de los nuevos modelos de taxonomía separada, manteniendo compatibilidad total con el frontend actual. El resultado crítico: OrdersService calcula `unitPrice` desde `eventCategory.pricePerDay` (no de la tabla legacy), garantizando que las órdenes de tipo EVENT no devuelvan NaN ni 0.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | DTOs nuevos + CatalogService + endpoints nuevos + aliases | 314c7fe | 8 DTOs, catalog.service.ts, catalog.controller.ts, catalog.module.ts |
| 2 | Migrar EventsService, HeroesService, ArticlesService, OrdersService | 91391c5 | events.service.ts, heroes.service.ts, articles.service.ts, orders.service.ts + 9 DTOs |

## Nuevos Endpoints REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /api/event-categories | Listar categorías de eventos |
| POST | /api/event-categories | Crear categoría de evento (ADMIN+) |
| PATCH | /api/event-categories/:id | Editar categoría de evento (ADMIN+) |
| DELETE | /api/event-categories/:id | Eliminar categoría de evento (ADMIN+) |
| GET | /api/event-tags | Listar tags de eventos |
| POST | /api/event-tags | Crear tag de evento (ADMIN+) |
| PATCH | /api/event-tags/:id | Editar tag de evento (ADMIN+) |
| DELETE | /api/event-tags/:id | Eliminar tag de evento (ADMIN+) |
| GET | /api/article-categories | Listar categorías de artículos |
| POST | /api/article-categories | Crear categoría de artículo (ADMIN+) |
| PATCH | /api/article-categories/:id | Editar categoría de artículo (ADMIN+) |
| DELETE | /api/article-categories/:id | Eliminar categoría de artículo (ADMIN+) |
| GET | /api/article-tags | Listar tags de artículos |
| POST | /api/article-tags | Crear tag de artículo (ADMIN+) |
| PATCH | /api/article-tags/:id | Editar tag de artículo (ADMIN+) |
| DELETE | /api/article-tags/:id | Eliminar tag de artículo (ADMIN+) |
| GET | /api/categories | **ALIAS** → devuelve eventCategory (antes devolvía Category legacy) |
| GET | /api/tags | **ALIAS** → devuelve articleTag (antes devolvía Tag legacy) |

## Decisions Made

### 1. Aliases /categories y /tags — lectura al nuevo modelo, escritura legacy hasta 18-04
`CatalogService.categories()` ahora hace `prisma.eventCategory.findMany(...)`. `tags()` hace `prisma.articleTag.findMany(...)`. Los métodos de escritura (`createCategory`, `updateCategory`, etc.) siguen apuntando a las tablas `Category`/`Tag` legacy. Plan 18-04 eliminará estos métodos de escritura y los controllers alias.

### 2. Dual-write en create/update de Event, Hero, Article
Al crear o actualizar, se escribe en **ambas** relaciones (`category` + `eventCategory`, `tags` + `articleTags`) con el mismo ID. Esto permite que el frontend siga enviando `categoryId` o `tagIds` y el backend persiste en ambas tablas. Plan 18-03 actualizará el frontend; plan 18-04 eliminará las escrituras legacy.

### 3. Fallback chain en OrdersService
`unitPrice = event.eventCategory?.pricePerDay ?? event.category?.pricePerDay ?? 0`
El fallback a `category?.pricePerDay` protege contra eventos cuyo `eventCategoryId` sea null en DB (no debería ocurrir después de 18-01, pero la defensa es gratuita).

### 4. EventTag UI deferida
El schema, los DTOs, el endpoint `/event-tags` y el método `eventTagIds` en los DTOs de evento están implementados. Sin embargo, **no existe UI en EventForm para asignar EventTags a eventos**. Esta funcionalidad queda diferida a Phase 19+. La migración de datos y la plomería de backend están completas.

## OrdersService Smoke Test (Critical Risk #1)

Verificación a nivel de query Prisma (sin servidor HTTP activo):

```
Event id=38 (slug=konbini-live-fest)
  eventCategory: { name: "Música", pricePerDay: 1000, minDays: 1, maxDays: 30 }
  category:      { name: "Música", pricePerDay: 1000 }
  computed unitPrice: 1000 (de event.eventCategory?.pricePerDay)
```

Resultado: una orden EVENT para este evento calcularía `subtotal = days * 1000` (correcto, no NaN ni 0).

## Hero Carousel Smoke Test (Critical Risk #2)

HeroesService.findActive() ahora incluye `{ category: true, eventCategory: true }`. Los heroes activos devuelven ambas relaciones en el payload.

## Deviations from Plan

### Auto-adaptations (minor)

**1. [Rule 1 - Bug] Filtro de categoría en events.service.ts refactorizado con IIFE**
- El plan sugería `const categorySlug = query.eventCategory ?? query.category;` antes del objeto `where`. Para mantener el patrón de spread existente (que usa inline expressions), se usó una IIFE `...(() => { ... })()` dentro del spread, manteniendo la legibilidad y evitando extraer variables fuera del objeto.

**2. assertUniqueSlug extendida (no renombrada)**
- El plan ofrecía dos opciones (renombrar o extender). Se optó por extender el union type del parámetro `model` para evitar modificar los 5 call sites existentes. Zero-risk.

**3. [Rule 3 - Blocking] Prisma node script smoke test corregido**
- El primer intento combinaba `include` y `select` (inválido en Prisma). Corregido a usar solo `include`.

## Known Stubs

Ninguno — todos los datos fluyen desde las tablas reales del DB. Los endpoints nuevos responden con datos reales de `event_categories`, `event_tags`, `article_categories`, `article_tags`.

## Self-Check: PASSED
