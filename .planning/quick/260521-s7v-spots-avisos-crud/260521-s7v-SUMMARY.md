---
phase: quick
plan: s7v
subsystem: api-spots
tags: [api, nestjs, prisma, spots, ads]
status: complete
key_files:
  created:
    - apps/api/prisma/migrations/20260521140240_rework_spots/
    - apps/api/src/spots/spots.module.ts
    - apps/api/src/spots/spots.controller.ts
    - apps/api/src/spots/spots.service.ts
    - apps/api/src/spots/dto/create-spot.dto.ts
    - apps/api/src/spots/dto/update-spot.dto.ts
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/prisma/seed.ts
    - apps/api/src/app.module.ts
    - apps/api/src/catalog/catalog.controller.ts
    - apps/api/src/catalog/catalog.service.ts
metrics:
  completed: "2026-05-21"
---

# Quick Task s7v: Feature de avisos (Spots) en la API

**One-liner:** El modelo `Spot` es ahora el feature de avisos pagados — CRUD completo en la
API; cualquier usuario autenticado crea un aviso y queda activo al instante.

## Qué se hizo

- **Schema** — el modelo `Spot` se rehízo: `title` (requerido), `image?`, `linkType` (enum
  `SpotLinkType` = URL / PHONE / EMAIL), `linkValue`, `expirationDate?`, y `owner` (relación
  a `User`). Migración `20260521140240_rework_spots` aplicada (se vació la tabla `Spot` antes,
  por las columnas nuevas NOT NULL — no afecta a otras tablas).
- **Seed** — la sección de spots se reescribió al nuevo shape y se movió a después de crear
  el usuario dueño (3 ejemplos: uno por cada `linkType`).
- **Módulo `spots`** nuevo — `GET /api/spots` (público, solo vigentes),
  `GET /api/spots/mine` (autenticado), `POST /api/spots` (cualquier autenticado),
  `PATCH` / `DELETE /api/spots/:id` (dueño o admin). Documentado en Swagger (`@ApiTags`).
- **Catalog** — se quitó el `GET /spots` que tenía; ahora lo sirve el módulo `spots`.

## Verificación

`nest build` limpio. Smoke test (API en :3399):
- `GET /api/spots` → `[]` (tabla vacía tras la migración).
- `POST /api/spots` (organizador, `linkType:PHONE`) → `201` con el aviso creado; aparece de
  inmediato en `GET /api/spots` y `GET /api/spots/mine`.
- `POST` sin token → `401`; `linkType` inválido → `400`.
- `PATCH` (dueño) → `200`; `DELETE` (dueño) → `{deleted:true}`.

## Notas

- El nombre `Spot` se mantiene a propósito (los ad-blockers bloquean rutas con "ad") — ver
  memoria del proyecto.
- La tabla `Spot` quedó **vacía** tras la migración (no se reseedeó para no borrar los
  eventos del usuario). `pnpm prisma:seed` repuebla con 3 avisos de ejemplo.
- Pagos: los avisos son pagados, pero no hay pasarela — se crean activos sin paso de cobro.
- Falta la UI en el website (sin diseño aún) — fuera de alcance: este quick es solo API.
