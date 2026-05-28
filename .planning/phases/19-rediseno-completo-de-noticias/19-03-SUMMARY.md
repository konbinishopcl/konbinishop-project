---
phase: 19-rediseno-completo-de-noticias
plan: "03"
subsystem: website/noticias
tags: [hub-page, noticias, client-component, server-component, responsive]
dependency_graph:
  requires: [19-01, 19-02]
  provides: [NoticiasHubView, noticias-hub-page]
  affects: [apps/website/app/(site)/noticias]
tech_stack:
  added: []
  patterns: [server-component-with-client-view, hub-layout, category-rails]
key_files:
  created:
    - apps/website/app/(site)/noticias/NoticiasHubView.tsx
  modified:
    - apps/website/app/(site)/noticias/page.tsx
    - apps/website/app/globals.css
decisions:
  - "NoticiasListView.tsx conservada como archivo dormido (no importada); la eliminación corresponde a plan 19-04 o cleanup posterior"
  - "page.tsx simplificado: fetchArticles() retorna items[] directamente (sin total/totalPages) ya que NoticiasHubView no necesita paginación"
metrics:
  duration: "~8 min"
  completed_date: "2026-05-27"
  tasks_completed: 2
  files_changed: 3
---

# Phase 19 Plan 03: Hub Page /noticias — Summary

**One-liner:** Hub page `/noticias` reescrita con hero 16:10 + picks columna 360px + grid Lo último + sponsored condicional + rails por categoría + explore 4 columnas — siguiendo exactamente `NewsHubPage` de `Konbini.html`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Actualizar page.tsx para fetchear 50 artículos | 5f86fe6 | page.tsx |
| 2 | Crear NoticiasHubView con todas las secciones | 7980dd3 | NoticiasHubView.tsx, globals.css |

## What Was Built

### Task 1 — page.tsx actualizado
- Reemplaza `NoticiasListView` con `NoticiasHubView`
- `fetchArticles()` simplificado: retorna `items[]` directamente (sin `total`/`totalPages`)
- `fetchArticleCategories()` conservado con `revalidate: 3600`
- `Promise.all` fetcha ambos en paralelo y pasa a `NoticiasHubView`

### Task 2 — NoticiasHubView.tsx creado
Estructura completa fiel al diseño `NewsHubPage` de `Konbini.html`:

1. **Hero + Picks** (`section.news-hero`): grid `minmax(0,1fr) 360px`
   - Hero: imagen 16:10, overlay gradiente 0→60%, texto con eyebrow "DESTACADO · CATEGORÍA", `h1 clamp(36px,4.6vw,56px)`, badge "Leer artículo →" en accent
   - Picks de la redacción: label mono, 3 artículos numerados `01/02/03` en accent, con categoría + título + fecha·lectura

2. **Lo último** (`div.sec-head` + `div.card-grid`): 4 `ArticleCard` con link "Ver todas las noticias"

3. **Artículo patrocinado** (`section.sponsored-feature`): condicional `isSponsored=true`, grid `1fr 1fr`, imagen con badge "ARTÍCULO PATROCINADO", info con botón CTA

4. **Rails por categoría**: slugs `["anime","manga","cine","gaming"]` — solo renderiza si hay artículos para ese slug, con `sec-head` y link "Ver más de X"

5. **Explora por categoría**: todas las categorías ordenadas alfabéticamente (`localeCompare "es"`), `columns: 4`, botones con hover accent + translateX

### Responsive CSS agregado a globals.css
```css
@media (max-width: 768px) {
  .news-hero { grid-template-columns: 1fr !important; }
  .sponsored-feature { grid-template-columns: 1fr !important; }
  .explore-cats { columns: 2 !important; column-gap: 24px !important; }
}
```

## Output notes

- **pageSize=50**: La API fetcha hasta 50 artículos para tener suficientes para todos los rails. El conteo real depende del contenido de la DB en producción.
- **Rails de categorías**: Solo aparecen si `articles.filter(a => a.articleCategory?.slug === slug).length > 0`. En DB vacía no aparece ninguno.
- **Artículo patrocinado**: Condicional en `articles.find(a => a.isSponsored)`. No aparece si no hay artículos patrocinados.
- **Responsive**: Reglas añadidas a `globals.css` (no existían previamente).

## Deviations from Plan

### Auto-noted

**1. [Dormant file] NoticiasListView.tsx conservada**
- **Found during:** Task 1
- **Issue:** Al reemplazar la importación en `page.tsx`, `NoticiasListView.tsx` quedó huérfana (ningún archivo la importa)
- **Decision:** Conservada sin modificar — la eliminación no está en el scope de este plan; puede ser cleanup de plan posterior o 19-04
- **Files modified:** Ninguno (decisión de no-acción)

## Known Stubs

Ninguno — todos los datos fluyen de la API real (`/articles?pageSize=50` y `/article-categories`).

## Self-Check: PASSED

- FOUND: `apps/website/app/(site)/noticias/NoticiasHubView.tsx`
- FOUND: `apps/website/app/(site)/noticias/page.tsx`
- FOUND: `.planning/phases/19-rediseno-completo-de-noticias/19-03-SUMMARY.md`
- FOUND: commit `5f86fe6` (Task 1)
- FOUND: commit `7980dd3` (Task 2)
