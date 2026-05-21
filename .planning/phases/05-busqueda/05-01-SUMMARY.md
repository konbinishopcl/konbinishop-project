---
phase: 5
plan: "05-01"
subsystem: website-search
tags: [website, nextjs, search]
status: complete
provides: [event-search]
affects: [apps/website/app/(site)/busqueda, apps/website/components/Header.tsx]
key_files:
  created:
    - apps/website/app/(site)/busqueda/page.tsx
    - apps/website/app/(site)/busqueda/SearchView.tsx
  modified:
    - apps/website/components/Header.tsx
metrics:
  completed: "2026-05-21"
  files_changed: 3
---

# Phase 5 · Summary 05-01: Búsqueda de eventos

**One-liner:** Nueva página `/busqueda` con búsqueda por texto + filtros de categoría y región
sincronizados con la URL; el botón de búsqueda del header ya lleva ahí.

## Qué se construyó

- **`app/(site)/busqueda/page.tsx`** — server component que envuelve `SearchView` en
  `<Suspense>` (requisito de `useSearchParams`) y marca la ruta `dynamic`.
- **`app/(site)/busqueda/SearchView.tsx`** — client component:
  - Lee `q` / `category` / `region` de la URL; trae `api.events({...})` y muestra los
    resultados con `EventCard`. Estados de carga y vacío.
  - Input de búsqueda + selects de categoría y región (de `api.categories()` /
    `api.regions()`); al cambiar hace `router.push` a `/busqueda?...` → filtros compartibles.
- **`Header.tsx`** — el botón de búsqueda navega a `/busqueda`.

## Verification

- `pnpm build` → "Compiled successfully"; la ruta `ƒ /busqueda` figura en la tabla.
- Smoke test runtime (build aislado + `next start`): `/busqueda` y `/busqueda?q=anime`
  responden `200`; `GET /api/events?q=anime` devuelve los eventos que matchean
  ("Anime Sinfónico en Vivo", "Expo Anime Concepción").

## Deviations from Plan

Ninguna. (Un primer smoke test dio `500` por un `.next` corrupto al correr `pnpm dev` y
`pnpm build` sobre el mismo directorio a la vez; con un build aislado funciona — verificar
siempre con el dev detenido.)

## Known Stubs / Follow-ups

- **05-02:** filtro por rango de fechas — requiere agregar `desde`/`hasta` al
  `QueryEventsDto` y al servicio de la API, más los inputs en `SearchView`.

## Self-Check: PASSED

- `app/(site)/busqueda/` (page + SearchView) — FOUND
- Búsqueda por texto/categoría/región sincronizada con la URL — CONFIRMED
- Botón de búsqueda del Header conectado — CONFIRMED
- `pnpm build` limpio + `/busqueda` responde `200` — CONFIRMED
