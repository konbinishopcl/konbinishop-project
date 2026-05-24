---
phase: 08-schema-v2
plan: 01
subsystem: database-schema
tags: [prisma, schema, user-model, migrations, v2]
dependency_graph:
  requires: []
  provides: [SCH-01, UserType enum, User.handle, User.type, User.isVerified, User.twoFactorCode, User.twoFactorExpiry]
  affects: [apps/api/prisma/schema.prisma, apps/api/prisma/migrations, .planning/REQUIREMENTS.md]
tech_stack:
  added: []
  patterns: [Prisma migrate deploy (non-interactive), manual migration SQL creation]
key_files:
  created:
    - apps/api/prisma/migrations/20260524183711_sch01_user_v2/migration.sql
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/prisma.config.ts
    - .planning/REQUIREMENTS.md
decisions:
  - "D8-PROFILE: Profile permanece separado de User (no fusión en esta fase) — handle va en User para namespace global"
  - "D8-HANDLE-NULL: handle inicializa como NULL para usuarios existentes — migración de Profile.slug diferida a Phase 13"
  - "D8-MIGRATION-MANUAL: migrate dev no funciona en entorno no-interactivo; se usó --create-only equivalent: SQL manual + migrate deploy"
metrics:
  duration: "~7 minutos"
  completed_date: "2026-05-24"
  tasks_completed: 2
  files_changed: 4
---

# Phase 08 Plan 01: User v2 + SCH-01..SCH-06 en REQUIREMENTS.md — Summary

Enum `UserType` y 5 campos escalares nuevos en `User` (type, handle, isVerified, twoFactorCode, twoFactorExpiry); migración `20260524183711_sch01_user_v2` aplicada en MySQL; sección v2 con SCH-01..SCH-06 documentada en REQUIREMENTS.md.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Agregar SCH-01..SCH-06 a REQUIREMENTS.md | fd892c5 | .planning/REQUIREMENTS.md |
| 2 | Extender modelo User con campos v2 + migración Prisma | 6f8e6be | schema.prisma, migrations/20260524183711_sch01_user_v2/, prisma.config.ts |

## What Was Built

### REQUIREMENTS.md — Sección v2

Agregada sección `## v2 Requirements — Milestone "Plataforma completa"` con los requisitos SCH-01..SCH-06 documentados con sus descripciones canónicas. La sección v1 original no fue modificada.

### schema.prisma — enum UserType + 5 campos en User

**Enum agregado:**
```prisma
enum UserType {
  PERSON
  ORGANIZATION
}
```

**Campos agregados a User (después de `blocked`):**
```prisma
  type            UserType  @default(PERSON)
  handle          String?   @unique
  isVerified      Boolean   @default(false)
  twoFactorCode   String?
  twoFactorExpiry DateTime?
```

### Migración aplicada

- Nombre: `20260524183711_sch01_user_v2`
- SQL: ADD COLUMN type ENUM('PERSON','ORGANIZATION'), ADD COLUMN handle VARCHAR(191) NULL, ADD COLUMN isVerified BOOLEAN DEFAULT false, ADD COLUMN twoFactorCode VARCHAR(191) NULL, ADD COLUMN twoFactorExpiry DATETIME(3) NULL; CREATE UNIQUE INDEX User_handle_key

## Decisions Made

1. **D8-PROFILE: Profile permanece separado** — El campo `handle` va en `User` (namespace global entre personas y organizaciones), pero la tabla `Profile` no se fusiona con `User` en esta fase. Decisión locked por KEY DECISION #1 del RESEARCH.

2. **D8-HANDLE-NULL: handle = NULL para usuarios existentes** — La migración deja `handle` como nullable. Los usuarios existentes obtienen NULL. La inicialización desde `Profile.slug` se difiere a Phase 13 (Perfil público v2). No hay colisión de datos.

3. **D8-MIGRATION-MANUAL: SQL manual + migrate deploy** — El entorno de ejecución no es interactivo (sin TTY), lo que impide `prisma migrate dev`. Se creó el archivo SQL manualmente y se aplicó con `prisma migrate deploy`. El resultado es idéntico al que generaría `migrate dev`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug preexistente] Eliminado campo `seed` inválido de prisma.config.ts**
- **Encontrado durante:** Task 2 (verificación `pnpm tsc --noEmit`)
- **Issue:** `prisma.config.ts` tenía `seed: "ts-node prisma/seed.ts"` que no existe en el tipo `PrismaConfig` de Prisma 6. Error: `error TS2353: Object literal may only specify known properties, and 'seed' does not exist in type 'PrismaConfig'`.
- **Fix:** Se eliminó la propiedad `seed` del objeto de configuración. La semilla se invoca directamente via `pnpm prisma db seed` (que ya estaba configurado en `package.json` con el campo `prisma.seed`).
- **Verificado:** Error no existía antes de Phase 8 (confirmado con `git stash`). El error sí era preexistente al presente plan — no introducido por los cambios del Plan 01.
- **Archivos modificados:** `apps/api/prisma.config.ts`
- **Commit:** 6f8e6be (incluido en commit de Task 2)

**2. [Rule 3 - Blocker] Docker MySQL iniciado manualmente**
- **Encontrado durante:** Task 2 (primera ejecución de `prisma migrate dev`)
- **Issue:** No había servidor MySQL corriendo. La DB usa Docker pero no había contenedor activo.
- **Fix:** `docker run --name konbini-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=konbini -p 3306:3306 -d mysql:8.0`, luego `migrate deploy` para todas las migraciones previas.
- **Nota:** El contenedor es efímero — se necesita iniciarlo de nuevo en próximas sesiones.

**3. [Rule 3 - Blocker] Entorno no-interactivo impide `prisma migrate dev`**
- **Encontrado durante:** Task 2
- **Issue:** `prisma migrate dev` detecta entorno no-interactivo y falla con error P1001 de tty.
- **Fix:** Se creó el archivo `migration.sql` manualmente con el SQL correcto y se aplicó con `prisma migrate deploy`. La carpeta de migración tiene el nombre correcto con timestamp real.

## Known Stubs

Ninguno — este plan solo agrega campos de schema y documentación. No hay lógica de negocio ni componentes UI.

## Verification Results

```
pnpm prisma validate  → ✅ The schema at prisma/schema.prisma is valid
pnpm prisma generate  → ✅ Generated Prisma Client (v6.19.3)
pnpm tsc --noEmit     → ✅ Exit 0 (sin errores de compilación)
```

Todos los acceptance criteria del plan verificados:
- ✅ `enum UserType { PERSON, ORGANIZATION }` en schema.prisma
- ✅ `type UserType @default(PERSON)` en modelo User
- ✅ `handle String? @unique` en modelo User
- ✅ `isVerified Boolean @default(false)` en modelo User
- ✅ `twoFactorCode` y `twoFactorExpiry` en modelo User
- ✅ Migración `20260524183711_sch01_user_v2` aplicada
- ✅ Sección `## v2 Requirements` en REQUIREMENTS.md
- ✅ SCH-01..SCH-06 documentados (6 referencias)
- ✅ Sección v1 intacta (AUTH-01 presente)

## Self-Check: PASSED
