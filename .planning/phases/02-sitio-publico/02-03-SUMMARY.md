---
phase: 2
plan: "02-03"
subsystem: website-event-detail
tags: [website, nextjs, event-detail]
status: complete
provides: [event-detail-real-data]
affects: [apps/website/app/(site)/evento]
key_files:
  renamed:
    - "apps/website/app/(site)/evento/[id] → [slug]"
  modified:
    - "apps/website/app/(site)/evento/[slug]/page.tsx"
metrics:
  completed: "2026-05-21"
  files_changed: 1
---

# Phase 2 · Summary 02-03: Detalle de evento real

**One-liner:** La página de detalle de evento consume `GET /events/:slug` y muestra el evento
real — sin checkout: el panel de entradas enlaza al sitio externo del organizador.

## Qué se construyó

- Ruta renombrada `evento/[id]` → `evento/[slug]`.
- `page.tsx` reescrita como server component `async`:
  - Trae `api.event(slug)`; slug inexistente → `notFound()` (404).
  - Hero con la imagen real (banner) + `Poster`; categoría y empresa en pills.
  - "Sobre el evento" con `description` / `about` reales; galería con `event.gallery`;
    categorías como pills enlazadas a `/categoria/<slug>`.
  - Panel de entradas: lista los `prices` (informativo) y, si hay `ticketUrl`, un botón que
    enlaza **fuera** (`target="_blank"`) al sitio del organizador. Se eliminó de esta vista
    el enlace a `/checkout` y la marca "Konbini Pay".
  - Bloques de fecha/hora (`dates` formateadas en es-CL), ubicación y enlaces
    (`socialLinks` + `videos`).

## Verification

- `pnpm build` del website → compila sin errores.
- Smoke test runtime (API + `next start`):
  - `/evento/konbini-live-fest` muestra título, "Sobre el evento", precios
    (Entrada general / VIP) y el botón "Comprar entradas" apuntando a la URL externa
    (`entradas.example.cl/...`). No aparece ningún enlace `/checkout`.
  - `/evento/no-existe-xyz` → `404`.

## Deviations from Plan

Ninguna.

## Known Stubs / Follow-ups

- **02-04:** eliminar la ruta `(site)/checkout/[id]` y el enlace `/checkout/1` del
  `HeroBlock` (último resto del flujo de venta de entradas).
- `HeroBlock` sigue con datos mock.
- El botón "Compartir" del hero es decorativo.

## Self-Check: PASSED

- Ruta `evento/[slug]` — FOUND
- `page.tsx` server component que consume `GET /events/:slug` — CONFIRMED
- Panel enlaza a `ticketUrl` externo, sin `/checkout` — CONFIRMED
- `pnpm build` limpio + smoke test runtime (incl. 404) — CONFIRMED
