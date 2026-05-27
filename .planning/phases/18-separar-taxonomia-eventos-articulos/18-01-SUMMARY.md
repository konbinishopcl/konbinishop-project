---
phase: 18-separar-taxonomia-eventos-articulos
plan: 01
subsystem: database
tags: [prisma, mysql, migration, taxonomy, schema]

# Dependency graph
requires:
  - phase: 08-schema-v2
    provides: schema Prisma con Category, Tag, Event, Hero, Article modelos base
provides:
  - "Modelos EventCategory, EventTag, ArticleCategory, ArticleTag en schema.prisma con @@map a tablas event_categories, event_tags, article_categories, article_tags"
  - "Migración SQL 20260527213839_sch08_split_taxonomies aplicada: DDL + DML que copia datos preservando IDs"
  - "Event.eventCategoryId, Hero.eventCategoryId, Article.articleCategoryId columnas nullable con FK"
  - "Datos duplicados: 5 EventCategories, 10 ArticleTags, 17 _ArticleToArticleTag links"
  - "Tablas legacy Category/Tag/_ArticleToTag/categoryId conservadas (cleanup en 18-04)"
affects:
  - 18-02 (backend API split — usa nuevos modelos Prisma)
  - 18-03 (frontend split — necesita endpoints nuevos)
  - 18-04 (cleanup — DROP tablas viejas, requiere que 18-02 y 18-03 migren todas las lecturas)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Schema aditivo-primero: crear nuevas tablas coexistentes antes de eliminar las viejas"
    - "Migración hand-edited: DDL → ADD COLUMN → DML INSERT/UPDATE → AddForeignKey (orden A→B→C→D)"
    - "INSERT INTO ... SELECT FROM para copiar filas preservando IDs entre tablas equivalentes"

key-files:
  created:
    - apps/api/prisma/migrations/20260527213839_sch08_split_taxonomies/migration.sql
  modified:
    - apps/api/prisma/schema.prisma

key-decisions:
  - "Hero reutiliza EventCategory (opción A del RESEARCH): Hero.eventCategoryId apunta a event_categories. Simplifica el split; HeroesService actualiza en 18-02."
  - "Migración reordenada manualmente: Prisma generó AlterTable antes de CreateTable; se reordenó a A→B→C→D para garantizar que las tablas existan antes de los INSERTs DML y antes de las FKs"
  - "Las tablas legacy Category, Tag, _ArticleToTag y las columnas categoryId en Event/Hero NO se eliminan en este plan; la limpieza queda para 18-04"

patterns-established:
  - "Pattern 1: migración hand-edited Prisma — generar con --create-only, reordenar secciones, añadir DML, aplicar con prisma migrate dev"
  - "Pattern 2: verificación de paridad SQL via PrismaClient.$queryRaw (no depender de mysql CLI)"

requirements-completed: [TAX-01, TAX-02, TAX-03, TAX-04, TAX-05]

# Metrics
duration: 30min
completed: 2026-05-27
---

# Phase 18 Plan 01: Separar Taxonomía — Schema + Migración Aditiva Summary

**4 nuevos modelos Prisma (EventCategory, EventTag, ArticleCategory, ArticleTag) + migración MySQL hand-edited que copia 5 categorías y 10 tags preservando IDs, con backfill de eventCategoryId en Event y Hero**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-27T21:35:00Z
- **Completed:** 2026-05-27T22:05:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Schema.prisma extendido con 4 nuevos modelos (EventCategory, EventTag, ArticleCategory, ArticleTag) con relaciones aditivas en Event, Hero y Article; modelos legacy intactos
- Migración `20260527213839_sch08_split_taxonomies` aplicada: DDL crea 6 nuevas tablas + 2 join tables, DML copia datos preservando IDs, backfill completo
- Datos verificados: 5 EventCategories (= 5 Categories), 10 ArticleTags (= 10 Tags), 17 _ArticleToArticleTag links (= 17 _ArticleToTag links), 0 Events sin backfillear, 0 Heroes sin backfillear
- Prisma Client regenerado con prisma.eventCategory, prisma.eventTag, prisma.articleCategory, prisma.articleTag disponibles

## Task Commits

Cada tarea fue commiteada atómicamente:

1. **Task 1: Añadir EventCategory, EventTag, ArticleCategory, ArticleTag al schema.prisma** - `e9a162d` (feat)
2. **Task 2: Migración sch08_split_taxonomies con DDL+DML** - `5c98b1d` (feat)

## Filas copiadas por tabla

| Tabla nueva | Fuente | Filas copiadas |
|-------------|--------|----------------|
| event_categories | Category | 5 |
| article_tags | Tag | 10 |
| _ArticleToArticleTag | _ArticleToTag | 17 |
| event_categories (backfill via Event.eventCategoryId) | Event.categoryId | 0 registros sin backfill |
| event_categories (backfill via Hero.eventCategoryId) | Hero.categoryId | 0 registros sin backfill |

*Nota: 0 sin backfill significa que todos los Events/Heroes que tenían categoryId quedaron correctamente con eventCategoryId asignado.*

## Nombre completo del directorio de migración

`20260527213839_sch08_split_taxonomies`

SHA del commit: `5c98b1d`

## Files Created/Modified

- `apps/api/prisma/schema.prisma` — 4 modelos nuevos añadidos; Event/Hero/Article reciben campos nullable eventCategoryId/articleCategoryId; relaciones M:M eventTags/articleTags; @@index en nuevas FKs
- `apps/api/prisma/migrations/20260527213839_sch08_split_taxonomies/migration.sql` — DDL + DML + AddForeignKey hand-edited (orden A→B→C→D)

## Decisions Made

- **Hero reutiliza EventCategory (opción A del RESEARCH):** Hero.eventCategoryId apunta a event_categories. La categoría en Hero es decorativa (carousel visual label), no de pricing. Simplifica el split ya que las categorías de eventos son las mismas que se muestran en el hero carousel.
- **Migración reordenada manualmente:** Prisma generó AlterTable (ADD COLUMN) ANTES de CreateTable. Se reordenó al patrón A→B→C→D del plan para garantizar que event_categories exista antes de los INSERT INTO y antes de las FKs que la referencian.

## Deviations from Plan

None — plan ejecutado exactamente como estaba escrito. La reordenación del SQL de Prisma era parte del plan (Task 2 dice explícitamente "REORDENAR y AÑADIR DML").

## Issues Encountered

None — migración aplicada sin errores. DB sincronizada en primer intento.

## Recordatorio para 18-04

Las siguientes tablas y columnas SIGUEN EXISTIENDO en la DB y deben limpiarse en el plan 18-04 (después de que 18-02 y 18-03 migren todas las lecturas/escrituras al nuevo modelo):

- `DROP TABLE Category`
- `DROP TABLE Tag`
- `DROP TABLE _ArticleToTag`
- `ALTER TABLE Event DROP COLUMN categoryId`
- `ALTER TABLE Hero DROP COLUMN categoryId`
- `ALTER TABLE Article DROP COLUMN tags` (relación implícita — vía Prisma model Tag)

## User Setup Required

None — no se requiere configuración externa. La migración fue aplicada automáticamente a la DB local.

## Next Phase Readiness

- **18-02 (backend API split):** Listo para empezar. Los modelos EventCategory, EventTag, ArticleCategory, ArticleTag están disponibles en el Prisma Client. CatalogService puede añadir endpoints /event-categories, /event-tags, /article-categories, /article-tags. EventsService puede cambiar EVENT_INCLUDE de `category: true` a `eventCategory: true` (CRÍTICO: mantener OrdersService sincronizado — lee event.category?.pricePerDay).
- **18-03 (frontend split):** Bloqueado hasta que 18-02 esté completo (necesita endpoints nuevos).
- **18-04 (cleanup):** Bloqueado hasta que 18-02 y 18-03 hayan migrado TODAS las lecturas/escrituras a los nuevos modelos.

## Self-Check: PASSED

- `apps/api/prisma/schema.prisma` — FOUND
- `apps/api/prisma/migrations/20260527213839_sch08_split_taxonomies/migration.sql` — FOUND
- `.planning/phases/18-separar-taxonomia-eventos-articulos/18-01-SUMMARY.md` — FOUND
- Commit `e9a162d` (Task 1) — FOUND
- Commit `5c98b1d` (Task 2) — FOUND
- Commit `40f369e` (docs metadata) — FOUND
- Data parity: 5 EventCategories = 5 Categories, 10 ArticleTags = 10 Tags, 17 join links copied — VERIFIED
- Backfill: 0 Events sin backfill, 0 Heroes sin backfill — VERIFIED
- `npx prisma migrate status` → "Database schema is up to date!" — VERIFIED

---
*Phase: 18-separar-taxonomia-eventos-articulos*
*Completed: 2026-05-27*
