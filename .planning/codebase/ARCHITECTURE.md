# Architecture

**Analysis Date:** 2026-05-20 (re-aligned after the Strapi→NestJS migration)

## Pattern Overview

**Overall:** Monorepo de dos apps — una API NestJS y una app Next.js que contiene tanto el
sitio público como el panel de administración.

**Key Characteristics:**
- `apps/api` — API REST modular en NestJS sobre PostgreSQL vía Prisma
- `apps/website` — Next.js App Router; sitio público (`app/(site)/`) y panel (`app/admin/`)
  conviven en la misma app
- Autenticación JWT propia: la API emite el token, el website lo guarda en `localStorage`
- Estado de moderación de eventos en columnas booleanas (`isApproved`, `isRejected`,
  `rejectedReason`) más relaciones a `User` (`owner`, `approvedBy`, `rejectedBy`)

## Layers

**API — NestJS (`apps/api/src/`):**
- Punto de entrada: `main.ts` — `setGlobalPrefix('api')`, CORS, `ValidationPipe` global,
  puerto 3333
- `app.module.ts` importa `ConfigModule` (global), `PrismaModule`, `AuthModule`, `UsersModule`
- `PrismaModule` / `PrismaService` — cliente Prisma compartido
- `AuthModule` — register/login/me; `JwtAuthGuard`, `RolesGuard`, decoradores `@Roles()` y
  `@CurrentUser()`
- `UsersModule` — CRUD de usuarios protegido por rol
- **Pendiente:** módulo `events` y módulos de taxonomías (ver ROADMAP Phase 1)

**Website — Next.js App Router (`apps/website/app/`):**
- `app/layout.tsx` — layout raíz con providers (tema + usuario)
- `app/(site)/` — grupo del sitio público: layout con Header/Footer; `page.tsx` (home),
  `categoria/[cat]`, `evento/[id]`, `crear`, `dashboard`, `checkout/[id]` *(a eliminar)*
- `app/login/` y `app/registro/` — fuera del grupo `(site)`; flujo de auth en 2 pasos
- `app/admin/` — panel: `layout.tsx` envuelto en `AdminGuard`; `dashboard`, `events`,
  `users` y vistas placeholder (`payments`, `categories`, `reports`, `logs`, `settings`,
  `help`)

## Data Flow

**Lectura del sitio público (estado actual):**
1. Las vistas (`page.tsx`, etc.) leen datos hardcodeados de `lib/data.ts` (mock)
2. *Objetivo (Phase 2):* leer de la API real vía `lib/api.ts`

**Autenticación (real, ya funcionando):**
1. `app/login` o `app/registro` llaman a `api.login` / `api.register` (`lib/api.ts`)
2. La API NestJS valida, emite un JWT (7d) y devuelve `{ token, user }`
3. `useUser().setAuth()` guarda `user` y `token` en `localStorage` (`kb-user`, `kb-token`)
4. Las llamadas protegidas envían `Authorization: Bearer <token>`; `JwtAuthGuard` lo verifica
   y `RolesGuard` chequea `@Roles()`

**Control de acceso por rol:**
- `AdminGuard` (cliente) protege todo `/admin`: solo `ADMIN` / `SUPER_ADMIN`
- El ítem "Usuarios" del sidebar y `/admin/users` quedan restringidos a `SUPER_ADMIN`

## Key Abstractions

- **`PrismaService`** (`api`) — extiende `PrismaClient`; inyectable en todos los servicios
- **Guards + decoradores** (`api`) — `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()`
- **`lib/api.ts`** (`website`) — cliente HTTP: wrapper `request()`, métodos `api.*`, y
  `toUser()` que mapea el usuario de la API al shape del website
- **`providers.tsx`** (`website`) — `useUser()` (`user`, `token`, `ready`, `setAuth`,
  `logout`) y `useTheme()`; estado en React Context, persistido en `localStorage`
- **Componentes reutilizables** (`website`) — `Header`, `Footer`, `EventCard`, `Rail`,
  `HeroBlock`, `Poster`, etc.; los de admin en `components/admin/`

## Error Handling

- **API:** excepciones HTTP de NestJS (`UnauthorizedException`, `ForbiddenException`, …);
  `ValidationPipe` global devuelve `400` con los mensajes de class-validator
- **Website:** `request()` en `lib/api.ts` lanza `Error` con el mensaje de la API; las vistas
  lo capturan y lo muestran inline

## Cross-Cutting Concerns

- **Autenticación:** JWT propio; token en `localStorage` del website
- **Validación:** DTOs con class-validator en la API; sin validación de esquema compartida
- **Logging:** logger por defecto de NestJS; sin observabilidad configurada

---

*Architecture analysis: 2026-05-20*
