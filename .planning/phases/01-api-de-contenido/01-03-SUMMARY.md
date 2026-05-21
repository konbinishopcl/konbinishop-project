---
phase: 1
plan: "01-03"
subsystem: api-uploads
tags: [api, nestjs, uploads, multipart]
status: complete
provides: [upload-endpoint]
affects: [apps/api/src/uploads, apps/api/src/app.module.ts, apps/api/src/main.ts]
key_files:
  created:
    - apps/api/src/uploads/uploads.module.ts
    - apps/api/src/uploads/uploads.controller.ts
    - apps/api/src/uploads/uploads.service.ts
  modified:
    - apps/api/src/app.module.ts
    - apps/api/src/main.ts
metrics:
  completed: "2026-05-21"
  files_changed: 5
  endpoints_added: 1
---

# Phase 1 · Summary 01-03: Endpoint de subida de imágenes

**One-liner:** `POST /api/upload` recibe una imagen, la valida, la guarda en
`apps/api/uploads/` y devuelve su URL pública — con esto la API de contenido (Phase 1) queda
completa.

## Qué se construyó

Módulo `uploads` (`uploads.module.ts`, `uploads.controller.ts`, `uploads.service.ts`),
registrado en `app.module.ts`.

| Método | Ruta | Acceso | Resultado |
|--------|------|--------|-----------|
| POST | `/api/upload` | autenticado | Guarda la imagen y devuelve `{ url, filename }` |

### Detalles

- `FileInterceptor` de `@nestjs/platform-express` (almacenamiento en memoria); el service
  escribe el buffer a disco con `fs`. No se importó `multer` directamente ni se agregaron
  dependencias.
- Valida MIME (JPG / PNG / WebP) y tamaño (máx. 5 MB); nombre único `timestamp-random.ext`.
- Devuelve la ruta relativa `/uploads/<archivo>`, igual que las imágenes del seed.
- `main.ts` y el service resuelven el directorio `uploads/` por `process.cwd()` (consistente).

## Verification

`nest build` limpio. Smoke test con la API + base local:

- `POST /api/upload` sin token → `401` ✓
- `POST /api/upload` con token + JPG → `200` con `{ url: "/uploads/…" }`; pedir esa URL → `200 image/jpeg` ✓
- `POST /api/upload` con archivo no-imagen (`text/plain`) → `400` ✓
- Archivo de prueba eliminado tras el test — `uploads/` queda con las 24 imágenes del seed.

## Deviations from Plan

Ninguna.

## Phase 1 — Cierre

Con 01-03 termina **Phase 1 — API de contenido**. La API NestJS ya expone todo lo que el
sitio necesita:

- **Eventos** (01-01): listado público, detalle, CRUD del organizador, moderación.
- **Catálogo** (01-02): regiones, comunas, categorías, tags, heroes, spots, artículos.
- **Subida de imágenes** (01-03): `POST /api/upload` + servido estático en `/uploads`.

Siguiente: **Phase 2 — Sitio público con datos reales** (conectar home, categorías y detalle
de evento a la API, y quitar el checkout).

## Self-Check: PASSED

- `apps/api/src/uploads/` (module, controller, service) — FOUND
- `UploadsModule` registrado en `app.module.ts` — CONFIRMED
- `nest build` → `dist/` limpio — CONFIRMED
- `POST /api/upload` probado (401 / 200 / 400) + URL servida — CONFIRMED
