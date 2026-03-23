---
phase: 01-security-foundation
verified: 2026-03-23T12:00:00Z
status: passed
score: 13/13 must-haves verified
---

# Phase 1: Security Foundation Verification Report

**Phase Goal:** Eliminar las vulnerabilidades de seguridad criticas e implementar la capa de proxy + reCAPTCHA que oculta Strapi del browser -- prerequisitos bloqueantes para lanzar pagos.
**Verified:** 2026-03-23
**Status:** PASSED
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Any authenticated Strapi user without role.type === 'dashboard' is redirected to /login immediately, regardless of username | VERIFIED | useUserStore.ts:49 throws on wrong role; auth.ts:65 calls /api/auth/login which validates role server-side; layout.tsx:44 guards via hasDashboardRole(); middleware.ts:48 checks role.type !== 'dashboard' and redirects |
| 2 | Strapi returns 403 for requests with an Origin header not matching dashboard or website URLs | VERIFIED | middlewares.ts:9-11 restricts origin to [DASHBOARD_URL, WEBSITE_URL] -- wildcard removed |
| 3 | All browser-side API requests from the website go through localhost:3000/api/ (Nuxt server), never directly to localhost:1337 | VERIFIED | nuxt.config.ts:71 sets strapi.url to BASE_URL \|\| localhost:3000; [...].ts proxy forwards all /api/* to Strapi |
| 4 | POST/PUT/DELETE requests to the website proxy without a valid x-recaptcha-token receive a 400 error when RECAPTCHA_SECRET_KEY is configured | VERIFIED | recaptcha.ts:25-30 throws createError(400) on missing/invalid token when secretKey is set |
| 5 | When RECAPTCHA_SECRET_KEY is not set, POST/PUT/DELETE requests pass through with a logged warning (dev bypass) | VERIFIED | recaptcha.ts:20-23 returns early with console.warn when secretKey is empty |
| 6 | GET requests pass through the proxy without reCAPTCHA validation | VERIFIED | isRecaptchaProtectedRoute checks method only -- GET is not in RECAPTCHA_PROTECTED_METHODS |
| 7 | Strapi has no reCAPTCHA validation logic | VERIFIED | grep -r recaptcha apps/strapi/config/ returns zero results |
| 8 | The strapi_jwt cookie has HttpOnly and Secure flags | VERIFIED | login/route.ts:54-55 sets httpOnly: true, secure: process.env.NODE_ENV === 'production' |
| 9 | Login flow goes through /api/auth/login server route which sets the HttpOnly cookie | VERIFIED | auth.ts:65 calls fetch('/api/auth/login'); login/route.ts handles it and sets cookie |
| 10 | Logout flow goes through /api/auth/logout server route which deletes the cookie | VERIFIED | auth.ts:56 calls fetch('/api/auth/logout'); logout/route.ts:7 calls response.cookies.delete |
| 11 | StrapiAPI no longer reads JWT from document.cookie | VERIFIED | api.ts contains no document.cookie reference; client-side branch adds no Authorization header |
| 12 | The dashboard proxy rejects paths not in the allowlist with 403 | VERIFIED | [...path]/route.ts:10-27 defines ALLOWED_PREFIXES; isAllowedPath() returns 403 for disallowed paths at every handler |
| 13 | The primary mutating form (form-event.tsx) calls useRecaptcha() and sends the token via StrapiAPI | VERIFIED | form-event.tsx:3 imports useRecaptcha; line:179 calls verifyRecaptcha('submit_event') before both createEvent and updateEvent |

**Score:** 13/13 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/dashboard/src/lib/stores/useUserStore.ts` | Role enforcement in setUser and hasDashboardRole | VERIFIED | setUser throws on role.type !== 'dashboard'; hasDashboardRole reads live store via getState() |
| `apps/dashboard/src/lib/strapi/auth.ts` | Role validation in login flow + HttpOnly-aware getToken | VERIFIED | login() calls /api/auth/login; getToken() returns null with HttpOnly comment; clearToken() calls /api/auth/logout |
| `apps/dashboard/src/app/dashboard/layout.tsx` | Layout guard for non-dashboard users | VERIFIED | hasDashboardRole() guard in useEffect; Acceso Denegado render block; AlertTriangle imported; blocklist removed |
| `apps/dashboard/src/middleware.ts` | Middleware role check with populate=role | VERIFIED | fetch URL includes ?populate=role at line 38; role.type !== 'dashboard' checked at line 48 |
| `apps/strapi/config/middlewares.ts` | CORS restricted to known origins | VERIFIED | origin: [DASHBOARD_URL\|\|localhost:3001, WEBSITE_URL\|\|localhost:3000]; wildcard removed; auth-response and auth-error-logger enabled |
| `apps/website/server/api/[...].ts` | Nitro catch-all proxy that forwards to Strapi | VERIFIED | proxyRequest(event, targetUrl, { headers }) at line 44; imports verifyRecaptchaToken and isRecaptchaProtectedRoute |
| `apps/website/server/utils/recaptcha.ts` | reCAPTCHA v3 server-side verification utility with dev bypass | VERIFIED | verifyRecaptchaToken and isRecaptchaProtectedRoute exported; dev bypass at line 20-23; throws createError(400) |
| `apps/website/nuxt.config.ts` | Strapi module pointed at Nuxt server, reCAPTCHA keys in runtimeConfig | VERIFIED | strapi.url = BASE_URL\|\|localhost:3000; recaptchaSecretKey and strapiUrl (server); recaptchaSiteKey (public) |
| `apps/dashboard/src/app/api/auth/login/route.ts` | Server-side login route that sets HttpOnly cookie | VERIFIED | httpOnly: true, secure, sameSite: 'strict'; validates role.type !== 'dashboard' with 403 |
| `apps/dashboard/src/app/api/auth/logout/route.ts` | Server-side logout route that deletes HttpOnly cookie | VERIFIED | response.cookies.delete(COOKIE_NAME) |
| `apps/dashboard/src/lib/recaptcha.ts` | Server-side reCAPTCHA validation utility with dev bypass | VERIFIED | validateRecaptchaToken; PROTECTED_METHODS = ['POST','PUT','DELETE']; dev bypass on missing GOOGLE_RECAPTCHA_SECRET_KEY |
| `apps/dashboard/src/app/api/[...path]/route.ts` | Proxy with allowlist, cookie-to-header injection, reCAPTCHA | VERIFIED | ALLOWED_PREFIXES (12 entries); getJwtFromCookie injects Authorization; validateRecaptchaToken called in POST/PUT/DELETE |
| `apps/dashboard/src/lib/strapi/api.ts` | StrapiAPI without client-side cookie reading, with reCAPTCHA token support | VERIFIED | no document.cookie; credentials: 'include'; recaptchaToken option on all mutating methods |
| `apps/dashboard/src/components/form-event.tsx` | Event form wired with useRecaptcha for token generation | VERIFIED | imports useRecaptcha; calls verifyRecaptcha('submit_event'); passes token to createEvent and updateEvent |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| useUserStore.ts | layout.tsx | hasDashboardRole() called in useEffect | WIRED | layout.tsx:44 if (user && !hasDashboardRole()) |
| middleware.ts | Strapi /api/users/me?populate=role | fetch with Authorization header | WIRED | middleware.ts:38 URL includes ?populate=role; line 41 Authorization: Bearer |
| auth.ts | /api/auth/login route | fetch('/api/auth/login') | WIRED | auth.ts:65 fetch('/api/auth/login', { method: 'POST' }) |
| [...path]/route.ts | HttpOnly cookie | request.cookies.get(cookieName) | WIRED | getJwtFromCookie() at line 30-32; called in every handler |
| [...path]/route.ts | recaptcha.ts | import { validateRecaptchaToken } | WIRED | line 2 import; called in POST/PUT/DELETE handlers |
| form-event.tsx | api.ts | StrapiAPI method with recaptchaToken | WIRED | createEvent(eventData, recaptchaToken) and updateEvent(id, data, recaptchaToken) |
| [...].ts (website) | recaptcha.ts | import { verifyRecaptchaToken, isRecaptchaProtectedRoute } | WIRED | line 1-4 import; called at line 14-20 |
| [...].ts (website) | Strapi API (localhost:1337) | proxyRequest(event, targetUrl) | WIRED | line 44 proxyRequest(event, targetUrl, { headers }) |
| nuxt.config.ts | [...].ts (website) | strapi.url points to Nuxt server | WIRED | strapi.url = BASE_URL\|\|localhost:3000 -- @nuxtjs/strapi routes through proxy |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | 01-01-PLAN.md | Dashboard restricts access to users with role `dashboard` | SATISFIED | Four guard points: useUserStore, auth.ts, layout.tsx, middleware.ts -- all use role.type === 'dashboard' |
| SEC-02 | 01-03-PLAN.md | JWT cookie has HttpOnly and Secure flags | SATISFIED | login/route.ts:54-55 httpOnly: true, secure: NODE_ENV === 'production' |
| SEC-03 | 01-01-PLAN.md | Strapi CORS restricted to known domains (no wildcard) | SATISFIED | middlewares.ts origin array has exactly 2 entries; wildcard absent |
| SEC-04 | 01-03-PLAN.md | Dashboard API proxy has route allowlist | SATISFIED | ALLOWED_PREFIXES with 12 entries; isAllowedPath() returns 403 for unlisted paths |
| SEC-05 | 01-02-PLAN.md | Website has Nuxt server-side proxy hiding Strapi URL | SATISFIED | [...].ts catch-all proxy exists; nuxt.config.ts strapi.url points to localhost:3000 |
| SEC-06 | 01-02-PLAN.md | Website proxy validates reCAPTCHA v3 token on POST/PUT/DELETE | SATISFIED | recaptcha.ts verifyRecaptchaToken called in [...].ts for POST/PUT/DELETE; dev bypass when key unset |
| SEC-07 | 01-03-PLAN.md | Dashboard proxy validates reCAPTCHA v3 token on POST/PUT/DELETE | SATISFIED | validateRecaptchaToken called in all three mutating handlers; dev bypass when GOOGLE_RECAPTCHA_SECRET_KEY unset |
| SEC-08 | 01-02-PLAN.md | Strapi has zero reCAPTCHA configuration | SATISFIED | grep -r recaptcha apps/strapi/config/ returns zero results |

All 8 requirements for Phase 1 are SATISFIED. No orphaned requirements found.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/dashboard/src/lib/strapi/auth.ts` | 48 | `return null` in getToken() | Info | This is intentional: getToken() is deliberately neutered because the JWT is HttpOnly and must not be read from JavaScript. The comment on lines 46-48 documents this explicitly. Not a stub. |

No blockers or warnings found. The single `return null` in `auth.ts` is a deliberate design decision documented in the code and plan, not an incomplete implementation.

---

### Human Verification Required

#### 1. HttpOnly Cookie Not Visible in Browser

**Test:** Log in to the dashboard, then open browser DevTools > Application > Cookies. Look for `strapi_jwt`.
**Expected:** Cookie is listed but `HttpOnly` column is checked, and `document.cookie` in the console does NOT include `strapi_jwt`.
**Why human:** Cannot verify cookie flags from static code analysis; requires a live browser session.

#### 2. CORS Rejection for Unknown Origins

**Test:** With Strapi running, run `curl -s -H "Origin: https://evil.com" -H "Access-Control-Request-Method: GET" -X OPTIONS http://localhost:1337/api/events`
**Expected:** Response does NOT include `Access-Control-Allow-Origin: https://evil.com` or wildcard.
**Why human:** Requires Strapi to be running; cannot verify runtime CORS behavior from config alone.

#### 3. Non-Dashboard User Redirect

**Test:** Create a Strapi user without the 'dashboard' role. Attempt to log in to the dashboard with that user.
**Expected:** Login returns 403 error with the 'Acceso denegado' message. If somehow a token is obtained, middleware redirects to /login.
**Why human:** Requires live Strapi instance with test user data.

#### 4. Website Proxy Intercepts All API Traffic

**Test:** With the website running and browser DevTools Network tab open, perform any action that fetches data (e.g., load the homepage or an event page). Filter network requests for `1337`.
**Expected:** Zero direct requests to `localhost:1337` appear. All API requests go to `localhost:3000/api/*`.
**Why human:** Requires a running browser session with network inspection.

---

### Gaps Summary

No gaps. All 13 observable truths are verified, all 14 artifacts are substantive and wired, all 8 key links are confirmed, all 8 requirements (SEC-01 through SEC-08) are satisfied with direct evidence in the codebase.

The phase goal is achieved: critical security vulnerabilities are eliminated and the proxy + reCAPTCHA layer is in place. The foundation for payment features is unblocked.

---

_Verified: 2026-03-23_
_Verifier: Claude (gsd-verifier)_
