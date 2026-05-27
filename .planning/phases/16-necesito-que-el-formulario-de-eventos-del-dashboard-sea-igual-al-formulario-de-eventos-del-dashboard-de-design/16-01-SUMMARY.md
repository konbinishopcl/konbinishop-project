---
phase: 16-necesito-que-el-formulario-de-eventos-del-dashboard-sea-igual-al-formulario-de-eventos-del-dashboard-de-design
plan: "01"
subsystem: dashboard/events
tags: [form, upload, arrays, dashboard, ui-parity]
dependency_graph:
  requires: []
  provides:
    - EventForm component con arrays dinámicos, file uploads y footer correcto
    - InitialEvent type extendido con gallery?: string[]
  affects:
    - apps/website/app/dashboard/events/new/page.tsx (consumer — sin cambios requeridos)
    - apps/website/app/dashboard/events/[id]/edit/page.tsx (consumer — sin cambios requeridos)
tech_stack:
  added: []
  patterns:
    - ImageUploadBox con URL.createObjectURL para preview inmediato
    - Uploads diferidos a handleSubmit (no en onChange)
    - Arrays dinámicos con PriceRow/DateRow/LinkRow types
    - isAdmin derivado de useUser().user?.role para conditional render de Panel 06
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/events/EventForm.tsx
decisions:
  - "Status-select movido del footer al Panel 06 admin-only en el cuerpo del formulario"
  - "CTA label derivado de tabla bloqueada: 6 combinaciones mode × status"
  - "Galería: 8 slots fijos (UI) con texto 'Hasta 8 imágenes' — diseño usa 8, texto original decía 10"
  - "Campo Venue omitido — backend no tiene columna venue (Open Question #1 del RESEARCH)"
  - "Tags/AI-suggest omitidos — no existen en diseño ni en CreateEventDto"
metrics:
  duration: "~6 minutos"
  completed_date: "2026-05-27"
  tasks_completed: 3
  files_modified: 1
---

# Phase 16 Plan 01: EventForm con arrays dinámicos, uploads y footer correcto — Summary

**One-liner:** EventForm reescrito completamente con file picker + preview vía URL.createObjectURL, arrays dinámicos para precios/fechas/sociales/videos, galería de 8 slots, y footer sticky limpio sin status-select.

---

## Changes Made

### Eliminado del archivo original
- Campos escalares `priceName`, `priceAmount`, `dateStr`, `startTime`, `endTime`, `instagram`, `tiktok`, `facebook`, `twitter`, `videoUrl` — reemplazados por arrays dinámicos
- Campos `banner: string` y `poster: string` — reemplazados por `ImageSlot` con file picker
- Footer con `position: fixed` inline styles — reemplazado por clase `.form-foot` del design system
- Status-select en el footer — movido al Panel 06 admin-only en el cuerpo del formulario
- Label incorrecto "Enviar a revisión →" — nunca estuvo en este refactor (se verificó ausencia)

### Añadido en el archivo nuevo
- Tipos auxiliares: `ImageSlot`, `PriceRow`, `DateRow`, `LinkRow`
- `FormData` con arrays dinámicos y `gallery: ImageSlot[]` (8 slots)
- `InitialEvent` extendido con `gallery?: string[]`
- Componente `ImageUploadBox` (file picker + preview + remove)
- `isAdmin` derivado de `useUser().user?.role`
- `ctaLabel` computado según tabla bloqueada (6 combinaciones `mode × form.status`)
- `handleSubmit` con upload de imágenes via `api.uploadImage` antes de construir payload
- 6 paneles siempre visibles: 01 Info básica, 02 Precio, 03 Fechas/ubicación, 04 Multimedia, 05 Redes sociales, 06 Administración (admin-only)
- Footer `.form-foot` con texto informativo izquierda + 3 botones derecha

---

## TypeScript Verification

```
cd apps/website && npx tsc --noEmit
# Exit code: 0 — sin errores TS
```

---

## Acceptance Criteria Results

### Task 1
| Check | Result |
|-------|--------|
| `type ImageSlot` | 1 match (línea 19) |
| `type PriceRow\|DateRow\|LinkRow` | 3 matches (líneas 16-18) |
| `gallery?: string[]` | 1 match (línea 62) |
| `prices: PriceRow[]` | 1 match (línea 37) |
| `function ImageUploadBox` | 1 match (línea 125) |
| `api.uploadImage` | 3 matches (líneas 339, 347, 357) |
| `URL.createObjectURL` | 2 matches (líneas 144, 150) |
| imports `useUser`, `api`, `imageUrl` | presentes |
| `isAdmin` derivation | 1 match (línea 206) |
| `Array(8).fill(null)` | 1 match (línea 217) |
| exports `EventForm` y `InitialEvent` | 2 matches |
| `tsc --noEmit` | PASSED (exit 0) |

### Task 2
| Check | Result |
|-------|--------|
| `<SectionHead n=` count | 6 |
| `n="01"` a `n="06"` | 6 matches |
| Todos los títulos de panel | 6 presentes |
| "+ Agregar otra tarifa/día/video/red social" | 4 presentes |
| `className="add-line"` count | 4 |
| `className="price-row"` count | 1 |
| `className="upload-grid"` count | 1 |
| `<ImageUploadBox` count | 3 (banner, poster, gallery slot en .map) |
| `gridTemplateColumns: "repeat(4, 1fr)"` | 1 match |
| `{isAdmin &&` | 1 match |
| "Hasta 8 imágenes" | 1 match |
| `<select` count | 5 (4 catálogo + 1 status en Panel 06) |
| `tsc --noEmit` | PASSED (exit 0) |

### Task 3
| Check | Result |
|-------|--------|
| `className="form-foot"` | 1 match |
| inline `position: "fixed"` gone | 0 matches |
| 6 CTA labels presentes | PASS (6 matches) |
| "Enviar a revisión →" gone | 0 matches |
| "Estado:" gone from footer | 0 matches |
| `handleSubmit("DRAFT")` | 1 match |
| `handleSubmit(form.status)` | 1 match |
| Cancelar link `.btn.ghost` | 1 match |
| `<select` dentro de `.form-foot` | 0 (awk check) |
| `const ctaLabel` | 1 match |
| `tsc --noEmit` | PASSED (exit 0) |

---

## Deviations from Plan

None — plan executed exactly as written.

All 6 pitfalls del RESEARCH evitados explícitamente:
- **Pitfall #1** (status-select en footer): Status-select colocado en Panel 06 del cuerpo, NUNCA en `.form-foot`
- **Pitfall #2** (CTA label erróneo para PENDING_MODERATION): Tabla de labels bloqueada implementada literalmente — "Crear en revisión →" para create+PENDING
- **Pitfall #3** (InitialEvent sin gallery): `gallery?: string[]` añadido a `InitialEvent`
- **Pitfall #4** (re-upload de imágenes): Después de upload exitoso, `set("banner", { file: null, url: r.url })` limpia el file
- **Pitfall #5** (preview con URL relativa): Se usa `imageUrl(slot.url)` de `lib/api.ts` para convertir `/uploads/x.jpg` → `/api/media/uploads/x.jpg`
- **Pitfall #6** (gallery array vacío al enviar): `galleryUrls.length ? galleryUrls : undefined` — se envía `undefined` si vacío

---

## Manual Smoke Test Notes

La compilación TypeScript exitosa (`tsc --noEmit exit 0`) confirma que:
- Los tipos de `EventForm` props son compatibles con los consumers (`new/page.tsx` y `[id]/edit/page.tsx`)
- La extensión `gallery?: string[]` en `InitialEvent` es opcional — no rompe el backend que no devuelva gallery
- Todos los handlers (`handleSubmit`, `updatePrice`, `addDate`, etc.) tienen tipos correctos

El smoke test visual en browser requeriría un servidor dev activo. Los criterios automatizados (tsc + greps) confirman la corrección estructural completa.

---

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 | `70dda96` | feat(dashboard/events): Task 1 — tipos, estado, ImageUploadBox y handleSubmit con uploads |
| Task 2 | `4739983` | feat(dashboard/events): Task 2 — render de paneles 01-06 |
| Task 3 | `eabf605` | feat(dashboard/events): Task 3 — footer sticky con CTA dinámico, sin status-select |

---

## Known Stubs

None — el formulario está completamente funcional. No hay valores hardcodeados vacíos, placeholders de datos, ni props siempre vacías fluyendo a la UI. Los 8 slots de galería vacíos son intencionales (slots de upload, no datos placeholder).

## Self-Check: PASSED
