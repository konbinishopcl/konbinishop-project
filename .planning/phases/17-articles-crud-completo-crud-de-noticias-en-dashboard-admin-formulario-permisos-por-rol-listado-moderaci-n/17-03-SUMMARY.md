---
phase: 17-articles-crud
plan: "03"
subsystem: dashboard/articles
tags: [admin, articles, moderation, crud, pagination]
dependency_graph:
  requires: [17-01, 17-02]
  provides: [ArticlesSection-real-data, articles-new-page, articles-edit-page, dashboard-shell-crumbs]
  affects: [dashboard/articles, DashboardShell]
tech_stack:
  added: []
  patterns: [EventsSection-pattern, useCallback-fetch, IIFE-modal-render]
key_files:
  created:
    - apps/website/app/dashboard/articles/new/page.tsx
    - apps/website/app/dashboard/articles/[slug]/edit/page.tsx
  modified:
    - apps/website/app/dashboard/sections/ArticlesSection.tsx
    - apps/website/app/dashboard/DashboardShell.tsx
  deleted:
    - apps/website/app/dashboard/modals/AdminArticleEditor.tsx
decisions:
  - "Use slug (not id) for edit URLs per advisor decision — zero API changes needed"
  - "AdminArticleEditor removed — was orphan calling non-existent /api/articles/edit endpoint"
  - "Approve modal does not pass tags to API — same behavior as EventsSection (API has no tags param on approve)"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-27T18:25:03Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 5
requirements:
  - ART-01
  - ART-02
  - ART-07
---

# Phase 17 Plan 03: ArticlesSection conectada + rutas /new y /[slug]/edit

ArticlesSection reemplazada de mock con eventos a datos reales de artículos con paginación, filtros y acciones de moderación; rutas /dashboard/articles/new y /[slug]/edit creadas con ArticleForm; DashboardShell actualizado con breadcrumbs; AdminArticleEditor roto eliminado.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Reescribir ArticlesSection con datos reales | 12051c6 | ArticlesSection.tsx |
| 2 | Crear rutas /new + /[slug]/edit + DashboardShell + rm AdminArticleEditor | c30fc81 | new/page.tsx, [slug]/edit/page.tsx, DashboardShell.tsx, (deleted) AdminArticleEditor.tsx |

## What Was Built

### Task 1 — ArticlesSection real data

- Replaced all mock `EVENTS = [...]` data with `fetchArticles()` calling `GET /api/articles?page=&pageSize=&status=`
- Filter chips: Todos / Borrador / En revisión / Publicado / Rechazado / Baneado
- Table columns: ARTÍCULO (thumb + title + tags) · AUTOR (userId / isSponsored) · CREADO (fmtDate) · ESTADO (pill) · ACCIONES
- Action buttons per status:
  - Borrador: Editar, Publicar (approve modal), Eliminar (ELIMINAR typed)
  - En revisión: Editar, Aprobar (approve modal), Rechazar (reject modal with reason)
  - Publicado: Editar, Banear (BANEAR typed)
  - Rechazado: Editar, Re-revisar (approve modal), Eliminar (ELIMINAR typed)
  - Baneado: Editar, Restaurar (approve modal)
- doApprove → PATCH /api/articles/:id/approve
- doReject → PATCH /api/articles/:id/reject { reason }
- doBan → PATCH /api/articles/:id/ban { reason: "Baneado por administrador" }
- doDelete → DELETE /api/articles/:id
- Pagination bar identical to EventsSection (pageWindows + ChevL/ChevR)
- Modal components copied from EventsSection (AdminApproveModal, AdminRejectModal, ConfirmDialog)

### Task 2 — Routes + Shell + Cleanup

- `apps/website/app/dashboard/articles/new/page.tsx` — renders `<ArticleForm mode="create" variant="admin" />`
- `apps/website/app/dashboard/articles/[slug]/edit/page.tsx` — fetches `GET /api/articles/:slug` with token, maps to `InitialArticle`, renders `<ArticleForm mode="edit" variant="admin" initial={...} />`
- DashboardShell: added `/dashboard/articles/new` → crumb "ARTÍCULOS / NUEVO"
- DashboardShell: added `articleEditMatch` regex `^/dashboard/articles/([^/]+)/edit$` → crumb "ARTÍCULOS / EDITAR"
- AdminArticleEditor.tsx: confirmed orphan (no imports anywhere) → deleted

## Decisions Made

1. **Slug-based edit URLs** — Articles use slug (string) not id (number) for edit routes, matching advisor guidance and requiring zero API proxy changes.
2. **AdminArticleEditor removed** — The component called `/api/articles/edit` (non-existent endpoint). Since it was not imported anywhere in the app, it was safe to delete outright.
3. **Approve modal doesn't forward tags to API** — The `AdminApproveModal` accepts a tags string but the approve endpoint doesn't take tags. This matches the identical behavior in EventsSection, and is acceptable as-is.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired to real API endpoints.

## Self-Check: PASSED

Files exist:
- FOUND: apps/website/app/dashboard/articles/new/page.tsx
- FOUND: apps/website/app/dashboard/articles/[slug]/edit/page.tsx
- FOUND: apps/website/app/dashboard/sections/ArticlesSection.tsx
- FOUND: apps/website/app/dashboard/DashboardShell.tsx
- DELETED: apps/website/app/dashboard/modals/AdminArticleEditor.tsx (confirmed gone)

Commits exist:
- FOUND: 12051c6 (Task 1)
- FOUND: c30fc81 (Task 2)

TypeScript: pnpm tsc --noEmit — PASSED (no errors)
