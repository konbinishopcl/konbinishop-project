---
phase: 2
plan: "02-02"
subsystem: website-categories
tags: [website, nextjs, categories, header]
status: complete
provides: [categories-real-data]
affects: [apps/website/app/(site)/layout.tsx, apps/website/components/Header.tsx, apps/website/app/(site)/categoria/[cat]/page.tsx]
key_files:
  modified:
    - apps/website/app/(site)/layout.tsx
    - apps/website/components/Header.tsx
    - apps/website/app/(site)/categoria/[cat]/page.tsx
metrics:
  completed: "2026-05-21"
  files_changed: 3
---

# Phase 2 · Summary 02-02: Categorías reales

**One-liner:** El nav del `Header` y la página `/categoria/[cat]` ya consumen las categorías y
eventos reales de la API en vez de los datos mock.

## Qué se construyó

- **`(site)/layout.tsx`** — pasa a server component `async`: trae las categorías de la API y
  se las pasa al `Header` por prop. Degrada a lista vacía si la API falla.
- **`Header.tsx`** — recibe `categories` por prop; el nav arma un botón "Inicio" fijo + una
  entrada por categoría real (→ `/categoria/<slug>`). Ya no importa `CATEGORIES` mock.
- **`/categoria/[cat]/page.tsx`** — de client component a server component `async`: resuelve
  la categoría por slug, trae sus eventos con `api.events({ category })` y los renderiza con
  `EventCard`. Estado vacío cuando la categoría no tiene eventos. Se quitó el texto japonés
  decorativo y el copy de "compra tu entrada" (alineado con events-only); los chips de filtro
  quedan estáticos (placeholder para Phase 5).

## Verification

- `pnpm build` del website → compila sin errores.
- Smoke test runtime (API + `next start`):
  - El nav del Header muestra `Inicio · Música · Teatro · Gastronomía · Anime y Manga ·
    Videojuegos` (categorías reales del seed).
  - `/categoria/musica` lista sus 3 eventos reales (`konbini-live-fest`,
    `festival-j-rock-santiago`, `anime-sinfonico-en-vivo`).

## Deviations from Plan

Ninguna.

## Known Stubs / Follow-ups

- **02-03:** detalle de evento — renombrar `evento/[id]` → `[slug]`, consumir `GET /events/:slug`.
- **02-04:** quitar checkout y UI de venta de entradas.
- Los chips de filtro de la categoría son estáticos hasta Phase 5 (Búsqueda).
- `CATEGORIES` en `lib/data.ts` quedó sin uso (se limpiará al retirar el mock).

## Self-Check: PASSED

- `(site)/layout.tsx` async con fetch de categorías — CONFIRMED
- `Header` arma el nav desde la prop `categories` — CONFIRMED
- `/categoria/[cat]` server component con datos reales — CONFIRMED
- `pnpm build` limpio + smoke test runtime — CONFIRMED
