---
phase: 18-separar-taxonomia-eventos-articulos
plan: "04"
subsystem: taxonomy-cleanup
tags: [prisma, migration, dashboard, category, cleanup, phase-18-close]
dependency_graph:
  requires: [18-03]
  provides: [taxonomy-final-state]
  affects: [dashboard-admin, api-events, api-heroes, api-articles, api-orders]
tech_stack:
  added: []
  patterns:
    - Migración manual con prisma migrate resolve --applied (entorno no-interactivo)
    - authedFetch con localStorage token para CRUD admin dashboard
    - Dispatch pattern kind==="tags" en SimpleCRUDSection
key_files:
  created:
    - apps/api/prisma/migrations/20260527222559_sch09_drop_legacy_taxonomy/migration.sql
  modified:
    - apps/website/app/dashboard/sections/CategoriesSection.tsx
    - apps/website/app/dashboard/sections/SimpleCRUDSection.tsx
    - apps/api/src/catalog/catalog.service.ts
    - apps/api/src/catalog/catalog.controller.ts
    - apps/api/src/catalog/catalog.module.ts
    - apps/api/src/events/events.service.ts
    - apps/api/src/articles/articles.service.ts
    - apps/api/src/heroes/heroes.service.ts
    - apps/api/src/orders/orders.service.ts
    - apps/api/src/users/users.service.ts
    - apps/api/src/events/dto/create-event.dto.ts
    - apps/api/src/events/dto/update-event.dto.ts
    - apps/api/src/events/dto/query-events.dto.ts
    - apps/api/src/articles/dto/create-article.dto.ts
    - apps/api/src/articles/dto/update-article.dto.ts
    - apps/api/src/articles/dto/create-sponsored-article.dto.ts
    - apps/api/src/articles/dto/query-articles.dto.ts
    - apps/api/src/heroes/dto/create-hero.dto.ts
    - apps/api/src/heroes/dto/update-hero.dto.ts
    - apps/api/prisma/schema.prisma
    - apps/api/prisma/seed.ts
    - apps/website/lib/api.ts
    - apps/website/app/(site)/HomeView.tsx
    - apps/website/app/(site)/page.tsx
    - apps/website/app/(site)/busqueda/SearchView.tsx
    - apps/website/app/(site)/busqueda/page.tsx
    - apps/website/app/(site)/categoria/[cat]/page.tsx
    - apps/website/app/(site)/evento/[slug]/EventView.tsx
    - apps/website/app/(site)/evento/[slug]/page.tsx
    - apps/website/app/(site)/tag/[tag]/page.tsx
decisions:
  - "Endpoints /categories y /tags eliminados (no mantenidos como aliases permanentes)"
  - "Migración sch09 creada manualmente y registrada con prisma migrate resolve --applied por restricción de entorno non-interactive"
  - "users.service.ts incluido en cleanup aunque no estaba en el plan original (consumidor no detectado)"
metrics:
  duration: "~29 minutos"
  completed: "2026-05-27"
  tasks: 3
  files: 28
---

# Phase 18 Plan 04: Close Phase — Dashboard Real + Legacy Cleanup + Migration sch09 Summary

Dashboard admin CategoriesSection conectado a CRUD real de /event-categories; SimpleCRUDSection rama tags conectada a /article-tags; backend limpio sin referencias legacy category/tag; migración sch09_drop_legacy_taxonomy aplicada eliminando Category, Tag, _ArticleToTag, Event.categoryId, Hero.categoryId.

## Tasks Completed

### Task 1: Dashboard real (CategoriesSection + SimpleCRUDSection kind=tags)

**Commit:** `0c739be`

- `CategoriesSection.tsx` reescrito: elimina `CATS` mock hardcoded, usa `useEffect` + `fetch("/api/event-categories")` para listar, y `authedFetch` con token de localStorage para POST/PATCH/DELETE.
- `SimpleCRUDSection.tsx` modificado: agrega `if (kind === "tags") return <RealTagsSection />;` al inicio. `RealTagsSection` fetcha `/api/article-tags` y tiene CRUD completo (crear/editar/eliminar con modales separados).
- TypeScript pasa sin errores.

### Task 2: Limpieza backend + frontend

**Commit:** `3a4d08d`

Archivos modificados en backend:
- **CatalogService**: eliminados métodos `categories()`, `findCategory/createCategory/updateCategory/removeCategory`, `tags()`, `findTag/createTag/updateTag/removeTag`; imports de DTOs legacy eliminados; unión `assertUniqueSlug` ya no incluye `'category' | 'tag'`
- **CatalogController**: eliminados `CategoriesController` (`@Controller('categories')`) y `TagsController` (`@Controller('tags')`) completos
- **CatalogModule**: eliminados `CategoriesController`, `TagsController` del array `controllers`
- **EventsService**: eliminado `category: true` del `EVENT_INCLUDE`; query filter simplificado a `query.eventCategory` (sin fallback `?? query.category`); create/update sin dual-write category
- **OrdersService**: `ITEM_INCLUDE` sin `category: true`; `eventForCap` sin fallback category; `unitPrice` sin `?? event.category?.pricePerDay`
- **HeroesService**: cuatro includes simplificados a `{ eventCategory: true }`; create/update sin dual-write category
- **ArticlesService**: `ARTICLE_INCLUDE`/`ARTICLE_DETAIL_INCLUDE` sin `tags: true`; nested `ARTICLE_DETAIL_INCLUDE.events.select.category` → `eventCategory`; filtro `query.articleTag` sin fallback `?? query.tag`; create/update/createSponsored sin `tags:` dual-write
- **DTOs Event**: eliminados `categoryId?`, `category?` de Create/Update/Query
- **DTOs Article**: eliminados `tagIds?`, `tag?` de Create/Update/CreateSponsored/Query
- **DTOs Hero**: eliminados `categoryId?` de Create/Update

Archivos modificados en frontend:
- **api.ts**: eliminados `ApiCategory`, `ApiTag` alias, `ApiEvent.category`, `ApiHero.category`, `EventsQuery.category`, `CreateEventInput.categoryId/categoryIds`, `api.categories()` alias; mappers simplificados a solo `eventCategory`
- **Consumers adicionales detectados** (no listados en el plan, corregidos con Rule 1): `HomeView.tsx`, `page.tsx` home, `busqueda/SearchView.tsx`, `busqueda/page.tsx`, `categoria/[cat]/page.tsx`, `evento/[slug]/EventView.tsx`, `evento/[slug]/page.tsx`, `tag/[tag]/page.tsx`

### Task 3: Migración sch09_drop_legacy_taxonomy

**Commit:** `1880818`

- `schema.prisma`: eliminados `model Category`, `model Tag`, `Event.categoryId`, `Hero.categoryId`, `Article.tags`, `@@index([categoryId])` en Hero
- **Migración manual**: `prisma migrate dev --create-only` no funciona en entorno non-interactive con datos en tablas. Solución: crear directorio `20260527222559_sch09_drop_legacy_taxonomy/migration.sql` manualmente con el DDL correcto, verificar nombres de FK/índices en MySQL, aplicar con `mysql < migration.sql`, registrar con `prisma migrate resolve --applied`
- **SQL generado**: DROP FK `Event_categoryId_fkey`, `Hero_categoryId_fkey`, `_ArticleToTag_A_fkey/_B_fkey`; DROP INDEX `Hero_categoryId_idx`; DROP COLUMN `categoryId` de Event y Hero; DROP TABLE `_ArticleToTag`, `Tag`, `Category`
- `prisma generate` regenera cliente sin tipos `Category`/`Tag`/`Event.category`/`Hero.category`/`Article.tags`
- **users.service.ts** (consumidor adicional no en plan): `include: { category: true }` → `eventCategory: true`; `include: { tags: true }` → `articleTags: true`
- **seed.ts**: `prisma.category` → `prisma.eventCategory`, `prisma.tag` → `prisma.articleTag`, `tags: { connect }` → `articleTags: { connect }`, `categoryId` → `eventCategoryId` en heroes y eventos
- `tsc --noEmit` pasa en `apps/api` después de `prisma generate`
- `prisma migrate status` reporta "Database schema is up to date!"
- `prisma validate` reporta "The schema at prisma/schema.prisma is valid 🚀"

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Consumidores de ApiCategory en website no detectados en plan**
- **Found during:** Task 2 — tsc --noEmit reveló errores en 8 archivos adicionales
- **Issue:** `HomeView.tsx`, `page.tsx`, `busqueda/SearchView.tsx`, `busqueda/page.tsx`, `categoria/[cat]/page.tsx`, `evento/[slug]/EventView.tsx`, `evento/[slug]/page.tsx`, `tag/[tag]/page.tsx` usaban `ApiCategory`, `api.categories()` o `event.category?.name`
- **Fix:** Actualizar todos los archivos para usar `ApiEventCategory`, `api.eventCategories()` y `event.eventCategory?.name`; query params `category:` → `eventCategory:`
- **Files modified:** Los 8 archivos listados arriba
- **Commit:** `3a4d08d`

**2. [Rule 1 - Bug] users.service.ts usaba includes legacy no detectados**
- **Found during:** Task 3 — tsc --noEmit post-prisma-generate reveló 2 errores
- **Issue:** `users.service.ts` tenía `include: { category: true }` y `include: { tags: true }` en queries de Event y Article
- **Fix:** Cambiar a `eventCategory: true` y `articleTags: true`
- **Files modified:** `apps/api/src/users/users.service.ts`
- **Commit:** `1880818`

**3. [Rule 3 - Blocking] prisma migrate dev no acepta entorno non-interactive**
- **Found during:** Task 3 — comando rechazado por Prisma al detectar que habrá pérdida de datos y no hay TTY
- **Issue:** `prisma migrate dev --create-only` requiere confirmación interactiva cuando las tablas tienen datos
- **Fix:** Crear SQL manualmente inspeccionando los nombres reales de FK/índices en MySQL, aplicar con `mysql < migration.sql`, registrar con `prisma migrate resolve --applied`
- **Impact:** Funcionalidad idéntica al flujo normal de Prisma, migración registrada correctamente en `_prisma_migrations`

## Critical Risk Checklist (Plan 18 Phase Closure)

| Risk | Estado | Verificación |
|------|--------|--------------|
| Risk #1: OrdersService EVENT unitPrice > 0 | CERRADO desde 18-02 | `event.eventCategory?.pricePerDay ?? 0` sin fallback legacy |
| Risk #2: Hero carousel mantiene categorías | OK | `eventCategory: true` en `findActive()`; `Hero.eventCategoryId` preservado |
| Risk #3: Articles conservan tags | OK | `articleTags: true` en includes; `_ArticleToArticleTag` preservada |
| Risk #4: SEO slugs /categoria/[slug] | OK | Slugs de EventCategory preservados 1:1 desde 18-01 |
| Risk #5: /categories y /tags aliases | ELIMINADOS | Decision final: no se conservan como aliases permanentes |

## DB State Post-Migration

| Tabla/Columna | Estado |
|---------------|--------|
| `Category` table | Eliminada |
| `Tag` table | Eliminada |
| `_ArticleToTag` table | Eliminada |
| `Event.categoryId` column | Eliminada |
| `Hero.categoryId` column | Eliminada |
| `event_categories` table | Existe (5 registros) |
| `article_tags` table | Existe |
| `Event.eventCategoryId` column | Existe |
| `Hero.eventCategoryId` column | Existe |

## Migration Details

**Directorio:** `apps/api/prisma/migrations/20260527222559_sch09_drop_legacy_taxonomy/`
**SQL contiene:** DROP FK Event/Hero categoryId; DROP INDEX Hero_categoryId_idx; DROP COLUMN categoryId x2; DROP TABLE _ArticleToTag, Tag, Category

## Self-Check: PASSED
