# External Integrations

**Analysis Date:** 2026-06-29

## APIs & External Services

**Authentication:**
- Google OAuth 2.0 - User login and account linking
  - SDK/Client: `google-auth-library` (Node backend), `@react-oauth/google` (React frontend)
  - Auth: Environment var `GOOGLE_CLIENT_ID` (public; safe to embed in frontend)
  - Usage: `apps/api/src/auth/auth.service.ts` verifies ID tokens; `apps/website` renders Sign-In button
  - Scope: Email + basic profile (no admin scope)

**Payment Processing:**
- Transbank WebPay Plus - Chilean e-commerce payment gateway
  - SDK/Client: Custom integration at `apps/api/services/transbank/transbank.service.ts`
  - Auth: `TRANSBANK_COMMERCE_CODE` + `TRANSBANK_API_SECRET` (credentials in env vars)
  - Environment: Selectable via `TRANSBANK_ENV` (sandbox/production)
  - Endpoints: `https://webpay3gint.transbank.cl` (sandbox) or `https://webpay3g.transbank.cl` (production)
  - API Path: `/rswebpaytransaction/api/webpay/v1.2/transactions` (POST to create, PUT to confirm)
  - Flow: Frontend redirects to Transbank → Payment confirmation → Callback to `GET /api/payments/transbank/callback` → State transition
  - Handled by: `apps/api/src/payments/payments.service.ts` (orchestration), `apps/api/src/payments/gateway.factory.ts` (factory pattern)

**Email Delivery:**
- Mailgun - Transactional email service (US region)
  - SDK/Client: `mailgun.js` (v13.1.0) with `form-data` for body encoding
  - Auth: `MAILGUN_API_KEY` (API key) + `MAILGUN_DOMAIN` (sending domain)
  - Configuration: `MAIL_FROM` env var (default "Konbini <no-reply@konbini.cl>")
  - Usage: `apps/api/services/mailgun/mailgun.service.ts` sends transactional emails
  - Email Templates: Built with `mjml` (v5.2.2); compiled to HTML before sending
  - Graceful Degradation: If API key or domain missing, MailgunService logs warning and disables (emails not sent, but no errors thrown)
  - Sent By: Auth service (2FA codes, password reset), Contact service (confirmations + notifications), Order/Subscription services

**Content Delivery & Storage:**
- Vercel Blob - Cloud file storage for uploads
  - SDK/Client: `@vercel/blob` (v2.5.0)
  - Auth: `BLOB_READ_WRITE_TOKEN` (read-write token)
  - Usage: `apps/api/src/uploads/uploads.service.ts` (handles image uploads)
  - Path: Files stored in `uploads/` namespace within Blob storage
  - URLs: Absolute public URLs returned (e.g., `https://*.blob.vercel-storage.com/uploads/...`)
  - Local Fallback: In dev (when `process.env.VERCEL` is not set), uses disk at `apps/api/uploads/` directory
  - File Types: JPG, PNG, WebP only; max 5 MB per file
  - Accessed: Frontend references absolute Blob URLs directly (no proxy needed)

## Data Storage

**Databases:**

**Primary - Relational:**
- Neon Postgres (managed PostgreSQL)
  - Connection (Runtime, pooled): `DATABASE_URL` env var (host ending with `-pooler`)
  - Connection (Migrations, direct): `DIRECT_URL` env var (host without `-pooler`)
  - Client: Prisma v6.19.3 (`@prisma/client`)
  - Schema: `apps/api/prisma/schema.prisma` - Models include Country, State, City, Event, EventCategory, EventTag, Spot, Hero, Order, Payment, User, Profile, Organization, Article, ContactMessage, CrmEntry, Subscription, etc.
  - Usage: All business data persists here; migrations via `prisma migrate deploy` (production startup script)
  - Prisma Binary Targets: Configured for both `native` (local dev) and `rhel-openssl-3.0.x` (Vercel Functions runtime)

**Cache:**
- Redis (optional, degrades gracefully if unavailable)
  - Connection: `REDIS_URL` env var (default `redis://localhost:6379` if not provided)
  - Client: `ioredis` (v5.10.1)
  - Service: `apps/api/utils/redis/redis.service.ts`
  - TTL Strategy: HTTP GET responses cached for 1 day; invalidated by collection changes
  - Failure Mode: If Redis unavailable, API continues operating without caching (no 500 errors)
  - Used By: `apps/api/utils/cache/http-cache.interceptor.ts` (global HTTP cache interceptor)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based
  - Implementation: `apps/api/src/auth/auth.service.ts`
  - Token Signing: `@nestjs/jwt` with `JWT_SECRET` env var
  - Token Structure: Payload includes `sub` (user ID), `email`, `role`, optional `actingAs` (org context), optional `twoFaPending` or `onboardingPending` flags
  - Expiration: Default long-lived tokens; special short tokens for 2FA (15 min) and Google onboarding (30 min)
  - Refresh: No explicit refresh token; rely on long-lived token or re-login
  - Storage: Frontend stores JWT in httpOnly cookie or sessionStorage (depends on implementation)
  - Guards: `apps/api/src/auth/jwt.guard.ts` (validates bearer token) + `apps/api/src/auth/api-key.guard.ts` (validates `X-API-Key` header for public endpoints)

**Multi-Factor Authentication (2FA):**
- SMS-less 2FA via Email
  - Mechanism: 6-digit code sent to email during login (if enabled on account)
  - Code Storage: Hashed with SHA-256, stored with 10-min expiry
  - Tokens: Intermediate JWT with `twoFaPending: true` (15 min valid, only for 2FA verification endpoints)
  - Sent By: `apps/api/services/mailgun/mail.service.ts` → `sendTwoFactorCode()`

**Google OAuth Flow:**
- Frontend: `@react-oauth/google` component sends `idToken` to backend
- Backend Verification: `google-auth-library` verifies token signature + expiry
- Onboarding: New Google users enter onboarding flow (intermediate JWT with `onboardingPending: true`, 30 min)
- Linking: Existing users can link Google account (no intermediate token needed)

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, Rollbar, or similar error tracking service configured

**Logs:**
- console (NestJS Logger) - Application logs via `console.log`, `console.error` (handled by NestJS Logger class)
  - Dev: Logs to stdout (visible in terminal)
  - Prod (Vercel Functions): Logs streamed to Vercel's log aggregation
  - Levels: `debug`, `log`, `warn`, `error` set by Logger class at `apps/api/src/`
  - IP Tracking: Request IP captured via `req.ip` (using `trust proxy: 1` in `apps/api/src/main.ts` for Nginx/Vercel proxy chains)
- Audit Service: Logs user actions (create, update, delete) to database at `apps/api/src/audit/`

## CI/CD & Deployment

**Hosting:**
- Vercel (both API and website)
  - API: Serverless Functions (entry point `apps/api/api/index.ts` as HTTP handler)
  - Website: Next.js on Vercel (optimized for App Router)
  - Preview Deploys: Vercel assigns URLs with pattern `*.konbini-project-website.vercel.app` (auto CORS allowed in backend)

**CI Pipeline:**
- Not explicitly configured - Vercel auto-deploys on git push to main/develop branches
- GitHub Actions: Not found in repo (assumed Vercel GitHub integration)

**Build Process:**
- Turbo: `turbo run build` orchestrates `pnpm` in each app
- API: `nest build` outputs to `dist/`
- Website: `next build` outputs to `.next/`

## Environment Configuration

**Required env vars (API):**
- Database: `DATABASE_URL`, `DIRECT_URL`
- Auth: `JWT_SECRET`, `GOOGLE_CLIENT_ID`
- Mailgun: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAIL_FROM`
- File Storage: `BLOB_READ_WRITE_TOKEN`
- Payments: `TRANSBANK_COMMERCE_CODE`, `TRANSBANK_API_SECRET`, `TRANSBANK_ENV`
- Server: `PORT` (default 3333), `NODE_ENV`
- Frontend URL: `FRONTEND_URL` (CORS validation)
- API Config: `API_BASE_URL` (callback URLs for payments)
- Cache: `REDIS_URL` (optional; defaults to `redis://localhost:6379`)
- Feature Flags: `HERO_PRICE_PER_DAY`, `HERO_MAX_ACTIVE`, `HERO_MAX_DAYS`, `SPOT_PRICE_PER_DAY`, `SPOT_MAX_ACTIVE`, `SPOT_MAX_DAYS`, `EVENT_MAX_DAYS`
- Contact Notifications: `CONTACT_NOTIFY_EMAILS` (comma-separated list of admin emails)

**Required env vars (Website):**
- API Communication: `API_URL` (server-side only), `API_KEY` (server-side only)
- Public API Origin: `NEXT_PUBLIC_API_ORIGIN` (client-side image URLs)
- Google: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (client-side)
- Social Links (public): `NEXT_PUBLIC_INSTAGRAM_*`, `NEXT_PUBLIC_TIKTOK_*`, `NEXT_PUBLIC_FACEBOOK_*`, `NEXT_PUBLIC_DISCORD_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_ABUSE_EMAIL`, `NEXT_PUBLIC_PRIVACY_EMAIL`

**Secrets location:**
- `.env` files (gitignored) at `apps/api/` and `apps/website/`
- Vercel Secrets: Configured in Vercel dashboard for production deployments
- No local vault (1Password, Doppler, etc.) detected

## Webhooks & Callbacks

**Incoming:**
- POST `/api/payments/transbank/callback` - Payment confirmation callback from Transbank
  - Query params: `token_ws` (transaction token), `TBK_TOKEN` (order ID)
  - Handler: `apps/api/src/payments/payments.controller.ts` → `handleTransbankCallback()`
  - Response: Redirects browser to frontend success/failure URL

- POST `/api/contact` - Public form submission for contact requests
  - Handler: `apps/api/src/contact/contact.controller.ts` → `create()`
  - Triggers: Email to user + notifications to admins (via Mailgun)

**Outgoing:**
- Mailgun API calls - Transactional emails (2FA codes, password resets, confirmations, admin notifications)
- Transbank API calls - Payment gateway integration (POST create transaction, PUT confirm transaction)
- No other external webhooks detected (no Stripe webhooks, no external job queues)

## Rate Limiting & Quotas

**Feature Quotas (enforced at checkout time):**
- Heroes: Max `HERO_MAX_ACTIVE` items per user, `HERO_MAX_DAYS` days per run, `HERO_PRICE_PER_DAY` CLP
- Spots: Max `SPOT_MAX_ACTIVE` items per user, `SPOT_MAX_DAYS` days per run, `SPOT_PRICE_PER_DAY` CLP
- Events: Max `EVENT_MAX_DAYS` days per run (price per day in database, category-specific)
- No rate limiting on API endpoints detected (rely on Vercel Functions CPU time limits)

## Integration Failure Modes

- **Mailgun unavailable:** Emails not sent, but no errors thrown (graceful degradation; logged as warning)
- **Transbank unavailable:** Payment initiation fails with 500 error (no retry logic)
- **Vercel Blob unavailable:** File upload fails with 500 error
- **Redis unavailable:** HTTP cache layer disabled, but API continues operating
- **Google OAuth misconfigured:** Sign-in fails; token verification error

---

*Integration audit: 2026-06-29*
