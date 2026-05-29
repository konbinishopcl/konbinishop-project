---
phase: 28-articulos-multiples-categorias
plan: "03"
subsystem: api
tags: [articles, many-to-many, dto, prisma, nestjs]
dependency_graph:
  requires: ["28-01"]
  provides: ["28-04", "28-05", "28-06"]
  affects: ["articles-service", "articles-dtos"]
tech_stack:
  added: []
  patterns: ["Prisma m2m connect/set", "DTO array validation @IsArray @IsInt each"]
key_files:
  created: []
  modified:
    - apps/api/src/articles/articles.service.ts
    - apps/api/src/articles/dto/create-article.dto.ts
    - apps/api/src/articles/dto/update-article.dto.ts
    - apps/api/src/articles/dto/create-sponsored-article.dto.ts
decisions:
  - "D-05: articleCategoryIds?: number[] in all 3 DTOs with @IsArray() @IsInt({ each: true }) validation"
  - "D-06: External query param ?articleCategory=slug unchanged; only Prisma where clause updated to { articleCategories: { some: { slug } } }"
  - "D-07: Both ARTICLE_INCLUDE and ARTICLE_DETAIL_INCLUDE use articleCategories: true (m2m relation)"
  - "update() uses { set: ids.map(id => ({ id })) } for m2m (not disconnect: true) matching articleTags pattern"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-29"
  tasks_completed: 2
  files_modified: 4
---

# Phase 28 Plan 03: API Articles Many-to-Many Migration Summary

**One-liner:** Migrated articles API layer from single articleCategory FK to many-to-many articleCategories relation — 3 DTOs + service include/where/create/update/createSponsored.

## What Was Built

The API layer for articles now fully supports the many-to-many relationship with `ArticleCategory` established in Plan 01. All entry points (DTOs, service queries, service mutations) were updated atomically.

### Task 1: 3 DTOs migrated (commit ffa8238)

Replaced the singular `articleCategoryId?: number` field in all three DTOs with the array form:

```typescript
@ApiPropertyOptional({ type: [Number], example: [3, 5], description: 'IDs de categorías del artículo (many-to-many)' })
@IsOptional()
@IsArray()
@IsInt({ each: true })
articleCategoryIds?: number[];
```

Files: `create-article.dto.ts`, `update-article.dto.ts`, `create-sponsored-article.dto.ts`.

### Task 2: articles.service.ts updated (commit 0a04a1e)

Six changes in service:

1. `ARTICLE_INCLUDE`: `articleCategory: true` → `articleCategories: true`
2. `ARTICLE_DETAIL_INCLUDE`: `articleCategory: true` → `articleCategories: true`
3. `findAll where`: `{ articleCategory: { slug } }` → `{ articleCategories: { some: { slug: query.articleCategory } } }`
4. `create()`: single `connect` → multi-connect via `articleCategoryIds.map((id) => ({ id }))`
5. `update()`: conditional `disconnect` → `{ set: dto.articleCategoryIds.map((id) => ({ id })) }` (m2m set pattern)
6. `createSponsored()`: single `connect` → multi-connect via `articleCategoryIds`

## Verification

- `grep -c "articleCategories: true" articles.service.ts` → 2 (both includes)
- `grep "articleCategories: { some: { slug: query.articleCategory } }"` → present
- `grep "articleCategories: { set: dto.articleCategoryIds"` → present
- `grep -cE "articleCategory:"` → 0 (no singular relation usage)
- `grep -cE "articleCategoryId\b"` → 0 (no singular field usage)
- `pnpm exec tsc --noEmit` → 0 errors in articles files

## Deviations from Plan

### Verify script false-positive for articleCategoryId substring

The plan's Task 2 verify script included:
```bash
grep -q "articleCategoryId" src/articles/articles.service.ts && exit 1
```

This grep matches `articleCategoryIds` (plural) as a substring, so it would always exit 1 even when the code is correct — because the correct implementation uses `dto.articleCategoryIds` everywhere. The verification was performed using word-boundary regex `grep -cE "articleCategoryId\b"` which correctly returns 0. The code is correct per all acceptance criteria; the script had a substring false-positive bug.

No architectural deviations. Plan executed as written.

## Known Stubs

None — all mutations now wire real m2m data through articleCategories.

## Self-Check: PASSED

- `apps/api/src/articles/articles.service.ts` — exists, modified
- `apps/api/src/articles/dto/create-article.dto.ts` — exists, modified
- `apps/api/src/articles/dto/update-article.dto.ts` — exists, modified
- `apps/api/src/articles/dto/create-sponsored-article.dto.ts` — exists, modified
- Commits ffa8238 and 0a04a1e verified in git log
