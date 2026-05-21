# Konbini

## What This Is

Plataforma chilena de publicación de eventos de cultura geek/otaku. Los organizadores se
registran y publican sus eventos **gratis**; un administrador los modera y, una vez aprobados,
quedan visibles al público en el sitio. El sitio público y el panel de administración son una
sola app Next.js; los datos los sirve una API NestJS sobre PostgreSQL.

**Konbini NO vende entradas.** La compra de tickets ocurre en una plataforma externa; las
páginas de evento solo enlazan hacia allá.

## Core Value

Organizadores publican gratis sus eventos; tras la aprobación de un administrador quedan
visibles al público.

## Requirements

### Validated

- ✓ API NestJS + Prisma sobre PostgreSQL local — base operativa
- ✓ Schema de contenido portado desde el Strapi anterior (regiones, comunas, categorías, tags,
  artículos, heroes, spots, eventos + componentes) — quick 260520-q4m
- ✓ Sistema de usuarios local con 3 roles (SUPER_ADMIN / ADMIN / AUTHENTICATED) — quick 260520-r3t
- ✓ Auth full-stack: register/login/me con JWT + bcrypt, guards por rol — quick 260520-w8k
- ✓ Maqueta del website (Next.js): vistas públicas + panel admin; login y registro conectados
  a la API

### Active

- [ ] API de contenido: endpoints de eventos (CRUD + moderación) y lectura pública de taxonomías
- [ ] Sitio público con datos reales (home, categorías, detalle de evento) — reemplazar la data mock
- [ ] Flujo de publicación: el organizador crea un evento desde el sitio y queda pendiente de moderación
- [ ] Moderación y panel admin: aprobar/rechazar eventos, gestión de usuarios
- [ ] Búsqueda de eventos con filtros
- [ ] Quitar del diseño el checkout / "Comprar entradas" / "Konbini Pay" — error de diseño:
  aquí no se venden entradas

### Out of Scope

| Feature | Reason |
|---------|--------|
| Venta de entradas / tickets a asistentes | Ocurre en una plataforma externa; el sitio solo enlaza vía `ticketUrl` |
| Cobro al organizador por publicar | Diferido a v2 — en v1 publicar es gratis |
| Pasarelas de pago (Transbank, Mercado Pago, Stripe) | Dependían del modelo de cobro; fuera de v1 |
| Emails transaccionales (MJML / Mailgun) | Diferido a v2 |
| Login social / OAuth | Botones de RRSS presentes en la UI sin conexión; diferido |
| App móvil | Web-first |

## Context

- **Stack:** monorepo pnpm (`pnpm@10.11.0`) + Turborepo, con dos apps bajo `apps/`:
  - `apps/api` — NestJS 11 + Prisma 6 + PostgreSQL 16 (local, en WSL). Puerto 3333, prefijo `/api`.
  - `apps/website` — Next.js 15 (App Router) + React 19 + TypeScript. Sitio público y panel
    `/admin` en la misma app. CSS plano (sin Tailwind ni librería de componentes).
- **Auth:** JWT propio (`@nestjs/jwt` + `bcryptjs`), sin Passport. Token de 7 días guardado en
  `localStorage` del website. Guards `JwtAuthGuard` + `RolesGuard` + decoradores `@Roles()` /
  `@CurrentUser()`.
- **Historia:** el proyecto migró desde un stack Strapi 5 + Nuxt 4 + dashboard Next.js. Se
  descartaron Strapi, Nuxt, Neon y Neon Auth. El roadmap previo (milestone de pagos) quedó
  obsoleto y fue reemplazado por este durante la re-alineación de 2026-05-20.
- **Entorno:** Windows 11 + WSL Ubuntu. El proyecto vive en WSL
  (`/home/gab/Code/konbini-project`); builds e instalaciones se ejecutan dentro de WSL.

## Constraints

- **Tech stack:** mantener NestJS + Prisma + Next.js — no migrar frameworks otra vez.
- **Alcance events-only:** nada de venta de entradas ni checkout en el sitio.
- **v1 sin pagos:** publicar es gratis; no integrar pasarelas de pago.
- **Builds en WSL:** instalaciones y compilaciones corren dentro de WSL, no desde Windows.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Migrar de Strapi/Nuxt al stack NestJS + Prisma + Next.js | Control total del backend y un solo framework de frontend | Validated |
| Sistema de usuarios local en vez de Neon Auth | Menos dependencias externas; control total de roles | Validated |
| Sitio público y panel admin en una sola app Next.js | Evita una tercera app; comparten componentes y deploy | Validated |
| v1 con publicación gratuita | Lanzar el bucle organizador→moderación→público sin la complejidad de pagos | Active |
| Konbini no vende entradas | La venta ocurre en una plataforma externa; reduce alcance y carga regulatoria | Active |
| Cobro al organizador diferido a v2 | El modelo de monetización aún no se define | Active |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-20 — re-alignment after the Strapi→NestJS stack migration*
