---
phase: 17-articles-crud
plan: "04"
subsystem: cuenta/articles
tags: [crud, organizador, articulos, upsell, frontend]
dependency_graph:
  requires: [17-01, 17-02]
  provides: [cuenta-articulos-list, cuenta-articulos-edit, crear-articulo-page]
  affects: [upsell-flow]
tech_stack:
  added: []
  patterns: [useUser-auth-guard, AccountShell-wrapper, ArticleForm-reuse]
key_files:
  created:
    - apps/website/app/(site)/cuenta/articulos/[slug]/edit/page.tsx
    - apps/website/app/(site)/crear-articulo/page.tsx
  modified:
    - apps/website/app/(site)/cuenta/articulos/page.tsx
    - apps/website/app/(site)/upsell/UpsellView.tsx
decisions:
  - "Relative import path for AccountShell en edit page corregido a ../../../AccountShell (3 niveles: edit → [slug] → articulos → cuenta)"
  - "UpsellView open state simplificado: eliminado article?: boolean ya que botón redirige directamente sin toggle"
metrics:
  duration: "~15 min"
  completed: "2026-05-27"
  tasks_completed: 4
  files_modified: 4
requirements:
  - ART-11
  - ART-12
  - ART-13
  - ART-14
  - ART-15
---

# Phase 17 Plan 04: Cuenta Articulos CRUD — Organizador Summary

Habilitación del CRUD completo del organizador para artículos patrocinados: listado real desde `/api/articles/mine`, páginas de creación y edición con `ArticleForm variant="sponsored"`, y corrección del flujo de upsell roto.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Reescribir /cuenta/articulos | 80563f3 | `app/(site)/cuenta/articulos/page.tsx` |
| 2 | Crear /cuenta/articulos/[slug]/edit | 51c0407 | `app/(site)/cuenta/articulos/[slug]/edit/page.tsx` |
| 3 | Crear /crear-articulo | 5f2e825 | `app/(site)/crear-articulo/page.tsx` |
| 4 | UpsellView: redirect a /crear-articulo | 38f84d8 | `app/(site)/upsell/UpsellView.tsx` |

## What Was Built

**Task 1 — /cuenta/articulos (rewrite):**
- Endpoint corregido de `?mine=true` (inexistente) a `/api/articles/mine` (creado en 17-01)
- Link de crear corregido de `/crear/articulo` (404) a `/crear-articulo` (nueva página)
- Botón "Editar" añadido → `/cuenta/articulos/{slug}/edit`
- DELETE con confirmación, error handling, y filtrado local optimista
- STATUS_META actualizado con todos los estados del API real (incluye `PENDING_PAYMENT`, `BANNED`)
- statusReason renderizado en rojo bajo la metadata de cada fila cuando el artículo está rechazado

**Task 2 — /cuenta/articulos/[slug]/edit (nueva página):**
- Fetch `GET /api/articles/{slug}` con token para cargar artículo pre-existente
- Mapeo de response a `InitialArticle` compatible con ArticleForm
- Renderiza `<ArticleForm mode="edit" variant="sponsored" initial={...} />`
- Auth guard con redirect a login si no hay usuario

**Task 3 — /crear-articulo (nueva página):**
- Resuelve el link roto pre-existente (ART-14)
- Renderiza `<ArticleForm mode="create" variant="sponsored" />` dentro de AccountShell
- Auth guard con redirect a login

**Task 4 — UpsellView limpieza:**
- Eliminada función `ArticleForm` interna (109 líneas de código muerto con payload roto: `videoUrl`, `isSponsored: true`)
- Paso 3 reemplazado con `router.push("/crear-articulo")` directo
- Estado `open` simplificado: eliminado `article?: boolean`
- SpotForm y HeroForm sin cambios

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ruta relativa incorrecta en AccountShell import**
- **Found during:** Task 2
- **Issue:** El import `../../AccountShell` apuntaba a la carpeta equivocada (la página vive en `[slug]/edit/`, no en `articulos/`)
- **Fix:** Corregido a `../../../AccountShell` (3 niveles: `edit → [slug] → articulos → cuenta`)
- **Files modified:** `app/(site)/cuenta/articulos/[slug]/edit/page.tsx`
- **Commit:** 51c0407

## Known Stubs

None — todos los datos se cargan desde el API real. El formulario `ArticleForm` está completamente cableado a los endpoints correctos creados en 17-01 y 17-02.

## Verification

- `pnpm tsc --noEmit` — PASSED
- `/api/articles/mine` — correcto (reemplaza `?mine=true`)
- `/crear/articulo` — eliminado (era 404)
- `/crear-articulo` — nuevo destino correcto
- `function ArticleForm` en UpsellView — eliminado
- `videoUrl`, `isSponsored: true` en UpsellView — eliminados
- `SpotForm`, `HeroForm` en UpsellView — intactos

## Self-Check: PASSED

- `apps/website/app/(site)/cuenta/articulos/page.tsx` — FOUND
- `apps/website/app/(site)/cuenta/articulos/[slug]/edit/page.tsx` — FOUND
- `apps/website/app/(site)/crear-articulo/page.tsx` — FOUND
- Commits 80563f3, 51c0407, 5f2e825, 38f84d8 — FOUND
