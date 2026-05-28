---
phase: 19-rediseno-completo-de-noticias
plan: "02"
subsystem: website/components
tags: [mega-menu, noticias, header, navigation]
dependency_graph:
  requires: [19-01]
  provides: [NewsMegaMenu, Header-news-trigger]
  affects: [apps/website/components/Header.tsx, apps/website/components/NewsMegaMenu.tsx]
tech_stack:
  added: []
  patterns: [onMouseEnter-hover-trigger, fragment-wrapper, fetch-on-mount, optimistic-active-state]
key_files:
  created:
    - apps/website/components/NewsMegaMenu.tsx
  modified:
    - apps/website/components/Header.tsx
decisions:
  - "Trigger via onMouseEnter en div wrapper (no CSS hover puro) — permite React state para animación del chevron"
  - "Mega menú renderizado fuera de <header> usando fragment React <> — coincide con patrón del design HTML (línea 1888)"
  - "z-index no requirió ajuste: header z-50, .mega-bg z-70 (definido en plan 19-01 globals.css)"
metrics:
  duration: "~6 minutos"
  completed: "2026-05-28T02:27:50Z"
  tasks: 2
  files: 2
---

# Phase 19 Plan 02: NewsMegaMenu — Mega menú de Noticias en el navbar

Implementación de `NewsMegaMenu.tsx` y trigger en `Header.tsx`. Al hovear "Noticias" aparece un dropdown con todas las categorías de artículos en layout de 4 columnas, ordenadas alfabéticamente, que navega a `/noticias/categoria/{slug}`.

## What Was Built

### apps/website/components/NewsMegaMenu.tsx (creado)

- Componente `"use client"` con `useEffect` que llama `GET /api/article-categories` al montar
- Categorías ordenadas alfabéticamente con `localeCompare("es")`
- Layout `.mega-bg` con `onMouseLeave={onClose}` y `style={{ "--mega-top": "72px" }}`
- Columna izquierda `.mega-aside`: label "NOTICIAS · ニュース", h3 "Lo último.", párrafo editorial, botón `.mega-cta` → navega a `/noticias`
- Columna derecha `.mega-flat`: grid de 4 columnas CSS (columns: 4), cada ítem muestra `name` a la izquierda y `.ja` (nameJa) a la derecha
- Categoría activa: compara `currentSlug` (extraído del pathname `/noticias/categoria/{slug}`) con `c.slug` → clase `.on`

### apps/website/components/Header.tsx (modificado)

- Import agregado: `import { NewsMegaMenu } from "./NewsMegaMenu";`
- Estado nuevo: `const [newsMenuOpen, setNewsMenuOpen] = useState(false);`
- Botón "Noticias" envuelto en `<div style={{ position: "relative" }} onMouseEnter={() => setNewsMenuOpen(true)}>`
- Chevron SVG inline animado: `transform: newsMenuOpen ? "rotate(180deg)" : "none"` con `transition: "transform .2s"`
- Return convertido de `<header>...</header>` a fragment `<>...<header>...</header>{newsMenuOpen && <NewsMegaMenu ... />}</>`
- `onClose` cierra el menú (`setNewsMenuOpen(false)`) desde dentro de `NewsMegaMenu` al `onMouseLeave`

## Integración del trigger

Se usó `onMouseEnter` en un `<div>` wrapper en lugar de CSS `:hover` puro. Esta decisión permite que React controle el estado `newsMenuOpen` para:
1. Mostrar/ocultar el mega menú condicionalmente
2. Animar el chevron con `transform: rotate(180deg)` mientras el menú está abierto

El cierre se delega a `onMouseLeave` dentro de `NewsMegaMenu` (en el wrapper `.mega-bg`), no en el botón del header, lo que evita el parpadeo al mover el mouse hacia el menú.

## Z-index del header vs mega menú

No fue necesario ajustar ningún z-index:
- Header: `z-index: 50` (sticky, línea 78 globals.css)
- `.mega-bg`: `z-index: 70` (fixed, línea 1385 globals.css — definido en plan 19-01)

El mega menú aparece correctamente sobre el header porque 70 > 50.

## Token en useUser

Confirmado desde 19-01-SUMMARY: el token proviene de `useUser()` vía `UserCtx.Provider` en `providers.tsx`. Almacenado en `localStorage` con clave `"kb-token"` y expuesto como `token: string | null` en el contexto. `NewsMegaMenu` no necesita el token ya que `/api/article-categories` es un endpoint público.

## Deviations from Plan

None — plan ejecutado exactamente como estaba escrito.

## Self-Check

### Files exist
- [x] apps/website/components/NewsMegaMenu.tsx — FOUND (fcac8dc)
- [x] apps/website/components/Header.tsx — FOUND, modificado (0bc812b)

### Commits exist
- [x] fcac8dc — feat(19-02): Task 1 — crear NewsMegaMenu.tsx con mega-aside + mega-flat
- [x] 0bc812b — feat(19-02): Task 2 — integrar NewsMegaMenu en Header.tsx

### TypeScript
- [x] npx tsc --noEmit → 0 errores

## Self-Check: PASSED
