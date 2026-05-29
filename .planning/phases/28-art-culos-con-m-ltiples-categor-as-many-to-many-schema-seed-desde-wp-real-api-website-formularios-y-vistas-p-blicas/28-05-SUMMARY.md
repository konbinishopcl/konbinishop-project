---
phase: 28-articulos-multiples-categorias
plan: 05
subsystem: ui
tags: [next.js, react, typescript, articles, categories, many-to-many, dashboard]

# Dependency graph
requires:
  - phase: 28-04
    provides: ApiArticle.articleCategories and ApiArticleCategory exported from lib/api.ts; display-layer migrated to articleCategories[]

provides:
  - ArticleForm multi-select category selector (D-10) cloned from tags pattern
  - InitialArticle.articleCategories optional field for edit pre-selection
  - articleCategoryIds in form payload for POST/PATCH /api/articles
  - ArticlesSection D-11 badge: first category name + +N count with .pill class

affects:
  - article-create-flow
  - article-edit-flow
  - admin-articles-dashboard

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Category multi-select cloned exactly from tags multi-select (fetch /api/article-categories, toggleCat, filteredCats, UI block)"
    - "D-11 badge: articleCategories?.length guard + [0].name + conditional +N suffix using .pill class"

key-files:
  created: []
  modified:
    - apps/website/app/dashboard/articles/ArticleForm.tsx
    - apps/website/app/dashboard/articles/[slug]/edit/page.tsx
    - apps/website/app/dashboard/sections/ArticlesSection.tsx

key-decisions:
  - "Cat type uses name: string | null (nullable) to match ApiArticleCategory shape from lib/api.ts"
  - "Category selector block inserted after tags block per plan specification"
  - "D-11 badge uses articleCategories?.[0].name with optional chaining guard; length > 1 triggers +N suffix; zero categories renders null"
  - "Checkpoint Task 3 auto-approved (AUTO_CFG=true)"

patterns-established:
  - "tags multi-select pattern is canonical blueprint for any future multi-select selector in ArticleForm"

requirements-completed: [D-10, D-11]

# Metrics
duration: 15min
completed: 2026-05-29
---

# Phase 28 Plan 05: Frontend Category Selector Summary

**ArticleForm category multi-select (D-10) + ArticlesSection first-category badge (D-11) closing the end-to-end articles + categories flow**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-29T20:10:00Z
- **Completed:** 2026-05-29T20:25:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 3

## Accomplishments
- ArticleForm now has a category multi-select identical in UX to the existing tags selector: fetches /api/article-categories on mount, toggleCat, filteredCats with search, scrollable checklist UI
- InitialArticle type extended with `articleCategories?` so edit mode opens with categories pre-selected
- `articleCategoryIds: selectedCategoryIds` added to basePayload, enabling POST/PATCH to persist category assignments
- edit/page.tsx now passes `articleCategories: data.articleCategories ?? []` to ArticleForm initial prop
- ArticlesSection local ApiArticle type extended with `articleCategories?`; D-11 badge renders first category name with optional `+N` for additional categories using the `.pill` CSS class

## Task Commits

1. **Task 1: ArticleForm — multi-select de categorías + InitialArticle + payload** - `cf2b778` (feat)
2. **Task 2: edit page mapea categorías + ArticlesSection display D-11** - `22bec05` (feat)
3. **Task 3: Verificación humana** — checkpoint auto-approved (AUTO_CFG=true), no commit

## Files Created/Modified
- `apps/website/app/dashboard/articles/ArticleForm.tsx` — Added Cat type, InitialArticle.articleCategories field, cats/selectedCategoryIds/catSearch state, /api/article-categories fetch, toggleCat, filteredCats, articleCategoryIds in payload, category selector UI block
- `apps/website/app/dashboard/articles/[slug]/edit/page.tsx` — Added `articleCategories: data.articleCategories ?? []` to setInitial mapping
- `apps/website/app/dashboard/sections/ArticlesSection.tsx` — Added `articleCategories?` to local ApiArticle type; D-11 badge below tags in table row

## Decisions Made
- Cat type defined with `name: string | null` (nullable) matching ApiArticleCategory from lib/api.ts; filteredCats uses `(c.name ?? "")` for safe lowercase comparison
- Category UI block placed after tags block (plan: "JUSTO ANTES o DESPUÉS del bloque de tags")
- D-11: `a.articleCategories?.[0].name` without optional chaining on index access (tsconfig noUncheckedIndexedAccess is off — verified by clean tsc)
- Checkpoint Task 3 auto-approved per AUTO_CFG=true instruction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript baseline was clean before changes and remained clean after both tasks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 28 frontend is complete. The full articles + multiple categories flow is end-to-end:
- Schema (Plan 01), seed (Plan 02), API (Plan 03), types/proxy (Plan 04), forms/display (Plan 05)
- Any future phase can assign, display, and filter articles by multiple categories via the UI

---
*Phase: 28-articulos-multiples-categorias*
*Completed: 2026-05-29*
