# External Integrations

**Analysis Date:** 2026-03-23

## APIs & External Services

**Headless CMS:**
- Strapi v5 (`apps/strapi`) — internal API consumed by both website and dashboard
  - REST API at `http://localhost:1337/api` (configurable via `API_URL` / `NEXT_PUBLIC_STRAPI_URL`)
  - Website uses `@nuxtjs/strapi` module (v4 API, cookie `strapi_jwt`, path `/api`)
  - Dashboard uses a custom proxy layer (`apps/dashboard/src/app/api/[...path]/route.ts`) that forwards all GET/POST/PUT/DELETE to Strapi, injecting JWT from cookie

**Image Processing:**
- Cloudinary — CDN for media assets
  - Used as an optional image source in the dashboard media proxy (`apps/dashboard/src/app/api/media/[...path]/route.ts`)
  - Configured via `NEXT_PUBLIC_CLOUDINARY_BASE_URL=https://res.cloudinary.com`
  - Images from `uploads/` path are served from Strapi; all others are assumed Cloudinary
  - Dashboard `next.config.ts` allows remote patterns for `res.cloudinary.com`

## Data Storage

**Databases:**
- SQLite (default/dev) — `apps/strapi/config/database.ts`, file at `.tmp/data.db`
  - Client: `better-sqlite3`
- MySQL (production option) — configured via env vars
  - Connection vars: `DATABASE_CLIENT=mysql`, `DATABASE_HOST`, `DATABASE_PORT` (3306), `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
  - SSL configurable via `DATABASE_SSL`, `DATABASE_SSL_CA`, etc.
  - Client: `mysql` 2.18.1 + `mysql2`
- PostgreSQL (supported but not primary) — configured via `DATABASE_URL` or individual host/port/name vars
  - Pool: min 2, max 10 connections (both MySQL and Postgres)

**File Storage:**
- Strapi uploads — local filesystem by default (`/uploads/` served at port 1337)
- Cloudinary — used as CDN for production media (referenced in dashboard config and media proxy)

**Caching:**
- None detected (no Redis, Memcached, or cache layer configured)
- Dashboard media route uses `Cache-Control: public, max-age=31536000, immutable` for processed images

## Authentication & Identity

**Auth Provider:**
- Strapi Users & Permissions plugin (`@strapi/plugin-users-permissions` 5.23.1)
  - JWT-based authentication
  - JWT secret: `JWT_SECRET` env var (configured in `apps/strapi/config/plugins.ts`)
  - Login endpoint: `POST /api/auth/local` (identifier + password)
  - Token stored in cookie `strapi_jwt` (1-day TTL in website, 7-day TTL in dashboard)
  - Role-based access: `dashboard` role type checked in `apps/dashboard/src/lib/strapi/auth.ts`

**Dashboard Auth Flow:**
- Next.js middleware (`apps/dashboard/src/middleware.ts`) validates JWT cookie on every protected route by calling `GET /api/users/me`
- On invalid token: cookie deleted, redirect to `/login`
- Role validation exists but is currently commented out (allows any authenticated Strapi user)

**Website Dev Mode:**
- Custom dev login endpoint at `apps/website/server/api/dev-login.post.ts`
  - Validates against `DEV_USERNAME` / `DEV_PASSWORD` env vars
  - Returns a `crypto.randomUUID()` session token
  - Used to gate `/dev` and `/cuenta` routes

## Monitoring & Observability

**Error Tracking — Sentry:**
- All three apps have Sentry SDK installed and partially configured, but **disabled in production** (commented out):

  - **Strapi** (`apps/strapi`): `@sentry/node` ^10.8.0 + `@strapi/plugin-sentry` ^5.23.1
    - **ACTIVE** — enabled in `apps/strapi/config/plugins.ts` with DSN hardcoded
    - DSN: `https://bed8a202a44c1bf2e3971b962c5be740@o4509929700196352.ingest.us.sentry.io/4509930249519104`
    - tracesSampleRate: 1.0, logs enabled, custom `beforeSend` adds tags

  - **Website** (`apps/website`): `@sentry/nuxt` ^10
    - **DISABLED** — `@sentry/nuxt/module` commented out in `nuxt.config.ts`
    - Plugin at `apps/website/plugins/sentry.client.ts` is a no-op
    - DSN configured in `runtimeConfig.public.sentry.dsn` (via `SENTRY_DSN` env var or hardcoded default)
    - `useSentry()` composable at `apps/website/composables/useSentry.ts` wraps capture/breadcrumb/user APIs — ready but inactive
    - Server config at `apps/website/sentry.server.config.ts` active (imported via plugin)

  - **Dashboard** (`apps/dashboard`): `@sentry/nextjs` ^10.8.0
    - **DISABLED** — `withSentryConfig` commented out in `apps/dashboard/next.config.ts`
    - Server/edge configs at `apps/dashboard/sentry.server.config.ts` and `sentry.edge.config.ts` are commented out stubs
    - Instrumentation at `apps/dashboard/src/instrumentation.ts` imports Sentry but defers to disabled configs
    - DSN: `https://54f5375a34406de793ecad4a1a9ba386@o4509929700196352.ingest.us.sentry.io/4509929700851712`

**Sentry Org:** `konbinishopcl` (referenced in dashboard next.config.ts comments)

**Logs (Strapi):**
- Winston file transport configured in `apps/strapi/config/server.ts`
  - Log file: `logs/strapi.log`, 5MB max, 5 files max
  - PM2 error/out logs: `logs/error.log`, `logs/out.log`, `logs/combined.log`

**Logs (Website/Dashboard):**
- `console.error` / `console.log` only

## Analytics

**Google Tag Manager:**
- Website integration via `apps/website/plugins/gtm-head.client.ts` and `apps/website/plugins/gtm-body.client.ts`
- GTM ID configured via `GTM_ID` env var (default `GTM-XXXXXXXX` placeholder)
- `window.dataLayer` initialized client-side only
- Excluded from `sitemap` and `robots` config

## SEO

**@nuxtjs/seo module** (website only):
- Sitemap auto-generated; excludes `/dev` and `/cuenta`
- Robots: allows all except `/dev` and `/cuenta`
- Configured in `apps/website/nuxt.config.ts`

**Google Fonts:**
- Roboto (400, 700) loaded via `<link>` in Nuxt head config
- `fonts.googleapis.com` and `fonts.gstatic.com` preconnected

**Font Awesome:**
- CDN stylesheet from `cdnjs.cloudflare.com` loaded in Nuxt head

## Maps

**Leaflet** ^1.9.4 (website):
- Interactive map component support
- Types: `@types/leaflet` ^1.9.17

## Media

**Plyr** ^3.8.3 (website):
- Video/audio player component

## CI/CD & Deployment

**Hosting:**
- Production managed via PM2 (see `ecosystem.config.cjs` / `ecosystem.config.js`)
- Website: cluster mode, all CPU instances
- Strapi: fork mode, 1 instance, 1G memory limit, auto-restart

**CI Pipeline:**
- Not detected (no GitHub Actions, CircleCI, etc. config found)

**Strapi Cloud:**
- `@strapi/plugin-cloud` 5.23.1 installed — supports Strapi Cloud deployment

## Environment Configuration

**Required env vars by app:**

Strapi (`apps/strapi/.env.example`):
- `HOST`, `PORT`
- `APP_KEYS` (comma-separated array)
- `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`
- `JWT_SECRET`, `ENCRYPTION_KEY`
- `DATABASE_CLIENT` (sqlite | mysql | postgres)
- Database connection vars (host, port, name, user, password) if not SQLite
- `APP_RUN_SEEDERS=true` to trigger data seeders on bootstrap
- `DEPLOYMENT_ENV`, `STRAPI_VERSION` (for Sentry tags)

Website (`apps/website/.env.example`):
- `API_URL` — Strapi base URL
- `GTM_ID` — Google Tag Manager ID
- `BLOCK_SEARCH_ENGINES` — set to `true` to add noindex/nofollow
- `NITRO_PORT` — server port for PM2
- `SENTRY_DSN` — override default Sentry DSN
- `DEV_USERNAME`, `DEV_PASSWORD` — dev mode gate credentials
- `DEV_MODE` — enable dev mode UI

Dashboard (`apps/dashboard/env.example`):
- `NEXT_PUBLIC_STRAPI_URL` — Strapi API base URL
- `NEXT_PUBLIC_APP_URL` — Dashboard's own URL (used in server-side proxy calls)
- `NEXT_PUBLIC_WEB_URL` — Website URL
- `NEXT_PUBLIC_STRAPI_TOKEN_COOKIE` — cookie name for JWT (default: `strapi_jwt`)
- `NEXT_PUBLIC_STRAPI_USER_COOKIE` — cookie name for user data
- `NEXT_PUBLIC_CLOUDINARY_BASE_URL` — Cloudinary base URL
- `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY` — reCAPTCHA v3 site key

## Webhooks & Callbacks

**Incoming:**
- Not detected (no webhook endpoint handlers found in any app)

**Outgoing:**
- Not detected

---

*Integration audit: 2026-03-23*
