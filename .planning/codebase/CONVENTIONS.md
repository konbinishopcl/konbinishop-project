# Conventions

**Analysis Date:** 2026-05-20 (re-aligned after the Strapi→NestJS migration)

## API (`apps/api`)

**Estructura:** convención estándar de NestJS — un módulo por feature, cada uno con
`<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts` y un directorio
`dto/`.

**Naming:**
- Archivos: `kebab-case` con sufijo de rol — `auth.controller.ts`, `roles.guard.ts`,
  `current-user.decorator.ts`, `register.dto.ts`
- Clases: `PascalCase` con sufijo — `AuthService`, `JwtAuthGuard`, `RegisterDto`
- Rutas: `@Controller('auth')` → endpoints bajo `/api/auth/...` (prefijo global `api`)

**Patrones:**
- Lógica de datos en services, que inyectan `PrismaService`; los controllers solo orquestan
- DTOs validados con `class-validator`; `ValidationPipe` global con `whitelist` + `transform`
- Protección: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN','SUPER_ADMIN')`;
  acceso al usuario actual con `@CurrentUser()`
- Roles según el enum Prisma `Role`: `SUPER_ADMIN`, `ADMIN`, `AUTHENTICATED`

## Website (`apps/website`)

**Naming:**
- Páginas: `page.tsx` / `layout.tsx` (convención App Router de Next.js)
- Componentes: `PascalCase.tsx` — `Header.tsx`, `EventCard.tsx`, `HeroBlock.tsx`
- Componentes del panel: bajo `components/admin/` — `AdminSidebar.tsx`, `AdminGuard.tsx`
- Librería: `camelCase.ts` — `api.ts`, `data.ts`, `admin-data.ts`
- Segmentos de ruta en español: `categoria`, `evento`, `crear`, `registro`

**Patrones:**
- Componentes con estado/efectos llevan `"use client"` al inicio
- Estado global vía React Context en `components/providers.tsx` (`useUser`, `useTheme`)
- Llamadas a la API centralizadas en `lib/api.ts` (objeto `api` + helper `request()`)
- Imports con alias `@/` (p. ej. `@/components/...`, `@/lib/api`)
- Texto de UI en español (locale chileno)

**Estilos:**
- CSS plano: `app/globals.css` (global) y `app/admin/admin.css` (panel, con scope bajo
  `.admin`)
- Sin Tailwind ni CSS-in-JS; clases con nombres semánticos (`btn`, `field`, `eyebrow`, …) y
  estilos inline puntuales con variables CSS (`var(--accent)`, `var(--ink-2)`)

## Datos y modelo

- `apps/api/prisma/schema.prisma` es la fuente de verdad del modelo de datos
- Slugs `@unique` por entidad; relaciones nombradas cuando una entidad apunta varias veces a
  la misma (p. ej. `Event` → `User` como `EventOwner` / `EventApprover` / `EventRejecter`)
- Moderación de eventos vía booleanos `isApproved` / `isRejected` + `rejectedReason`

## Git

- Commits convencionales con scope por app: `feat(api): ...`, `feat(website): ...`
- Archivos `.env` gitignoreados; nunca commitear credenciales ni `JWT_SECRET`
- Trabajo de tareas registrado en `.planning/` (quick tasks y fases)

---

*Conventions analysis: 2026-05-20*
