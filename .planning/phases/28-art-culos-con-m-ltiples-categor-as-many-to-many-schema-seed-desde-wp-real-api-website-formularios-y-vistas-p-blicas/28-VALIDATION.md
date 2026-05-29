---
phase: 28
slug: articulos-multiples-categorias
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-29
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (API) + TypeScript tsc (website) |
| **Config file** | `apps/api/jest.config.ts` |
| **Quick run command** | `cd apps/api && pnpm test --no-coverage` |
| **Full suite command** | `cd apps/api && pnpm test:e2e` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && pnpm test --no-coverage`
- **After every plan wave:** Run `cd apps/api && pnpm test:e2e`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 28-01-01 | 01 | 1 | D-04 | migration | `ls apps/api/prisma/migrations/*_articulos_many_to_many/ 2>/dev/null` | ❌ W0 | ⬜ pending |
| 28-01-02 | 01 | 1 | D-01 | script | `node -e "require('./apps/api/prisma/update-article-categories')"` | ❌ W0 | ⬜ pending |
| 28-01-03 | 01 | 1 | D-08 | seed | `cd apps/api && pnpm exec ts-node prisma/seed.ts` | ✅ | ⬜ pending |
| 28-02-01 | 02 | 2 | D-05 | type-check | `cd apps/api && pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 28-02-02 | 02 | 2 | D-06 | unit | `cd apps/api && pnpm test --no-coverage` | ✅ | ⬜ pending |
| 28-03-01 | 03 | 3 | D-09 | type-check | `cd apps/website && pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 28-03-02 | 03 | 3 | D-10 | manual | Browser: crear artículo con múltiples categorías | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (Jest + tsc already installed).
- The migration file is created as part of Wave 1 task 01.

*No additional Wave 0 setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ArticleForm muestra multi-select de categorías | D-10 | UI interaction | Abrir dashboard > artículos > editar; verificar que aparece selector de categorías múltiples |
| ArticleCard muestra primera categoría del array | D-09 | Visual display | Navegar a `/noticias`; verificar badge de categoría en cada card |
| Filtro `?articleCategory=slug` retorna artículos con esa categoría | D-06 | E2E HTTP | `curl "/api/articles?articleCategory=naruto"` devuelve artículos con esa categoría |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
