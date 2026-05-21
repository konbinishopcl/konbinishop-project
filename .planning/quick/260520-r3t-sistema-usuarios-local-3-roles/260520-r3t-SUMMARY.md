---
phase: quick
plan: r3t
subsystem: api-local-users
tags: [prisma, users, roles, auth, postgres-local, bcrypt, neon-removal]
dependency_graph:
  requires: [260520-q4m]
  provides: [user-model, role-enum, local-postgres]
  affects: [apps/api/prisma/schema.prisma, apps/api/prisma/seed.ts, apps/api/.env]
tech_stack:
  added: [bcryptjs]
  removed: [neon, neon-auth, prisma-directUrl]
  patterns: [prisma-enum-role, named-relations-user-event]
key_files:
  created:
    - apps/api/prisma/migrations/20260521005715_init/migration.sql
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/prisma/seed.ts
    - apps/api/.env
    - apps/api/.env.example
    - apps/api/package.json
decisions:
  - "Se descarta Neon y Neon Auth — la API usa PostgreSQL local (base/rol konbini en WSL)"
  - "Modelo User propio reemplaza a Profile: email (unique), passwordHash (bcrypt), firstname, lastname, rut, isCompany, role, confirmed, blocked"
  - "enum Role { SUPER_ADMIN, ADMIN, AUTHENTICATED }, default AUTHENTICATED"
  - "Event.userId/approvedById/rejectedById pasan de String (ids Neon Auth) a Int FK contra User (relaciones nombradas EventOwner/EventApprover/EventRejecter)"
  - "Se elimina directUrl del datasource (era para el pooler de Neon)"
  - "Carpeta de migraciones regenerada desde cero (la previa apuntaba a Neon)"
  - "bcryptjs se importa nombrado (import { hash }) por ser CJS — el default import daba undefined bajo ts-node"
metrics:
  duration: "~12 minutes"
  completed: "2026-05-20T21:10:00Z"
  tasks_completed: 3
  files_changed: 6
---

# Quick Task r3t: Sistema de usuarios local con 3 roles

**One-liner:** Se reemplazó Neon Auth (y Neon como base) por un sistema de usuarios local: modelo `User` propio con enum `Role` de 3 valores, sobre PostgreSQL local, con seed de un usuario por rol.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Schema: User + Role, quitar Profile/directUrl, FK en Event | (uncommitted) | apps/api/prisma/schema.prisma |
| 2 | Apuntar a PostgreSQL local + bcryptjs | (uncommitted) | apps/api/.env, .env.example, package.json |
| 3 | Migración limpia + seed de usuarios | (uncommitted) | apps/api/prisma/migrations/, seed.ts |

## What Was Built

### schema.prisma

- **`enum Role`** con 3 valores: `SUPER_ADMIN`, `ADMIN`, `AUTHENTICATED` (default `AUTHENTICATED`).
- **`model User`** (reemplaza a `Profile`): `email` unique, `passwordHash`, `firstname`, `lastname`, `rut`, `isCompany`, `role`, `confirmed`, `blocked`, timestamps.
- **`Event`**: `userId` / `approvedById` / `rejectedById` pasan de `String` a `Int?` con FK reales a `User` (relaciones nombradas `EventOwner` / `EventApprover` / `EventRejecter`) + índices.
- `datasource` sin `directUrl`.

### Base de datos

- `.env` → `DATABASE_URL` a `postgresql://konbini@localhost:5432/konbini` (PostgreSQL 16 local en WSL).
- Migración `20260521005715_init` aplicada limpia (carpeta de migraciones regenerada desde cero).

### seed.ts

- Reemplaza los `Profile` por **3 usuarios, uno por rol** (`superadmin@`, `admin@`, `organizador@konbini.cl`), con `passwordHash` bcrypt (password dev `konbini123`).
- Los 3 eventos quedan ligados por FK: `owner` = organizer, `approvedBy` = admin.

## Verification

- `prisma migrate status` → "Database schema is up to date" en la base local.
- `prisma:seed` corrido **2× seguidas** sin error → idempotente.
- Query: 3 usuarios con roles `SUPER_ADMIN` / `ADMIN` / `AUTHENTICATED`; 3 eventos con `userId` FK.
- `nest build` → OK con el cliente regenerado.

## Deviations from Plan

- `bcryptjs` se importó como `import { hash }` (nombrado) en vez de default: bajo `ts-node` el default import del módulo CJS resolvía a `undefined`.

## Known Stubs / Follow-ups

- **Endpoints de auth**: este task entregó el modelo de datos + roles. Falta la capa de runtime — registro, login, hash de password en el registro, emisión/validación de JWT y guards de NestJS por rol. Candidato a su propia fase/quick.
- **Neon**: el proyecto en console.neon.tech quedó sin uso — se puede eliminar manualmente desde la consola (no se tocó).
- Supersede la decisión de Neon Auth del quick task [260520-q4m](../260520-q4m-exportar-strapi-a-prisma-neon-auth/260520-q4m-SUMMARY.md).

## Self-Check: PASSED

- `apps/api/prisma/schema.prisma` con `User` + `enum Role` — FOUND
- `apps/api/prisma/migrations/20260521005715_init/migration.sql` — FOUND
- Sin `Profile` ni `directUrl` ni `DIRECT_URL` — CONFIRMED
- 3 usuarios (uno por rol) en la base local — CONFIRMED
