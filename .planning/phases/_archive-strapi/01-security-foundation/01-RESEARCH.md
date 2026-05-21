# Phase 1: Security Foundation - Research

**Researched:** 2026-03-23
**Domain:** Web security hardening — JWT cookies, CORS, Next.js API proxy allowlisting, Nuxt server-side proxy, reCAPTCHA v3 integration
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Dashboard restringe acceso solo a usuarios con rol `dashboard` (role enforcement restaurado) | Commented-out code in 4 files fully identified; restoration pattern documented |
| SEC-02 | Cookie JWT del dashboard tiene flags `HttpOnly` y `Secure` (no accesible desde JavaScript) | Next.js `cookies()` API pattern for HttpOnly cookie from server route documented |
| SEC-03 | Strapi CORS restringido a dominios conocidos (no wildcard `origin: ['*']`) | Exact location in `apps/strapi/config/middlewares.ts` line 9 confirmed; pattern documented |
| SEC-04 | Proxy API del dashboard tiene allowlist de rutas permitidas (no pass-through irrestricto) | Existing unrestricted proxy at `apps/dashboard/src/app/api/[...path]/route.ts` fully analyzed; allowlist pattern documented |
| SEC-05 | Website tiene proxy Nuxt server-side (`server/api/[...].ts`) que oculta la URL de Strapi | Reference implementation exists in waldo-project; exact file to create documented |
| SEC-06 | Proxy del website valida token reCAPTCHA v3 en POST/PUT/DELETE | Reference `recaptcha.ts` utility from waldo-project confirmed and analyzed |
| SEC-07 | Proxy del dashboard (Next.js) valida token reCAPTCHA v3 en POST/PUT/DELETE | `react-google-recaptcha-v3` already installed in dashboard; hook `useRecaptcha` already exists |
| SEC-08 | Strapi no valida reCAPTCHA — la validación es responsabilidad exclusiva de los proxies | No reCAPTCHA config found in Strapi plugins; nothing to remove — just ensure it is never added |
</phase_requirements>

---

## Summary

Phase 1 addresses four distinct security gaps in the current codebase, all of which are documented in `.planning/codebase/CONCERNS.md` and have been confirmed by direct code inspection. The gaps are: (1) dashboard role enforcement is commented out in four files, allowing any Strapi user to access the admin; (2) the JWT cookie is set via `document.cookie` without `HttpOnly` or `Secure` flags; (3) Strapi's CORS policy uses `origin: ['*']` with `credentials: true`; (4) the Next.js proxy catch-all passes any path to Strapi without an allowlist.

A fifth concern — the website calling Strapi directly from the browser — is not yet a bug (website currently works correctly) but becomes a blocking gap for payment security: the browser would expose the Strapi URL and the website would be unable to enforce reCAPTCHA server-side. The solution is to create a Nuxt `server/api/[...].ts` proxy matching the pattern already implemented in waldo-project.

All four plans in this phase are surgical fixes or additive new files. None require schema changes, database migrations, or new npm packages for the core fixes. The reCAPTCHA infrastructure already exists in the dashboard (`react-google-recaptcha-v3`, `RecaptchaProvider`, `useRecaptcha` hook). The website needs a reCAPTCHA secret key in `runtimeConfig` and a `vue-recaptcha` or `@nuxtjs/recaptcha` package if it doesn't already have one — or it can use `$fetch` directly (the waldo-project pattern uses `$fetch` directly without a Vue wrapper).

**Primary recommendation:** Execute the four plans in order. Each plan is independent — they share no runtime dependencies on each other — but CORS must be fixed before any payment endpoints are added to Strapi, and the proxy allowlist must be in place before the website proxy is deployed (to prevent double-proxying confusion).

---

## Standard Stack

### Core (existing — do not change)

| Library | Version | Purpose | Location |
|---------|---------|---------|----------|
| Next.js | 15.4.6 | Dashboard framework, App Router | `apps/dashboard` |
| `react-google-recaptcha-v3` | ^1.11.0 | reCAPTCHA v3 for React | `apps/dashboard` — already installed |
| Nuxt | 4.0.3 | Website framework with Nitro server | `apps/website` |
| `@nuxtjs/strapi` | ^2.0.0 | Strapi client for Nuxt | `apps/website` — reconfigured to point at self |
| Strapi | 5.23.1 | API/CMS | `apps/strapi` |

### Additions Required

| Library | Version | Purpose | Install In |
|---------|---------|---------|-----------|
| `vue-recaptcha` | ^3.x (same as waldo-project) | reCAPTCHA v3 for Vue/Nuxt | `apps/website` |

Note: waldo-project uses `vue-recaptcha@^3.0.0-alpha.6` and `vue3-recaptcha-v2@^2.1.0`. The website proxy in waldo-project does NOT use a Vue package for reCAPTCHA — it uses `$fetch` directly in the Nitro server util. No Vue reCAPTCHA package is needed for the server-side proxy. A Vue package would only be needed if client-side reCAPTCHA token generation is required in the website (e.g. for the event submission form in `CartDefault.vue`).

**Confidence:** HIGH — confirmed by direct inspection of waldo-project and konbini package.json files.

### Environment Variables to Add

```bash
# Dashboard (.env)
NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY=      # already in use by RecaptchaProvider
GOOGLE_RECAPTCHA_SECRET_KEY=                 # server-side, for proxy validation

# Website (.env)
RECAPTCHA_SITE_KEY=                          # public — for client-side token generation
RECAPTCHA_SECRET_KEY=                        # private — for Nitro proxy validation

# Strapi (.env)
# No reCAPTCHA env vars needed in Strapi — SEC-08
```

---

## Architecture Patterns

### Plan 1: Restore Dashboard Role Enforcement

**What to change:** Four files have the role check commented out. The pattern is to uncomment and restore. The `StrapiAuth.validateUserRole()` method is already correct at line 142 of `auth.ts` (`userData.role.type !== 'dashboard'`) — it was never broken, just never called from the guards.

**Files and changes:**

| File | What's Commented Out | What to Restore |
|------|---------------------|-----------------|
| `apps/dashboard/src/lib/stores/useUserStore.ts` | `setUser` role validation block (lines 50-62) | Uncomment and check `user.role.type === 'dashboard'`; remove the "Allow any user" block (lines 64-72) |
| `apps/dashboard/src/lib/stores/useUserStore.ts` | `hasDashboardRole()` returns `true` (line 88) | Restore `return !!useUserStore.getState().user?.role && useUserStore.getState().user.role.type === 'dashboard'` or equivalent |
| `apps/dashboard/src/lib/strapi/auth.ts` | Role validation in `login()` (lines 78-82) | Uncomment the role check block |
| `apps/dashboard/src/app/dashboard/layout.tsx` | `hasDashboardRole()` guard (lines 52-58, 112-138) | Uncomment the redirect and "Acceso Denegado" render blocks |
| `apps/dashboard/src/app/dashboard/layout.tsx` | Hardcoded blocklist (lines 44-50) | REMOVE entirely — replace with `hasDashboardRole()` guard |
| `apps/dashboard/src/middleware.ts` | Role check block (lines 48-57) | Uncomment the role redirect block |

**Note on `hasDashboardRole` in Zustand:** The current store uses `set => ({...})` pattern. `hasDashboardRole` is a method that returns `true` unconditionally. When restoring, the method needs to read the current user from the store state, not from closure. The correct pattern:

```typescript
hasDashboardRole: () => {
  // Must read from get() not from the set closure since user can change
  return false; // placeholder - actual implementation reads state
},
```

In practice, since this is a Zustand `persist` store, the `get()` call is not directly available in the factory. The safest approach is to check `user?.role?.type === 'dashboard'` inside the closure, which is the original commented-out approach: `return user?.role?.name === 'Dashboard'`. Note the existing `validateUserRole` in `auth.ts` uses `role.type !== 'dashboard'` (lowercase, type field) while the store comment uses `role.name === 'Dashboard'` (capitalized, name field). These must be made consistent — use `role.type === 'dashboard'` everywhere, matching `validateUserRole`.

**Confidence:** HIGH — code is directly visible, logic is clear, and the correct check value (`type === 'dashboard'`) is already in the working `validateUserRole` method.

---

### Plan 2: Fix JWT Cookie Security

**Problem:** `document.cookie = \`${cookieName}=${response.jwt}; path=/; max-age=...\`` at `apps/dashboard/src/lib/strapi/auth.ts` line 88. No `HttpOnly`, no `Secure`, no `SameSite`.

**Solution:** Move cookie setting to a Next.js API Route Handler that runs server-side.

**Pattern:**

```typescript
// apps/dashboard/src/app/api/auth/login/route.ts  (NEW FILE)
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Forward login to Strapi
  const strapiRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!strapiRes.ok) {
    const error = await strapiRes.json();
    return NextResponse.json(error, { status: strapiRes.status });
  }

  const data = await strapiRes.json();

  // Set HttpOnly cookie server-side
  const response = NextResponse.json({ user: data.user });
  response.cookies.set(COOKIE_NAME, data.jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
```

**Client-side changes required:**

1. `StrapiAuth.login()` — instead of calling `StrapiAPI.authenticate()` directly and then setting `document.cookie`, it calls `POST /api/auth/login` (the new API route). The JWT never touches the browser.
2. `StrapiAuth.getToken()` — currently reads `document.cookie`. Since the cookie is `HttpOnly`, it is no longer readable from JS. The middleware already reads it via `request.cookies.get()` (server-side), so this is fine. Any client-side code that calls `getToken()` to build an `Authorization` header must instead have the proxy route inject the header server-side (the proxy at `[...path]/route.ts` already reads `Authorization` from the request — but that means the client can't set it from JS anymore). **This is the key architectural shift:** once `HttpOnly`, the JWT cannot be read by client code. API requests from the browser must go through the Next.js proxy, which reads the cookie server-side and adds the `Authorization` header before forwarding.
3. `StrapiAuth.clearToken()` — currently clears via `document.cookie`. Must become a server-side call to `POST /api/auth/logout` that calls `response.cookies.delete(COOKIE_NAME)`.

**Proxy update required for cookie forwarding:** The existing `[...path]/route.ts` proxy currently only forwards the `Authorization` header from the client request. After making the cookie `HttpOnly`, the browser won't send an `Authorization` header — instead, the browser sends the `strapi_jwt` cookie with the request. The proxy must read the cookie from the incoming request and add it as an `Authorization: Bearer <jwt>` header before forwarding to Strapi:

```typescript
// In apps/dashboard/src/app/api/[...path]/route.ts
// After the allowlist check (Plan 3):
const cookieName = process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt';
const jwt = request.cookies.get(cookieName)?.value;
if (jwt) {
  clientHeaders['Authorization'] = `Bearer ${jwt}`;
}
```

**Confidence:** HIGH — Next.js `response.cookies.set()` with `httpOnly: true` is the documented pattern for setting secure cookies from Route Handlers.

---

### Plan 3: Restrict Strapi CORS + Dashboard Proxy Allowlist + Dashboard reCAPTCHA

**3a: Strapi CORS**

File: `apps/strapi/config/middlewares.ts` line 9.

Change `origin: ['*']` to explicit domain list:

```typescript
{
  name: 'strapi::cors',
  config: {
    enabled: true,
    origin: [
      process.env.DASHBOARD_URL || 'http://localhost:3001',
      process.env.WEBSITE_URL || 'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  },
},
```

New environment variables needed in `apps/strapi/.env`:
```
DASHBOARD_URL=https://dashboard.konbini.cl
WEBSITE_URL=https://konbini.cl
```

**3b: Dashboard Proxy Allowlist**

File: `apps/dashboard/src/app/api/[...path]/route.ts`

The proxy currently passes any path to Strapi. Add an allowlist at the top of each handler:

```typescript
// Allowlisted route prefixes
const ALLOWED_PREFIXES = [
  'events',
  'articles',
  'heroes',
  'spots',
  'categories',
  'tags',
  'regions',
  'communes',
  'users',
  'stats',
  'upload',
  'auth/local',
];

function isAllowedPath(path: string): boolean {
  return ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix));
}
```

Return 403 for non-allowlisted paths:
```typescript
if (!isAllowedPath(path)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**3c: Dashboard reCAPTCHA Validation**

The dashboard already has `react-google-recaptcha-v3` installed, `RecaptchaProvider` wrapping the root layout, and `useRecaptcha` hook. The proxy (`[...path]/route.ts`) needs to validate the `x-recaptcha-token` header on POST/PUT/DELETE requests before forwarding.

Server-side validation utility (new file):

```typescript
// apps/dashboard/src/lib/recaptcha.ts
const RECAPTCHA_SECRET = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE'];

export async function validateRecaptchaToken(
  token: string | null,
  method: string
): Promise<void> {
  if (!PROTECTED_METHODS.includes(method.toUpperCase())) return;

  if (!token) {
    throw new Error('reCAPTCHA token required');
  }

  const result = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: RECAPTCHA_SECRET!, response: token }),
  }).then(r => r.json());

  if (!result.success || result.score <= 0.5) {
    throw new Error('reCAPTCHA verification failed');
  }
}
```

In `[...path]/route.ts`, call `validateRecaptchaToken` before forwarding:
```typescript
const recaptchaToken = request.headers.get('x-recaptcha-token');
try {
  await validateRecaptchaToken(recaptchaToken, request.method);
} catch {
  return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
}
```

Client-side: Any dashboard form that calls a mutating endpoint (POST/PUT/DELETE) must obtain a reCAPTCHA token via the existing `useRecaptcha` hook and pass it as `x-recaptcha-token` header. The `StrapiAPI` class needs a method to pass a recaptcha token on these calls.

**Confidence:** HIGH — all three sub-tasks are surgical edits to existing files with clear before/after.

---

### Plan 4: Website Nuxt Proxy + reCAPTCHA

**4a: Create `server/api/[...].ts`**

The waldo-project implements this pattern at `/home/gab/Code/waldo-project/apps/website/server/api/[...].ts`. It can be copied nearly verbatim:

- Reads `API_URL` from `process.env`
- Strips OAuth routes (not applicable to konbini but harmless to keep)
- Calls `isRecaptchaProtectedRoute(fullPath, method)` — returns `true` for POST/PUT/DELETE
- Reads `x-recaptcha-token` header and calls `verifyRecaptchaToken(token, secretKey)`
- Uses Nitro's `proxyRequest(event, targetUrl, { headers })` to forward

Key diff from waldo: konbini does not have OAuth routes. Those branches can be omitted. The core logic (reCAPTCHA check + `proxyRequest`) is identical.

**4b: Create `server/utils/recaptcha.ts`**

Copy verbatim from waldo-project's `/home/gab/Code/waldo-project/apps/website/server/utils/recaptcha.ts`. It uses:
- `createError` from `h3` (bundled with Nitro — no new dependency)
- `$fetch` from Nuxt (available in server utils)
- Score threshold: `<= 0.5`

**4c: Reconfigure `@nuxtjs/strapi` to point at the Nuxt server**

In `apps/website/nuxt.config.ts`, the `strapi.url` currently points directly at Strapi:

```typescript
strapi: {
  url: process.env.API_URL || 'http://localhost:1337',  // CURRENT — points at Strapi
```

Change to point at the Nuxt server itself:

```typescript
strapi: {
  url: process.env.BASE_URL || 'http://localhost:3000',  // NEW — points at Nuxt server
  prefix: '/api',
  version: 'v4',
  ...
},
```

When `@nuxtjs/strapi` makes a request like `GET /api/events`, it will now hit `http://localhost:3000/api/events`, which is caught by `server/api/[...].ts` (Nitro's catch-all), which proxies to `http://localhost:1337/api/events`. The browser never sees the Strapi URL.

Add `RECAPTCHA_SECRET_KEY` to server-only `runtimeConfig`:

```typescript
runtimeConfig: {
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,  // ADD
  public: {
    apiUrl: process.env.BASE_URL || 'http://localhost:3000',  // point at self
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,         // ADD
    ...
  },
},
```

**4d: reCAPTCHA on the client (website)**

The website needs to generate reCAPTCHA tokens for POST/PUT/DELETE calls from Vue components (primarily `CartDefault.vue` and any auth forms). The waldo-project uses `vue-recaptcha@^3.0.0-alpha.6`. Since the proxy validates any POST/PUT/DELETE, all mutating calls from the website must include `x-recaptcha-token`.

Required client-side additions:
- Install `vue-recaptcha` (or use inline `$fetch` to the Google reCAPTCHA script — the waldo-project loads the script via Google's CDN JS and calls `grecaptcha.execute()` directly from a Nuxt plugin)
- Add `RECAPTCHA_SITE_KEY` to `runtimeConfig.public`

**4e: SEC-08 — Strapi not validating reCAPTCHA**

Confirmed: `apps/strapi/config/plugins.ts` has NO reCAPTCHA configuration. The `users-permissions` Strapi plugin has a built-in reCAPTCHA toggle (disabled by default). Verify it remains disabled. Nothing to remove.

**Confidence:** HIGH — waldo-project is a fully working reference. The konbini website server/api directory already exists (`apps/website/server/api/`) with one file (`dev-login.post.ts`). The catch-all `[...].ts` can be added alongside it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| reCAPTCHA v3 server-side verify | Custom HTTP client to siteverify | Copy `server/utils/recaptcha.ts` from waldo-project | Already implemented, tested, and deployed in production |
| Nuxt proxy forwarding | Manual `fetch()` per method | Nitro's built-in `proxyRequest(event, url, { headers })` | Handles method, body, headers, streaming transparently |
| Next.js HttpOnly cookie | Manual `Set-Cookie` header string | `response.cookies.set(name, value, options)` from `NextResponse` | Handles encoding, path, domain, secure flag correctly |
| Role check logic | New auth system | Uncomment existing `role.type === 'dashboard'` check | Already written and tested before it was commented out |

---

## Common Pitfalls

### Pitfall 1: `hasDashboardRole` reads stale closure state
**What goes wrong:** In a Zustand store with the `set => ({...})` pattern, a method like `hasDashboardRole` closes over the initial `user` value (which is `null`). Even after `setUser` is called, the closure inside `hasDashboardRole` still sees the old value.
**How to avoid:** Use `useUserStore.getState().user` inside `hasDashboardRole` instead of the closure variable, OR store `hasDashboardRole` as a derived selector called outside the store (`useUserStore(state => state.user?.role?.type === 'dashboard')`). The original commented-out code has this same issue — verify it actually works before shipping.
**Confidence:** HIGH — Zustand closure behavior is well-documented.

### Pitfall 2: `StrapiAPI.getToken()` breaks after making cookie HttpOnly
**What goes wrong:** `StrapiAuth.getToken()` reads `document.cookie`. Once the cookie is `HttpOnly`, this returns `null`. Any code that calls `getToken()` to build `Authorization: Bearer` headers will silently send unauthenticated requests.
**How to avoid:** Audit all callers of `getToken()`. The pattern must shift: browser → Next.js proxy → Strapi (proxy injects the JWT by reading the `HttpOnly` cookie server-side). The `StrapiAPI` class sends requests to `/api/` (the proxy), not to Strapi directly. The proxy reads the cookie and adds the header.
**Warning signs:** 401 errors after login; dashboard shows user as logged out even with a valid cookie.

### Pitfall 3: CORS breaks the dashboard after restricting origin
**What goes wrong:** If `DASHBOARD_URL` or `WEBSITE_URL` env vars are not set in the Strapi deployment, the fallback value must exactly match the deployed hostname (including protocol, no trailing slash). A mismatch between `https://konbini.cl` and `https://www.konbini.cl` causes all browser requests to fail with CORS errors.
**How to avoid:** Test CORS restriction locally first. Use exact matching. If the website has both `www` and non-`www`, add both to the origin array.
**Warning signs:** Browser console shows `CORS policy: The 'Access-Control-Allow-Origin' header...` errors immediately after deploying the CORS change.

### Pitfall 4: `@nuxtjs/strapi` sends server-side requests directly to Strapi (bypassing proxy)
**What goes wrong:** `@nuxtjs/strapi` makes requests from the Nuxt server (SSR) AND from the browser (client-side). When `strapi.url` points at `http://localhost:3000` (Nuxt itself), a server-side SSR request to `http://localhost:3000/api/events` creates a loopback — Nuxt server calling itself. This can cause issues with port conflicts or infinite loops during SSR.
**How to avoid:** In `nuxt.config.ts`, use the server-internal Strapi URL for SSR and the public-facing URL for client:

```typescript
runtimeConfig: {
  strapiUrl: process.env.API_URL || 'http://localhost:1337', // server-only, direct
  public: {
    apiUrl: process.env.BASE_URL || 'http://localhost:3000', // client → proxy
  },
},
```

Or configure `@nuxtjs/strapi` to use `API_URL` directly for server-side and proxy only for browser. Verify how `@nuxtjs/strapi` v2 uses `runtimeConfig` to determine SSR vs browser URLs before deploying.
**Confidence:** MEDIUM — `@nuxtjs/strapi` v2 behavior in SSR context needs verification against current docs.

### Pitfall 5: reCAPTCHA token required on Strapi login endpoint
**What goes wrong:** If the proxy requires `x-recaptcha-token` on ALL POST requests (matching by method only), then `POST /api/auth/local` (login) also requires a token. The Strapi users-permissions login doesn't generate a token on its own — the website login form must generate one.
**How to avoid:** The `isRecaptchaProtectedRoute` function in waldo-project currently returns `true` for all POST/PUT/DELETE. This is intentional — all mutating requests, including login, must have a reCAPTCHA token. Ensure the website login form generates a token. This is the correct behavior for anti-bot protection.
**Confidence:** HIGH — waldo-project applies this consistently.

### Pitfall 6: Proxy allowlist blocks legitimate Strapi endpoints used by dashboard
**What goes wrong:** Adding an allowlist to the dashboard proxy may block routes that are currently in use. If `upload` is not on the list, image uploads break. If `auth` is not on the list, the login API route breaks.
**How to avoid:** Before finalizing the allowlist, audit `StrapiAPI` class in `apps/dashboard/src/lib/strapi/api.ts` to enumerate all Strapi endpoints currently called by the dashboard. The allowlist must include all of them.
**Warning signs:** Dashboard pages returning 403 from the proxy after the allowlist is added.

---

## Code Examples

### Setting an HttpOnly cookie from a Next.js Route Handler
```typescript
// Source: Next.js 15 official docs — cookies() API
import { NextResponse } from 'next/server';

const response = NextResponse.json({ user: data.user });
response.cookies.set('strapi_jwt', data.jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
});
return response;
```

### Deleting an HttpOnly cookie (logout)
```typescript
// Source: Next.js 15 official docs
const response = NextResponse.json({ ok: true });
response.cookies.delete('strapi_jwt');
return response;
```

### Dashboard proxy reading cookie and injecting Authorization header
```typescript
// Source: Next.js 15 docs — reading cookies in Route Handlers
const cookieName = process.env.NEXT_PUBLIC_STRAPI_TOKEN_COOKIE || 'strapi_jwt';
const jwt = request.cookies.get(cookieName)?.value;
const headers: Record<string, string> = {};
if (jwt) {
  headers['Authorization'] = `Bearer ${jwt}`;
}
```

### Nitro proxyRequest (Nuxt website proxy)
```typescript
// Source: waldo-project/apps/website/server/api/[...].ts (production code)
import { proxyRequest } from 'h3';

return proxyRequest(event, targetUrl, { headers });
```

### reCAPTCHA server-side verification (Nuxt server util)
```typescript
// Source: waldo-project/apps/website/server/utils/recaptcha.ts (production code)
import { createError } from 'h3';

export async function verifyRecaptchaToken(
  token: string | null | undefined,
  secretKey: string
): Promise<void> {
  if (!token || !token.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'reCAPTCHA token is required' });
  }

  const result = await $fetch<{ success: boolean; score: number; 'error-codes'?: string[] }>(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      method: 'POST',
      body: new URLSearchParams({ secret: secretKey, response: token }).toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  if (!result.success || result.score <= 0.5) {
    throw createError({ statusCode: 400, statusMessage: 'reCAPTCHA verification failed.' });
  }
}
```

### Strapi CORS restriction
```typescript
// Source: apps/strapi/config/middlewares.ts — existing file, change origin array
{
  name: 'strapi::cors',
  config: {
    enabled: true,
    origin: [
      process.env.DASHBOARD_URL || 'http://localhost:3001',
      process.env.WEBSITE_URL || 'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  },
},
```

### Role check in Zustand store (restoring)
```typescript
// Source: apps/dashboard/src/lib/stores/useUserStore.ts — restoring commented-out logic
setUser: (user: User) => {
  if (!user.role || user.role.type !== 'dashboard') {
    throw new Error('Usuario no tiene permisos de dashboard');
  }
  set({ user, isAuthenticated: true });
},

hasDashboardRole: () => {
  // Read from global store state, not from stale closure
  return useUserStore.getState().user?.role?.type === 'dashboard';
},
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — zero test files exist in any app (confirmed by CONCERNS.md) |
| Config file | None — Wave 0 must create |
| Quick run command | N/A until Wave 0 |
| Full suite command | N/A until Wave 0 |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEC-01 | Non-dashboard user cannot access `/dashboard` routes | manual-only (requires Strapi user with wrong role) | — | ❌ Wave 0 |
| SEC-02 | `strapi_jwt` cookie is not readable via `document.cookie` | manual-only (browser devtools check) | — | ❌ Wave 0 |
| SEC-03 | Strapi returns 403 for cross-origin request from unknown origin | manual-only (curl with bad Origin header) | `curl -H "Origin: https://evil.com" http://localhost:1337/api/events` | ❌ Wave 0 |
| SEC-04 | Dashboard proxy returns 403 for non-allowlisted paths | manual/smoke | `curl -X GET http://localhost:3001/api/admin` → expect 403 | ❌ Wave 0 |
| SEC-05 | Browser network tab shows no requests to `localhost:1337` | manual-only (browser devtools) | — | ❌ Wave 0 |
| SEC-06 | `POST /api/events` without `x-recaptcha-token` returns 400 | smoke | `curl -X POST http://localhost:3000/api/events` → expect 400 | ❌ Wave 0 |
| SEC-07 | Dashboard `POST /api/events` without `x-recaptcha-token` returns 400 | smoke | `curl -X POST http://localhost:3001/api/events` → expect 400 | ❌ Wave 0 |
| SEC-08 | Strapi plugins.ts has no reCAPTCHA config | code inspection | `grep -r recaptcha apps/strapi/config/` → expect no results | N/A — grep |

### Sampling Rate

- **Per task commit:** Manual UAT check for that specific task's UAT criteria
- **Per wave merge:** Full UAT list executed manually
- **Phase gate:** All 7 UAT criteria green before `/gsd:verify-work`

### Wave 0 Gaps

None required — Phase 1 is purely security fixes with no automated test suite. UAT is manual verification via browser devtools and `curl`. The CONCERNS.md confirms zero test files exist; this is a known gap addressed in future phases.

*(Manual-only justification: SEC-01 requires a real Strapi user with a non-dashboard role. SEC-02 and SEC-05 require browser devtools inspection. These cannot be automated without a test user seeder and Playwright setup, which is out of scope for Phase 1.)*

---

## Open Questions

1. **`@nuxtjs/strapi` v2 SSR loopback behavior**
   - What we know: Setting `strapi.url` to the Nuxt server's own URL makes server-side `useStrapiClient()` calls loop back to itself during SSR. The waldo-project solves this by having separate `API_URL` (Strapi direct) for server and `BASE_URL` (Nuxt) for client.
   - What's unclear: Does `@nuxtjs/strapi` v2 respect `runtimeConfig` separately for server vs. client contexts, or does it use a single URL?
   - Recommendation: Inspect `@nuxtjs/strapi` v2 docs before implementing Plan 4. May need to configure `NUXT_STRAPI_URL` separately for server-side to avoid loopback.

2. **Dashboard `StrapiAPI` class — how does it construct Authorization headers?**
   - What we know: `StrapiAPI` has a `makeRequest()` method that likely calls `StrapiAuth.getToken()` to get the JWT.
   - What's unclear: After making the cookie `HttpOnly`, `getToken()` returns `null` on the client. Does the `StrapiAPI` class need to be completely refactored, or does simply removing the `Authorization: Bearer` header from client requests work (because the proxy reads the `HttpOnly` cookie)?
   - Recommendation: Read `apps/dashboard/src/lib/strapi/api.ts` in detail during Plan 2 implementation to understand the header injection pattern.

3. **Strapi `auth-response` middleware — does role data require it?**
   - What we know: Two middlewares (`auth-error-logger`, `auth-response`) are commented out in `apps/strapi/config/middlewares.ts` lines 21-22. CONCERNS.md notes the `auth-response` middleware enriches login responses with the user's role object.
   - What's unclear: Does `POST /api/auth/local` currently return `role` in the response? The `LoginResponse` type in `auth.ts` includes `role`, but it may only be populated if the middleware is active.
   - Recommendation: Test `POST /api/auth/local` response in the current state. If `role` is missing, uncomment `global::auth-response` when implementing Plan 2. This is a prerequisite for SEC-01.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `apps/dashboard/src/lib/strapi/auth.ts` — JWT cookie set via `document.cookie` confirmed at line 88
- Direct code inspection of `apps/dashboard/src/lib/stores/useUserStore.ts` — role check commented out confirmed at lines 50-62, 87-88
- Direct code inspection of `apps/dashboard/src/app/dashboard/layout.tsx` — hardcoded username blocklist confirmed at lines 44-50
- Direct code inspection of `apps/dashboard/src/middleware.ts` — role check block commented out at lines 48-57
- Direct code inspection of `apps/strapi/config/middlewares.ts` — `origin: ['*']` confirmed at line 9
- Direct code inspection of `apps/dashboard/src/app/api/[...path]/route.ts` — unrestricted proxy confirmed (no allowlist)
- Direct code inspection of `waldo-project/apps/website/server/api/[...].ts` — reference proxy implementation
- Direct code inspection of `waldo-project/apps/website/server/utils/recaptcha.ts` — reference reCAPTCHA utility
- Direct code inspection of `apps/dashboard/src/components/recaptcha-provider.tsx` — `react-google-recaptcha-v3` already installed
- Direct code inspection of `apps/dashboard/src/lib/hooks/useRecaptcha.ts` — `useRecaptcha` hook already exists
- Direct code inspection of `apps/website/nuxt.config.ts` — `strapi.url` points at Strapi directly
- `.planning/codebase/CONCERNS.md` — comprehensive audit confirming all four gaps

### Secondary (MEDIUM confidence)
- Next.js 15 App Router docs — `response.cookies.set()` with `httpOnly` option (training data, August 2025)
- Nitro/h3 `proxyRequest` API — available in Nuxt 4's bundled Nitro (confirmed by waldo-project usage)
- `@nuxtjs/strapi` v2 `url` config behavior in SSR — needs verification (flagged as Open Question)

---

## Metadata

**Confidence breakdown:**
- Plan 1 (Role enforcement): HIGH — code is directly visible, logic clear, test: any non-dashboard user
- Plan 2 (JWT cookie): HIGH — pattern is Next.js standard; caveat is `StrapiAPI` auth header refactor scope
- Plan 3 (CORS + allowlist + dashboard reCAPTCHA): HIGH — all three are surgical file edits
- Plan 4 (Website proxy): HIGH — reference implementation exists in waldo-project verbatim

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable — these are Node.js/Next.js/Nuxt patterns that don't change frequently)
