---
phase: 15-rediseno-ui-migracion-de-vistas
plan: 05
subsystem: website-views
tags: [nextjs, react, ssr, articles, organizer, services, cart, pricing, about]

# Dependency graph
requires:
  - phase: 15-01
    provides: CSS tokens in globals.css (art-card, svc-hero, cart-shell, thanks-shell, etc.), shared components
  - phase: 15-02
    provides: EventCard, Poster, page.tsx+View.tsx separation pattern
  - phase: 15-04
    provides: AccountShell, useUser, providers

provides:
  - 17+ new routes in apps/website/app/(site)/
  - /noticias listado + /noticias/[slug] detalle con API Phase 13
  - /u/[handle] perfil organizador con API Phase 13 CNT-03
  - /tag/[tag] listado eventos por tag
  - /servicios/fotografia + /servicios/creadores con POST a Phase 14 SVC-01
  - /precios, /nosotros, /ayuda (static + contact form)
  - /gracias/[kind] página de éxito (foto/creadores/contacto)
  - /upgrade upsell Pro
  - /carrito + /carrito/exito + /carrito/error (UI mock)
  - /crear-producto/[kind] (spot/hero/articulo) con APIs reales
  - /evento/expirado
  - app/not-found.tsx (Next.js 404 convention)

affects: [website, routing, seo]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server component page.tsx fetches data via server-side fetch (process.env.API_URL + API_KEY headers)
    - "use client" View.tsx owns all interactivity, receives typed props
    - Each new view in its own file (D-04 separation)
    - Direct fetch() for API endpoints not in api.ts (articles, users/handle, services)
    - CartView reads localStorage kb-cart with mock fallback (no cart store implemented)

key-files:
  created:
    - apps/website/app/(site)/noticias/page.tsx
    - apps/website/app/(site)/noticias/NoticiasListView.tsx
    - apps/website/app/(site)/noticias/[slug]/page.tsx
    - apps/website/app/(site)/noticias/[slug]/ArticleView.tsx
    - apps/website/app/(site)/u/[handle]/page.tsx
    - apps/website/app/(site)/u/[handle]/OrganizerView.tsx
    - apps/website/app/(site)/tag/[tag]/page.tsx
    - apps/website/app/(site)/servicios/fotografia/page.tsx
    - apps/website/app/(site)/servicios/fotografia/FotografiaView.tsx
    - apps/website/app/(site)/servicios/creadores/page.tsx
    - apps/website/app/(site)/servicios/creadores/CreadoresView.tsx
    - apps/website/app/(site)/precios/page.tsx
    - apps/website/app/(site)/precios/PricingView.tsx
    - apps/website/app/(site)/gracias/[kind]/page.tsx
    - apps/website/app/(site)/upgrade/page.tsx
    - apps/website/app/(site)/nosotros/page.tsx
    - apps/website/app/(site)/ayuda/page.tsx
    - apps/website/app/(site)/carrito/page.tsx
    - apps/website/app/(site)/carrito/CartView.tsx
    - apps/website/app/(site)/carrito/exito/page.tsx
    - apps/website/app/(site)/carrito/error/page.tsx
    - apps/website/app/(site)/crear-producto/[kind]/page.tsx
    - apps/website/app/(site)/crear-producto/[kind]/CreateProductView.tsx
    - apps/website/app/(site)/evento/expirado/page.tsx
    - apps/website/app/not-found.tsx
  modified: []

key-decisions:
  - "api.ts has no articles/userByHandle/createServiceRequest methods — all new routes use direct fetch() from server pages with process.env.API_URL + API_KEY headers"
  - "Article model has no category or author field — category derived from first tag; author shown as Konbini Editorial"
  - "CartView reads localStorage kb-cart with MOCK_ITEMS fallback — no global cart store (deferred)"
  - "crear-producto/[kind]=evento redirects to /crear (Phase 3 form); avoids duplicate form"
  - "ArticleView uses simple markdown-to-HTML regex renderer (no external library)"
  - "gracias/[kind] uses React.use(params) for client component with dynamic kind"

requirements-completed: [UI-MIG-05, UI-ROUTES]

# Metrics
duration: ~14min
completed: 2026-05-25
---

# Phase 15 Plan 05: Nuevas vistas — Summary

**17 nuevas rutas Next.js creadas completando el diseño del sitio: noticias, perfil organizador, servicios, carrito, páginas estáticas y auxiliares. Build verde.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-05-25
- **Completed:** 2026-05-25
- **Tasks:** 3/3
- **Files created:** 25
- **Files modified:** 0

## Accomplishments

### Task 1 — Noticias + Artículo + Perfil organizador + Tag listing

| Ruta | Archivo | API |
|------|---------|-----|
| /noticias | page.tsx + NoticiasListView.tsx | SSR GET /articles?pageSize=24 |
| /noticias/[slug] | page.tsx + ArticleView.tsx | SSR GET /articles/:slug + related |
| /u/[handle] | page.tsx + OrganizerView.tsx | SSR GET /users/:handle |
| /tag/[tag] | page.tsx | api.events() filtro client-side |

- Articles API (Phase 13): lista y detalle con SSR
- OrganizerView: tabs Próximos/Pasados/Artículos; badge verificado; redes sociales
- ArticleView: markdown simple render, share button, related articles sidebar
- Tag page: filtra eventos por tag/category slug

### Task 2 — Servicios + Precios + Gracias + Upgrade + Nosotros + Ayuda

| Ruta | Archivo | API |
|------|---------|-----|
| /servicios/fotografia | page.tsx + FotografiaView.tsx | SSR GET /services/photography/options + POST /services/photography |
| /servicios/creadores | page.tsx + CreadoresView.tsx | SSR GET /services/content-creators/options + POST /services/content-creators |
| /precios | page.tsx + PricingView.tsx | Mock pricing (hardcoded) |
| /gracias/[kind] | page.tsx | kind: foto/creadores/contacto |
| /upgrade | page.tsx | CTA → /cuenta?tab=subs |
| /nosotros | page.tsx | Estática |
| /ayuda | page.tsx | FAQ + POST /contact con tabs |

- Servicios: formularios conectados a Phase 14 SVC-01 endpoints reales
- Ayuda: tab FAQ (mock) + tab Contacto (POST /api/contact → /gracias/contacto)

### Task 3 — Carrito + Crear/[kind] + Evento expirado + NotFound + build

| Ruta | Archivo | API |
|------|---------|-----|
| /carrito | page.tsx + CartView.tsx | Mock (localStorage fallback) |
| /carrito/exito | page.tsx | searchParams.orderId |
| /carrito/error | page.tsx | — |
| /crear-producto/[kind] | page.tsx + CreateProductView.tsx | POST /api/spots + /api/heroes + /api/articles/sponsored |
| /evento/expirado | page.tsx | — |
| app/not-found.tsx | not-found.tsx | Next.js 404 convention |

- CartView: no implementa checkout real (SITE-04); pago mock → /carrito/exito
- crear-producto: spot/hero/articulo con APIs reales; evento redirecta a /crear
- not-found.tsx en `app/` (Next.js convention exacta, no bajo `(site)/`)

## Task Commits

1. **Task 1: Noticias + perfil organizador + tag listing** — `3d5ee3d`
2. **Task 2: Servicios + precios + gracias + upgrade + nosotros + ayuda** — `1d505fd`
3. **Task 3: Carrito + crear-producto + evento expirado + not-found + build verde** — `d63160b`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] api.ts sin métodos articles/userByHandle**
- **Found during:** Task 1 (before writing)
- **Issue:** Plan references `api.articles` y `api.article` pero NO existen en lib/api.ts. La instrucción del plan dice explícitamente "NO TOCAR api.ts".
- **Fix:** Las server pages usan `fetch()` directo con `process.env.API_URL` + `X-API-Key`, el mismo patrón interno que `api.ts`. No se tocó api.ts.
- **Files modified:** Todas las server pages (noticias, u/handle, servicios)

None other — plan executed as written.

## Build Verification

`pnpm --filter konbini-website build` — **exit 0** ✓

All 25 new routes compiled successfully including:
- /noticias, /noticias/[slug], /u/[handle], /tag/[tag] (dynamic server routes)
- /servicios/fotografia, /servicios/creadores (dynamic SSR)
- /precios, /nosotros (static)
- /gracias/[kind], /carrito, /crear-producto/[kind] (dynamic client)
- /evento/expirado, app/not-found.tsx

## Known Stubs

- `CartView`: Mock items in localStorage / hardcoded fallback. No global cart store, no real Transbank integration. Will connect when payment processing is implemented.
- `CartView`: "Pagar" button goes to /carrito/exito directly (mock checkout). Real WebPay flow deferred.
- `precios/PricingView`: Hardcoded pricing data ($4.990, $29.990, $8.000). Will connect to settings API (Phase 11) when available.
- `nosotros/page.tsx`: Team and stats hardcoded. Will update when real data is available.
- `tag/[tag]/page.tsx`: Client-side filter on events — no true backend tag filtering for events (only articles have tag support). Functional but limited relevance.

These stubs do NOT prevent the plan's goal (new views complete) — all service forms, article API, and organizer profile work against real APIs.

---
*Phase: 15-rediseno-ui-migracion-de-vistas*
*Completed: 2026-05-25*
