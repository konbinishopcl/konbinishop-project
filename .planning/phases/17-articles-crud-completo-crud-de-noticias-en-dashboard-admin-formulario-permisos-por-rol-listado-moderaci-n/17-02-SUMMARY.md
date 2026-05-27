---
phase: 17-articles-crud
plan: "02"
subsystem: dashboard/articles
tags: [form, markdown-editor, react-hook-form, zod, image-upload, tags]
dependency_graph:
  requires: [17-01]
  provides: [ArticleForm, MarkdownEditor]
  affects: [17-03, 17-04]
tech_stack:
  added: []
  patterns:
    - RHF+Zod form with Controller for MarkdownEditor
    - Local state for selectedTagIds (number[]) outside RHF
    - ImageUploadBox replicated locally (banner 16:9 only)
    - Sticky footer with dynamic CTA based on mode+variant+status
    - status and eventId always registered in RHF even when not rendered
key_files:
  created:
    - apps/website/components/MarkdownEditor.tsx
    - apps/website/app/dashboard/articles/ArticleForm.tsx
  modified: []
decisions:
  - "D-04 honored: ArticleForm uses flat fields, zero accordion elements"
  - "D-04-2: Dropped unused useCallback and setValue from ArticleForm (advisor rule: noUnusedLocals)"
  - "Toolbar buttons decorative (no onClick) matching UpsellView pattern"
  - "eventId rendered only in sponsored+create; status rendered only in admin+isAdmin"
metrics:
  duration: "~15min"
  completed: "2026-05-27"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 17 Plan 02: MarkdownEditor compartido + ArticleForm sin accordion — Summary

**One-liner:** Extrajo MarkdownEditor de UpsellView como componente reutilizable y creó ArticleForm con RHF+Zod, campos planos, image upload, tags multi-select y variantes admin/sponsored.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Crear MarkdownEditor compartido (extraer de UpsellView) | fa6a074 |
| 2 | Crear ArticleForm sin accordion (RHF + Zod + image upload + tags) | fa6a074 |

## What Was Built

### MarkdownEditor (`apps/website/components/MarkdownEditor.tsx`)
- Toolbar horizontal con 7 botones decorativos (B, I, H1, H2, ≡, ", 🔗)
- Botones con `tabIndex={-1}` para no interrumpir el flujo de Tab del formulario
- Badge "MARKDOWN" alineado a la derecha de la toolbar
- Textarea nativo con `fontFamily: var(--font-mono)` y `lineHeight: 1.6`
- Props: `value`, `onChange`, `placeholder`, `minHeight` (default 240), `id`, `helpText`
- Help text configurable debajo del textarea
- 85 líneas

### ArticleForm (`apps/website/app/dashboard/articles/ArticleForm.tsx`)
- Campos planos (cero accordion, cero AccItem): Título, Slug, Extracto, Imagen, Contenido, Tags
- `variant="admin"`: muestra select de Estado (APPROVED/PENDING_MODERATION/DRAFT), oculta eventId
- `variant="sponsored"`: muestra select de evento de GET /api/events/mine (solo en create), oculta status
- `mode="create"` + `variant="admin"` → POST /api/articles
- `mode="create"` + `variant="sponsored"` → POST /api/articles/sponsored
- `mode="edit"` → PATCH /api/articles/:id
- Tras guardar, si admin seleccionó APPROVED, llama PATCH /api/articles/:id/approve
- Image upload via `api.uploadImage()` con preview inmediato
- Tags multi-select con búsqueda, selectedTagIds fuera de RHF
- CTA dinámico según mode+variant+watchStatus
- Sticky footer con blur backdrop y texto contextual
- Exporta `ArticleForm` y `InitialArticle` type
- 356 líneas

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused imports: useCallback, setValue**
- **Found during:** Pre-write advisor review
- **Issue:** Plan's action block included `useCallback` in imports and `setValue` in useForm destructure, neither used in the component body. This would cause TypeScript `noUnusedLocals` errors.
- **Fix:** Removed `useCallback` from imports; destructured only `{ register, control, handleSubmit, watch, formState }` from useForm
- **Files modified:** apps/website/app/dashboard/articles/ArticleForm.tsx
- **Commit:** fa6a074

## Known Stubs

None — both components are fully wired. MarkdownEditor reads/writes real value via props. ArticleForm fetches real data from /api/tags and /api/events/mine, uploads images via api.uploadImage, and submits to real endpoints.

## Self-Check: PASSED

- [x] `apps/website/components/MarkdownEditor.tsx` exists and exports MarkdownEditor (1 match)
- [x] `apps/website/app/dashboard/articles/ArticleForm.tsx` exists and exports ArticleForm + InitialArticle
- [x] `grep -c "form-acc\|AccItem"` returns 0 in ArticleForm
- [x] `grep -c "api.uploadImage"` returns 1 in ArticleForm
- [x] `grep -c "/api/tags"` returns 1 in ArticleForm
- [x] `grep -c "/api/events/mine"` returns 1 in ArticleForm
- [x] `grep -c "/api/articles/sponsored"` returns 1 in ArticleForm
- [x] `pnpm tsc --noEmit` passes with zero errors
- [x] Commit fa6a074 exists on develop branch
