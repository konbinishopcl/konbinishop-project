---
phase: 2
plan: "02-01"
subsystem: website-data
tags: [website, nextjs, api-client, home]
status: complete
provides: [website-data-layer, home-real-data]
affects: [apps/website/lib/api.ts, apps/website/lib/data.ts, apps/website/components/EventCard.tsx, apps/website/app/(site)/page.tsx]
key_files:
  modified:
    - apps/website/lib/api.ts
    - apps/website/lib/data.ts
    - apps/website/components/EventCard.tsx
    - apps/website/app/(site)/page.tsx
metrics:
  completed: "2026-05-21"
  files_changed: 4
---

# Phase 2 · Summary 02-01: Capa de datos + home con eventos reales

**One-liner:** El website tiene su capa de datos contra la API NestJS y la home ya muestra
los eventos reales del seed en vez de `lib/data.ts`.

## Qué se construyó

### `lib/api.ts` — capa de datos

- Tipos de la API: `ApiEvent`, `ApiEventList`, `ApiCategory`, `ApiRegion`, `ApiCommune`
  (más los de precios/fechas/links).
- Fetchers en el objeto `api`: `events(query)`, `event(slug)`, `categories()`, `regions()`,
  `communes(region?)` — además de los de auth ya existentes.
- `imageUrl(path)` — antepone el origen de la API a las rutas `/uploads/...`.
- `toEventItem(ApiEvent)` — mapea el evento de la API al shape `EventItem`: toma poster/banner,
  formatea la primera fecha (`8 ABR 2026`) y calcula el precio mínimo.

### Resto

- `EventItem` (en `data.ts`) gana `slug` y `catSlug`; `ja`/`art`/`stamp` pasan a opcionales.
  Se agregó `slug` a los 12 eventos mock (siguen alimentando las vistas no conectadas aún).
- `EventCard` enlaza por slug → `/evento/<slug>`.
- `(site)/page.tsx` es ahora un server component `async` (`dynamic = "force-dynamic"`): trae
  eventos y categorías de la API, arma el rail "Destacados" y un rail por cada categoría con
  eventos. Si la API no responde, degrada a una home sin rails.

## Verification

- `pnpm build` del website → compila sin errores; la home figura como ruta `ƒ` (dinámica).
- Smoke test runtime (API en :3333 + `next start`): la home renderiza la sección
  "Destacados" y los 11 eventos aprobados del seed, con cards enlazando a `/evento/<slug>`
  (p. ej. `konbini-live-fest`, `festival-j-rock-santiago`, `esports-konbini-cup`).

## Deviations from Plan

Ninguna. El `HeroBlock` queda con datos mock como estaba previsto (se conecta más adelante).

## Known Stubs / Follow-ups

- **02-02:** categorías reales — `/categoria/[cat]` y el nav de categorías del `Header`
  (hoy usan las categorías mock `cine/conciertos/...`, distintas de las de la API).
- **02-03:** detalle de evento real — renombrar `evento/[id]` → `[slug]` y consumir
  `GET /events/:slug`.
- **02-04:** quitar el checkout y la UI de venta de entradas.
- `HeroBlock` sigue en mock — pendiente de conectar a `/api/heroes`.

## Self-Check: PASSED

- `lib/api.ts` con tipos + fetchers + `imageUrl` + `toEventItem` — FOUND
- `(site)/page.tsx` server component async — CONFIRMED
- `pnpm build` limpio — CONFIRMED
- Home renderiza eventos reales del seed (smoke test runtime) — CONFIRMED
