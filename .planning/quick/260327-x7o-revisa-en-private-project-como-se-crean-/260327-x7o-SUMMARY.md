---
phase: quick
plan: x7o
subsystem: strapi-seeders
tags: [seeders, strapi, content-types, article, hero, spot]
dependency_graph:
  requires: []
  provides: [article-seed-data, hero-seed-data, spot-seed-data]
  affects: [apps/strapi/src/index.ts, apps/strapi/seeders/cleanup.ts]
tech_stack:
  added: []
  patterns: [strapi-entityService-seed-pattern, slugify-for-uid-generation]
key_files:
  created:
    - apps/strapi/seeders/articles.ts
    - apps/strapi/seeders/heroes.ts
    - apps/strapi/seeders/spots.ts
  modified:
    - apps/strapi/seeders/cleanup.ts
    - apps/strapi/src/index.ts
decisions:
  - "Skip media fields (image, desktop_image, tablet_image, mobile_image, thumbnail) in all seeders — require actual file uploads"
  - "Skip relation fields (tags, events, region, commune, categories) in articles/heroes seeders — require pre-existing entity IDs"
  - "Spot existence check uses title filter (no slug field on spot schema)"
  - "Hero slug generated via slugify() matching the regions.ts pattern"
  - "Articles seeded after tags/regions/categories in bootstrap to preserve future relation wiring"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-28T02:59:51Z"
  tasks_completed: 2
  files_changed: 5
---

# Quick Task x7o: Strapi Seeders for Article, Hero, and Spot Summary

**One-liner:** Three new Strapi seeders (articles, heroes, spots) following existing konbini TS pattern, with cleanup and bootstrap wiring for all 6 non-Event content types.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create seeder files for article, hero, and spot | 54c234c | apps/strapi/seeders/articles.ts, heroes.ts, spots.ts |
| 2 | Update cleanup.ts and index.ts to include new seeders | f8596d7 | apps/strapi/seeders/cleanup.ts, apps/strapi/src/index.ts |

## What Was Built

### New Seeder Files

**articles.ts** — 6 sample gaming/anime/geek culture articles covering Comic Con guide, cosplay coverage, eSports tournament review, manga news, LAN party chronicle, and retro gaming feature. Each article has `title`, `slug`, `excerpt`, and full `content` (richtext markdown). Existence check by slug.

**heroes.ts** — 5 sample hero banners for fictional upcoming events (Chile Comic Con, Anime Festival, Geek Night LAN Party, Gaming Expo Chile, Cosplay Battle Festival). All required fields populated: `title`, `slug` (generated via slugify), `date`, `address`, `address_number`, `venue`, `link`, `expiration_date`. Existence check by slug.

**spots.ts** — 5 sample advertising spots for banners/promotions. Fields: `title`, `link`, `expiration_date`. Existence check by title (no slug field on spot schema).

### Updated Files

**cleanup.ts** — Added deletion of articles (step 1), heroes (step 2), and spots (step 3) before existing commune/category/tag/region deletions. Updated total count expression to include all 7 content types.

**index.ts** — Added 3 imports (`populateArticles`, `populateHeroes`, `populateSpots`) and 3 `await` calls after existing seeders (regions, categories, tags), so articles/heroes/spots are seeded after their potential dependencies.

## Verification

- All 3 seeder files exist in `apps/strapi/seeders/`
- `npx tsc --noEmit` passes with zero errors on both checkpoints
- index.ts has 6 occurrences of the new seeder identifiers (3 imports + 3 calls)
- cleanup.ts covers 7 content types in correct dependency order
- No Event seeder created (excluded per requirement)
- No Stats seeder created (no schema)
- No media fields seeded in any file

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all seeded fields contain real sample data. Media and relation fields are intentionally skipped (documented in plan) and do not affect the seeders' purpose of populating text/date content.

## Self-Check: PASSED

- `apps/strapi/seeders/articles.ts` — FOUND
- `apps/strapi/seeders/heroes.ts` — FOUND
- `apps/strapi/seeders/spots.ts` — FOUND
- Commit 54c234c — FOUND
- Commit f8596d7 — FOUND
