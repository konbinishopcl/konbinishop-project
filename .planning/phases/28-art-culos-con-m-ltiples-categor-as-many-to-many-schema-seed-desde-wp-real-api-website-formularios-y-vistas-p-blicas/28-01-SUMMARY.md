---
phase: 28-articulos-multiples-categorias
plan: 01
subsystem: database
tags: [prisma, mysql, schema, migration, many-to-many, articles]

# Dependency graph
requires:
  - phase: 27-dashboard-analytics-pagos-y-graficos-reales-con-recharts
    provides: completed dashboard analytics; stable schema prior to m2m change
provides:
  - Article↔ArticleCategory many-to-many implicit Prisma relation via _ArticleToArticleCategory pivot
  - Prisma client regenerated exposing article.articleCategories[]
  - 437 existing category assignments backfilled into pivot (no data loss)
affects:
  - 28-02 (seed.ts must use connect syntax for articleCategories)
  - 28-03 (articles.service.ts include/select must use articleCategories not articleCategory)
  - Any code that previously referenced articleCategoryId on Article model

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hand-crafted MySQL migration (non-interactive env): create pivot → add FKs → backfill from FK data → drop old FK/index/column"
    - "Data backfill before DROP COLUMN when existing rows have non-null FK values"
    - "Implicit m2m via matching field names: Article.articleCategories[] ↔ ArticleCategory.articles[]"

key-files:
  created:
    - apps/api/prisma/migrations/20260529160000_sch11_article_category_m2m/migration.sql
  modified:
    - apps/api/prisma/schema.prisma

key-decisions:
  - "Added B.5 backfill step to migration SQL: 437 articles had articleCategoryId set — all backfilled into pivot before DROP COLUMN"
  - "Used prisma migrate deploy (not resolve --applied) to actually execute SQL against DB"
  - "ArticleCategory.articles back-relation name unchanged — reused as m2m back-relation without modification"

patterns-established:
  - "m2m pivot backfill pattern: INSERT INTO pivot SELECT id, fk_col FROM table WHERE fk_col IS NOT NULL — run before DROP COLUMN"

requirements-completed: [D-04]

# Metrics
duration: 12min
completed: 2026-05-29
---

# Phase 28 Plan 01: Article↔ArticleCategory Schema Migration Summary

**Converted Article↔ArticleCategory from FK (articleCategoryId) to implicit Prisma m2m via _ArticleToArticleCategory pivot, preserving 437 existing category assignments**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-05-29T19:35:00Z
- **Completed:** 2026-05-29T19:47:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Removed `articleCategoryId` FK column, `@relation`, and `@@index` from Article model in schema.prisma
- Added `articleCategories ArticleCategory[]` implicit m2m relation (mirrors ArticleTag pattern)
- Created hand-crafted migration SQL `sch11_article_category_m2m` with A/B/B.5/C structure
- Backfilled all 437 existing `articleCategoryId` assignments into the pivot table before dropping the column
- Applied migration via `prisma migrate deploy` — pivot table confirmed in DB with 437 rows
- Regenerated Prisma client exposing `article.articleCategories` as m2m relation

## Task Commits

Each task was committed atomically:

1. **Task 1: Actualizar schema.prisma — Article a many-to-many implícito** - `226942a` (feat)
2. **Task 2: Escribir migración SQL hand-crafted sch11 + registrar + regenerar cliente** - `1cba909` (feat)

**Plan metadata:** (final commit)

## Files Created/Modified

- `apps/api/prisma/schema.prisma` - Removed FK relation/column/index, added articleCategories m2m
- `apps/api/prisma/migrations/20260529160000_sch11_article_category_m2m/migration.sql` - Hand-crafted SQL: pivot CREATE + FKs + data backfill + DROP old column

## Decisions Made

- **Data backfill added (deviation from plan):** The plan's migration SQL had no backfill step. Pre-execution check found 437 articles all had `articleCategoryId` set. Added `INSERT INTO _ArticleToArticleCategory SELECT id, articleCategoryId FROM Article WHERE articleCategoryId IS NOT NULL` between FK creation and DROP COLUMN — ensures zero data loss.
- **Used `migrate deploy` not `resolve --applied`:** The plan mentioned both options. Used `deploy` to actually execute the SQL, verified DB state directly (SHOW TABLES, COUNT(*)) rather than trusting `prisma generate` alone.
- **ArticleCategory.articles unchanged:** The back-relation already existed as the FK back-relation; Prisma reuses it as the m2m back-relation without any modification needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added data backfill to migration SQL**
- **Found during:** Task 2 (pre-apply verification)
- **Issue:** Plan's migration SQL dropped the `articleCategoryId` column with no backfill. 437 articles had non-null values — dropping without backfill would destroy all existing category assignments
- **Fix:** Added Section B.5 to migration SQL: `INSERT INTO _ArticleToArticleCategory (A, B) SELECT id, articleCategoryId FROM Article WHERE articleCategoryId IS NOT NULL`
- **Files modified:** apps/api/prisma/migrations/20260529160000_sch11_article_category_m2m/migration.sql
- **Verification:** `SELECT COUNT(*) FROM _ArticleToArticleCategory` returned 437 after migration
- **Committed in:** 1cba909 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical — data integrity)
**Impact on plan:** Essential for data integrity. No data lost from schema conversion.

## Issues Encountered

None — DB FK and index names matched Prisma conventions exactly (`Article_articleCategoryId_fkey`, `Article_articleCategoryId_idx`). Migration applied cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Prisma client ready: `article.articleCategories` exposes the m2m relation
- Wave 2 (Plans 02/03) can now fix `seed.ts` and `articles.service.ts` which reference the removed `articleCategoryId` field
- Note: `seed.ts` and `articles.service.ts` intentionally left broken per plan — fixing them is the explicit scope of Wave 2

---
*Phase: 28-articulos-multiples-categorias*
*Completed: 2026-05-29*
