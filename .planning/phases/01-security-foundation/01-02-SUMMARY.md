---
phase: 01-security-foundation
plan: 02
subsystem: api
tags: [nuxt, nitro, proxy, recaptcha, strapi, server-middleware]

# Dependency graph
requires: []
provides:
  - Nitro catch-all proxy at server/api/[...].ts that forwards all /api/* requests to Strapi
  - reCAPTCHA v3 server-side verification utility with dev bypass when RECAPTCHA_SECRET_KEY is unset
  - Browser-facing API surface is now localhost:3000/api/* (not Strapi directly)
affects: [02-payment-schema, 03-transbank, 04-mercadopago-stripe, payment forms, event creation flow]

# Tech tracking
tech-stack:
  added: []
  patterns: [Nitro catch-all proxy pattern, reCAPTCHA opt-in via env var, header whitelist forwarding]

key-files:
  created:
    - apps/website/server/api/[...].ts
    - apps/website/server/utils/recaptcha.ts
  modified:
    - apps/website/nuxt.config.ts

key-decisions:
  - "reCAPTCHA is enforced at the Nuxt proxy layer, not in Strapi — proxy owns validation, Strapi stays clean"
  - "Dev bypass via empty RECAPTCHA_SECRET_KEY prevents breaking existing forms before client-side token wiring"
  - "strapi.url points to localhost:3000 (loopback through proxy) — suboptimal but functional and matches waldo-project pattern"
  - "No OAuth routes in proxy — konbini does not use social login"

patterns-established:
  - "Proxy pattern: all browser API calls go through Nuxt server, never directly to Strapi"
  - "reCAPTCHA opt-in: empty secretKey = warn + pass through; configured secretKey = enforce on POST/PUT/DELETE"
  - "Header whitelist: proxy forwards only Authorization, Content-Type, Cookie — no other headers pass to Strapi"

requirements-completed: [SEC-05, SEC-06, SEC-08]

# Metrics
duration: 1min
completed: 2026-03-23
---

# Phase 1 Plan 02: Nuxt Server Proxy + reCAPTCHA Summary

**Nitro catch-all proxy routing all browser API calls through localhost:3000/api/* with reCAPTCHA v3 enforcement on POST/PUT/DELETE via RECAPTCHA_SECRET_KEY env var**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-23T04:38:03Z
- **Completed:** 2026-03-23T04:39:36Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Browser-side API traffic now proxied through Nuxt server — Strapi URL never exposed to browser (SEC-05)
- POST/PUT/DELETE requests validated with reCAPTCHA v3 when RECAPTCHA_SECRET_KEY is configured (SEC-06)
- Dev bypass prevents breaking existing Vue forms before client-side reCAPTCHA token generation is wired in
- Strapi has zero reCAPTCHA configuration — all responsibility delegated to the proxy (SEC-08)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Nuxt server proxy and reCAPTCHA utility** - `fbe8c15` (feat)
2. **Task 2: Reconfigure nuxt.config.ts to route through proxy** - `5ce866d` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified

- `apps/website/server/api/[...].ts` - Nitro catch-all proxy; validates reCAPTCHA then forwards to Strapi via proxyRequest
- `apps/website/server/utils/recaptcha.ts` - reCAPTCHA v3 verification utility with dev bypass and isRecaptchaProtectedRoute helper
- `apps/website/nuxt.config.ts` - strapi.url changed to localhost:3000; recaptchaSecretKey, strapiUrl (server), recaptchaSiteKey (public) added to runtimeConfig

## Decisions Made

- reCAPTCHA enforcement lives in the Nuxt proxy, not Strapi. This keeps Strapi clean and centralizes request filtering at the server boundary.
- Empty `RECAPTCHA_SECRET_KEY` triggers a warn-and-pass-through behavior. This prevents breaking the existing multi-step event form (CartDefault.vue etc.) that does not yet send `x-recaptcha-token`. The plan explicitly called for this dev bypass.
- `strapi.url` set to `localhost:3000` (via `BASE_URL` env). Both SSR and client-side `@nuxtjs/strapi` calls loop through the proxy — suboptimal for SSR latency but functionally correct and consistent with the waldo-project reference.
- No OAuth proxy routes added — konbini does not use social login (explicitly out of scope).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all verification checks passed on first run.

## User Setup Required

To enable reCAPTCHA enforcement in production, add to `.env`:

```
RECAPTCHA_SECRET_KEY=<your-v3-secret-key>
RECAPTCHA_SITE_KEY=<your-v3-site-key>
BASE_URL=https://yoursite.com
```

Without `RECAPTCHA_SECRET_KEY`, the proxy operates in dev bypass mode (warns and passes through). This is intentional — wiring client-side token generation into Vue forms is a future task.

## Next Phase Readiness

- Proxy is ready to accept reCAPTCHA tokens from client forms once `RECAPTCHA_SITE_KEY` is used in Vue components
- All browser API requests now go through localhost:3000/api/* — correct foundation for payment flow endpoints in Phase 2+
- SEC-05, SEC-06, SEC-08 satisfied

---
*Phase: 01-security-foundation*
*Completed: 2026-03-23*
