---
phase: 01-security-foundation
plan: "03"
subsystem: dashboard-auth-proxy
tags: [security, httponly-cookie, proxy, allowlist, recaptcha, jwt]
dependency_graph:
  requires: [01-01]
  provides: [HttpOnly-JWT-cookie, proxy-allowlist, recaptcha-validation]
  affects: [dashboard-login, dashboard-proxy, all-dashboard-forms]
tech_stack:
  added: []
  patterns: [HttpOnly-cookie-via-server-route, proxy-cookie-injection, recaptcha-validation-middleware]
key_files:
  created:
    - apps/dashboard/src/app/api/auth/login/route.ts
    - apps/dashboard/src/app/api/auth/logout/route.ts
    - apps/dashboard/src/lib/recaptcha.ts
  modified:
    - apps/dashboard/src/lib/strapi/auth.ts
    - apps/dashboard/src/lib/strapi/api.ts
    - apps/dashboard/src/app/api/[...path]/route.ts
    - apps/dashboard/src/components/form-event.tsx
decisions:
  - "StrapiAuth.logout() and clearToken() made async; callers in layout.tsx remain fire-and-forget (safe since redirect occurs via window.location.href)"
  - "Dynamic import of StrapiAPI in validateUserRole() to avoid circular import after removing StrapiAPI import from auth.ts"
  - "recaptchaToken optional on all StrapiAPI mutating methods so existing callers without tokens work via dev bypass"
metrics:
  duration_seconds: 231
  completed_date: "2026-03-23"
  tasks_completed: 3
  files_changed: 7
---

# Phase 1 Plan 03: HttpOnly JWT Cookie + Proxy Hardening Summary

**One-liner:** HttpOnly JWT via server auth routes, proxy allowlist + cookie injection, reCAPTCHA validation on POST/PUT/DELETE with dev bypass.

## What Was Built

### SEC-02: HttpOnly JWT Cookie

Created `POST /api/auth/login` server route that:
- Forwards credentials to Strapi `/api/auth/local`
- Fetches full user with role populated
- Validates `role.type === 'dashboard'` server-side (returns 403 if not)
- Sets JWT as `httpOnly: true`, `secure` (production), `sameSite: 'strict'` cookie
- Returns `{ user }` without JWT to client

Created `POST /api/auth/logout` server route that deletes the HttpOnly cookie.

Updated `StrapiAuth`:
- `getToken()` returns `null` (JWT HttpOnly, not JS-readable)
- `clearToken()` async, calls `/api/auth/logout`
- `login()` calls `/api/auth/login` instead of `StrapiAPI.authenticate + document.cookie`
- `logout()` async, awaits `clearToken()`
- `validateUserRole()` awaits `clearToken()`

Updated `StrapiAPI.makeRequest()`:
- Removed client-side `document.cookie` reading entirely
- Added `credentials: 'include'` so browser sends HttpOnly cookie automatically
- Accepts `recaptchaToken` option, forwards as `x-recaptcha-token` header

### SEC-04: Proxy Path Allowlist

Rewrote `apps/dashboard/src/app/api/[...path]/route.ts` with:
- `ALLOWED_PREFIXES` array covering all 12 Strapi endpoints used by the dashboard
- `isAllowedPath()` helper returning 403 for non-allowlisted paths
- Cookie-to-header injection: reads `strapi_jwt` HttpOnly cookie, injects as `Authorization: Bearer` header on Strapi requests
- Old pattern (reading `Authorization` from `request.headers`) removed entirely

### SEC-07: reCAPTCHA on Mutating Requests

Created `apps/dashboard/src/lib/recaptcha.ts`:
- `validateRecaptchaToken(token, method)` validates against Google siteverify API
- Dev bypass: when `GOOGLE_RECAPTCHA_SECRET_KEY` is unset, logs warning and returns (no-op)
- Returns 400 with "reCAPTCHA verification failed" when validation fails

Updated `StrapiAPI`: all mutating methods (createEvent, updateEvent, createArticle, uploadFile, deleteFile, etc.) accept optional `recaptchaToken` parameter and pass it through.

Wired `form-event.tsx`:
- Imports and calls `useRecaptcha()`
- Calls `verifyRecaptcha('submit_event')` before create/update API calls
- Passes token to `StrapiAPI.createEvent()` and `StrapiAPI.updateEvent()`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Circular import risk between auth.ts and api.ts**
- **Found during:** Task 1
- **Issue:** After removing `StrapiAPI` import from `auth.ts` (login no longer calls `StrapiAPI.authenticate`), `validateUserRole()` still needs `StrapiAPI.getMe()`. A static import would re-introduce the coupling.
- **Fix:** Used dynamic import (`await import('./api')`) inside `validateUserRole()` to avoid circular dependency at module load time.
- **Files modified:** apps/dashboard/src/lib/strapi/auth.ts

## Commits

- `8adfa30` feat(01-03): HttpOnly JWT via server auth routes + remove document.cookie
- `0c51640` feat(01-03): harden dashboard proxy with allowlist, cookie injection, reCAPTCHA
- `6497121` feat(01-03): wire reCAPTCHA token through StrapiAPI and form-event.tsx

## Self-Check: PASSED

Files created/exist:
- apps/dashboard/src/app/api/auth/login/route.ts: FOUND
- apps/dashboard/src/app/api/auth/logout/route.ts: FOUND
- apps/dashboard/src/lib/recaptcha.ts: FOUND

Key behavioral truths verified:
- httpOnly: true in login route: FOUND
- ALLOWED_PREFIXES in proxy: FOUND
- cookies.get (cookie injection) in proxy: FOUND
- x-recaptcha-token in api.ts: FOUND
- document.cookie count in auth.ts: 0 (correct)
- useRecaptcha in form-event.tsx: FOUND
- GOOGLE_RECAPTCHA_SECRET_KEY dev bypass: FOUND
