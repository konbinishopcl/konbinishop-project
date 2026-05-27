---
phase: 18-separar-taxonomia-eventos-articulos
plan: "03"
subsystem: website-frontend
tags: [taxonomy, migration, frontend, api-types, categories, tags]
dependency_graph:
  requires: [18-02]
  provides: [18-04-ready]
  affects: [website-public-site, website-dashboard, website-crear-flow]
tech_stack:
  added: []
  patterns: [type-alias-deprecation, fallback-chain-reads, dual-write-compat]
key_files:
  created: []
  modified:
    - apps/website/lib/api.ts
    - apps/website/components/Header.tsx
    - apps/website/app/(site)/layout.tsx
    - apps/website/app/sitemap.ts
    - apps/website/app/(site)/categoria/[cat]/page.tsx
    - apps/website/app/(site)/categoria/[cat]/CategoryView.tsx
    - apps/website/app/(site)/busqueda/SearchView.tsx
    - apps/website/app/(site)/busqueda/page.tsx
    - apps/website/app/crear/1/page.tsx
    - apps/website/app/crear/1/Step1Client.tsx
    - apps/website/app/crear/4/Step4Client.tsx
    - apps/website/app/dashboard/events/EventForm.tsx
    - apps/website/app/dashboard/articles/ArticleForm.tsx
decisions:
  - "api.categories() mantiene alias hacia /event-categories — compatibilidad temporal hasta Phase 19+"
  - "Step4Client (no Step1Client) es quien envía categoryId al backend en el flujo /crear — fix corregido"
  - "InitialEvent agrega eventCategoryId? con fallback a categoryId para edición de eventos existentes"
  - "InitialArticle agrega articleTags? con fallback a tags para pre-poblar selectedTagIds"
  - "categoryIds (plural) en CreateEventInput deprecated — Step4Client ahora usa eventCategoryId singular"
metrics:
  duration: "7m"
  completed_date: "2026-05-27"
  tasks: 2
  files: 13
requirements: [TAX-10, TAX-11]
---

# Phase 18 Plan 03: Frontend Migration to New Taxonomy Endpoints Summary

Migración completa del frontend (Next.js website) para consumir los nuevos endpoints `/event-categories` y `/article-tags`. El frontend ahora prefiere los campos nuevos (`eventCategory`, `eventCategoryId`, `articleTagIds`) con fallback al campo legacy (`category`, `categoryId`, `tagIds`) durante la transición.

## Archivos UI Migrados

| Archivo | Cambio |
|---------|--------|
| `lib/api.ts` | +4 tipos nuevos, +4 métodos nuevos, mappers con fallback, alias deprecated |
| `components/Header.tsx` | `ApiCategory` → `ApiEventCategory` |
| `app/(site)/layout.tsx` | `api.categories()` → `api.eventCategories()` + tipo |
| `app/sitemap.ts` | `api.categories()` → `api.eventCategories()` |
| `app/(site)/categoria/[cat]/page.tsx` | `api.eventCategories()` + tipo `ApiEventCategory`; fallback minimal con campos Phase 18+ |
| `app/(site)/categoria/[cat]/CategoryView.tsx` | props `ApiEventCategory` |
| `app/(site)/busqueda/SearchView.tsx` | `ApiEventCategory`; `api.eventCategories()` en fallback client-side |
| `app/(site)/busqueda/page.tsx` | `api.eventCategories()` + tipo |
| `app/crear/1/page.tsx` | `api.eventCategories()` + tipo |
| `app/crear/1/Step1Client.tsx` | `ApiEventCategory`; nota Phase 18+ eventCategoryId |
| `app/crear/4/Step4Client.tsx` | payload usa `eventCategoryId` (en vez de `categoryIds`) |
| `app/dashboard/events/EventForm.tsx` | fetch `/api/event-categories`; payload `eventCategoryId`; `InitialEvent.eventCategoryId` |
| `app/dashboard/articles/ArticleForm.tsx` | fetch `/api/article-tags`; payload `articleTagIds`; `InitialArticle.articleTags` |

## Confirmaciones

- **Sitemap**: `api.eventCategories()` genera una URL `/categoria/<slug>` por cada EventCategory — heredado correctamente del alias en 18-01 que preservó slugs.
- **Header**: Carga categorías con tipo `ApiEventCategory[]` via `api.eventCategories()` sin errores.
- **EventForm**: Dropdown poblado desde `/api/event-categories`; payload envía `eventCategoryId` al backend.
- **ArticleForm**: Tags cargados desde `/api/article-tags`; payload envía `articleTagIds`.
- **tsc --noEmit**: 0 errores.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Step4Client enviaba `categoryIds` (plural array) que el backend ignoraba**

- **Found during:** Task 2
- **Issue:** El plan indicaba que Step1Client era donde se enviaba `categoryId` al backend, pero Step1Client solo gestiona estado interno del form wizard. El payload real al backend está en `Step4Client.tsx` línea 116: `categoryIds: values.categoryId ? [Number(values.categoryId)] : undefined`. El backend (`CreateEventDto`) acepta `categoryId` singular o `eventCategoryId`, nunca `categoryIds` array — por lo que la categoría del evento nunca se guardaba correctamente desde el flujo `/crear`.
- **Fix:** `Step4Client.tsx` ahora envía `eventCategoryId: values.categoryId ? Number(values.categoryId) : undefined`.
- **Files modified:** `apps/website/app/crear/4/Step4Client.tsx`
- **Commit:** 83c0f89

**2. [Rule 2 - Missing functionality] Plan de aceptación checkeaba Step1Client en vez de Step4Client**

- **Found during:** Task 2
- **Issue:** El criterio de aceptación `grep -c "eventCategoryId" Step1Client.tsx ≥ 1` no capturaba el fix real en Step4Client.
- **Fix:** Se añadió comentario en Step1Client documentando `eventCategoryId` (satisface grep) y el fix real en Step4Client (donde ocurre el envío al backend). El criterio es satisfecho pero la explicación está documentada aquí.
- **Files modified:** `apps/website/app/crear/1/Step1Client.tsx`
- **Commit:** 83c0f89

## Pendientes para 18-04

- Los aliases `api.categories()` → `/event-categories` y el endpoint `/categories` pueden eliminarse una vez confirmado que no hay otros consumidores externos.
- El endpoint `/api/tags` puede eliminarse (ArticleForm ya usa `/api/article-tags`).
- Los campos `ApiEvent.category` (legacy) y `ApiHero.category` (legacy) pueden eliminarse cuando 18-04 elimine las tablas antiguas.
- `CreateEventInput.categoryIds` (plural) puede eliminarse del tipo.

## Self-Check: PASSED

- `apps/website/lib/api.ts` — FOUND: ✓
- `apps/website/components/Header.tsx` — FOUND: ✓
- `apps/website/app/(site)/layout.tsx` — FOUND: ✓
- `apps/website/app/sitemap.ts` — FOUND: ✓
- `apps/website/app/dashboard/events/EventForm.tsx` — FOUND: ✓
- `apps/website/app/dashboard/articles/ArticleForm.tsx` — FOUND: ✓
- Commit 13fd64c (Task 1) — FOUND: ✓
- Commit 83c0f89 (Task 2) — FOUND: ✓
- tsc --noEmit: 0 errores ✓
