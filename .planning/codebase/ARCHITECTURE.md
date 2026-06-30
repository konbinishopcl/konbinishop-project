# Architecture

**Analysis Date:** 2026-06-29

## Pattern Overview

**Overall:** Modular layered architecture with clear separation between API (NestJS) and frontend (Next.js), sharing Prisma models via monorepo structure.

**Key Characteristics:**
- **API-first design**: NestJS backend exposes REST endpoints with global `/api` prefix; shared utilities in `utils/` directory outside `src/`
- **Serverless-aware**: Single `createApp()` function in `src/main.ts` shared between local Express server and Vercel handler at `api/index.ts`
- **HTTP caching layer**: Redis-backed interceptor at `utils/cache/http-cache.interceptor.ts` with graceful degradation (catches Redis errors)
- **Modular feature modules**: 27 feature modules (auth, events, articles, heroes, spots, orders, payments, catalog, uploads, notifications, etc.) each with controller + service + DTO layer
- **Organization context**: Global `OrgContextModule` provides org-scoped data access via decorator-based extraction from JWT
- **Next.js SSR-first**: All page.tsx files are server components loading data via async functions; client interactivity via "use client" boundary

## Layers

**API Core Layer (NestJS):**
- Purpose: HTTP request handling, validation, authentication, business logic orchestration
- Location: `apps/api/src/`
- Contains: AppModule (root), Controllers (request routing), Services (business logic)
- Depends on: Shared utilities (Redis, Prisma, mail, error handling)
- Used by: HTTP clients (website frontend, external integrations)

**Shared Utilities Layer:**
- Purpose: Cross-cutting concerns shared across modules
- Location: `apps/api/utils/`
- Contains:
  - `cache/http-cache.interceptor.ts` — Redis-backed HTTP caching with fallback to no-cache on Redis failure
  - `redis/redis.module.ts` + `redis.service.ts` — ioredis client management
  - `prisma/prisma.module.ts` + `prisma.service.ts` — PrismaClient lifecycle
  - `http-exception.filter.ts` — Global exception handler
  - `templates/mail.templates.ts` — Email template builders
- Depends on: External services (Redis, PostgreSQL)
- Used by: All feature modules via dependency injection

**Data Access Layer:**
- Purpose: Database communication and ORM
- Location: `apps/api/prisma/schema.prisma` defines models; accessed via `PrismaService` injected into services
- Contains: Prisma models (Country, State, City, Event, Article, Hero, Spot, Order, Payment, Profile, User via Neon Auth, etc.)
- Depends on: PostgreSQL (Neon) with connection pooling
- Used by: All services via PrismaService

**Feature Module Layer:**
- Purpose: Domain-specific business logic grouped by feature
- Location: `apps/api/src/{feature}/` (auth, events, articles, heroes, spots, orders, payments, catalog, uploads, notifications, transfers, subscriptions, crm, organizations, audit, profiles, users, services, settings, newsletter, legal, faq, contact, stats, likes, crm)
- Structure per module:
  - `{feature}.controller.ts` — Route handlers, request/response transformation
  - `{feature}.service.ts` — Business logic, data manipulation, orchestration
  - `{feature}.module.ts` — Dependency declaration and imports
  - `dto/` — Data transfer objects (DTO) for validation via class-validator
- Dependencies: Services depend on PrismaService, RedisService, other feature services (e.g., EventsService imports NotificationsService)
- Used by: Controllers expose endpoints; other services via module exports

**Common/Cross-cutting Module:**
- Purpose: Shared guards, decorators, types across features
- Location: `apps/api/src/common/`
- Contains:
  - `org-context/` — `OrgContextGuard` extracts organization context from JWT, `@OrgContext()` decorator injects it into controller methods
- Used by: Any controller needing organization-scoped data (events, orders, etc.)

**Frontend Application Layer (Next.js):**
- Purpose: Server-side rendering and client interactivity
- Location: `apps/website/app/` with App Router structure
- Contains:
  - Server components: `page.tsx` files with async data fetching (SSR)
  - Client components: Components marked with "use client" for interactivity
  - Layout: `layout.tsx` at root and per-route for shared UI
  - Routes: `(site)/`, `dashboard/`, `crear/`, `registro/`, `login/`, `api/` (internal proxy)
- Depends on: API via `/api/` proxy (local Next.js routes) or direct API_URL (server-side)
- Used by: End users via browser

**Internal Proxy Layer:**
- Purpose: Forward frontend requests to backend; adds API key server-side
- Location: `apps/website/app/api/[...path]/route.ts` and `apps/website/app/api/media/[...path]`
- Contains: Dynamic route handler that proxies all HTTP methods to backend
- How it works: Strips `host` header, adds `X-API-Key` from env, preserves query strings
- Used by: Client-side code calling `/api/*` endpoints

## Data Flow

**Authentication Flow:**
1. Client submits email/password or Google token to `POST /api/auth/login` or `POST /api/auth/google`
2. AuthService validates credentials via external auth provider or Neon Auth
3. On success: generates JWT + pendingToken for 2FA; sends OTP code via email (MailgunService)
4. Client verifies 2FA code: `POST /api/auth/2fa/verify` with pendingToken
5. AuthService returns final JWT and user object
6. Frontend stores JWT in localStorage; includes in `Authorization: Bearer {token}` header for subsequent requests

**Event Creation Flow:**
1. User navigates to `/crear` (Next.js page)
2. Frontend form (`CreateEventForm`) collects event data client-side
3. `POST /api/events` sent to backend via internal proxy
4. EventsController validates input via CreateEventDto (class-validator)
5. EventsService:
   - Validates business rules (e.g., min/max price)
   - Inserts event record into Prisma
   - Emits notification via NotificationsService
   - Invalidates cache pattern `http:events:*` via RedisService
6. Response returned; cache miss on next `GET /api/events`
7. Frontend refetches events and displays new entry

**Public Event Listing Flow:**
1. Anonymous user visits homepage
2. Next.js `(site)/page.tsx` (server component) calls `api.events()` via internal proxy
3. Request hits `GET /api/events?pageSize=60` (no auth header)
4. EventsController calls EventsService.findAll(query, null)
5. Service queries Prisma for APPROVED events only
6. HttpCacheInterceptor:
   - Checks if user is unauthenticated (no Authorization header) → cacheable
   - Builds cache key: `http:events:GET/api/events?pageSize=60`
   - Tries RedisService.get(key); if Redis unavailable, falls through to .catch(() => null)
   - On cache miss: executes handler, pipes response to Redis.set() with 86400s TTL
   - Response includes `X-Cache: MISS` header
7. Next subsequent GET from unauthenticated user: cache hit, `X-Cache: HIT` header
8. On any POST/PATCH/DELETE to events: cache pattern `http:events:*` deleted, forcing miss on next read

**Organization Context Flow:**
1. Authenticated user from org makes request: `GET /api/events/mine`
2. JwtAuthGuard validates Bearer token; extracts user.sub (user ID)
3. OrgContextGuard:
   - Reads `x-org-id` header from request (typically from frontend)
   - Verifies user belongs to that org via Prisma
   - Injects OrgContextDto into `@OrgContext()` parameter
4. EventsService.findMine() uses org context to filter events by organization
5. Response scoped to that organization

**Image/Media Flow:**
1. Frontend references image path in response: `/api/media/uploads/event-123.jpg`
2. Request to `GET /api/media/uploads/event-123.jpg` routes to `apps/website/app/api/media/[...path]`
3. Proxy forwards to backend: `GET {BACKEND_URL}/api/media/uploads/event-123.jpg`
4. In local mode: backend serves from disk (`apps/api/uploads/` via static middleware in main.ts)
5. In Vercel: backend (also serverless) fetches from Vercel Blob (UploadsService handles this)
6. Response includes cache-immutable headers for CDN caching

**State Management:**
- No global state management library (Redux, Zustand) observed
- Component-level state: React hooks (useState, useContext)
- User session: JWT in localStorage (frontend), extracted from Authorization header (backend)
- Organization context: Passed via `x-org-id` header (frontend → backend)
- Temporary state (pending 2FA): pendingToken returned by auth endpoint, sent back in Authorization header

## Key Abstractions

**HttpCacheInterceptor:**
- Purpose: Transparent HTTP response caching for public read endpoints
- Files: `apps/api/utils/cache/http-cache.interceptor.ts`
- Pattern: NestJS interceptor registered globally in `AppModule` via `APP_INTERCEPTOR`
- How it works:
  - Maps request path to collection name (events → 'events', spots → 'spots', etc.)
  - GET requests without auth header: cache by full URL + query string
  - GET requests with auth header: skip cache (response varies by user role)
  - POST/PATCH/DELETE: invalidate entire collection cache pattern
  - Redis failure: caught silently, request proceeds without caching
- Cache keys: `http:events:GET/api/events?pageSize=60` (TTL 86400s = 1 day)

**OrgContextGuard + @OrgContext() Decorator:**
- Purpose: Inject organization context into request without explicit parameter passing
- Files: `apps/api/src/common/org-context/org-context.guard.ts`, `org-context.decorator.ts`, `org-context.module.ts`
- Pattern: Global guard extracts org-id header and validates membership; decorator injects typed object
- Usage: Controllers use `@UseGuards(OrgContextGuard)` + `@OrgContext() ctx: OrgContextDto` in handler signature
- Data: OrgContextDto contains orgId, org name, user's role in org, etc.

**Feature Modules:**
- Purpose: Organize related controllers, services, DTOs by domain (auth, events, etc.)
- Pattern: NestJS module declares controller, providers (services), imports (dependencies), exports (public services)
- Examples:
  - AuthModule (`apps/api/src/auth/auth.module.ts`): exports AuthService for injection into other modules
  - EventsModule: imports LikesModule, AuditModule, NotificationsModule to compose behavior
- Dependency direction: Child modules import parent/shared modules (never circular)

**DTOs (Data Transfer Objects):**
- Purpose: Validate and transform request payloads
- Location: Each feature module has `dto/` subdirectory
- Pattern: class-validator decorators (e.g., `@IsEmail()`, `@IsOptional()`, `@Transform()`)
- Global validation: `ValidationPipe` in AppModule applies to all routes, whitelist + transform enabled
- Example: `CreateEventDto` validates title, description, price, dates, etc.

**PrismaService + Lifecycle Management:**
- Purpose: Manage PrismaClient connection, ensure clean shutdown
- Files: `apps/api/utils/prisma/prisma.service.ts`, `prisma.module.ts`
- Pattern: Service extends PrismaClient, implements OnModuleInit/OnModuleDestroy
- Lifecycle: `onModuleInit()` calls `$connect()` on app startup; `onModuleDestroy()` calls `$disconnect()` on shutdown
- Availability: Injected into all services that query database

**RedisService + Graceful Degradation:**
- Purpose: Provide Redis client; survive Redis unavailability
- Files: `apps/api/utils/redis/redis.service.ts`, `redis.module.ts`
- Methods:
  - `get(key)` — fetch cached value
  - `set(key, value, ttlSeconds)` — store with expiration
  - `deletePattern(pattern)` — invalidate all keys matching pattern (e.g., `http:events:*`)
- Failure mode: All methods catch errors silently (logged but swallowed)
- Usage: HttpCacheInterceptor calls `redis.get()` with `.catch(() => null)`, continues if Redis unavailable

**Serverless Handler + Caching:**
- Purpose: Reuse NestJS app across Vercel Function invocations
- Files: `apps/api/api/index.ts` (entry point), `src/main.ts` (app factory)
- Pattern:
  - `createApp()` in main.ts exports async function (no listen() call)
  - bootstrap() wraps createApp(), adds listen() for local testing
  - `api/index.ts` handler imports createApp(), caches Express app in closure, reuses across requests
- Cold start: First request to serverless function takes ~1-2s (app initialization); subsequent requests use cached instance
- Fluid Compute: Vercel's long-running container environment keeps process alive; single app instance persists

## Entry Points

**API Boot (Local):**
- Location: `apps/api/src/main.ts`
- Triggers: `npm run dev` or `node dist/src/main` 
- Responsibilities:
  1. Calls `createApp()` to initialize NestJS
  2. Calls `app.listen(PORT)` to start Express server on port 3333 (configurable via env)
  3. Logs startup message to console

**API Boot (Vercel):**
- Location: `apps/api/api/index.ts`
- Triggers: Incoming HTTP request to Vercel Function
- Responsibilities:
  1. First call: imports createApp(), awaits initialization, caches Express handler
  2. Subsequent calls: retrieves cached handler, invokes Express with req/res
  3. Handles cold starts transparently (first request slower, then fast)

**Website Boot:**
- Location: `apps/website/app/layout.tsx` (root layout) + `app/page.tsx` (homepage)
- Triggers: `npm run dev` (Turbopack) or `npm run build && npm run start`
- Responsibilities:
  1. Initializes React providers (theme, notifications, Google OAuth)
  2. Sets metadata, fonts, global styles
  3. Mounts provider tree and children
  4. Next.js automatically routes requests to matching `page.tsx` or `route.ts`

**Public Homepage (SSR):**
- Location: `apps/website/app/(site)/page.tsx`
- Triggers: User navigates to `/` or `/events`
- Responsibilities:
  1. Async data fetching in server component (before render)
  2. Fetches events, heroes, articles, settings, stats from API
  3. Transforms API responses via `toEventItem()`, `toHeroSlide()`
  4. Passes data to `HomeView` client component for rendering

**Internal API Proxy:**
- Location: `apps/website/app/api/[...path]/route.ts`
- Triggers: Client-side fetch to `/api/*`
- Responsibilities:
  1. Intercepts all HTTP methods (GET, POST, PATCH, PUT, DELETE)
  2. Forwards request to backend API (BACKEND_URL env var)
  3. Adds `X-API-Key` header (server-side env var, never exposed to client)
  4. Strips problematic response headers (connection, keep-alive, transfer-encoding)
  5. Returns response to client

## Error Handling

**Strategy:** Layered validation + exception filter

**Patterns:**
- **Request validation:** `ValidationPipe` in AppModule validates DTOs, throws `BadRequestException` if schema mismatch
- **Business rule violation:** Services throw `BadRequestException`, `ConflictException`, `ForbiddenException`, `NotFoundException` as appropriate
- **HTTP Exception Filter:** `HttpExceptionFilter` in `apps/api/utils/http-exception.filter.ts` catches all exceptions, transforms to JSON response with status code
- **Uncaught exceptions:** Logged by NestJS default handler; client receives 500 error
- **Redis failure:** Swallowed silently (logged at DEBUG level); request proceeds without caching
- **Database connection loss:** Prisma throws error, caught by service, typically returns 500 via exception filter
- **Frontend error handling:** Try/catch blocks in async data fetching (page.tsx); failed fetch returns empty data structure, page renders with fallback UI

## Cross-Cutting Concerns

**Logging:**
- Backend: NestJS Logger class used in services/controllers; logs to stdout (stdout captured by PM2 or Vercel)
- Frontend: console.log/console.error for debugging; no structured logging
- Redis errors logged but not thrown (graceful degradation)

**Validation:**
- Backend: class-validator decorators on DTOs; global ValidationPipe enforces
- Frontend: react-hook-form + Zod for client-side form validation before submission
- API key validation: ApiKeyGuard checks `X-API-Key` header (global guard), denies requests without valid key

**Authentication:**
- Backend: JwtAuthGuard validates `Authorization: Bearer {token}` header, decodes JWT, injects user into request
- Backend: TwoFaGuard for 2FA verification, checks pendingToken
- Backend: OptionalJwtAuthGuard like JwtAuthGuard but allows unauthenticated requests (for public event listing)
- Frontend: JWT stored in localStorage after login; frontend auth guard checks before rendering protected routes
- Google OAuth: Frontend uses @react-oauth/google library; passes token to `POST /auth/google` endpoint

**Authorization:**
- Backend: RolesGuard + @Roles() decorator restricts endpoints to ADMIN, SUPER_ADMIN, ORGANIZER roles
- Backend: OrgContextGuard + @OrgContext() decorator provides org-scoped data access
- Frontend: Conditional rendering based on current user's role

**Caching:**
- HTTP response caching: HttpCacheInterceptor + Redis (graceful fallback to no-cache)
- ISR (Incremental Static Regeneration): Next.js pages use `next: { revalidate: 60 }` for 60-second revalidation
- Cache invalidation: POST/PATCH/DELETE to events invalidates `http:events:*` pattern

**CORS:**
- Configured in `createApp()` in main.ts
- Allows: Frontend URL (env var `FRONTEND_URL`), Vercel preview deploys (*.vercel.app)
- Credentials: enabled (allows cookies/auth headers)

---

*Architecture analysis: 2026-06-29*
