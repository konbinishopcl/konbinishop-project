---
phase: 18
slug: separar-taxonomia-eventos-articulos
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-27
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No framework — manual smoke tests only |
| **Config file** | none |
| **Quick run command** | `curl http://localhost:3000/event-categories` |
| **Full suite command** | Manual checklist (see Per-Task map below) |
| **Estimated runtime** | ~5 minutes manual |

---

## Sampling Rate

- **After every task commit:** Restart API, verify endpoints still respond (no 500s)
- **After every plan wave:** Run full checklist for that wave
- **Before `/gsd:verify-work`:** Full smoke test checklist must pass
- **Max feedback latency:** N/A (manual)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| Schema EventCategory | 18-01 | 1 | TAX-01 | manual-sql | `SELECT COUNT(*) FROM event_categories;` | ❌ | pending |
| Schema EventTag | 18-01 | 1 | TAX-02 | manual-sql | `SELECT COUNT(*) FROM event_tags;` | ❌ | pending |
| Schema ArticleCategory | 18-01 | 1 | TAX-03 | manual-sql | `SELECT COUNT(*) FROM article_categories;` | ❌ | pending |
| Schema ArticleTag | 18-01 | 1 | TAX-04 | manual-sql | `SELECT COUNT(*) FROM article_tags;` | ❌ | pending |
| Data migration | 18-01 | 1 | TAX-05 | manual-sql | `SELECT COUNT(*) FROM event_categories; -- debe igualar COUNT FROM categories` | ❌ | pending |
| GET /event-categories | 18-02 | 2 | TAX-06 | smoke | `curl http://localhost:3000/event-categories` | ❌ | pending |
| GET /article-categories | 18-02 | 2 | TAX-07 | smoke | `curl http://localhost:3000/article-categories` | ❌ | pending |
| EventsService pricing | 18-02 | 2 | TAX-08 | manual | Crear orden de evento → verificar precio no es NaN/0 | ❌ | pending |
| ArticleTag filter | 18-02 | 2 | TAX-09 | smoke | `curl "http://localhost:3000/articles?tag=<slug>"` | ❌ | pending |
| Frontend api.ts types | 18-03 | 3 | TAX-10 | smoke | Navegar a / → Header muestra categorías sin errores | ❌ | pending |
| Búsqueda y EventForm | 18-03 | 3 | TAX-11 | manual | UI: filtro búsqueda usa EventCategory; EventForm dropdown funciona | ❌ | pending |
| Dashboard CRUDs | 18-04 | 4 | TAX-12 | manual | Admin: editar categoría → refrescar sitio → cambio visible | ❌ | pending |

---

## Critical Risk Checklist

These checks MUST pass before marking phase complete:

- [ ] `OrdersService` — crear una orden de evento y verificar que `unitPrice` no sea 0 ni NaN
- [ ] `Hero` carousel — verificar que sigue mostrando categorías en el hero (usa EventCategory ahora)
- [ ] `_ArticleToTag` data — artículos pre-existentes conservan sus tags: `GET /articles/:slug` retorna `articleTags` con datos
- [ ] SEO slugs — `/categoria/[slug]` sigue funcionando para slugs de EventCategory existentes
- [ ] `GET /categories` alias — endpoint antiguo sigue respondiendo 200 (backwards compat si aplica)

---

## Wave 0 Gaps

El proyecto no tiene infraestructura de tests automatizados. Todas las verificaciones son smoke tests manuales o SQL queries. No se requiere configurar framework de tests en Wave 0.
