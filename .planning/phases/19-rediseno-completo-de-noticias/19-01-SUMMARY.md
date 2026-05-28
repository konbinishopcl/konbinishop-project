---
phase: 19-rediseno-completo-de-noticias
plan: "01"
subsystem: website/noticias
tags: [types, css, components, articles, like-button]
dependency_graph:
  requires: []
  provides: [ArticleCard, ApiArticle, ApiArticleEvent, mega-css, like-css]
  affects: [noticias/page, noticias/NoticiasListView, noticias/[slug]/ArticleView]
tech_stack:
  added: []
  patterns: [optimistic-update, use-client-component, shared-component-extraction]
key_files:
  created:
    - apps/website/components/ArticleCard.tsx
  modified:
    - apps/website/lib/api.ts
    - apps/website/app/globals.css
    - apps/website/app/(site)/noticias/NoticiasListView.tsx
    - apps/website/app/(site)/noticias/page.tsx
    - apps/website/app/(site)/noticias/[slug]/page.tsx
    - apps/website/app/(site)/noticias/[slug]/ArticleView.tsx
decisions:
  - "ApiArticle/ApiArticleEvent movidos de noticias/page.tsx a lib/api.ts como tipos exportados globales"
  - "ArticleCard extrae la card inline de NoticiasListView; agrega like optimistic + reading time"
  - "PAGE_SIZE aumentado de 24 a 50 para hub page con rails por categoría"
metrics:
  duration_seconds: 284
  completed_date: "2026-05-28"
  tasks_completed: 2
  files_created: 1
  files_modified: 6
---

# Phase 19 Plan 01: Cimientos CSS + Tipos + ArticleCard Summary

Extracción de ArticleCard como componente compartido con like optimistic y tiempo de lectura, tipos ApiArticle/ApiArticleEvent en lib/api.ts, y clases mega-menú + a-like en globals.css.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Tipos en lib/api.ts y CSS en globals.css | beeae08 | lib/api.ts, globals.css |
| 2 | ArticleCard componente compartido | eee2109 | components/ArticleCard.tsx, noticias/*.tsx |

## What Changed

### apps/website/lib/api.ts
- `ApiArticleCategory` extendida con `nameJa?: string | null`
- Nuevos tipos exportados: `ApiArticleEvent` y `ApiArticle` (con `_count?: { likes: number }`)
- Nuevos métodos en `api`: `articles()`, `article()`, `likeArticle()`, `unlikeArticle()`

### apps/website/app/globals.css
- Bloque `.mega-bg`, `.mega-inner`, `.mega-flat`, `.mega-aside`, `.mega-cta`, `@keyframes megaIn` (news mega menu)
- Bloque `.a-like`, `.a-like.on`, `.a-like:hover`, `.a-rel` (article card like button)
- Media queries responsive para mega menú (960px y 640px)

### apps/website/components/ArticleCard.tsx (creado)
- Componente `"use client"` que encapsula la card completa
- Helpers exportados: `formatDate`, `getCat`, `readingTime` (Math.ceil(words/200) min)
- Like button (`.a-like`) con toggle optimistic: POST/DELETE `/api/articles/{id}/like`
- Si usuario no autenticado → toast local "Inicia sesión para dar like" (2.5s, sin dependencia externa)
- Badge de eventos relacionados en `.a-meta` si `a.events.length > 0`
- Token confirmado: proviene de `useUser()` vía `UserCtx.Provider` en providers.tsx (localStorage "kb-token", expuesto como `token: string | null` en contexto)

### apps/website/app/(site)/noticias/NoticiasListView.tsx
- Importa `ApiArticle` desde `@/lib/api` (antes desde `./page`)
- Elimina helpers duplicados `formatDate` y `getCat`
- Reemplaza bloque `<Link><article className="art-card">...</article></Link>` por `<ArticleCard key={a.id} article={a} />`

### apps/website/app/(site)/noticias/page.tsx
- Elimina definiciones locales de `ApiArticle` y `ApiArticleEvent`
- Importa ambos tipos desde `@/lib/api`
- `PAGE_SIZE` aumentado de 24 a 50

### apps/website/app/(site)/noticias/[slug]/page.tsx y ArticleView.tsx
- Corregidos imports de `ApiArticle`/`ApiArticleEvent` de `"../page"` a `"@/lib/api"` (auto-fix Rule 1)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Imports rotos en archivos del slug al mover tipos**
- **Found during:** Task 2 TypeScript verify
- **Issue:** `noticias/[slug]/page.tsx` y `noticias/[slug]/ArticleView.tsx` importaban `ApiArticle`/`ApiArticleEvent` desde `"../page"`, que ya no los exporta
- **Fix:** Actualizados los imports en ambos archivos a `"@/lib/api"`
- **Files modified:** apps/website/app/(site)/noticias/[slug]/page.tsx, apps/website/app/(site)/noticias/[slug]/ArticleView.tsx
- **Commit:** eee2109

## Known Stubs

Ninguno — todos los campos rendereados tienen fuente de datos real (API o estado local).

## Self-Check: PASSED

- [x] apps/website/components/ArticleCard.tsx — FOUND
- [x] apps/website/lib/api.ts con nameJa y ApiArticle — FOUND
- [x] apps/website/app/globals.css con mega-bg y a-like — FOUND
- [x] Commits beeae08, eee2109 — FOUND
- [x] TypeScript exit:0 — NO ERRORS
