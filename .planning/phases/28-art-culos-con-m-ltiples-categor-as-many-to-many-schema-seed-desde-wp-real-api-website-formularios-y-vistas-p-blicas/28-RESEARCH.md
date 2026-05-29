# Phase 28: Artículos con múltiples categorías — Research

**Researched:** 2026-05-29
**Domain:** Prisma implicit many-to-many migration, seed data transformation, NestJS DTO refactor, Next.js frontend display
**Confidence:** HIGH

## Summary

Phase 28 is a contained refactor that mirrors an exact pattern already in the codebase: `ArticleTag` implicit many-to-many. The schema change (`articleCategoryId FK` → implicit `articleCategories []`) follows the same SQL structure as `_ArticleToArticleTag` created in Phase 18. Every API, seed, and frontend change has a direct analog in existing code.

The primary risk is not the application logic — it is the migration mechanism. This project uses hand-written SQL migrations applied via `prisma migrate deploy` or `migrate resolve --applied`. A `prisma migrate dev` workflow will not work in this environment. The migration SQL must create the `_ArticleToArticleCategory` pivot table, drop the `articleCategoryId` column, drop its FK and index, and follow the section ordering pattern established in Phase 18 (`_sch08_split_taxonomies`): A) CreateTable → B) AddForeignKey → optionally C) Drop old column.

The seed update path is also well-defined: a lightweight TypeScript script (`update-article-categories.ts`) calls the WP REST API (`?_fields=id,slug,categories`), transforms `categorySlug: string | null` → `categorySlugs: string[]` using the same slug-normalisation function (`cleanWpSlug`) already in `export-wp-articles.ts`, writes `articles.json`, then `seed.ts` picks it up and uses `connect: categorySlugs.map(slug => ({ slug }))` — the exact pattern used for tags (`connect: tagIds.map(id => ({ id }))`).

**Primary recommendation:** Follow the `ArticleTag` implicit m2m pattern end-to-end; it is a HIGH-confidence blueprint for every layer of this change.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Seed data — actualización de articles.json**
- D-01: Crear `prisma/update-article-categories.ts` — llama WP API (`?_fields=id,slug,categories`), cruza por slug contra `articles.json`, reemplaza `categorySlug: string | null` por `categorySlugs: string[]`. Imágenes ya descargadas no se tocan.
- D-02: Catch-all a excluir: `["cultura-otaku", "anime", "uncategorized"]`. Si solo hay catch-alls, incluirlos.
- D-03: Todo cambio de datos pasa por seeder (`seed.ts` → `articles.json`), nunca directo a DB.

**Schema y migración Prisma**
- D-04: Quitar `articleCategoryId Int?` y la relación `articleCategory ArticleCategory?` de `Article`. Agregar relación implícita many-to-many: `articleCategories ArticleCategory[]` en `Article` y `articles Article[]` en `ArticleCategory`.

**API — articles.service y DTOs**
- D-05: `articleCategoryId?: number` en los 3 DTOs cambia a `articleCategoryIds?: number[]`.
- D-06: Filtro `?articleCategory=slug` mantiene la misma interfaz, lógica cambia a `articleCategories: { some: { slug } }`.
- D-07: En `include`, `articleCategory: true` cambia a `articleCategories: true`.

**Seed.ts**
- D-08: `articles.json` pasa de `{ categorySlug: string | null }` a `{ categorySlugs: string[] }`. Loop de seed usa `connect: categorySlugs.map(slug => ({ slug }))`.

**Frontend — display**
- D-09: Mostrar primera del array `articleCategories[0]`. No multi-badge.

**Frontend — formularios**
- D-10: Agregar selector de categorías múltiples a `ArticleForm` usando mismo patrón que tags (checkboxes con búsqueda). Mismo patrón para vista pública si existe ese campo.
- D-11: En `ArticlesSection` del dashboard admin, mostrar primera categoría o badge con conteo (ej: "Anime +2").

**Scripts auxiliares**
- D-12: `export-wp-articles.ts` actualizar para generar `categorySlugs: string[]` con la misma lógica catch-all de D-02.
- D-13: `recategorize-articles.ts` eliminar — era workaround para FK única, ya no aplica.

### Claude's Discretion
- Diseño exacto del selector de categorías en formularios
- Orden de categorías en el array (ej: más específica primero)
- Manejo de `articleCategories: []` en display — mostrar "NOTICIAS" como fallback

### Deferred Ideas (OUT OF SCOPE)
- Filtrar artículos por múltiples categorías simultáneas en URL (ej: `?cats=anime,naruto`)
- Mostrar badges de todas las categorías en ArticleCard (diseño multi-badge)
</user_constraints>

---

## Standard Stack

### Core (all existing in the project)

| Component | Current State | Change Required |
|-----------|--------------|-----------------|
| Prisma 6 + MySQL | `articleCategoryId Int?` FK on `Article` | Drop FK/column, add implicit m2m |
| NestJS 11 `articles.service.ts` | `articleCategory: true` include, scalar `connect`/`disconnect` | `articleCategories: true`, `{ set: [] }` / `{ connect: [...] }` |
| 3 DTOs (`create`, `update`, `create-sponsored`) | `articleCategoryId?: number` | `articleCategoryIds?: number[]` with `@IsArray() @IsInt({ each: true })` |
| `seed.ts` | `categorySlug: string | null` → `articleCategoryId` | `categorySlugs: string[]` → `connect: categorySlugs.map(slug => ({ slug }))` |
| Next.js `ArticleForm.tsx` | Tags multi-select (checkboxes + search) | Add identical pattern for categories |
| `lib/api.ts` `ApiArticle` type | `articleCategory: ApiArticleCategory | null` | `articleCategories: ApiArticleCategory[]` |

### No new dependencies required

All patterns already exist in the codebase. No new npm packages needed.

---

## Architecture Patterns

### Pattern 1: Implicit Many-to-Many (Prisma) — exact blueprint

The codebase already uses implicit m2m for `ArticleTag` and `EventTag`. The `_ArticleToArticleTag` pivot table in MySQL follows Prisma's naming convention `_ArticleToArticleCategory`.

**Current ArticleTag pattern (HIGH confidence — source: `schema.prisma`):**
```prisma
// ArticleTag side
model ArticleTag {
  articles  Article[]
  ...
}

// Article side
model Article {
  articleTags ArticleTag[]
  ...
}
```

**Target ArticleCategory pattern (replicate exactly):**
```prisma
// ArticleCategory side — add
model ArticleCategory {
  articles Article[]   // ADD this field
  ...
}

// Article side — replace FK with m2m
model Article {
  // REMOVE: articleCategory   ArticleCategory? @relation(...)
  // REMOVE: articleCategoryId Int?
  articleCategories ArticleCategory[]  // ADD
  ...
}
```

### Pattern 2: Service update — include and where (HIGH confidence — source: `articles.service.ts`)

**Current:**
```typescript
const ARTICLE_INCLUDE = {
  articleTags: true,
  articleCategory: true,   // ← FK relation
  ...
};

// findAll where:
...(query.articleCategory && { articleCategory: { slug: query.articleCategory } }),

// create:
articleCategory: dto.articleCategoryId ? { connect: { id: dto.articleCategoryId } } : undefined,

// update:
...(dto.articleCategoryId !== undefined && {
  articleCategory: dto.articleCategoryId
    ? { connect: { id: dto.articleCategoryId } }
    : { disconnect: true },
}),
```

**After Phase 28:**
```typescript
const ARTICLE_INCLUDE = {
  articleTags: true,
  articleCategories: true,  // ← implicit m2m
  ...
};

// findAll where:
...(query.articleCategory && {
  articleCategories: { some: { slug: query.articleCategory } }
}),

// create:
articleCategories: dto.articleCategoryIds?.length
  ? { connect: dto.articleCategoryIds.map(id => ({ id })) }
  : undefined,

// update (replaces all, same pattern as articleTags):
...(dto.articleCategoryIds !== undefined && {
  articleCategories: { set: dto.articleCategoryIds.map(id => ({ id })) },
}),
```

### Pattern 3: Seed connect by slug (HIGH confidence — source: `seed.ts` existing tags pattern)

**Current (tags, by id):**
```typescript
articleTags: tagIds.length ? { connect: tagIds.map(id => ({ id })) } : undefined,
```

**After Phase 28 (categories, by slug — D-08):**
```typescript
const categorySlugs: string[] = art.categorySlugs ?? [];
// in create:
articleCategories: categorySlugs.length
  ? { connect: categorySlugs.map(slug => ({ slug })) }
  : undefined,
// in update (upsert):
articleCategories: { set: categorySlugs.map(slug => ({ slug })) },
```

### Pattern 4: ArticleForm category multi-select (follows existing tags UI)

The existing tag selector in `ArticleForm.tsx` uses:
- `useState<number[]>` for selected IDs
- `fetch("/api/article-tags")` on mount
- Checkbox list with text search filter
- `selectedTagIds` sent as `articleTagIds` in payload

Replicate exactly for categories:
- `useState<number[]>` → `selectedCategoryIds`
- `fetch("/api/article-categories")` on mount (proxy exists via `[...path]/route.ts`)
- Same checkbox/search UI
- Send as `articleCategoryIds`
- `InitialArticle` needs `articleCategories?: { id: number; name: string | null; slug: string }[]`

### Pattern 5: Primary category display helper

All display sites use `a.articleCategory?.name ?? fallback`. After migration all access `a.articleCategories[0]`. Extract one shared helper to keep all display sites consistent (D-09):

```typescript
// In ArticleCard.tsx (then import in other views)
export function primaryCategory(a: ApiArticle): string {
  if (a.articleCategories?.[0]?.name) return a.articleCategories[0].name;
  if (a.articleTags?.[0]?.name)       return a.articleTags[0].name;
  return "Noticias";
}
```

This helper replaces the inline `getCat()` function in `ArticleCard.tsx` and `ArticleView.tsx`.

### Anti-Patterns to Avoid

- **`prisma migrate dev`**: Project uses `prisma migrate deploy` + hand-written SQL. Using `migrate dev` in a non-interactive environment breaks.
- **Disconnect pattern on update**: For m2m relations, Prisma uses `{ set: [] }` to clear all, not `{ disconnect: true }`. The old `disconnect: true` only works for FK relations.
- **Forgetting to update both `ARTICLE_INCLUDE` and `ARTICLE_DETAIL_INCLUDE`**: Both constants in `articles.service.ts` must be updated.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Pivot table creation | Custom SQL pivot table | Prisma implicit m2m — name `_ArticleToArticleCategory` auto-generated |
| Category filter query | Custom JOIN SQL | Prisma `articleCategories: { some: { slug } }` |
| Slug normalisation in update script | New slugify logic | Copy `cleanWpSlug` from `export-wp-articles.ts` (line ~170) |
| Array validation in DTOs | Custom validator | `@IsArray() @IsInt({ each: true })` same as existing `articleTagIds` |

---

## Runtime State Inventory

This phase is a schema migration + data rebuild — relevant categories apply.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `Article.articleCategoryId` FK column in production DB (437 articles in seed, unknown in prod) | Migration SQL drops column + FK; full re-seed rebuilds pivot via `seed.ts`. D-03 confirmed: seed-only flow. |
| Live service config | None — article categories are DB data served via API, not config | None |
| OS-registered state | None — no task scheduler or pm2 references to article category | None |
| Secrets/env vars | None — no env var references to `articleCategoryId` | None |
| Build artifacts | `apps/api/dist/` — compiled JS, rebuilt automatically by NestJS build | Auto-rebuilt on next `pnpm build` |

**Key data note:** `recategorize-articles.ts` (to be deleted per D-13) writes directly to the DB. After this phase, it is replaced by `update-article-categories.ts` which writes only to `articles.json`, then `seed.ts` rebuilds the DB from JSON (D-03).

---

## Common Pitfalls

### Pitfall 1: Migration mechanism — hand-written SQL required

**What goes wrong:** Running `prisma migrate dev` in this non-interactive environment fails or creates a migration that diverges from what `migrate deploy` applies.

**Why it happens:** STATE.md Phase 08-01 documents: "Migration manual via SQL + migrate deploy por entorno no-interactivo." Phase 18 migrations were hand-edited SQL with `migrate resolve --applied`.

**How to avoid:** Create migration directory `YYYYMMDDHHMMSS_sch11_article_category_m2m/migration.sql` manually. SQL order must be:
1. `CREATE TABLE _ArticleToArticleCategory` (pivot, same structure as `_ArticleToArticleTag`)
2. `DROP INDEX Article_articleCategoryId_idx` (if exists)
3. `ALTER TABLE Article DROP FOREIGN KEY` (the FK to article_categories)
4. `ALTER TABLE Article DROP COLUMN articleCategoryId`

Then register: `npx prisma migrate resolve --applied YYYYMMDDHHMMSS_sch11_article_category_m2m`

**Reference:** `20260527213839_sch08_split_taxonomies/migration.sql` — shows exact SQL for creating `_ArticleToArticleTag` pivot.

### Pitfall 2: Slug mismatch in update-article-categories.ts

**What goes wrong:** WP REST API returns post slugs that may include URL-encoded characters (e.g. `%c3%b3` for `ó`). If the script compares raw WP slugs against `articles.json` slugs (which were processed by `cleanWpSlug` = `slugify(decodeURIComponent(slug))`), the cross-reference silently misses articles.

**Why it happens:** `export-wp-articles.ts` normalises slugs via `cleanWpSlug` before writing to JSON. The WP API returns the raw slug.

**How to avoid:** In `update-article-categories.ts`, apply the same `cleanWpSlug` function to WP post slugs before looking them up in the JSON map. Copy the function from `export-wp-articles.ts` lines ~170-176.

### Pitfall 3: Catch-all set discrepancy — `anime` must be added

**What goes wrong:** Existing `export-wp-articles.ts` and `recategorize-articles.ts` use `CATCHALL = new Set(['cultura-otaku', 'uncategorized'])`. D-02/D-12 add `anime` to this set. If the new `update-article-categories.ts` uses the old 2-item set, articles that only have `["anime", "naruto"]` get `["anime", "naruto"]` instead of `["naruto"]`.

**How to avoid:** `const CATCHALL = new Set(['cultura-otaku', 'anime', 'uncategorized'])` — 3 items in all three script contexts (new update script, updated export script).

### Pitfall 4: `articleCategory` vs `articleCategories` in NoticiasHubView rails

**What goes wrong:** `NoticiasHubView` groups articles into rails by computing `catCounts[a.articleCategory?.slug]`. After migration, `articleCategory` is gone from the API response — rails render empty.

**Why it happens:** The grouping logic reads from `a.articleCategory?.slug` (singular FK), not from the array.

**How to avoid:** Replace with `a.articleCategories?.[0]?.slug` in the grouping and filtering logic. The rails show articles under their primary (first) category — consistent with D-09.

### Pitfall 5: `InitialArticle` type missing `articleCategories` for edit mode

**What goes wrong:** `ArticleForm` in edit mode loads article data from `/api/articles/:slug`. The `InitialArticle` type does not include `articleCategories`, so the category multi-select opens with nothing pre-selected even when the article has categories.

**How to avoid:** Add `articleCategories?: { id: number; name: string | null; slug: string }[]` to `InitialArticle` type. In `EditArticlePage`, map `data.articleCategories ?? []` into `initial`. Initialise `selectedCategoryIds` from `initial?.articleCategories?.map(c => c.id) ?? []`.

### Pitfall 6: `ArticlesSection.tsx` local `ApiArticle` type out of sync

**What goes wrong:** `ArticlesSection.tsx` defines its own local `ApiArticle` type (lines 19-32) that does not extend from `lib/api.ts`. It currently has `tags: { ... }[]` but no `articleCategory`/`articleCategories`. If the admin list view is updated to show category but the local type is not updated, TypeScript errors.

**How to avoid:** Add `articleCategories?: { id: number; name: string | null; slug: string }[]` to the local `ApiArticle` type in `ArticlesSection.tsx`. The display logic for D-11 reads `a.articleCategories?.[0]?.name`.

---

## Code Examples

### Migration SQL pattern (source: `20260527213839_sch08_split_taxonomies/migration.sql`)

```sql
-- ── A) Create pivot table ──
CREATE TABLE `_ArticleToArticleCategory` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,
    UNIQUE INDEX `_ArticleToArticleCategory_AB_unique`(`A`, `B`),
    INDEX `_ArticleToArticleCategory_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ── B) Add FK for pivot (Prisma requires these) ──
ALTER TABLE `_ArticleToArticleCategory`
  ADD CONSTRAINT `_ArticleToArticleCategory_A_fkey`
  FOREIGN KEY (`A`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `_ArticleToArticleCategory`
  ADD CONSTRAINT `_ArticleToArticleCategory_B_fkey`
  FOREIGN KEY (`B`) REFERENCES `article_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- ── C) Drop the old FK column ──
ALTER TABLE `Article` DROP FOREIGN KEY `Article_articleCategoryId_fkey`;
DROP INDEX `Article_articleCategoryId_idx` ON `Article`;
ALTER TABLE `Article` DROP COLUMN `articleCategoryId`;
```

### update-article-categories.ts skeleton

```typescript
// prisma/update-article-categories.ts
// Idempotent: reads WP API, updates articles.json in place.
// NO DB connection — D-01/D-03.

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import slugify from 'slugify';

const WP_API   = 'https://konbinishop.com/wp-json/wp/v2';
const OUT_FILE = join(process.cwd(), 'prisma', 'data', 'articles.json');
const CATCHALL = new Set(['cultura-otaku', 'anime', 'uncategorized']); // D-02: 3 items

function cleanWpSlug(wpSlug: string): string {
  // Copy exact function from export-wp-articles.ts
  try {
    return slugify(decodeURIComponent(wpSlug), { lower: true, strict: true, locale: 'es' });
  } catch {
    return slugify(wpSlug, { lower: true, strict: true, locale: 'es' });
  }
}

async function main() {
  // 1. Load existing articles.json → map by normalized slug
  const articles = JSON.parse(readFileSync(OUT_FILE, 'utf-8'));
  const bySlug = new Map(articles.map((a: any) => [a.slug, a]));

  // 2. Fetch WP categories (id → slug)
  const wpCats = await fetchWpCategories(); // ?per_page=100&_fields=id,slug
  const wpCatSlug: Record<number, string> = {};
  for (const c of wpCats) wpCatSlug[c.id] = c.slug;

  // 3. Fetch WP posts (slug + categories only — no image download)
  const posts = await fetchAllWpPosts(); // ?_fields=id,slug,categories

  let updated = 0;
  for (const post of posts) {
    const normalizedSlug = cleanWpSlug(post.slug); // ← pitfall 2 prevention
    const article = bySlug.get(normalizedSlug);
    if (!article) continue;

    const catSlugs = (post.categories ?? [])
      .map((id: number) => wpCatSlug[id])
      .filter(Boolean) as string[];

    // D-02: exclude catch-alls if specific alternatives exist
    const specific = catSlugs.filter(s => !CATCHALL.has(s));
    const categorySlugs = specific.length > 0 ? specific : catSlugs;

    article.categorySlugs = categorySlugs; // replaces categorySlug
    delete article.categorySlug;           // remove old field
    updated++;
  }

  writeFileSync(OUT_FILE, JSON.stringify(articles, null, 2), 'utf-8');
  console.log(`✓ Updated ${updated} articles in articles.json`);
}
```

### seed.ts articles loop change

```typescript
// Before:
const articlesData: Array<{
  categorySlug: string | null;
  // ...
}> = JSON.parse(...);

const articleCategoryId = art.categorySlug ? (catBySlug[art.categorySlug] ?? null) : null;
// in upsert:
articleCategoryId,   // scalar

// After:
const articlesData: Array<{
  categorySlugs: string[];
  // ...
}> = JSON.parse(...);

// in upsert create:
articleCategories: art.categorySlugs?.length
  ? { connect: art.categorySlugs.map(slug => ({ slug })) }
  : undefined,

// in upsert update (set replaces all):
articleCategories: { set: (art.categorySlugs ?? []).map(slug => ({ slug })) },
```

---

## Complete Consumer Inventory

All files that reference `articleCategory` (singular FK) and require updating:

### API (`apps/api/`)
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Remove FK field + `@@index`; add `articleCategories ArticleCategory[]` to Article; add `articles Article[]` to ArticleCategory |
| `prisma/seed.ts` | Change data type + connect pattern (D-08) |
| `prisma/data/articles.json` | Run `update-article-categories.ts` script |
| `prisma/export-wp-articles.ts` | `categorySlug: string` → `categorySlugs: string[]` (D-12) |
| `prisma/recategorize-articles.ts` | Delete (D-13) |
| `prisma/update-article-categories.ts` | Create new (D-01) |
| `src/articles/articles.service.ts` | ARTICLE_INCLUDE, ARTICLE_DETAIL_INCLUDE, findAll where, create, update, createSponsored |
| `src/articles/dto/create-article.dto.ts` | `articleCategoryId → articleCategoryIds: number[]` |
| `src/articles/dto/update-article.dto.ts` | same |
| `src/articles/dto/create-sponsored-article.dto.ts` | same |

### Website (`apps/website/`)
| File | Change |
|------|--------|
| `lib/api.ts` (line 272) | `ApiArticle.articleCategory` → `articleCategories: ApiArticleCategory[]` |
| `components/ArticleCard.tsx` | `getCat()` → `primaryCategory()` using `articleCategories[0]` |
| `app/(site)/noticias/NoticiasHubView.tsx` | All 4 `a.articleCategory?.` references; rail grouping logic |
| `app/(site)/noticias/[slug]/ArticleView.tsx` | `getCat()` inline helper → use shared `primaryCategory()` |
| `app/(site)/noticias/categorias/[slug]/NewsCategoryView.tsx` | Any `articleCategory` display references |
| `app/(site)/noticias/categoria/[slug]/NewsCategoryView.tsx` | Same (second route for same view) |
| `components/SearchLightbox.tsx` | Line 81: `a.articleCategory?.name` → `a.articleCategories?.[0]?.name` |
| `app/dashboard/articles/ArticleForm.tsx` | Add category multi-select (D-10); `InitialArticle` type; payload includes `articleCategoryIds` |
| `app/dashboard/articles/[slug]/edit/page.tsx` | Map `data.articleCategories` into `InitialArticle` |
| `app/dashboard/sections/ArticlesSection.tsx` | Local `ApiArticle` type + D-11 display |

**Not changing:**
- `app/(site)/layout.tsx` — already calls `api.articleCategories()` for Header/MegaMenu; no change needed
- `catalog.service.ts` — ArticleCategory CRUD does not change
- `catalog.controller.ts` — endpoints unchanged

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (ts-jest) |
| Config file | `apps/api/jest.config.js` |
| Quick run command | `cd apps/api && pnpm test:audit` (existing spec only) |
| Full suite command | `cd apps/api && pnpm test --no-coverage` |
| E2e suite | `cd apps/api && pnpm test:e2e` (has `describe.skip` per STATE.md Phase 07) |

### Phase Requirements → Test Map

| Behavior | Test Type | Notes |
|----------|-----------|-------|
| Schema: `articleCategoryId` column removed from DB | Manual verification | `prisma migrate deploy` + `prisma db pull` check |
| Schema: `_ArticleToArticleCategory` pivot table exists | Manual verification | Check after migration |
| `seed.ts` seeds articles with multiple categories correctly | Manual (run seed, query DB) | `prisma db seed` then `prisma studio` |
| `articles.service.ts` `findAll` with `?articleCategory=slug` returns correct articles | Unit / integration — manual | Test via `curl /api/articles?articleCategory=anime` |
| `ArticleForm` category multi-select renders + saves | Manual UI test | Create article, assign 2 cats, verify in DB |
| Public display shows first category correctly | Manual UI test | `/noticias` — verify rails + cards |
| `update-article-categories.ts` produces valid JSON | Manual (run script, inspect output) | Inspect 3 sample articles |

### Wave 0 Gaps

No existing unit specs cover the articles service or DTOs. The single existing spec is `src/audit/audit.service.spec.ts`. For this refactor phase, tests are manual-verification oriented — no new spec files are required in Wave 0. The planner should include a verification task for each bullet above.

*(No automated test spec files to create — this is an internal refactor of existing behavior.)*

---

## State of the Art

| Old Approach | Current Approach | When Changed |
|--------------|------------------|--------------|
| Single `articleCategoryId FK` on Article | Implicit many-to-many via Prisma `articleCategories []` | This phase (28) |
| `categorySlug: string \| null` in articles.json | `categorySlugs: string[]` | This phase (28) |
| `recategorize-articles.ts` DB workaround script | `update-article-categories.ts` JSON-only script | This phase (28) — old script deleted |
| `export-wp-articles.ts` outputs `categorySlug: string` | Outputs `categorySlugs: string[]` | This phase (28) |

---

## Open Questions

1. **WP API availability for `update-article-categories.ts`**
   - What we know: `konbinishop.com/wp-json/wp/v2` is used by existing scripts and appears accessible
   - What's unclear: Whether the WP site is still live and the API is reachable in 2026
   - Recommendation: Include a connectivity check at script start; graceful error if API is unreachable. The script is idempotent so it can be re-run.

2. **Order of categories in `categorySlugs[]` array**
   - What we know: D-02 applies catch-all filtering; `specific.length > 0 ? specific : catSlugs`
   - What's unclear: Whether within the specific categories there should be a fixed ordering (most-specific first, alphabetical, or WP API order)
   - Recommendation (Claude's discretion): Use WP API order. Within the specific filtered set, preserve the order returned by WP. Most specific category tends to appear later — reversing is overkill and WP order is deterministic.

---

## Sources

### Primary (HIGH confidence)
- `apps/api/prisma/schema.prisma` — current Article + ArticleCategory model; ArticleTag implicit m2m blueprint
- `apps/api/src/articles/articles.service.ts` — all ARTICLE_INCLUDE, where, create, update, createSponsored patterns
- `apps/api/prisma/seed.ts` — current seeding loop and ArticleTag connect pattern
- `apps/api/prisma/migrations/20260527213839_sch08_split_taxonomies/migration.sql` — pivot table SQL blueprint
- `apps/api/prisma/migrations/20260529141744_add_article_images_gallery/migration.sql` — most recent migration format
- `apps/api/prisma/export-wp-articles.ts` — `cleanWpSlug` function, WP API fetch pattern, catch-all logic
- `apps/api/prisma/recategorize-articles.ts` — (to delete) existing catch-all set `{cultura-otaku, uncategorized}`
- `apps/website/app/dashboard/articles/ArticleForm.tsx` — tag multi-select pattern to replicate for categories
- `apps/website/lib/api.ts` lines 241-284 — `ApiArticle`, `ApiArticleCategory` types
- `apps/api/prisma/data/articles.json` — 437 articles with current `categorySlug: string | null` shape

### Secondary (MEDIUM confidence)
- STATE.md Phase 08-01, 18 — confirms non-interactive migration pattern (`migrate deploy`, `migrate resolve --applied`)
- STATE.md Phase 18-03 — confirms ArticleForm uses `/api/article-tags` and sends `articleTagIds` (category pattern to follow)

## Metadata

**Confidence breakdown:**
- Schema change: HIGH — exact blueprint in same codebase (`_ArticleToArticleTag`)
- Migration mechanism: HIGH — documented in STATE.md, confirmed by migration files
- API / service changes: HIGH — direct code reading of current service
- Seed changes: HIGH — existing seed.ts pattern for tags
- Frontend display: HIGH — `articleCategories[0]` is a straightforward array access
- `update-article-categories.ts` script: MEDIUM — WP API availability not verified at research time; slug normalisation pitfall documented

**Research date:** 2026-05-29
**Valid until:** 2026-06-29 (stable libraries; the main dependency is WP API availability)
