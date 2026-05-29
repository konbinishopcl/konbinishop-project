---
phase: 28-articulos-multiples-categorias
verified: 2026-05-29T21:00:00Z
status: passed
score: 15/15 must-haves verified
re_verification: false
---

# Phase 28: Artículos con Múltiples Categorías — Verification Report

**Phase Goal:** Cambiar la relación entre artículos y categorías de FK única (articleCategoryId) a many-to-many. Incluye: migración Prisma (schema + SQL), actualización del seeder de datos (articles.json via update-article-categories.ts), actualización de la API (articles.service + 3 DTOs + query filter), y actualización del frontend (tipos en lib/api.ts, componentes de display, formularios de creación/edición, vistas públicas de noticias).
**Verified:** 2026-05-29T21:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Article model has no articleCategoryId column; has articleCategories ArticleCategory[] m2m | VERIFIED | schema.prisma line 124: `articleCategories ArticleCategory[]`; no `articleCategoryId` in grep |
| 2 | Migration file exists with _ArticleToArticleCategory pivot + backfill | VERIFIED | `migrations/20260529160000_sch11_article_category_m2m/migration.sql` — CREATE pivot + B.5 backfill from existing FK |
| 3 | articles.json uses categorySlugs[] (not categorySlug) | VERIFIED | 0 `categorySlug"` keys; all 437 articles have `categorySlugs` |
| 4 | update-article-categories.ts exists and is JSON-only (no DB) | VERIFIED | File exists; uses readFileSync/writeFileSync only, no PrismaClient |
| 5 | seed.ts uses articleCategories connect/set by slug | VERIFIED | Lines 338/353: `{ set: knownSlugs.map(slug => ({ slug })) }` / `{ connect: knownSlugs.map(slug => ({ slug })) }` |
| 6 | export-wp-articles.ts has 3-item CATCHALL + emits categorySlugs[] | VERIFIED | Line 282: `new Set(['cultura-otaku', 'anime', 'uncategorized'])`; line 285: `categorySlugs` output |
| 7 | recategorize-articles.ts deleted | VERIFIED | File not found in filesystem |
| 8 | All 3 DTOs have articleCategoryIds?: number[] | VERIFIED | create-article.dto.ts:49, update-article.dto.ts:48, create-sponsored-article.dto.ts:44 |
| 9 | ARTICLE_INCLUDE and ARTICLE_DETAIL_INCLUDE use articleCategories: true | VERIFIED | articles.service.ts lines 25 and 32 |
| 10 | findAll where uses articleCategories: { some: { slug } } | VERIFIED | articles.service.ts line 69 |
| 11 | lib/api.ts ApiArticle has articleCategories: ApiArticleCategory[] | VERIFIED | lib/api.ts line 284 |
| 12 | ArticleCard.tsx getCat reads articleCategories[0] | VERIFIED | getCat function line 19: `a.articleCategories?.[0]?.name` |
| 13 | NoticiasHubView.tsx rail grouping uses articleCategories[0].slug | VERIFIED | Lines 30/42: `a.articleCategories?.[0]?.slug` for catCounts key and filter |
| 14 | ArticleForm.tsx has category multi-select with selectedCategoryIds + articleCategoryIds in payload | VERIFIED | Lines 114-115/168-169/192/343/350 — full multi-select wired |
| 15 | ArticlesSection.tsx local ApiArticle type has articleCategories field | VERIFIED | Line 30: `articleCategories?: { id: number; name: string | null; slug: string }[]`; D-11 badge at line 442-444 |

**Score:** 15/15 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/prisma/schema.prisma` | articleCategories m2m, no articleCategoryId | VERIFIED | Line 124 m2m; no FK column |
| `apps/api/prisma/migrations/20260529160000_sch11_article_category_m2m/migration.sql` | Pivot CREATE + backfill + DROP old column | VERIFIED | Full A/B/B.5/C structure |
| `apps/api/prisma/data/articles.json` | categorySlugs[] for all 437 articles | VERIFIED | 437 categorySlugs entries, 0 singular |
| `apps/api/prisma/update-article-categories.ts` | Idempotent JSON-only WP fetcher | VERIFIED | readFileSync/writeFileSync only, no DB |
| `apps/api/prisma/seed.ts` | articleCategories connect/set by slug, knownSlugs filter | VERIFIED | Anti-P2025 knownSlugs filter + correct Prisma syntax |
| `apps/api/prisma/export-wp-articles.ts` | 3-item CATCHALL + categorySlugs[] output | VERIFIED | Set of 3; categorySlugs field |
| `apps/api/prisma/recategorize-articles.ts` | DELETED | VERIFIED | File does not exist |
| `apps/api/src/articles/dto/create-article.dto.ts` | articleCategoryIds?: number[] | VERIFIED | Line 49 |
| `apps/api/src/articles/dto/update-article.dto.ts` | articleCategoryIds?: number[] | VERIFIED | Line 48 |
| `apps/api/src/articles/dto/create-sponsored-article.dto.ts` | articleCategoryIds?: number[] | VERIFIED | Line 44 |
| `apps/api/src/articles/articles.service.ts` | ARTICLE_INCLUDE/DETAIL use articleCategories: true; findAll where uses some | VERIFIED | Lines 25, 32, 69 |
| `apps/website/lib/api.ts` | ApiArticle.articleCategories: ApiArticleCategory[] | VERIFIED | Line 284 |
| `apps/website/components/ArticleCard.tsx` | getCat reads articleCategories[0] | VERIFIED | Lines 18-19 |
| `apps/website/app/(site)/noticias/NoticiasHubView.tsx` | Rail grouping uses articleCategories[0].slug | VERIFIED | Lines 30, 42 |
| `apps/website/app/dashboard/articles/ArticleForm.tsx` | Multi-select + selectedCategoryIds + articleCategoryIds payload | VERIFIED | Full implementation confirmed |
| `apps/website/app/dashboard/sections/ArticlesSection.tsx` | Local ApiArticle with articleCategories; D-11 badge | VERIFIED | Lines 30, 442-444 |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| articles.json categorySlugs[] | seed.ts | knownSlugs filter + connect/set | WIRED | seed.ts line 317 filter + 338/353 connect/set |
| articles.service.ts ARTICLE_INCLUDE | API responses | articleCategories: true | WIRED | Both includes confirmed; all findUnique/findMany use these |
| ArticleForm selectedCategoryIds | POST/PATCH payload | articleCategoryIds: selectedCategoryIds | WIRED | Line 192: present in basePayload |
| query.articleCategory string | Prisma where | articleCategories: { some: { slug } } | WIRED | Line 69 — external param unchanged, Prisma clause updated |
| ApiArticle.articleCategories[] | NoticiasHubView rail grouping | articleCategories?.[0]?.slug | WIRED | Lines 30, 42 |

---

## Requirements Coverage

| Decision | Description | Status | Evidence |
|----------|-------------|--------|---------|
| D-01 | update-article-categories.ts — WP API only, JSON-only, no images | SATISFIED | File exists; WP fetch + writeFileSync, no PrismaClient |
| D-02 | Catch-all exclusion strategy | SATISFIED | update-article-categories.ts implements identical CATCHALL logic |
| D-03 | All data changes via seeder (seed.ts → articles.json), never direct DB | SATISFIED | No direct DB writes in any script |
| D-04 | Remove articleCategoryId, add articleCategories m2m | SATISFIED | schema.prisma + migration confirmed |
| D-05 | 3 DTOs use articleCategoryIds?: number[] | SATISFIED | All 3 DTOs confirmed |
| D-06 | External ?articleCategory=slug unchanged; Prisma where updated | SATISFIED | query-articles.dto.ts line 20 preserves string param; service line 69 uses `some` |
| D-07 | Both includes use articleCategories: true | SATISFIED | Lines 25, 32 in service |
| D-08 | articles.json uses categorySlugs[] | SATISFIED | 437 entries confirmed |
| D-09 | Display uses articleCategories[0] for single-category display | SATISFIED | ArticleCard, NoticiasHubView, ArticleView, SearchLightbox |
| D-10 | ArticleForm category multi-select (same pattern as tags) | SATISFIED | Full multi-select with fetch, toggle, search, payload |
| D-11 | ArticlesSection shows first category + +N badge | SATISFIED | Lines 442-444 confirmed |
| D-12 | export-wp-articles.ts generates categorySlugs[] with 3-item CATCHALL | SATISFIED | Line 282 Set(['cultura-otaku', 'anime', 'uncategorized']) |
| D-13 | recategorize-articles.ts deleted | SATISFIED | File does not exist |

**All 13 locked decisions satisfied.**

---

## Anti-Patterns Found

None. No TODOs, placeholders, empty returns, or stub implementations detected in the modified files. The one notable pattern — `articleCategoryIds: selectedCategoryIds.length ? selectedCategoryIds : undefined` in ArticleForm — is correct behavior (omit empty array rather than send []).

---

## Human Verification Required

### 1. Category multi-select renders correctly in ArticleForm

**Test:** Open the admin dashboard article create/edit form. Verify the category selector appears below the tags block, loads categories from `/api/article-categories`, allows multi-select, and shows selected count.
**Expected:** Multi-select UI matching tags selector pattern; pre-selected in edit mode.
**Why human:** Visual rendering and UX cannot be verified by grep.

### 2. NoticiasHubView rail grouping with real data

**Test:** Visit `/noticias` on the site. Verify articles group into topic rails based on their primary category (articleCategories[0]).
**Expected:** Rails visible with category-based grouping; no empty rails or uncategorized fallback dominating.
**Why human:** Requires live DB data and visual inspection.

### 3. D-11 badge in ArticlesSection

**Test:** Open the admin dashboard articles list. Verify category badge appears next to each article showing the first category name; articles with 2+ categories show "+N" suffix.
**Expected:** "Anime +2" style badge using .pill class.
**Why human:** UI rendering requires browser.

---

## Gaps Summary

No gaps. All 15 must-haves are verified against the actual codebase. The many-to-many migration is end-to-end: schema, migration SQL (with backfill), seed data (articles.json), seed script (seed.ts), API service (include/where/create/update), 3 DTOs, frontend types (lib/api.ts), display components (ArticleCard, NoticiasHubView, ArticleView, SearchLightbox), admin form (ArticleForm), and admin list (ArticlesSection). The workaround script (recategorize-articles.ts) is deleted. All 12 commits claimed in summaries are verified in git log.

---

_Verified: 2026-05-29T21:00:00Z_
_Verifier: Claude (gsd-verifier)_
