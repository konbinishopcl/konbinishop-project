---
phase: 2
plan: "02-04"
subsystem: website-checkout-removal
tags: [website, nextjs, checkout, hero, events-only]
status: complete
provides: [checkout-removed, hero-real-data]
affects: [apps/website/app/(site)/checkout, apps/website/components/HeroBlock.tsx, apps/website/app/(site)/page.tsx, apps/website/lib/api.ts]
key_files:
  removed:
    - "apps/website/app/(site)/checkout/[id]/page.tsx"
  modified:
    - apps/website/lib/api.ts
    - apps/website/components/HeroBlock.tsx
    - apps/website/app/(site)/page.tsx
metrics:
  completed: "2026-05-21"
  files_changed: 4
---

# Phase 2 · Summary 02-04: Quitar el checkout + cierre de Phase 2

**One-liner:** Se eliminó del sitio el flujo de checkout/venta de entradas y el `HeroBlock`
quedó conectado a eventos reales — el sitio público corre 100% con datos de la API.

## Qué se construyó

- **Ruta `(site)/checkout/[id]/` eliminada.** `grep` confirma que no queda ninguna
  referencia a `/checkout` en el código.
- **`lib/api.ts`** — tipo `HeroEvent` + mapper `toHeroEvent(ApiEvent)`.
- **`HeroBlock.tsx`** — recibe `events: HeroEvent[]` por prop; carrusel real (flechas y dots
  recorren los destacados); CTA "Ver evento" → `/evento/<slug>`. Deja de usar el mock `HERO`.
- **`(site)/page.tsx`** — construye los `heroEvents` desde los primeros eventos de la API y
  los pasa al `HeroBlock`.

## Verification

- `pnpm build` del website → compila sin errores.
- Smoke test runtime (API + `next start`):
  - La home renderiza el hero con un evento real (`FEATURED`, CTA "Ver evento",
    `hero-art-img`).
  - `/checkout/1` → `404` (ruta eliminada).

## Deviations from Plan

Ninguna. (El `HeroBlock`, que en planes previos quedaba en mock, se conectó aquí — cierra el
sitio público completo.)

## Phase 2 — Cierre

Con 02-04 termina **Phase 2 — Sitio público con datos reales**. El sitio público corre con
datos de la API:

- **Home** (02-01) — rails de eventos reales por categoría.
- **Categorías** (02-02) — nav del Header + `/categoria/[cat]` reales.
- **Detalle de evento** (02-03) — `/evento/[slug]` con `GET /events/:slug`.
- **Checkout + Hero** (02-04) — checkout eliminado; hero con eventos reales.

Siguiente: **Phase 3 — Publicación de eventos** (el organizador crea eventos desde `/crear`).

## Self-Check: PASSED

- Ruta `/checkout` eliminada; sin referencias en el código — CONFIRMED
- `HeroBlock` consume `HeroEvent[]` reales — CONFIRMED
- `pnpm build` limpio + smoke test runtime — CONFIRMED
