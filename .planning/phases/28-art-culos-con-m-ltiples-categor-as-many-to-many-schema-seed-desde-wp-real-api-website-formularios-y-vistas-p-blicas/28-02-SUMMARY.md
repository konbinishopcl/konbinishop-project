---
phase: 28-articulos-multiples-categorias
plan: "02"
subsystem: api/data
tags: [articles, seed, categories, many-to-many, wordpress-export]
dependency_graph:
  requires: ["28-01"]
  provides: ["articles.json with categorySlugs[]", "seed.ts m2m articleCategories", "update-article-categories.ts"]
  affects: ["apps/api/prisma/seed.ts", "apps/api/prisma/data/articles.json"]
tech_stack:
  added: []
  patterns: ["WP API pagination + slug normalization", "anti-P2025 slug filter", "JSON-only idempotent script"]
key_files:
  created:
    - apps/api/prisma/update-article-categories.ts
  modified:
    - apps/api/prisma/data/articles.json
    - apps/api/prisma/seed.ts
    - apps/api/prisma/export-wp-articles.ts
  deleted:
    - apps/api/prisma/recategorize-articles.ts
decisions:
  - "Sweep-after-loop pattern: after WP enrichment loop, unconditional final sweep ensures all 437 articles have categorySlugs[] even if WP coverage is incomplete"
  - "Anti-P2025 knownSlugs filter: skip slugs not in curated DB list rather than auto-create (nameJa required in ArticleCategory would be null → MegaMenu contamination)"
  - "exit 0 on WP failure: JSON not overwritten on network error; script idempotent and re-executable"
metrics:
  duration_minutes: 15
  completed_date: "2026-05-29"
  tasks_completed: 3
  files_changed: 5
---

# Phase 28 Plan 02: Data Layer — update-article-categories.ts + seed.ts m2m + export-wp update Summary

**One-liner:** Idempotent update-article-categories.ts fetches WP API to migrate 437 articles from categorySlug (singular) to categorySlugs[] (array), seed.ts wired to connect ArticleCategory m2m via anti-P2025 slug filter, export-wp updated with 3-item CATCHALL and categorySlugs[] output.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create update-article-categories.ts + regenerate articles.json | 128a2df | `update-article-categories.ts`, `data/articles.json` |
| 2 | Update seed.ts — connect/set articleCategories by slug with anti-P2025 filter | 8eefc2c | `seed.ts` |
| 3 | Update export-wp-articles.ts (D-12) + delete recategorize-articles.ts (D-13) | a9e4a11 | `export-wp-articles.ts`, ~~recategorize-articles.ts~~ |

## Outcome

- **articles.json:** 437/437 articles migrated. 219 now have multiple categories, 0 empty. No `categorySlug` singular key remains.
- **seed.ts:** Uses `knownSlugs` (anti-P2025 filter) + `articleCategories: { set: ... }` (update) / `{ connect: ... }` (create). Zero references to `articleCategoryId` or `art.categorySlug`.
- **export-wp-articles.ts:** CATCHALL expanded to 3 items `['cultura-otaku', 'anime', 'uncategorized']`; now emits `categorySlugs[]` array.
- **recategorize-articles.ts:** Deleted — was a DB-write workaround for the old single-FK; obsolete with m2m + seed-only data mutation (D-13).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Design] Sweep-after-loop pattern for complete migration guarantee**
- **Found during:** Task 1 design (advisor review)
- **Issue:** The plan's per-WP-post loop (step 6: "if not found, continue") would leave articles unmatched by current WP posts without `categorySlugs`, causing the acceptance criterion check (`a.some(x=>'categorySlug' in x)`) to fail.
- **Fix:** Added unconditional final sweep after the WP loop: for any article without `categorySlugs`, fall back to `[art.categorySlug]` (or `[]` if null), then `delete art.categorySlug` unconditionally. This is also the offline fallback code path.
- **Files modified:** `apps/api/prisma/update-article-categories.ts`
- **Commit:** 128a2df

## Known Stubs

None. All data is fully wired. The actual seeding (re-seed run) is a phase-level manual checkpoint per the plan's verification note — not a stub.

## Self-Check: PASSED

- [x] `apps/api/prisma/update-article-categories.ts` — created
- [x] `apps/api/prisma/data/articles.json` — 437 articles, all with `categorySlugs[]`, none with `categorySlug`
- [x] `apps/api/prisma/seed.ts` — `articleCategories` connect/set, `knownSlugs` filter, zero `articleCategoryId`
- [x] `apps/api/prisma/export-wp-articles.ts` — CATCHALL 3 items, emits `categorySlugs,`
- [x] `apps/api/prisma/recategorize-articles.ts` — deleted
- [x] Commits: 128a2df, 8eefc2c, a9e4a11 all exist in git log
