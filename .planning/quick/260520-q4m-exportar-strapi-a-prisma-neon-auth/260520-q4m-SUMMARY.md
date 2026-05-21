---
phase: quick
plan: q4m
subsystem: api-prisma-schema
tags: [prisma, nestjs, neon, neon-auth, schema, seeders, strapi-export]
dependency_graph:
  requires: []
  provides: [prisma-schema, prisma-migration, prisma-seed, profile-model]
  affects: [apps/api/prisma/schema.prisma, apps/api/package.json]
tech_stack:
  added: []
  patterns: [prisma-implicit-m2m, prisma-component-tables, neon-auth-profile-split]
key_files:
  created:
    - apps/api/prisma/seed.ts
    - apps/api/prisma/migrations/20260520234052_strapi_models/migration.sql
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/package.json
decisions:
  - "No User/auth model — autenticación delegada a Neon Auth; los extras de usuario viven en Profile (PK = id de Neon Auth)"
  - "Relaciones a usuario (userId, approvedById, rejectedById) son columnas String sin FK — Neon Auth es el source of truth"
  - "approved_by corregido de oneToMany (Strapi) a referencia n:1 única"
  - "Typo heredado corregido: rejected_reazon -> rejectedReason"
  - "Campos media (banner/poster/imágenes) → String (URL); gallery → String[]"
  - "Componentes de Strapi (prices/dates/rrss/videos) → tablas propias con FK cascade a Event"
  - "Strapi date -> DateTime @db.Date; Strapi time -> String (HH:mm)"
  - "m2m vía implicit many-to-many de Prisma (Article↔Tag, Article↔Event, Event↔Category, Hero↔Category)"
  - "neon_auth.users_sync NO se mapea aún — Neon Auth no está activado; queda como follow-up"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-20T23:48:00Z"
  tasks_completed: 3
  files_changed: 4
---

# Quick Task q4m: Export Strapi → Prisma (NestJS API) con Neon Auth

**One-liner:** Los 8 content types de Strapi + sus 4 componentes quedaron traducidos a `schema.prisma`, migrados en Neon, y poblados con un seed idempotente — sin modelo de usuario, delegando auth a Neon Auth con un modelo `Profile` aparte.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Traducir content types de Strapi a schema.prisma | (uncommitted) | apps/api/prisma/schema.prisma |
| 2 | Migrar contra Neon + regenerar cliente | (uncommitted) | apps/api/prisma/migrations/ |
| 3 | Seed script + wiring en package.json | (uncommitted) | apps/api/prisma/seed.ts, package.json |

## What Was Built

### schema.prisma — 13 modelos

- **Geo:** `Region`, `Commune` (Commune n:1 Region)
- **Taxonomía:** `Category`, `Tag`
- **Contenido:** `Article`, `Hero`, `Spot`, `Event`
- **Componentes de Event:** `EventPrice`, `EventDate`, `EventSocialLink`, `EventVideo` (FK cascade a Event)
- **`Profile`:** campos extra del usuario (rut, isCompany, firstname, lastname, role), PK = id de Neon Auth

Cada atributo se mapeó fiel a los `schema.json` de Strapi, aplicando las decisiones del frontmatter. m2m: Article↔Tag, Article↔Event, Event↔Category, Hero↔Category.

### Migración

`20260520234052_strapi_models` aplicada en la base `neondb` de Neon. `prisma migrate status` → "Database schema is up to date".

### seed.ts

Script idempotente (`deleteMany` en orden FK-safe → `create`): las **16 regiones de Chile con sus 346 comunas** (data-driven, igual que el seeder de Strapi), 5 categorías, 5 tags, 3 artículos, 2 heroes, 3 spots, 3 eventos (con componentes) y 2 profiles. Slugs generados con un helper `slugify` (sin acentos). Cableado vía `prisma.seed` en package.json + script `prisma:seed`.

## Verification

- `prisma validate` → schema válido
- `prisma migrate status` → up to date en Neon
- `prisma:seed` ejecutado **dos veces seguidas** sin error → idempotente
- Conteo final: regions 16, communes 346, categories 5, tags 5, articles 3, heroes 2, spots 3, events 3, profiles 2
- `nest build` → OK con el cliente regenerado

## Deviations from Plan

Ninguna — el plan se ejecutó tal cual.

## Known Stubs / Follow-ups

- **Neon Auth (activado 2026-05-20):** está basado en Better Auth — creó el esquema `neon_auth` con tablas propias (`user`, `session`, `account`, `organization`, `member`, `jwks`...). Prisma gestiona SOLO `public`; `neon_auth.*` lo gestiona Better Auth y NO debe mapearse en el schema de Prisma (migrate intentaría sobrescribir sus tablas). El diseño actual (Profile + userId String sin FK) ya es el patrón correcto. Falta la **integración de auth en runtime**: instancia de Better Auth + guard de NestJS que valide la sesión/JWT.
- **Endpoints REST:** este task entregó solo el modelo de datos + seed. Exponer los content types como recursos NestJS (controllers/services/DTOs por entidad) + el endpoint `/stats` queda como trabajo siguiente — candidato a fase GSD propia.
- **Imágenes:** los campos media se seedearon con URLs `placehold.co`; falta una estrategia real de uploads.

## Self-Check: PASSED

- `apps/api/prisma/schema.prisma` (13 modelos) — FOUND
- `apps/api/prisma/seed.ts` — FOUND
- `apps/api/prisma/migrations/20260520234052_strapi_models/migration.sql` — FOUND
- Migración aplicada en Neon — CONFIRMED
