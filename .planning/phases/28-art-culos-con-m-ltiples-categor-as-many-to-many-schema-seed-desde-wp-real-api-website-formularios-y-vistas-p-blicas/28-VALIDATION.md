---
phase: 28
slug: articulos-multiples-categorias
status: aligned
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-29
updated: 2026-05-29
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Reconciled with the 5-plan breakdown produced by /gsd:plan-phase (waves 1-4).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (API) + TypeScript tsc (API + website) |
| **Config file** | `apps/api/jest.config.js` |
| **API type-check** | `cd apps/api && pnpm exec tsc --noEmit` |
| **Website type-check** | `cd apps/website && pnpm exec tsc --noEmit` |
| **API unit run** | `cd apps/api && pnpm test --no-coverage` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task's `<automated>` verify (grep / tsc).
- **After every plan wave:** Run the relevant type-check (API tsc after wave 2, website tsc after waves 3-4).
- **Before `/gsd:verify-work`:** API tsc + website tsc both green; manual checkpoints approved.
- **Max feedback latency:** 30 seconds.

---

## Reachable-State Note (CRITICAL)

This phase performs two foundational type breaks that ripple downstream. A full `tsc --noEmit` is NOT a
valid per-plan gate until the wave that lands the type change closes:

- **API:** Plan 01 drops `articleCategoryId` and regenerates the Prisma client. The instant it lands,
  `seed.ts` (Plan 02) and `articles.service.ts` (Plan 03) stop type-checking — intentionally. Full API
  `tsc` only becomes green at the CLOSE of wave 2 (Plans 02 + 03 both landed). Plan 01's gate is
  `prisma validate` + `prisma generate` + migration file exists — NOT API tsc.
- **Website:** Plan 04 changes `lib/api.ts` `ApiArticle.articleCategory` → `articleCategories[]`. Every
  display site breaks until updated in the same plan. Website `tsc` is green at the close of Plan 04, and
  again after Plan 05.

---

## Per-Task Verification Map (5-plan structure)

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 28-01-01 | 01 | 1 | D-04 | schema | `cd apps/api && grep -q "articleCategories ArticleCategory\[\]" prisma/schema.prisma && pnpm exec prisma validate` | ⬜ |
| 28-01-02 | 01 | 1 | D-04 | migration | `ls apps/api/prisma/migrations/*_sch11_article_category_m2m/migration.sql && cd apps/api && pnpm exec prisma generate` | ⬜ |
| 28-02-01 | 02 | 2 | D-01/D-02/D-03 | script+json | `node -e "const a=require('./apps/api/prisma/data/articles.json'); process.exit(a.some(x=>'categorySlug' in x)?1:0)"` | ⬜ |
| 28-02-02 | 02 | 2 | D-08 | seed grep | `cd apps/api && grep -q knownSlugs prisma/seed.ts && ! grep -q articleCategoryId prisma/seed.ts` | ⬜ |
| 28-02-03 | 02 | 2 | D-12/D-13 | scripts | `cd apps/api && ! test -f prisma/recategorize-articles.ts && grep -q categorySlugs, prisma/export-wp-articles.ts` | ⬜ |
| 28-03-01 | 03 | 2 | D-05 | DTO grep | `cd apps/api && grep -q "articleCategoryIds?: number\[\]" src/articles/dto/create-article.dto.ts` | ⬜ |
| 28-03-02 | 03 | 2 | D-06/D-07 | service+tsc | `cd apps/api && grep -q "articleCategories: { some:" src/articles/articles.service.ts` (full API tsc at wave-2 close) | ⬜ |
| WAVE-2-CLOSE | 02+03 | 2 | — | API tsc | `cd apps/api && pnpm exec tsc --noEmit` | ⬜ |
| 28-04-01 | 04 | 3 | D-09 | type+helper | `cd apps/website && grep -q "articleCategories: ApiArticleCategory\[\]" lib/api.ts` | ⬜ |
| 28-04-02 | 04 | 3 | D-09 | display+tsc | `cd apps/website && pnpm exec tsc --noEmit` | ⬜ |
| 28-05-01 | 05 | 4 | D-10 | form+tsc | `cd apps/website && grep -q selectedCategoryIds app/dashboard/articles/ArticleForm.tsx && pnpm exec tsc --noEmit` | ⬜ |
| 28-05-02 | 05 | 4 | D-11 | admin+tsc | `cd apps/website && grep -q "a.articleCategories\[0\].name" app/dashboard/sections/ArticlesSection.tsx && pnpm exec tsc --noEmit` | ⬜ |
| 28-05-03 | 05 | 4 | D-10/D-11 | manual | checkpoint:human-verify (selector + persistencia + badge) | ⬜ |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (Jest + tsc already installed).
- The migration file is created as part of Wave 1 (Plan 01), directory name `*_sch11_article_category_m2m`.

*No additional Wave 0 setup needed.*

---

## Manual-Only Verifications (NOT automated gates)

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Re-seed completo de la DB | D-03/D-08 | DESTRUCTIVO (deleteMany + 437 artículos) + depende de WP API externa | `cd apps/api && pnpm exec ts-node prisma/seed.ts` tras aplicar la migración de Plan 01; luego `prisma studio` para verificar pivot `_ArticleToArticleCategory` poblado |
| articles.json regenerado vía WP API | D-01 | Depende de disponibilidad de `konbinishop.com/wp-json` (puede estar caída) | Correr `update-article-categories.ts`; si WP responde, inspeccionar 3 artículos de muestra con `categorySlugs` |
| ArticleForm multi-select de categorías | D-10 | UI interaction | Dashboard > artículos > editar; verificar selector con pre-selección; guardar y confirmar persistencia |
| ArticleCard / vistas muestran primera categoría | D-09 | Visual display | `/noticias`; verificar badge de categoría en cards y rails |
| ArticlesSection badge primera categoría + conteo | D-11 | Visual display | Lista admin; verificar formato `Nombre +N` |
| Filtro `?articleCategory=slug` | D-06 | E2E HTTP | `curl "/api/articles?articleCategory=naruto"` devuelve artículos con esa categoría en su array |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are explicit manual checkpoints
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none required)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] Reachable-state gating documented (no premature full-tsc gate)
- [x] `nyquist_compliant: true`

**Approval:** aligned with 5-plan breakdown 2026-05-29
