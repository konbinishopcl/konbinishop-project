---
phase: quick
plan: h3o
subsystem: api-heroes
tags: [api, nestjs, prisma, heroes, paid-placement]
status: complete
key_files:
  created:
    - apps/api/prisma/migrations/20260521xxxxxx_rework_heroes/
    - apps/api/src/heroes/heroes.module.ts
    - apps/api/src/heroes/heroes.controller.ts
    - apps/api/src/heroes/heroes.service.ts
    - apps/api/src/heroes/dto/create-hero.dto.ts
    - apps/api/src/heroes/dto/update-hero.dto.ts
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/prisma/seed.ts
    - apps/api/.env
    - apps/api/.env.example
    - apps/api/src/app.module.ts
    - apps/api/src/catalog/catalog.controller.ts
    - apps/api/src/catalog/catalog.service.ts
metrics:
  completed: "2026-05-21"
---

# Quick Task h3o: Heroes como placement pagado

**One-liner:** `Hero` es ahora un placement pagado del carrusel del home — CRUD completo,
cobro por día y cupo global, igual que los spots pero para el hero.

## Qué se hizo

- **Schema** — `Hero` rehecho: `title`, `lead?`, `image`, `date?`, `place?`,
  `linkType`+`linkValue` (reusa el enum `SpotLinkType`), `category?`, `owner`, y los campos
  de cobro `days` / `amount` / `expirationDate`. Se quitó región y comuna de `Hero`,
  `Region` y `Commune` (ya no se relacionan). Migración `rework_heroes` aplicada (tabla
  `Hero` vaciada antes, por las columnas nuevas NOT NULL).
- **Env** — `HERO_PRICE_PER_DAY`, `HERO_MAX_ACTIVE` (+ `SPOT_PRICE_PER_DAY`,
  `SPOT_MAX_ACTIVE` para el rework de spots) en `.env` y `.env.example`.
- **Módulo `heroes`** — `GET /api/heroes` (público, solo vigentes), `/heroes/quota`
  (cupo + precio/día), `/heroes/mine`, `POST /heroes` (cualquier autenticado, valida cupo
  global), `PATCH`/`DELETE /heroes/:id` (dueño o admin). Documentado en Swagger (tag
  `heroes`).
- **Cobro y cupo** — al crear: `amount = days × HERO_PRICE_PER_DAY`,
  `expirationDate = hoy + days`. Si los heroes activos llegan al `HERO_MAX_ACTIVE` global,
  un `POST` más responde `409`. El hero queda activo al crearse (sin paso de pago).
- **Catalog** — se quitó el `GET /heroes`; ahora lo sirve el módulo `heroes`.
- **Seed** — la sección de heroes se reescribió al nuevo shape (2 ejemplos, tras el usuario
  dueño).

## Verificación

`nest build` limpio. Smoke test (API en :3399):
- `GET /heroes/quota` → `{max:5, active:0, available:5, pricePerDay:15000}`.
- `POST /heroes` (days 10) → `amount:150000` (10×15000), expiración hoy+10.
- Sin token → `401`; `days:0` → `400`.
- Tras 5 heroes activos, el 6º → `409` (cupo global lleno).
- CRUD y limpieza OK.

## Notas / Follow-ups

- **Spots**: aún hay que aplicarles el mismo cobro-por-día + cupo global (`SPOT_*` ya están
  en el env). Es el siguiente paso.
- La tabla `Hero` quedó vacía tras la migración; `pnpm prisma:seed` repuebla con 2 ejemplos.
- El nombre del enum `SpotLinkType` se reutiliza para el link del hero (mismo concepto).
- Sin tocar el website (el HeroBlock del home sigue mostrando eventos — se revisará al
  retomar el website).
