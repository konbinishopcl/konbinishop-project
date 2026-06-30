# Codebase Structure

**Analysis Date:** 2026-06-29

## Directory Layout

```
konbini-project/                          # pnpm monorepo root
├── apps/
│   ├── api/                              # NestJS backend (port 3333 local, Vercel serverless)
│   │   ├── api/
│   │   │   └── index.ts                  # Vercel serverless handler
│   │   ├── src/                          # Source code
│   │   │   ├── main.ts                   # App factory (createApp) + bootstrap
│   │   │   ├── app.module.ts             # Root module, imports all feature modules
│   │   │   ├── app.controller.ts         # Health check endpoint
│   │   │   ├── app.service.ts            # Root service
│   │   │   ├── auth/                     # Authentication module
│   │   │   │   ├── auth.controller.ts    # Routes: login, register, google, 2fa, etc.
│   │   │   │   ├── auth.service.ts       # JWT generation, password hashing, 2FA logic
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── jwt-auth.guard.ts     # Validates Bearer token
│   │   │   │   ├── optional-jwt-auth.guard.ts  # Allows unauthenticated requests
│   │   │   │   ├── two-fa.guard.ts       # 2FA token validation
│   │   │   │   ├── api-key.guard.ts      # X-API-Key validation (global)
│   │   │   │   ├── roles.guard.ts        # Role-based access control
│   │   │   │   ├── current-user.decorator.ts  # Injects @CurrentUser() into handlers
│   │   │   │   └── dto/                  # RegisterDto, LoginDto, GoogleAuthDto, etc.
│   │   │   ├── events/                   # Events feature module
│   │   │   │   ├── events.controller.ts  # CRUD endpoints for events
│   │   │   │   ├── events.service.ts     # Business logic: create, update, filter, soft-delete
│   │   │   │   ├── events.module.ts      # Imports auth, likes, audit, notifications
│   │   │   │   └── dto/                  # CreateEventDto, UpdateEventDto, QueryEventsDto, etc.
│   │   │   ├── articles/                 # Blog articles (similar structure)
│   │   │   ├── heroes/                   # Homepage hero slides
│   │   │   ├── spots/                    # Business locations/storefronts
│   │   │   ├── catalog/                  # Event categories, regions, communes, tags
│   │   │   ├── orders/                   # Event ticket orders
│   │   │   ├── payments/                 # Payment processing
│   │   │   ├── uploads/                  # Image/file uploads (Vercel Blob or local disk)
│   │   │   ├── users/                    # User profile management
│   │   │   ├── profiles/                 # Extended profile data (company profile, etc.)
│   │   │   ├── organizations/            # Organization management + context
│   │   │   ├── auth/                     # (see above)
│   │   │   ├── notifications/            # Email/push notifications
│   │   │   ├── transfers/                # Money transfers between accounts
│   │   │   ├── subscriptions/            # Subscription plans
│   │   │   ├── crm/                      # CRM functionality
│   │   │   ├── audit/                    # Audit logging (IP, action, user, timestamp)
│   │   │   ├── common/
│   │   │   │   └── org-context/          # Organization context extraction (@OrgContext decorator)
│   │   │   ├── services/                 # API integration services (Stripe, Mailgun, etc.)
│   │   │   ├── settings/                 # Global settings (public settings endpoint)
│   │   │   ├── stats/                    # Analytics (approved event count, organizer count, etc.)
│   │   │   ├── newsletter/               # Email newsletter subscription
│   │   │   ├── legal/                    # Legal pages (terms, privacy)
│   │   │   ├── faq/                      # FAQ management
│   │   │   ├── contact/                  # Contact form submissions
│   │   │   ├── likes/                    # Like/save functionality for events
│   │   │   └── [other modules...]        # Each feature follows: module.ts, controller.ts, service.ts, dto/
│   │   ├── utils/                        # Shared utilities (outside src/ for reusability)
│   │   │   ├── cache/
│   │   │   │   └── http-cache.interceptor.ts  # Redis-backed HTTP caching with graceful fallback
│   │   │   ├── redis/
│   │   │   │   ├── redis.module.ts
│   │   │   │   └── redis.service.ts      # ioredis client management
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts     # PrismaClient lifecycle
│   │   │   ├── http-exception.filter.ts  # Global exception handler
│   │   │   ├── templates/
│   │   │   │   └── mail.templates.ts     # Email template builders (MJML)
│   │   │   └── [other utilities...]
│   │   ├── prisma/
│   │   │   └── schema.prisma             # Database schema (Prisma ORM models)
│   │   ├── services/                     # External service integrations (outside utils/)
│   │   │   ├── mailgun/
│   │   │   │   ├── mailgun.module.ts
│   │   │   │   └── mailgun.service.ts    # Email sending via Mailgun
│   │   │   └── [other service modules...]
│   │   ├── dist/                         # Compiled JavaScript (generated by nest build)
│   │   ├── test/                         # Test files
│   │   ├── uploads/                      # Local disk uploads (development/local only)
│   │   ├── package.json
│   │   └── nest-cli.json
│   │
│   └── website/                          # Next.js frontend (port 3000 local, Vercel)
│       ├── app/                          # App Router directory (Next.js 13+)
│       │   ├── layout.tsx                # Root layout (metadata, providers, theme script)
│       │   ├── globals.css               # Global styles
│       │   ├── robots.ts                 # robots.txt generator
│       │   ├── sitemap.ts                # sitemap.xml generator
│       │   ├── not-found.tsx             # 404 page
│       │   ├── (site)/                   # Route group for public pages (no layout wrapper)
│       │   │   └── page.tsx              # Homepage with SSR (fetches events, articles, heroes, etc.)
│       │   ├── api/                      # Internal API routes (not exposed to users directly)
│       │   │   ├── [...path]/
│       │   │   │   └── route.ts          # Internal proxy: forwards /api/* to backend + adds API key
│       │   │   └── media/
│       │   │       └── [...path]/
│       │   │           └── route.ts      # Media proxy: forwards image requests to backend
│       │   ├── login/
│       │   │   └── page.tsx              # Login page (async: fetches countries for country selector)
│       │   ├── registro/                 # Registration route group
│       │   │   ├── page.tsx              # Redirect to /registro/1
│       │   │   ├── layout.tsx            # Registration layout wrapper
│       │   │   ├── 1/page.tsx            # Step 1: email/password
│       │   │   ├── 2/page.tsx            # Step 2: personal info + country selector
│       │   │   ├── 3/page.tsx            # Step 3: email verification
│       │   │   └── [other steps...]
│       │   ├── crear/                    # Event creation route group
│       │   │   ├── page.tsx              # Redirect to /crear/1
│       │   │   ├── layout.tsx            # Event creation layout
│       │   │   ├── 1/page.tsx            # Step 1: event title, description
│       │   │   ├── 2/page.tsx            # Step 2: dates, pricing
│       │   │   ├── 3/page.tsx            # Step 3: location, category
│       │   │   └── [...more steps...]
│       │   └── dashboard/                # Authenticated dashboard (requires JWT)
│       │       ├── layout.tsx            # Dashboard layout with sidebar
│       │       ├── page.tsx              # Dashboard home/overview
│       │       ├── events/               # Organizer's events
│       │       │   ├── page.tsx          # List organizer events
│       │       │   └── [id]/page.tsx     # Edit single event
│       │       ├── orders/               # Organizer's orders
│       │       ├── articles/             # Admin article management
│       │       ├── countries/            # Admin: country/state/city management
│       │       ├── event-categories/     # Admin: event category management
│       │       ├── cities/               # Admin: city management
│       │       ├── faq/                  # Admin: FAQ management
│       │       └── [other admin pages...]
│       ├── components/                   # Reusable React components
│       │   ├── ArticleCard.tsx           # Article card display
│       │   ├── EventCard.tsx             # Event card display
│       │   ├── Header.tsx                # Site header with navigation (use client)
│       │   ├── Footer.tsx                # Site footer
│       │   ├── HeroCarousel.tsx          # Homepage hero carousel (use client)
│       │   ├── AuthShell.tsx             # Auth layout wrapper
│       │   ├── GoogleLoginButton.tsx     # Google OAuth button
│       │   ├── MarkdownEditor.tsx        # Markdown editor for admin (use client)
│       │   ├── Poster.tsx                # Event poster/image component
│       │   ├── OneTap.tsx                # Google One Tap widget (use client)
│       │   ├── NavigationProgress.tsx    # Next progress bar
│       │   ├── LikedArticlesProvider.tsx # Context provider for liked articles
│       │   ├── Providers.tsx             # Root client providers (theme, Google OAuth, toast)
│       │   ├── ProfileModal.tsx          # User profile modal
│       │   └── [other components...]
│       ├── lib/                          # Utility functions and helpers
│       │   ├── api.ts                    # API client: request(), apiBase(), buildHeaders(), specific endpoints
│       │   │                             # Exports: api.events(), api.articles(), api.heroes(), etc.
│       │   │                             # Handles server vs client mode: direct API_URL server-side, /api proxy client-side
│       │   ├── data.ts                   # Type definitions and helpers (EventItem, Role, etc.)
│       │   ├── admin-data.ts             # Admin-specific data helpers
│       │   └── site.ts                   # Site configuration (URLs, meta)
│       ├── public/                       # Static assets
│       │   ├── favicon.ico
│       │   ├── logo.png
│       │   └── [other static files...]
│       ├── next.config.ts                # Next.js configuration
│       ├── tsconfig.json                 # TypeScript configuration
│       ├── package.json
│       └── .next/                        # Build output (generated)
│
├── .planning/                            # GSD planning documents
│   └── codebase/                         # Architecture/structure/conventions documentation
│       ├── ARCHITECTURE.md               # (This file's sibling)
│       ├── STRUCTURE.md                  # (This file)
│       └── [other docs...]
├── package.json                          # Monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml                   # Workspace config
├── turbo.json                            # Turbo CI/CD config
├── tsconfig.json                         # Root TypeScript config
└── [other root files...]
```

## Directory Purposes

**apps/api/src/**
- Purpose: NestJS application source code
- Contains: Feature modules (27 total), root AppModule, bootstrap logic
- Key files: `main.ts` (factory + bootstrap), `app.module.ts` (root), each `{feature}/` follows module pattern

**apps/api/utils/**
- Purpose: Shared utilities and cross-cutting concerns
- Contains: Redis client, Prisma lifecycle, HTTP caching interceptor, exception filter, email templates
- Why outside src/: Easier to import in serverless handlers without path traversal

**apps/api/api/**
- Purpose: Vercel serverless entry point
- Contains: `index.ts` (handler that calls createApp from main.ts)
- Why separate: Vercel expects handlers at `api/` for automatic deployment to Functions

**apps/api/prisma/**
- Purpose: Database schema and migrations
- Contains: `schema.prisma` (ORM models), `migrations/` (generated by prisma migrate)
- Key file: `schema.prisma` defines all models (Event, Article, User via Neon Auth, Profile, etc.)

**apps/website/app/(**
- Purpose: App Router pages and routes (Next.js 13+)
- Contains: Route folders, page.tsx, layout.tsx, route.ts (API routes)
- Pattern: Each directory = URL segment; `(site)` = route group (no URL impact); `[param]` = dynamic; `[...param]` = catch-all

**apps/website/components/**
- Purpose: Reusable React components
- Contains: UI components (cards, headers, buttons), forms, client-side interactive components
- Convention: Most are server components; marked "use client" when needing hooks/events

**apps/website/lib/**
- Purpose: Non-JSX utility code
- Contains: API client (request function, endpoint methods), type definitions, helpers
- Key exports: `api` object with methods like `api.events()`, `api.articles()`, `imageUrl()`, `withUtm()`

**apps/website/public/**
- Purpose: Static assets (images, fonts, manifests)
- Contains: Favicons, logos, SVGs, public JSON files (manifest.json)
- Served at `/` (e.g., `/favicon.ico`)

## Key File Locations

**Entry Points:**

- API Local Startup: `apps/api/src/main.ts` — bootstrap() calls createApp().listen(port)
- API Vercel Startup: `apps/api/api/index.ts` — handler calls createApp(), caches, reuses Express
- Website Startup: `apps/website/package.json` scripts (dev, build, start) invoke Next.js CLI
- Homepage SSR: `apps/website/app/(site)/page.tsx` — async data fetching before render
- Dashboard Entry: `apps/website/app/dashboard/layout.tsx` + `page.tsx`

**Configuration:**

- API Config: `apps/api/nest-cli.json` (builder), `.env` (not in repo), TypeScript at `apps/api/tsconfig.json`
- Website Config: `apps/website/next.config.ts`, TypeScript at `apps/website/tsconfig.json`
- Monorepo: Root `package.json`, `pnpm-workspace.yaml`, `turbo.json` (build orchestration)
- Database: `apps/api/prisma/schema.prisma` (models), `.env` var `DATABASE_URL` + `DIRECT_URL`

**Core Logic:**

- Authentication: `apps/api/src/auth/` (register, login, 2FA, Google OAuth, JWT generation)
- Events: `apps/api/src/events/events.service.ts` (create, update, list, filter, delete)
- Caching: `apps/api/utils/cache/http-cache.interceptor.ts` (Redis-backed with fallback)
- Database: `apps/api/utils/prisma/prisma.service.ts` (PrismaClient lifecycle management)
- API Client: `apps/website/lib/api.ts` (request wrapper, endpoint methods, media URL builder)

**Testing:**

- API Tests: `apps/api/test/` directory (e2e + unit tests)
- Test Config: `apps/api/package.json` scripts: `test`, `test:audit`, `test:e2e`
- Framework: Jest + Supertest (installed in `apps/api/package.json`)

## Naming Conventions

**Files:**

- Controllers: `{feature}.controller.ts` (e.g., `events.controller.ts`)
- Services: `{feature}.service.ts` (e.g., `events.service.ts`)
- Modules: `{feature}.module.ts` (e.g., `events.module.ts`)
- DTOs: `{action}-{entity}.dto.ts` or `query-{entity}.dto.ts` (e.g., `create-event.dto.ts`, `query-events.dto.ts`)
- Guards: `{feature}.guard.ts` or `{strategy}-auth.guard.ts` (e.g., `jwt-auth.guard.ts`, `api-key.guard.ts`)
- Decorators: `{action}.decorator.ts` (e.g., `current-user.decorator.ts`)
- Interceptors: `{feature}.interceptor.ts` (e.g., `http-cache.interceptor.ts`)
- React Components: PascalCase, no file extension suffix (e.g., `EventCard.tsx`, `Header.tsx`)
- React Pages: `page.tsx` (App Router convention)
- Next Routes: `route.ts` (App Router convention for API routes)
- API Methods: `api.{resource}()` in `lib/api.ts` (e.g., `api.events()`, `api.articles()`)

**Directories:**

- Feature directories: kebab-case plural (e.g., `events/`, `articles/`, `users/`)
- Utils: `utils/` (lowercase, plural)
- Components: `components/` (lowercase, plural)
- Library: `lib/` (lowercase, short form)
- Types/Data: part of `lib/` (e.g., `lib/data.ts` for types, `lib/api.ts` for client)
- Admin panel: `dashboard/` (lowercase)
- Public routes: Route groups like `(site)/`, `(auth)/` to organize without URL impact
- Multi-step forms: Numbered subdirectories `1/`, `2/`, `3/` (e.g., `crear/1/`, `registro/2/`)

## Where to Add New Code

**New API Endpoint:**
1. **Service logic:** Add method to `apps/api/src/{feature}/{feature}.service.ts`
2. **Controller route:** Add method to `apps/api/src/{feature}/{feature}.controller.ts`
3. **DTO validation:** Add new `.dto.ts` file in `apps/api/src/{feature}/dto/` if needed
4. **Module import:** If importing from another feature, add to `imports: []` in `apps/api/src/{feature}/{feature}.module.ts`
5. **Test:** Add test to `apps/api/test/{feature}.e2e-spec.ts`

**New Website Page:**
1. **Page component:** Create `apps/website/app/{route}/page.tsx`
2. **Data fetching:** If server-side SSR needed: make async page, call `api.{resource}()` in page body
3. **Layout wrapper:** Create `apps/website/app/{route}/layout.tsx` if shared wrapper needed (e.g., dashboard layout)
4. **Client component:** For interactive UX, create component in `apps/website/components/` marked with "use client"
5. **Type definitions:** Add types to `apps/website/lib/data.ts` or endpoint-specific types in `lib/api.ts`

**New Reusable Component:**
1. **Component file:** `apps/website/components/{ComponentName}.tsx`
2. **Mark "use client"** if uses hooks (useState, useContext, onClick, etc.)
3. **Props interface:** Define TypeScript props at top of file
4. **Export:** Named export (not default) for easier tree-shaking
5. **Usage:** Import in page.tsx or parent component as needed

**New Feature Module (rare):**
1. **Directory:** Create `apps/api/src/{newfeature}/`
2. **Core files:** `{newfeature}.module.ts`, `{newfeature}.controller.ts`, `{newfeature}.service.ts`
3. **DTO directory:** `apps/api/src/{newfeature}/dto/` with `.dto.ts` files
4. **Register:** Import new module in `apps/api/src/app.module.ts` imports array
5. **Add to build:** Ensure NestJS CLI includes new directory (usually automatic)

**New Utility or Helper:**
1. **Shared API utility:** `apps/api/utils/{category}/{name}.ts`
2. **Frontend helper:** `apps/website/lib/{category}.ts` (e.g., `lib/date-utils.ts`)
3. **Export:** Clearly mark exports so consumers can find them
4. **No circular imports:** Utilities should not import feature modules

## Special Directories

**apps/api/dist/**
- Purpose: Compiled JavaScript output from TypeScript
- Generated: By `nest build` command
- Committed: No (in .gitignore)
- Lifecycle: Deleted before rebuild; contains dist/src/ with .js + .js.map files

**apps/api/uploads/**
- Purpose: Local disk storage for images during development
- Generated: When images uploaded via `/api/uploads` endpoint (local mode only)
- Committed: No (in .gitignore)
- Lifecycle: Development only; Vercel uses Vercel Blob (via UploadsService)

**apps/website/.next/**
- Purpose: Next.js build cache and compiled pages
- Generated: By `next build` command
- Committed: No (in .gitignore)
- Lifecycle: Deleted before rebuild; speeds up incremental builds

**apps/api/node_modules/ + apps/website/node_modules/**
- Purpose: Installed npm dependencies
- Generated: By `pnpm install` from package-lock.yaml
- Committed: No (monorepo root has pnpm-lock.yaml instead)
- Lifecycle: Shared via pnpm; each workspace has symlinks to root node_modules

**.turbo/ + .next/**
- Purpose: Turbo CI/CD cache, Next.js cache
- Generated: During build
- Committed: No
- Lifecycle: Safe to delete; rebuild caches next time

---

*Structure analysis: 2026-06-29*
