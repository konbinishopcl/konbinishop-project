# Codebase Structure

**Analysis Date:** 2026-03-23

## Directory Layout

```
konbini-project/
├── apps/
│   ├── dashboard/          # Next.js 15 admin panel (internal, not indexed)
│   │   ├── src/
│   │   │   ├── app/        # Next.js App Router pages and API routes
│   │   │   │   ├── api/
│   │   │   │   │   ├── [...path]/route.ts   # Catch-all Strapi proxy (GET/POST/PUT/DELETE)
│   │   │   │   │   └── media/[...path]/     # Media proxy
│   │   │   │   ├── dashboard/               # Protected dashboard routes
│   │   │   │   │   ├── layout.tsx           # Auth shell (sidebar + topbar)
│   │   │   │   │   ├── page.tsx             # Dashboard home (stats)
│   │   │   │   │   ├── articles/
│   │   │   │   │   ├── categories/
│   │   │   │   │   ├── communes/
│   │   │   │   │   ├── events/
│   │   │   │   │   ├── heroes/
│   │   │   │   │   ├── regions/
│   │   │   │   │   ├── settings/
│   │   │   │   │   ├── spots/
│   │   │   │   │   ├── tags/
│   │   │   │   │   └── users/
│   │   │   │   ├── login/                   # Login page
│   │   │   │   ├── layout.tsx               # Root layout (RecaptchaProvider)
│   │   │   │   └── page.tsx                 # Root splash page
│   │   │   ├── components/                  # All shared React components (flat, no subdirs)
│   │   │   └── lib/
│   │   │       ├── helpers/                 # Utility functions
│   │   │       ├── hooks/                   # React hooks
│   │   │       ├── stores/                  # Zustand stores
│   │   │       └── strapi/                  # Strapi client layer
│   │   │           ├── api.ts               # StrapiAPI static class
│   │   │           ├── auth.ts              # StrapiAuth static class
│   │   │           ├── config.ts            # Base URL, cookie names
│   │   │           └── index.ts             # Re-exports
│   │   └── public/                          # Static assets (logo.svg, etc.)
│   │
│   ├── strapi/             # Strapi v5 headless CMS (port 1337)
│   │   ├── config/
│   │   │   ├── admin.ts
│   │   │   ├── api.ts
│   │   │   ├── database.ts
│   │   │   ├── middlewares.ts
│   │   │   ├── plugins.ts               # users-permissions JWT + Sentry config
│   │   │   └── server.ts
│   │   ├── database/
│   │   │   └── migrations/
│   │   ├── seeders/
│   │   ├── src/
│   │   │   ├── admin/                   # Strapi admin customization
│   │   │   ├── api/                     # Collection-type APIs
│   │   │   │   ├── article/
│   │   │   │   ├── category/
│   │   │   │   ├── commune/
│   │   │   │   ├── event/
│   │   │   │   ├── hero/
│   │   │   │   ├── region/
│   │   │   │   ├── spot/
│   │   │   │   ├── stats/               # Custom stats endpoint (no content-types)
│   │   │   │   └── tag/
│   │   │   ├── components/
│   │   │   │   └── event/               # Strapi component schemas (prices, dates, rrss, videos)
│   │   │   ├── extensions/
│   │   │   │   └── users-permissions/
│   │   │   │       └── content-types/user/schema.json  # Extended user fields (rut, is_company, etc.)
│   │   │   └── middlewares/
│   │   │       ├── auth-error-logger.ts # Sentry auth failure reporter (disabled in config)
│   │   │       └── auth-response.ts
│   │   ├── types/
│   │   │   └── generated/               # Auto-generated Strapi types
│   │   └── public/
│   │       └── uploads/                 # Uploaded media files
│   │
│   └── website/            # Nuxt 3 public-facing site
│       ├── assets/
│       │   ├── fonts/satoshi/
│       │   └── styles/
│       │       ├── abstracts/
│       │       ├── base/
│       │       └── components/
│       ├── components/                  # PascalCase Vue SFCs (flat, no subdirs)
│       ├── composables/                 # Nuxt auto-imported composables (use*.ts)
│       ├── layouts/
│       │   ├── auth.vue
│       │   ├── create.vue               # Multi-step event creation layout
│       │   └── default.vue
│       ├── middleware/
│       │   ├── auth.ts                  # Redirects to /login if not authenticated
│       │   ├── dev.global.ts
│       │   └── guest.ts
│       ├── pages/
│       │   ├── index.vue
│       │   ├── [category]/              # Dynamic category listing
│       │   ├── anunciar/                # Event creation wizard (/anunciar/[step])
│       │   ├── busqueda.vue
│       │   ├── contacto/
│       │   ├── cuenta/
│       │   ├── dev/
│       │   ├── eventos/
│       │   ├── login/
│       │   └── registro.vue
│       ├── plugins/
│       │   ├── fontawesome.client.ts
│       │   ├── gtm-body.client.ts
│       │   ├── gtm-head.client.ts
│       │   ├── router.client.ts
│       │   ├── sentry.client.ts
│       │   └── sentry.server.ts
│       ├── public/images/
│       ├── server/api/
│       │   └── dev-login.post.ts        # Dev-only login endpoint
│       ├── stores/                      # Pinia stores (*. store.ts)
│       └── types/                       # TypeScript type definitions (*. types.ts)
│
├── .planning/codebase/     # GSD codebase analysis documents
├── .turbo/                 # Turbo build cache
├── package.json            # Root workspace (yarn workspaces)
├── turbo.json              # Turbo pipeline config (dev/build/lint tasks)
└── yarn.lock
```

## Directory Purposes

**`apps/dashboard/src/app/dashboard/[resource]/`:**
- Purpose: One directory per managed resource (events, articles, heroes, spots, users, categories, tags, regions, communes)
- Contains: `page.tsx` (list view, Server Component), `[documentId]/page.tsx` (detail view), `[documentId]/edit/page.tsx` (edit form), `create/page.tsx` (create form)
- Key files: `apps/dashboard/src/app/dashboard/events/page.tsx`

**`apps/dashboard/src/components/`:**
- Purpose: All reusable React components in a single flat directory
- Contains: Form components (`form-*.tsx`), field components (`*-field.tsx`), utility components
- Key files: `form-event.tsx`, `form-blog.tsx`, `image-upload-field.tsx`, `stats-default.tsx`, `tiptap-editor.tsx`

**`apps/dashboard/src/lib/strapi/`:**
- Purpose: Complete API client layer for dashboard-to-Strapi communication
- Key files: `api.ts` (StrapiAPI class), `auth.ts` (StrapiAuth class), `config.ts` (base URL and cookie names), `index.ts` (re-exports)

**`apps/strapi/src/api/[resource]/`:**
- Purpose: Standard Strapi collection-type structure per resource
- Contains: `controllers/[resource].ts`, `routes/[resource].ts`, `services/[resource].ts`, `content-types/[resource]/schema.json`
- Pattern: All controllers/routes/services use `factories.createCore*()` unless customized

**`apps/strapi/src/api/stats/`:**
- Purpose: Custom read-only endpoint returning aggregate counts for the dashboard
- Contains: `controllers/stats.ts` (custom, uses `strapi.entityService.count`), `routes/stats.ts`
- No content-types directory (no collection type, just a custom route)

**`apps/website/stores/`:**
- Purpose: Pinia state management for public website
- Key files: `event.store.ts` (event fetch/save), `create.store.ts` (multi-step form, persisted), `category.store.ts`, `hero.store.ts`, `region.store.ts`, `app.store.ts`, `upload.store.ts`

**`apps/website/composables/`:**
- Purpose: Shared view logic; auto-imported by Nuxt
- Key files: `useEvents.ts` (date formatting, location helpers), `useImageUrl.ts` (Strapi URL builder), `useRut.ts` (Chilean RUT validation), `useScrollHeader.ts`, `useSentry.ts`, `useUser.ts`

## Key File Locations

**Entry Points:**
- `apps/dashboard/src/app/layout.tsx`: Root Next.js layout with RecaptchaProvider
- `apps/dashboard/src/app/dashboard/layout.tsx`: Authenticated dashboard shell with sidebar navigation
- `apps/website/pages/index.vue`: Website home page
- `apps/strapi/config/server.ts`: Strapi server configuration

**Configuration:**
- `apps/dashboard/src/lib/strapi/config.ts`: Strapi base URL and cookie names for dashboard
- `apps/strapi/config/plugins.ts`: JWT secret and Sentry configuration
- `apps/strapi/config/middlewares.ts`: CORS (currently `origin: ['*']`), body, security middleware
- `apps/strapi/config/database.ts`: Database connection settings

**Core Logic:**
- `apps/dashboard/src/lib/strapi/api.ts`: All Strapi API calls from dashboard (StrapiAPI class)
- `apps/dashboard/src/lib/strapi/auth.ts`: Login, logout, token management (StrapiAuth class)
- `apps/dashboard/src/app/api/[...path]/route.ts`: Strapi proxy (all HTTP methods)
- `apps/dashboard/src/lib/stores/useUserStore.ts`: Dashboard user state (Zustand + persist)
- `apps/strapi/src/api/stats/controllers/stats.ts`: Dashboard statistics aggregation
- `apps/website/stores/create.store.ts`: Multi-step event creation state (Pinia + persist)
- `apps/website/stores/event.store.ts`: Event fetching/saving for public website

**Content Schemas:**
- `apps/strapi/src/api/event/content-types/event/schema.json`: Event fields and relations
- `apps/strapi/src/api/article/content-types/article/schema.json`: Article fields and relations
- `apps/strapi/src/extensions/users-permissions/content-types/user/schema.json`: Extended user fields

**Testing:**
- Not detected — no test files found in any app

## Naming Conventions

**Files (Dashboard - Next.js):**
- Pages: `page.tsx`, `layout.tsx` (Next.js App Router convention)
- Components: `kebab-case.tsx` (e.g., `form-event.tsx`, `image-upload-field.tsx`)
- Library files: `camelCase.ts` (e.g., `useUserStore.ts`, `useRecaptcha.ts`)

**Files (Website - Nuxt):**
- Pages: `kebab-case.vue` (e.g., `busqueda.vue`, `recuperar-contrasena.vue`)
- Components: `PascalCase.vue` (e.g., `CardEvent.vue`, `EventsDefault.vue`, `FormLogin.vue`)
- Stores: `camelCase.store.ts` (e.g., `event.store.ts`, `create.store.ts`)
- Composables: `useCamelCase.ts` (e.g., `useEvents.ts`, `useImageUrl.ts`)
- Types: `camelCase.types.ts` (e.g., `event.types.ts`, `create.types.ts`)

**Files (Strapi):**
- All resource directories: `lowercase` (e.g., `event`, `spot`, `commune`)
- Controller/service/route files named after resource: `spot.ts`, `event.ts`

**Directories:**
- Dashboard resource sections: `lowercase` matching Strapi plural names (e.g., `events`, `articles`, `heroes`)
- Website pages: `spanish-kebab-case` for Spanish routes (e.g., `anunciar`, `eventos`, `cuenta`)

## Where to Add New Code

**New Strapi Content Type (e.g., `venue`):**
- Schema: `apps/strapi/src/api/venue/content-types/venue/schema.json`
- Controller: `apps/strapi/src/api/venue/controllers/venue.ts` (use `factories.createCoreController`)
- Service: `apps/strapi/src/api/venue/services/venue.ts` (use `factories.createCoreService`)
- Route: `apps/strapi/src/api/venue/routes/venue.ts` (use `factories.createCoreRouter`)

**New Dashboard Resource Section:**
- Pages: `apps/dashboard/src/app/dashboard/venues/` (add `page.tsx`, `create/page.tsx`, `[documentId]/page.tsx`, `[documentId]/edit/page.tsx`)
- API methods: Add static methods to `apps/dashboard/src/lib/strapi/api.ts`
- Form component: `apps/dashboard/src/components/form-venue.tsx`

**New Website Page:**
- Implementation: `apps/website/pages/[page-name].vue` or `apps/website/pages/[page-name]/index.vue`
- If needs auth guard: Add `definePageMeta({ middleware: 'auth' })` in `<script setup>`

**New Website Component:**
- Implementation: `apps/website/components/PascalCaseName.vue`

**New Pinia Store (Website):**
- Implementation: `apps/website/stores/camelCase.store.ts`

**New Dashboard Hook:**
- Implementation: `apps/dashboard/src/lib/hooks/useCamelCase.ts`

**New Dashboard Utility:**
- Implementation: `apps/dashboard/src/lib/helpers/camelCase.ts`

## Special Directories

**`apps/strapi/dist/`:**
- Purpose: Compiled TypeScript output from Strapi build
- Generated: Yes (by `yarn build`)
- Committed: No (in .gitignore)

**`apps/dashboard/.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No

**`apps/website/.nuxt/`:**
- Purpose: Nuxt build artifacts and auto-generated types
- Generated: Yes
- Committed: No

**`apps/strapi/public/uploads/`:**
- Purpose: User-uploaded media files served by Strapi
- Generated: Yes (at runtime)
- Committed: No (typically gitignored)

**`apps/strapi/types/generated/`:**
- Purpose: Auto-generated TypeScript types from Strapi content types
- Generated: Yes (by `yarn strapi ts:generate-types`)
- Committed: Yes

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents consumed by plan-phase and execute-phase
- Generated: Yes (by GSD map-codebase command)
- Committed: Yes

---

*Structure analysis: 2026-03-23*
