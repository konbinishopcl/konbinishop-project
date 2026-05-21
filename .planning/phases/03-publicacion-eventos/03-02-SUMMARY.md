---
phase: 3
plan: "03-02"
subsystem: website-create-event
tags: [website, nextjs, uploads, form]
status: complete
provides: [event-image-upload]
affects: [apps/website/app/(site)/crear/page.tsx, apps/website/lib/api.ts]
key_files:
  modified:
    - apps/website/lib/api.ts
    - apps/website/app/(site)/crear/page.tsx
metrics:
  completed: "2026-05-21"
  files_changed: 2
---

# Phase 3 · Summary 03-02: Subida de imágenes en /crear

**One-liner:** El Step 3 del formulario `/crear` sube banner, poster y galería contra
`POST /api/upload`; el evento se crea con las rutas `/uploads/...` reales.

## Qué se construyó

- **`lib/api.ts`** — `api.uploadImage(file, token)`: `POST /api/upload` con `FormData`
  multipart (sin fijar `Content-Type` — lo pone el navegador con su boundary); devuelve
  `{ url, filename }`.
- **`/crear/page.tsx`**:
  - `FormData` gana `banner`, `poster` (string) y `gallery` (string[]).
  - Componente `ImageUploader` reutilizable: input de archivo oculto, sube al elegir, muestra
    el preview con `imageUrl()` y permite quitar la imagen; estados de "Subiendo…" y error.
  - Step 3: banner y poster con `ImageUploader`; galería con thumbnails subidos (removibles)
    + botón "Agregar" hasta 10 imágenes.
  - El submit incluye `banner` / `poster` / `gallery` en el `CreateEventInput`.

## Verification

- `pnpm build` del website → compila sin errores.
- Smoke test runtime (API en :3399): `POST /api/upload` con una imagen → `201` con
  `{ url: "/uploads/…", filename }`; el archivo queda servido en `/uploads`.
- (El primer intento en :3333 salió vacío por chocar con el dev del usuario en ese puerto;
  repetido en :3399 con la API propia funcionó.)

## Deviations from Plan

Ninguna.

## Known Stubs / Follow-ups

- **03-03:** panel `/cuenta` — lista de eventos del organizador con su estado.
- La subida es de a una imagen por vez (sin selección múltiple ni drag-and-drop).

## Self-Check: PASSED

- `api.uploadImage` (multipart) en `lib/api.ts` — FOUND
- `ImageUploader` + galería funcional en `/crear` Step 3 — CONFIRMED
- `pnpm build` limpio + `POST /api/upload` → 201 con `{url}` — CONFIRMED
