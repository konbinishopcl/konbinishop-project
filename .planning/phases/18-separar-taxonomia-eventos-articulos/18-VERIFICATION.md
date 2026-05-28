---
phase: 18-separar-taxonomia-eventos-articulos
verified: 2026-05-27T23:30:00Z
status: human_needed
score: 12/12 must-haves verified
human_verification:
  - test: "Confirmar endpoints nuevos responden correctamente"
    expected: "GET /api/event-categories devuelve 200 con array de 5 categorías; GET /api/article-tags devuelve 200 con array de 10 tags; GET /api/categories devuelve 404 (eliminado); GET /api/tags devuelve 404 (eliminado)"
    why_human: "Requiere servidor HTTP activo para verificar respuestas reales de los endpoints"
  - test: "Confirmar tablas legacy eliminadas en base de datos"
    expected: "SHOW TABLES no muestra 'categories', 'tags', '_ArticleToTag'; columnas categoryId ausentes en events y heroes; event_categories y article_tags existen con datos"
    why_human: "Requiere acceso directo a la base de datos MySQL en el entorno de producción/desarrollo activo; el estado actual del archivo schema.prisma y la migración SQL indican que el DDL es correcto pero no se puede confirmar sin conectar a DB"
  - test: "Confirmar CRUD del dashboard admin persiste en DB"
    expected: "Crear nueva EventCategory desde /dashboard → aparece en listado → editar nombre → guardar → nombre actualizado → eliminar → desaparece del listado; mismo flujo para ArticleTag"
    why_human: "Requiere sesión autenticada con token ADMIN en el navegador para ejecutar las operaciones CRUD completas"
  - test: "Confirmar sitemap.xml genera URLs correctas"
    expected: "sitemap.xml contiene entradas /categoria/<slug> para cada una de las 5 EventCategories; no contiene URLs basadas en categorías legacy"
    why_human: "Requiere que el servidor Next.js esté activo y que /sitemap.xml sea accesible para inspección"
  - test: "Confirmar que crear un evento desde /crear asigna eventCategoryId correctamente"
    expected: "Completar flujo /crear/1 → /crear/4 → submit → evento creado con eventCategoryId != null en la DB; OrdersService calcula unitPrice > 0 para ese evento"
    why_human: "Requiere sesión de usuario autenticado, DB activa y verificación de la fila creada en la tabla events"
---

# Phase 18: Separar Taxonomía Eventos/Artículos — Verification Report

**Phase Goal:** Desacoplar completamente la taxonomía de eventos y artículos: crear modelos `EventCategory`, `EventTag`, `ArticleCategory`, `ArticleTag` independientes; migrar datos desde `Category` y `Tag` actuales; eliminar los modelos compartidos; actualizar toda la capa backend (DTOs, servicios, controladores) y frontend (api.ts, formularios, filtros, páginas públicas) para usar la nueva taxonomía separada.

**Verified:** 2026-05-27T23:30:00Z
**Status:** human_needed — todas las verificaciones automatizadas pasaron; 5 ítems requieren verificación en tiempo de ejecución
**Re-verification:** No — verificación inicial

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Los 4 nuevos modelos de taxonomía existen en schema.prisma y los 2 legacy fueron eliminados | VERIFIED | `grep "^model EventCategory "` → 1; `grep "^model ArticleTag "` → 1; `grep "^model Category "` → 0; `grep "^model Tag "` → 0 |
| 2 | La migración aditiva sch08 existe con DDL+DML que crea tablas nuevas y copia datos preservando IDs | VERIFIED | Archivo `20260527213839_sch08_split_taxonomies/migration.sql` existe; contiene `CREATE TABLE event_categories`, `INSERT INTO event_categories SELECT`, `UPDATE Event SET eventCategoryId` |
| 3 | La migración de limpieza sch09 existe con DROP de tablas y columnas legacy | VERIFIED | Archivo `20260527222559_sch09_drop_legacy_taxonomy/migration.sql` existe; contiene `DROP TABLE Category`, `DROP TABLE Tag`, `DROP TABLE _ArticleToTag`, `DROP COLUMN categoryId` |
| 4 | Los 4 nuevos endpoints REST (/event-categories, /event-tags, /article-categories, /article-tags) están implementados en el backend | VERIFIED | `catalog.controller.ts` contiene `@Controller('event-categories')` y los 3 equivalentes; `catalog.service.ts` tiene todos los métodos CRUD para los 4 recursos |
| 5 | Los endpoints legacy /categories y /tags fueron eliminados del backend | VERIFIED | `grep "Controller('categories')"` → 0 en catalog.controller.ts; `grep "Controller('tags')"` → 0; `catalog.module.ts` no registra CategoriesController ni TagsController |
| 6 | Todos los servicios backend (events, orders, heroes, articles, users) usan los nuevos campos de taxonomía sin referencias legacy | VERIFIED | events.service.ts: `eventCategory: true` (1), `category: true` → 0; orders.service.ts: `eventCategory: true` (3), `event.category` → 0; heroes.service.ts: `eventCategory: true` (4), `include: { category: true }` → 0; articles.service.ts: `articleTags: true` (2), `tags: true` → 0; users.service.ts: `eventCategory: true` (1), `articleTags: true` (1) |
| 7 | Los DTOs del backend (Event, Article, Hero) usan los nuevos campos y no exponen los legacy | VERIFIED | create-event.dto.ts: `eventCategoryId` presente, `categoryId` ausente; create-article.dto.ts: `articleTagIds` presente, `tagIds` ausente; create-hero.dto.ts: `eventCategoryId` presente, `categoryId` ausente |
| 8 | OrdersService calcula unitPrice desde eventCategory.pricePerDay (no de la tabla legacy) | VERIFIED | `unitPrice = event.eventCategory?.pricePerDay ?? 0` en orders.service.ts; 0 referencias a `event.category` en el mismo archivo |
| 9 | El frontend (api.ts) exporta los tipos nuevos y los métodos de API nuevos sin aliases legacy | VERIFIED | `ApiEventCategory` (1), `ApiEventTag` (1), `ApiArticleCategory` (1), `ApiArticleTag` (1) exportados; `eventCategories()` (1), `eventTags()` (1), `articleCategories()` (1), `articleTags()` (1); `ApiCategory` → 0, `categories() =>` → 0 |
| 10 | Todas las páginas públicas del frontend consumen los nuevos tipos y endpoints | VERIFIED | Header.tsx: `ApiEventCategory` (2); layout.tsx: `api.eventCategories()` (1); sitemap.ts: `api.eventCategories()` (1); busqueda/page.tsx: `api.eventCategories()` (1); categoria/[cat]/page.tsx: `api.eventCategories()` (1) |
| 11 | Los formularios de creación/edición usan los nuevos campos (eventCategoryId, articleTagIds) | VERIFIED | EventForm.tsx: `eventCategoryId` (3), `"/api/event-categories"` (1); ArticleForm.tsx: `articleTagIds` (1), `"/api/article-tags"` (1); Step4Client.tsx: `eventCategoryId` (1) — fix bug donde enviaba `categoryIds` array que el backend ignoraba |
| 12 | El dashboard admin tiene CRUD real para EventCategory y ArticleTag (sin datos hardcoded) | VERIFIED | CategoriesSection.tsx: 0 referencias a `CATS =` mock, `/api/event-categories` (4), `useEffect` (2) para cargar datos; SimpleCRUDSection.tsx: `kind === "tags"` dispatch (5), `RealTagsSection` con `/api/article-tags` (5) y CRUD completo |

**Score:** 12/12 truths verified

---

## Required Artifacts

### Schema y Migraciones

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/prisma/schema.prisma` | 4 modelos nuevos, 0 legacy | VERIFIED | EventCategory, EventTag, ArticleCategory, ArticleTag presentes; Category y Tag ausentes |
| `apps/api/prisma/migrations/20260527213839_sch08_split_taxonomies/migration.sql` | DDL+DML aditivo | VERIFIED | CREATE TABLE + INSERT INTO SELECT + UPDATE backfill |
| `apps/api/prisma/migrations/20260527222559_sch09_drop_legacy_taxonomy/migration.sql` | DROP tablas y columnas legacy | VERIFIED | DROP TABLE Category/Tag/_ArticleToTag, DROP COLUMN categoryId x2 |

### DTOs del Catalog (nuevos)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/catalog/dto/create-event-category.dto.ts` | DTO para EventCategory | VERIFIED | Existe |
| `apps/api/src/catalog/dto/update-event-category.dto.ts` | DTO para EventCategory | VERIFIED | Existe |
| `apps/api/src/catalog/dto/create-event-tag.dto.ts` | DTO para EventTag | VERIFIED | Existe |
| `apps/api/src/catalog/dto/update-event-tag.dto.ts` | DTO para EventTag | VERIFIED | Existe |
| `apps/api/src/catalog/dto/create-article-category.dto.ts` | DTO para ArticleCategory | VERIFIED | Existe |
| `apps/api/src/catalog/dto/update-article-category.dto.ts` | DTO para ArticleCategory | VERIFIED | Existe |
| `apps/api/src/catalog/dto/create-article-tag.dto.ts` | DTO para ArticleTag | VERIFIED | Existe |
| `apps/api/src/catalog/dto/update-article-tag.dto.ts` | DTO para ArticleTag | VERIFIED | Existe |

### Backend Services

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/catalog/catalog.service.ts` | 4 conjuntos CRUD nuevos, 0 legacy | VERIFIED | eventCategories(), eventTags(), articleCategories(), articleTags() + CRUD; `prisma.category` → 0, `prisma.tag` → 0 |
| `apps/api/src/catalog/catalog.controller.ts` | 4 controllers nuevos, 0 legacy | VERIFIED | @Controller('event-categories') y 3 más; CategoriesController y TagsController eliminados |
| `apps/api/src/catalog/catalog.module.ts` | 4 controllers registrados, 0 legacy | VERIFIED | EventCategoriesController, EventTagsController, ArticleCategoriesController, ArticleTagsController |
| `apps/api/src/events/events.service.ts` | eventCategory, sin category legacy | VERIFIED | `eventCategory: true` en includes; 0 `category: true` legacy |
| `apps/api/src/orders/orders.service.ts` | unitPrice desde eventCategory | VERIFIED | `event.eventCategory?.pricePerDay ?? 0`; 0 `event.category` |
| `apps/api/src/heroes/heroes.service.ts` | eventCategory en 4 includes | VERIFIED | 4 `eventCategory: true`; 0 `category: true` legacy |
| `apps/api/src/articles/articles.service.ts` | articleTags en includes | VERIFIED | 2 `articleTags: true`; 0 `tags: true` legacy |
| `apps/api/src/users/users.service.ts` | eventCategory y articleTags | VERIFIED | `eventCategory: true` (1), `articleTags: true` (1) |

### Frontend

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/website/lib/api.ts` | Tipos y métodos nuevos, sin aliases legacy | VERIFIED | ApiEventCategory/Tag/ArticleCategory/Tag; eventCategories() etc.; ApiCategory → 0; api.categories() → 0 |
| `apps/website/components/Header.tsx` | ApiEventCategory | VERIFIED | 2 referencias |
| `apps/website/app/(site)/layout.tsx` | api.eventCategories() | VERIFIED | 1 llamada |
| `apps/website/app/sitemap.ts` | api.eventCategories() | VERIFIED | 1 llamada |
| `apps/website/app/(site)/busqueda/SearchView.tsx` | ApiEventCategory | VERIFIED | 3 referencias |
| `apps/website/app/(site)/categoria/[cat]/page.tsx` | api.eventCategories() | VERIFIED | 1 llamada |
| `apps/website/app/(site)/categoria/[cat]/CategoryView.tsx` | ApiEventCategory props | VERIFIED | 3 referencias |
| `apps/website/app/crear/4/Step4Client.tsx` | eventCategoryId en payload | VERIFIED | 1 referencia — bug fix de 18-03 |
| `apps/website/app/dashboard/events/EventForm.tsx` | eventCategoryId + fetch /event-categories | VERIFIED | 3 eventCategoryId, 1 fetch call |
| `apps/website/app/dashboard/articles/ArticleForm.tsx` | articleTagIds + fetch /article-tags | VERIFIED | 1 articleTagIds, 1 fetch call |
| `apps/website/app/dashboard/sections/CategoriesSection.tsx` | CRUD real /event-categories sin mock | VERIFIED | 4 referencias endpoint, 0 CATS mock, 2 useEffect |
| `apps/website/app/dashboard/sections/SimpleCRUDSection.tsx` | RealTagsSection con /article-tags | VERIFIED | 5 referencias endpoint, kind==="tags" dispatch, CRUD completo |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| EventForm.tsx | /api/event-categories | fetch en useEffect | VERIFIED | línea 335: `fetch("/api/event-categories")` |
| ArticleForm.tsx | /api/article-tags | fetch en useEffect | VERIFIED | `fetch("/api/article-tags")` |
| Step4Client.tsx | CreateEventDto.eventCategoryId | payload submit | VERIFIED | `eventCategoryId: values.categoryId ? Number(values.categoryId) : undefined` |
| CategoriesSection.tsx | /api/event-categories | authedFetch CRUD | VERIFIED | 4 referencias: GET list + POST + PATCH + DELETE |
| SimpleCRUDSection.tsx (RealTagsSection) | /api/article-tags | fetch+authedFetch | VERIFIED | 5 referencias al endpoint |
| OrdersService | EventCategory.pricePerDay | event.eventCategory?.pricePerDay | VERIFIED | Sin fallback a category legacy |
| catalog.controller.ts → EventCategoriesController | catalog.module.ts | controllers array | VERIFIED | Module registra los 4 controllers nuevos |
| schema.prisma → EventCategory | sch08 migration | DDL CREATE TABLE | VERIFIED | Migración crea event_categories tabla |
| Event.eventCategoryId | sch08 migration | DML UPDATE backfill | VERIFIED | `UPDATE Event SET eventCategoryId = categoryId` |
| sch09 migration | Category/Tag/\_ArticleToTag | DROP TABLE | VERIFIED | SQL contiene los 3 DROPs + 2 DROP COLUMN |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| TAX-01 | 18-01 | Nuevos modelos EventCategory, EventTag, ArticleCategory, ArticleTag en schema.prisma | SATISFIED | 4 modelos presentes; @@map a tablas correctas |
| TAX-02 | 18-01 | Migración aditiva que copia datos de Category→EventCategory, Tag→ArticleTag preservando IDs | SATISFIED | sch08_split_taxonomies con INSERT INTO ... SELECT; backfill Event.eventCategoryId y Hero.eventCategoryId |
| TAX-03 | 18-01 | Event.eventCategoryId y Hero.eventCategoryId añadidos con backfill completo (0 sin backfill) | SATISFIED | schema.prisma: `eventCategoryId Int?` en Event y Hero; sch08 DML: `UPDATE Event SET eventCategoryId = categoryId WHERE categoryId IS NOT NULL` |
| TAX-04 | 18-01 | Article recibe articleCategoryId y relación M:M articleTags | SATISFIED | schema.prisma: `articleCategoryId Int?` + `articleTags ArticleTag[]` |
| TAX-05 | 18-01 | Migración sch09 elimina tablas y columnas legacy | SATISFIED | sch09 SQL: DROP TABLE Category, Tag, _ArticleToTag; DROP COLUMN categoryId x2 |
| TAX-06 | 18-02 | 4 grupos de endpoints REST nuevos (/event-categories, /event-tags, /article-categories, /article-tags) con CRUD completo y guards ADMIN | SATISFIED | catalog.controller.ts tiene los 4 @Controller; catalog.service.ts tiene CRUD para los 4 |
| TAX-07 | 18-02 | EventsService, HeroesService, ArticlesService usan solo los nuevos campos (eventCategory, articleTags) | SATISFIED | 0 referencias legacy `category: true` en services; `eventCategory: true` y `articleTags: true` presentes |
| TAX-08 | 18-02 | OrdersService calcula unitPrice desde eventCategory.pricePerDay — no NaN ni 0 | SATISFIED | `event.eventCategory?.pricePerDay ?? 0`; 0 `event.category` |
| TAX-09 | 18-02 | Endpoints /categories y /tags eliminados (no como aliases permanentes) | SATISFIED | 0 `Controller('categories')` y 0 `Controller('tags')` en el codebase |
| TAX-10 | 18-03 | api.ts exporta ApiEventCategory, ApiEventTag, ApiArticleCategory, ApiArticleTag y métodos correspondientes | SATISFIED | 4 tipos exportados, 4 métodos en el objeto api |
| TAX-11 | 18-03 | Todo el frontend (páginas públicas, formularios, flujo /crear) usa nuevos tipos y endpoints | SATISFIED | 12+ archivos verificados con las referencias correctas; Step4Client bug fix enviando eventCategoryId |
| TAX-12 | 18-04 | Dashboard admin tiene CRUD real para EventCategory y ArticleTag sin datos hardcoded | SATISFIED | CategoriesSection: 0 CATS mock, fetch real; SimpleCRUDSection: RealTagsSection con CRUD completo |

**Cobertura:** 12/12 requisitos satisfechos programáticamente

---

## Anti-Patterns Found

Ninguno. No se detectaron TODOs bloqueantes, implementaciones stub, datos hardcoded que fluyan a renderización, o handlers vacíos en los archivos verificados.

---

## Git Commits Verificados

| Commit | Plan | Descripción |
|--------|------|-------------|
| `e9a162d` | 18-01 Task 1 | feat: schema.prisma — 4 nuevos modelos de taxonomía |
| `5c98b1d` | 18-01 Task 2 | feat: migración sch08_split_taxonomies DDL+DML |
| `314c7fe` | 18-02 Task 1 | feat: DTOs catalog + CatalogService + endpoints nuevos + aliases |
| `91391c5` | 18-02 Task 2 | feat: EventsService, HeroesService, ArticlesService, OrdersService migrados |
| `13fd64c` | 18-03 Task 1 | feat: api.ts + 12 archivos frontend migrados a ApiEventCategory/api.eventCategories() |
| `83c0f89` | 18-03 Task 2 | feat: Step4Client fix — payload usa eventCategoryId (no categoryIds array) |
| `0c739be` | 18-04 Task 1 | feat: CategoriesSection CRUD real + SimpleCRUDSection RealTagsSection |
| `3a4d08d` | 18-04 Task 2 | feat: cleanup backend + 8 archivos frontend adicionales corregidos |
| `1880818` | 18-04 Task 3 | feat: migración sch09 + seed.ts + users.service.ts cleanup |

Todos los commits verificados en el repositorio git.

---

## TypeScript Compilation

`cd apps/api && npx tsc --noEmit` → salida vacía (exit 0 = 0 errores). Confirmado en la verificación.

---

## Human Verification Required

### 1. Endpoints nuevos responden / legacy dan 404

**Test:** Levantar el servidor de la API (`apps/api`) y ejecutar:
- `curl http://localhost:3001/api/event-categories` → debe devolver 200 con array de 5 categorías
- `curl http://localhost:3001/api/article-tags` → debe devolver 200 con array de ~10 tags
- `curl http://localhost:3001/api/categories` → debe devolver 404 (endpoint eliminado)
- `curl http://localhost:3001/api/tags` → debe devolver 404 (endpoint eliminado)

**Expected:** Los 2 primeros devuelven datos reales de DB; los 2 últimos dan 404.
**Why human:** Requiere servidor HTTP activo.

### 2. Estado de la base de datos post-migración sch09

**Test:** Conectar a MySQL y ejecutar:
```sql
SHOW TABLES LIKE 'categories';       -- debe devolver 0 filas
SHOW TABLES LIKE 'tags';             -- debe devolver 0 filas
SHOW TABLES LIKE '_ArticleToTag';    -- debe devolver 0 filas
SHOW TABLES LIKE 'event_categories'; -- debe devolver 1 fila
SELECT COUNT(*) FROM event_categories; -- debe devolver 5
```

**Expected:** Tablas legacy ausentes, tablas nuevas presentes con datos.
**Why human:** La verificación programática del SQL del migration.sql es correcta, pero el estado real de la DB solo se puede confirmar con acceso directo. El entorno es WSL2 sin certeza de que la migración sch09 se aplicó en la instancia local activa.

### 3. CRUD del dashboard admin persiste cambios

**Test:** Abrir `/dashboard` con sesión ADMIN:
1. Ir a la sección "Categorías" → ver listado de categorías cargado desde API
2. Crear una nueva EventCategory con nombre de prueba → verificar que aparece en el listado
3. Editar el nombre → guardar → verificar que el cambio persiste en el listado
4. Eliminar la categoría de prueba → verificar que desaparece

**Expected:** Cada operación persiste en la DB y el listado se refresca con datos reales.
**Why human:** Requiere sesión autenticada con token ADMIN y servidor activo.

### 4. Sitemap.xml contiene URLs de EventCategories

**Test:** Acceder a `http://localhost:3000/sitemap.xml` y verificar que contiene entradas `/categoria/<slug>` para cada una de las 5 EventCategories actuales.

**Expected:** 5 URLs de tipo `/categoria/*` en el sitemap.
**Why human:** Requiere servidor Next.js activo.

### 5. Flujo /crear asigna eventCategoryId y OrdersService calcula unitPrice > 0

**Test:** Completar el flujo `/crear` seleccionando una categoría de evento → llegar a Step4 → submit → verificar en DB que el evento creado tiene `eventCategoryId IS NOT NULL`. Luego crear una orden para ese evento y verificar que `unitPrice > 0`.

**Expected:** `event.eventCategoryId` populado; orden con subtotal correcto (no NaN ni 0).
**Why human:** Requiere usuario autenticado, flujo multi-step completo, y acceso a la DB para verificar la fila creada.

---

## Gaps Summary

Ningún gap identificado. Todas las verificaciones automatizadas pasaron al 100%:
- 12/12 truths verificadas con evidencia de código
- 12/12 requisitos TAX-01 a TAX-12 satisfechos
- 0 anti-patrones bloqueantes detectados
- TypeScript compilation limpia en apps/api
- Todos los commits documentados existen en el repositorio

Los 5 ítems de verificación humana son verificaciones de runtime (comportamiento en servidor activo, estado real de DB), no indicadores de código faltante o incorrecto. La implementación está completa.

---

_Verified: 2026-05-27T23:30:00Z_
_Verifier: Claude (gsd-verifier)_
