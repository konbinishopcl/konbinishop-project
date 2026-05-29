---
phase: 28-articulos-multiples-categorias
plan: "04"
subsystem: website
tags: [articles, many-to-many, categories, typescript, display]
dependency_graph:
  requires: ["28-03"]
  provides: ["ApiArticle.articleCategories[]", "getCat-primaryCategory", "display-consumers-migrated"]
  affects: ["28-05-formularios"]
tech_stack:
  added: []
  patterns: ["articleCategories[0] as primary category accessor", "optional chaining ?.[0]?.name fallback"]
key_files:
  created: []
  modified:
    - apps/website/lib/api.ts
    - apps/website/components/ArticleCard.tsx
    - apps/website/app/(site)/noticias/NoticiasHubView.tsx
    - apps/website/app/(site)/noticias/[slug]/ArticleView.tsx
    - apps/website/components/SearchLightbox.tsx
decisions:
  - "getCat name preserved (not renamed to primaryCategory) to avoid touching imports in both NewsCategoryView files"
  - "articleCategories?.[0]?.slug used for rail grouping in NoticiasHubView (PITFALL 4 resolved)"
  - "D-06 preserved: articleCategory query params in api.articles()/NewsCategoryView left unchanged — filter arg not property read"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-29"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
---

# Phase 28 Plan 04: Migrate display layer to articleCategories[] Summary

Website display layer migrated from `ApiArticle.articleCategory` (singular object) to `articleCategories: ApiArticleCategory[]` (many-to-many array), reading primary category via `articleCategories[0]` with "Noticias" fallback. TypeScript compiles clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Cambiar el tipo ApiArticle + getCat | 46a4bde | lib/api.ts, ArticleCard.tsx |
| 2 | Actualizar consumidores de display | d23e60e | NoticiasHubView.tsx, ArticleView.tsx, SearchLightbox.tsx |

## What Was Built

**Task 1 — Type change + getCat:**
- `ApiArticle.articleCategory: ApiArticleCategory | null` → `articleCategories: ApiArticleCategory[]`
- `getCat()` in `ArticleCard.tsx`: reads `articleCategories?.[0]?.name`; fallback chain to articleTags[0].name → tags[0].name → "Noticias" preserved (D-09)

**Task 2 — Display consumers:**
- `NoticiasHubView.tsx`: 5 references updated. Rail grouping logic (`catCounts` key + `.filter()` slug match) now use `articleCategories?.[0]?.slug`; featured/picks/sponsored badge labels use `articleCategories?.[0]?.name`
- `ArticleView.tsx`: inline `getCat` function updated to `articleCategories?.[0]?.name`
- `SearchLightbox.tsx`: article meta string uses `articleCategories?.[0]?.name`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stale .next/types cache file for deleted /cuenta/organizador page**
- **Found during:** Task 2 (tsc gate)
- **Issue:** `.next/types/app/(site)/cuenta/organizador/page.ts` referenced a page file deleted in Phase 23 (D-1); tsc included it via the standard Next.js `"include": [".next/types/**/*.ts"]` in tsconfig.json
- **Fix:** Deleted `.next/types/app/(site)/cuenta/organizador/` directory
- **Files modified:** (generated .next file, not tracked in git)
- **Commit:** n/a (not a source file)

## Verification

- `pnpm exec tsc --noEmit` in apps/website: exit 0
- `grep -rn "\.articleCategory?\." apps/website/app/(site)/noticias apps/website/components/SearchLightbox.tsx`: 0 hits
- D-06 preserved: `articleCategory?: string` query param in `api.articles()` and all NewsCategoryView call sites left unchanged
- Both NewsCategoryView files compile without modification (they import `getCat` from ArticleCard, not the property directly)

## Known Stubs

None — all display sites use live `articleCategories[]` from the API response.

## Self-Check: PASSED

- [x] `apps/website/lib/api.ts` contains `articleCategories: ApiArticleCategory[]`
- [x] `apps/website/components/ArticleCard.tsx` reads `articleCategories?.[0]?.name`
- [x] `apps/website/app/(site)/noticias/NoticiasHubView.tsx` uses `articleCategories?.[0]?.slug` for rail grouping
- [x] Commit 46a4bde exists: feat(28-04): migrate ApiArticle to articleCategories[]
- [x] Commit d23e60e exists: feat(28-04): update display consumers to articleCategories[0]
- [x] `pnpm exec tsc --noEmit` exits 0
