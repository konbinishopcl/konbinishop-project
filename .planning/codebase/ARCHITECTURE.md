# Architecture

**Analysis Date:** 2026-03-23

## Pattern Overview

**Overall:** Three-tier monorepo — Headless CMS backend, admin dashboard, and public-facing website

**Key Characteristics:**
- Turbo monorepo orchestrating three independent apps under `apps/`
- All data flows through Strapi REST API (v5, `documentId`-based); no shared packages or types across apps
- Dashboard proxies all API calls through Next.js API routes to avoid CORS issues; website calls Strapi directly via `@nuxtjs/strapi`
- Authentication is JWT-based (cookie `strapi_jwt`) on dashboard; Strapi's `useStrapiUser` on website
- Event approval workflow: events have `is_approved`, `is_rejected`, `expiration_date` flags managed from dashboard

## Layers

**Backend — Strapi CMS:**
- Purpose: Source of truth for all content, user accounts, and media
- Location: `apps/strapi/src/`
- Contains: Collection-type APIs (article, category, commune, event, hero, region, spot, tag), a custom `stats` API, user-permissions extension, Sentry plugin, custom middlewares
- Depends on: SQLite/Postgres (configured in `apps/strapi/config/database.ts`), JWT via `apps/strapi/config/plugins.ts`
- Used by: Dashboard (via proxy), Website (directly via `@nuxtjs/strapi`)

**Admin Dashboard — Next.js 15:**
- Purpose: Internal CMS UI for managing all Strapi content; not indexed by search engines
- Location: `apps/dashboard/src/`
- Contains: App Router pages (`src/app/dashboard/*`), a centralized `StrapiAPI` class (`src/lib/strapi/api.ts`), auth layer (`src/lib/strapi/auth.ts`), Zustand user store (`src/lib/stores/useUserStore.ts`), form components (`src/components/form-*.tsx`)
- Depends on: Strapi via internal Next.js API proxy at `src/app/api/[...path]/route.ts`
- Used by: Konbini staff/admins

**Public Website — Nuxt 3:**
- Purpose: Consumer-facing event directory, user registration and event creation flow
- Location: `apps/website/`
- Contains: File-based pages (`pages/`), PascalCase Vue components (`components/`), Pinia stores (`stores/*.store.ts`), Nuxt composables (`composables/use*.ts`), route middleware (`middleware/`), Nuxt server endpoints (`server/api/`)
- Depends on: Strapi directly via `@nuxtjs/strapi` module (`useStrapiClient`, `useStrapiUser`)
- Used by: Public users

## Data Flow

**Dashboard CRUD (e.g., editing an event):**
1. React page component (e.g., `src/app/dashboard/events/[documentId]/edit/page.tsx`) calls `StrapiAPI` static method (e.g., `StrapiAPI.updateEvent(documentId, data)`)
2. `StrapiAPI.makeRequest()` in `src/lib/strapi/api.ts` reads JWT from `strapi_jwt` cookie and sends request to `/api/{endpoint}` (relative URL on client, absolute on server)
3. Next.js catch-all proxy `src/app/api/[...path]/route.ts` receives the request, appends `Authorization` header, and forwards to `http://localhost:1337/api/{path}`
4. Strapi processes the request, returns JSON
5. Proxy returns response to React component

**Public Website Event Listing:**
1. Nuxt page (e.g., `pages/eventos/index.vue`) calls `useStrapiClient()('events', { params: {...} })` inside `useAsyncData`
2. `@nuxtjs/strapi` module sends request directly to Strapi API with SSR support
3. Strapi returns paginated event data with populated relations
4. Page renders component tree with data

**Event Creation (Public — Multi-step):**
1. Authenticated user navigates to `/anunciar` → redirected to `/anunciar/1`
2. `middleware/auth.ts` guards the route via `useStrapiUser()`
3. Multi-step form uses `useCreateStore` (Pinia, persisted to localStorage) to hold form state across steps 1–3
4. On final submit, `useEventStore.saveEvent()` sends `POST` to Strapi `events` endpoint
5. Event lands with `is_approved: false`, awaiting dashboard approval

**State Management:**
- Dashboard: Zustand (`src/lib/stores/useUserStore.ts`) with `persist` to localStorage (`user-storage` key)
- Website: Pinia stores (`stores/*.store.ts`); `create.store.ts` persisted to localStorage for multi-step form; `event.store.ts` uses `useStrapiClient` directly

## Key Abstractions

**StrapiAPI (Dashboard):**
- Purpose: Single static class for all Strapi API calls from the dashboard
- Examples: `apps/dashboard/src/lib/strapi/api.ts`
- Pattern: Static methods per resource (`getEvents`, `createEvent`, `updateEvent`); all route through private `makeRequest()` which handles JWT injection and client/server URL resolution

**StrapiAuth (Dashboard):**
- Purpose: Login, logout, token management for dashboard users
- Examples: `apps/dashboard/src/lib/strapi/auth.ts`
- Pattern: Static methods; stores JWT in cookie; validates `role.type === 'dashboard'`

**Strapi Core Factory Pattern (Backend):**
- Purpose: All standard APIs use Strapi's factory helpers — no custom logic unless extended
- Examples: `apps/strapi/src/api/spot/controllers/spot.ts`, `apps/strapi/src/api/spot/services/spot.ts`, `apps/strapi/src/api/spot/routes/spot.ts`
- Pattern: `factories.createCoreController('api::spot.spot')` — override only when needed (only `stats` has custom logic)

**Pinia Stores (Website):**
- Purpose: Client-side data and UI state for the public website
- Examples: `apps/website/stores/event.store.ts`, `apps/website/stores/create.store.ts`, `apps/website/stores/category.store.ts`
- Pattern: Composition API style (`defineStore('name', () => {...})`); async actions call `useStrapiClient` directly

**Nuxt Composables (Website):**
- Purpose: Reusable view logic extracted from components
- Examples: `apps/website/composables/useEvents.ts`, `apps/website/composables/useImageUrl.ts`, `apps/website/composables/useRut.ts`
- Pattern: Functions prefixed `use`, return named helpers

## Entry Points

**Strapi Backend:**
- Location: `apps/strapi/src/` (bootstrapped by Strapi runtime)
- Triggers: `yarn dev` / `yarn start` in `apps/strapi`
- Responsibilities: Serve REST API on port 1337, manage admin panel at `/admin`

**Next.js Dashboard:**
- Location: `apps/dashboard/src/app/layout.tsx` (root layout), `apps/dashboard/src/app/page.tsx` (splash), `apps/dashboard/src/app/dashboard/layout.tsx` (authenticated shell)
- Triggers: `yarn dev` / `yarn start` in `apps/dashboard`
- Responsibilities: Render admin UI, validate JWT via cookie on each request, proxy all API calls to Strapi

**Nuxt Website:**
- Location: `apps/website/pages/index.vue` (home), `apps/website/app.ts` (Nuxt app config)
- Triggers: `yarn dev` / `yarn start` in `apps/website`
- Responsibilities: SSR public pages, handle user auth with Strapi via `@nuxtjs/strapi`

## Error Handling

**Strategy:** Each layer handles errors locally; no shared error contract

**Patterns:**
- Dashboard `StrapiAPI` methods: `try/catch` blocks, re-throw errors to page components which render inline error messages
- Strapi custom controllers: `try/catch` with `ctx.internalServerError()` return
- Website pages: `try/catch` inside `useAsyncData` callbacks, return empty arrays on failure (silent degradation)
- Strapi proxy (`apps/dashboard/src/app/api/[...path]/route.ts`): `try/catch` returns `{ error: 'Internal server error' }` with status 500

## Cross-Cutting Concerns

**Logging:** Strapi uses `strapi.log.*`; Sentry is configured in both Strapi (`apps/strapi/config/plugins.ts`) and website (`apps/website/plugins/sentry.client.ts`, `sentry.server.ts`)

**Validation:** Form-level only; no shared schema validation library; Strapi content-type schemas (`schema.json`) enforce field constraints server-side

**Authentication:**
- Dashboard: Cookie-based JWT (`strapi_jwt`), read by `StrapiAuth` class; role check (`role.type === 'dashboard'`) partially implemented but currently bypassed
- Website: `@nuxtjs/strapi` manages token; `middleware/auth.ts` guards `/anunciar` and `/cuenta` routes via `useStrapiUser()`

---

*Architecture analysis: 2026-03-23*
