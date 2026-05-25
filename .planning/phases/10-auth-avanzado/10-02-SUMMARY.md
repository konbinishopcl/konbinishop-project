---
plan: "10-02"
phase: 10
subsystem: auth
tags: [google-oauth, onboarding, jwt, guard, dto]
dependency_graph:
  requires: ["10-01"]
  provides: ["google-onboarding-flow"]
  affects: ["auth.service", "auth.controller"]
tech_stack:
  added: []
  patterns: ["pending-token guard", "isNew detection on upsert", "validation-only onboarding"]
key_files:
  created:
    - apps/api/src/auth/dto/google-onboarding.dto.ts
    - apps/api/src/auth/onboarding.guard.ts
  modified:
    - apps/api/src/auth/auth.service.ts
    - apps/api/src/auth/auth.controller.ts
decisions:
  - "TODO Phase 13 (not 11) — countryId/acceptedTerms persistencia diferida; Phase 10 solo valida entrada y emite JWT"
  - "isNew detectado en upsertGoogleUser: creación nueva = isNew:true; encontrado por googleId o email = isNew:false"
  - "onboardingToken con 30min expiración (doble que twoFaPending de 15min)"
metrics:
  duration_seconds: 131
  completed_date: "2026-05-25"
  tasks_completed: 5
  files_changed: 4
---

# Phase 10 Plan 02: Google OAuth Onboarding Summary

**One-liner:** Google OAuth distingue usuario nuevo de existente — nuevo recibe onboardingToken (30min, onboardingPending:true) y completa país + T&C en POST /auth/google/onboarding antes del JWT definitivo.

## What Was Built

Extended the Google OAuth flow in NestJS to handle new vs. existing users differently. New Google users now receive a short-lived `onboardingToken` instead of an immediate session JWT. They must call `POST /auth/google/onboarding` with `{ countryId, acceptedTerms: true }`, which validates the country FK and terms acceptance, then emits the definitive JWT.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | GoogleOnboardingDto | 010445a | apps/api/src/auth/dto/google-onboarding.dto.ts |
| 2 | OnboardingGuard | 84c0d08 | apps/api/src/auth/onboarding.guard.ts |
| 3 | AuthService — upsert isNew + helpers + methods | d465986 | apps/api/src/auth/auth.service.ts |
| 4 | Controller endpoint POST /auth/google/onboarding | 9469628 | apps/api/src/auth/auth.controller.ts |
| 5 | Final tsc --noEmit verification | — | (gate: 0 errors) |

## Behavior After This Plan

- `POST /auth/google` with **existing** user → `{ token, user }` (unchanged)
- `POST /auth/google` with **new** user → `{ onboardingToken, onboardingRequired: true }`
- `POST /auth/google/onetap` — same distinction
- `POST /auth/google/onboarding` with `Authorization: Bearer <onboardingToken>` + `{ countryId, acceptedTerms: true }` → `{ token, user }` definitivo
- `acceptedTerms !== true` → 400 Bad Request
- `countryId` not in DB → 400 Bad Request
- onboardingToken expiry (30min) or missing `onboardingPending` claim → 401 from OnboardingGuard
- onboardingToken used on regular endpoints → 401 from JwtAuthGuard (already blocks `onboardingPending`)

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- The plan's prose Context mentioned "TODO Phase 11" but key_context explicitly deferred to Phase 13. The code comment and this summary use Phase 13.
- JwtAuthGuard already rejected `onboardingPending` tokens (from Phase 10-01 forward-looking design). No additional changes needed.

## Known Stubs

- `googleOnboarding()` validates countryId FK and acceptedTerms but does NOT persist them to User model (no schema columns). This is intentional and documented with `TODO Phase 13` in the method comment. The JWT is emitted regardless, allowing the frontend to continue the flow. Phase 13 will add the migration and persistence.

## Self-Check: PASSED
