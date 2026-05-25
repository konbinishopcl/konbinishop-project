---
phase: 10-auth-avanzado
verified: 2026-05-24T18:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Login → pendingToken → 2FA verify → JWT definitivo"
    expected: "POST /auth/login returns pendingToken; POST /auth/2fa/verify with correct 6-digit code and pendingToken returns { token, user }"
    why_human: "Requires live Mailgun delivery of the 6-digit code to an actual inbox"
  - test: "Google OAuth nuevo usuario → onboardingToken → onboarding → JWT"
    expected: "POST /auth/google with a new Google accessToken returns { onboardingToken, onboardingRequired: true }; POST /auth/google/onboarding with that token + valid countryId + acceptedTerms: true returns { token, user }"
    why_human: "Requires a real Google accessToken pointing to an email not in the DB"
  - test: "Google OAuth usuario existente → JWT directo sin onboarding"
    expected: "POST /auth/google with an accessToken for an email already in the DB returns { token, user } without onboardingToken"
    why_human: "Requires a real Google accessToken for an existing user"
  - test: "POST /auth/change-email/request → email enviado → confirm → email actualizado"
    expected: "Authenticated user posts { newEmail }; receives confirmation email at newEmail; POSTs the token to /auth/change-email/confirm; user.email is updated to newEmail"
    why_human: "Requires live Mailgun delivery and database inspection to confirm email was updated"
  - test: "pendingToken rechazado en endpoints normales"
    expected: "GET /auth/me with a pendingToken (twoFaPending:true) returns 401"
    why_human: "Integration test requiring a real pendingToken signed with the running server's JWT_SECRET"
---

# Phase 10: Auth avanzado — Verification Report

**Phase Goal:** Completar el módulo auth con 2FA por email, Google OAuth onboarding para nuevos usuarios, y endpoints de cambio de email
**Verified:** 2026-05-24T18:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                  | Status     | Evidence                                                                                             |
| --- | -------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| 1   | login() y register() devuelven pendingToken (no JWT definitivo)                        | VERIFIED   | auth.service.ts lines 125, 135: both return `{ pendingToken: this.sign2FaPending(user), twoFaRequired: true }` |
| 2   | POST /auth/2fa/verify y POST /auth/2fa/resend existen y usan TwoFaGuard                | VERIFIED   | auth.controller.ts lines 37–51; TwoFaGuard checks `twoFaPending === true`                           |
| 3   | Google OAuth distingue nuevo/existente; nuevo recibe onboardingToken                   | VERIFIED   | auth.service.ts lines 182–208: `isNew` branch returns `{ onboardingToken, onboardingRequired: true }` |
| 4   | POST /auth/google/onboarding emite JWT definitivo tras validar country y T&C           | VERIFIED   | auth.service.ts lines 311–323; auth.controller.ts line 65–71 with OnboardingGuard                   |
| 5   | POST /auth/change-email/request + /confirm implementados con SHA-256 y expiración 24h  | VERIFIED   | auth.service.ts lines 329–389; migration 20260525014932_sch07_email_change applied                   |

**Score: 5/5 truths verified**

---

### Required Artifacts

| Artifact                                              | Expected                                           | Status     | Details                                                      |
| ----------------------------------------------------- | -------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| `apps/api/src/auth/auth.service.ts`                   | verifyTwoFa, resendTwoFa, googleOnboarding, requestEmailChange, confirmEmailChange | VERIFIED | All 5 methods present and substantive (lines 276–389)       |
| `apps/api/src/auth/auth.controller.ts`                | 5 new endpoints wired to service                   | VERIFIED   | All endpoints present: 2fa/verify, 2fa/resend, google/onboarding, change-email/request, change-email/confirm |
| `apps/api/src/auth/jwt-auth.guard.ts`                 | Rejects twoFaPending and onboardingPending tokens  | VERIFIED   | Lines 32–34: explicit check throws 401 for pending tokens   |
| `apps/api/src/auth/two-fa.guard.ts`                   | Accepts only twoFaPending tokens                   | VERIFIED   | Lines 29–31: checks `payload.twoFaPending` required true     |
| `apps/api/src/auth/onboarding.guard.ts`               | Accepts only onboardingPending tokens              | VERIFIED   | Lines 31–33: checks `payload.onboardingPending` required true |
| `apps/api/src/auth/dto/verify-2fa.dto.ts`             | 6-digit code DTO                                   | VERIFIED   | IsString + Length(6,6) + Matches(/^\d{6}$/)                 |
| `apps/api/src/auth/dto/google-onboarding.dto.ts`      | countryId + acceptedTerms DTO                      | VERIFIED   | IsInt + IsPositive; IsBoolean + Equals(true)                |
| `apps/api/src/auth/dto/change-email-request.dto.ts`   | newEmail DTO                                       | VERIFIED   | IsEmail validator                                           |
| `apps/api/src/auth/dto/change-email-confirm.dto.ts`   | token DTO                                          | VERIFIED   | IsString + MinLength(32)                                    |
| `apps/api/services/mailgun/mail.service.ts`           | sendTwoFactorCode(), sendEmailChangeConfirmation() | VERIFIED   | Lines 97–105 present and wired to templates                 |
| `apps/api/utils/templates/mail.templates.ts`          | twoFactorCodeTemplate(), emailChangeTemplate()     | VERIFIED   | Lines 294–316 present with full MJML rendering              |
| `apps/api/prisma/migrations/…_sch07_email_change`     | pendingEmail, emailChangeToken, emailChangeTokenExpiry added | VERIFIED | Migration 20260525014932_sch07_email_change applied; `pnpm prisma migrate status` = up to date |
| `apps/api/prisma/schema.prisma` (User fields)         | Three new nullable fields on User                  | VERIFIED   | Lines 396–399 confirm fields present                         |

---

### Key Link Verification

| From                        | To                               | Via                              | Status  | Details                                                                             |
| --------------------------- | -------------------------------- | -------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `auth.controller.ts`        | `auth.service.verifyTwoFa()`     | `@UseGuards(TwoFaGuard)` + body  | WIRED   | Controller line 42 calls `this.auth.verifyTwoFa(user.sub, dto.code)`               |
| `auth.controller.ts`        | `auth.service.resendTwoFa()`     | `@UseGuards(TwoFaGuard)`         | WIRED   | Controller line 50 calls `this.auth.resendTwoFa(user.sub)`                          |
| `auth.controller.ts`        | `auth.service.googleOnboarding()`| `@UseGuards(OnboardingGuard)`    | WIRED   | Controller line 70 calls `this.auth.googleOnboarding(user.sub, ...)`                |
| `auth.controller.ts`        | `auth.service.requestEmailChange()` | `@UseGuards(JwtAuthGuard)`    | WIRED   | Controller line 106 calls `this.auth.requestEmailChange(user.sub, dto.newEmail)`    |
| `auth.controller.ts`        | `auth.service.confirmEmailChange()` | public (no guard)             | WIRED   | Controller line 111 calls `this.auth.confirmEmailChange(dto.token)`                 |
| `auth.service.issueTwoFaCode()` | `mail.service.sendTwoFactorCode()` | direct call                 | WIRED   | auth.service.ts line 61 calls `this.mail.sendTwoFactorCode(user.email, code)`       |
| `auth.service.requestEmailChange()` | `mail.service.sendEmailChangeConfirmation()` | direct call  | WIRED   | auth.service.ts line 350 calls `this.mail.sendEmailChangeConfirmation(newEmail, ...)` |
| `mail.service.ts`           | `twoFactorCodeTemplate()`        | import + direct call             | WIRED   | mail.service.ts line 18 imports it; line 98 calls it                                |
| `mail.service.ts`           | `emailChangeTemplate()`          | import + direct call             | WIRED   | mail.service.ts line 19 imports it; line 103 calls it                               |
| Prisma User model           | emailChangeToken/pendingEmail fields | migration + schema update    | WIRED   | auth.service.ts lines 343–346 write to pendingEmail, emailChangeToken, emailChangeTokenExpiry |

---

### TypeScript Compilation

`pnpm tsc --noEmit` in `apps/api` — **exits with no output (clean, zero errors).**

---

### Requirements Coverage

The prompt specified requirement IDs AUTH-01, AUTH-02, AUTH-03. The ROADMAP.md Phase 10 uses a different ID space than REQUIREMENTS.md:

| ROADMAP Phase 10 ID | Description                            | Status    | Evidence                                                    |
| ------------------- | -------------------------------------- | --------- | ----------------------------------------------------------- |
| AUTH-01             | 2FA por email (verify + resend)        | SATISFIED | login/register emit pendingToken; /auth/2fa/verify + /resend implemented |
| AUTH-02             | Google OAuth flow                      | SATISFIED | googleAuth() and googleOneTap() distinguish new vs existing users |
| AUTH-03             | Google onboarding                      | SATISFIED | /auth/google/onboarding endpoint with OnboardingGuard emits definitive JWT |
| AUTH-04             | Change email/password                  | SATISFIED | /auth/change-email/request + /confirm implemented; changePassword pre-existed |

**ID namespace note:** REQUIREMENTS.md also defines `AUTH-01/02/03`, but in that file those IDs refer to the basic auth work completed in prior phases (JWT endpoints, roles, CRUD). The ROADMAP.md Phase 10 reuses AUTH-01 through AUTH-04 to describe the advanced auth features of this phase. This is a naming collision in the planning docs but does not reflect missing implementation — both the basic auth requirements and the Phase 10 advanced auth features are fully implemented.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `auth.service.ts` | 308 | `TODO Phase 13: persistir countryId y acceptedTerms en el modelo User` | INFO | By design — documented decision in 10-02-PLAN.md. onboarding validates input and emits JWT but does not persist country/terms (no schema fields yet). The endpoint works; persistence is deferred. Not a blocker. |
| `auth.module.ts` | 22 | `TwoFaGuard` and `OnboardingGuard` not listed in `providers[]` | WARNING | Both guards are `@Injectable()` with `JwtService` as constructor dep. They are used exclusively within `AuthController` (same module), and `JwtModule` is imported in `AuthModule` — so NestJS resolves them from the module's DI scope at request time. However, the established project pattern (JwtAuthGuard, OrgContextGuard) is to register guards explicitly. If a future refactor moves these guards to a cross-module context, they will break. Recommend adding `TwoFaGuard` and `OnboardingGuard` to `auth.module.ts` providers. |

---

### Human Verification Required

#### 1. End-to-end 2FA flow

**Test:** POST /auth/login with valid credentials → inspect response for `pendingToken` → check email inbox for 6-digit code → POST /auth/2fa/verify with `Authorization: Bearer <pendingToken>` + `{ "code": "<received-code>" }` → expect `{ token, user }`
**Expected:** Definitive JWT issued; inbox received exactly one email with a styled code block
**Why human:** Mailgun delivery is an external service; code correctness requires real inbox access

#### 2. POST /auth/2fa/resend

**Test:** With a pendingToken, POST /auth/2fa/resend → expect `{ ok: true }` + new email in inbox
**Expected:** New 6-digit code sent; old code invalidated (old code returns 401 after resend)
**Why human:** Requires live email delivery and timing-sensitive comparison of old vs new codes

#### 3. Google OAuth new user → onboarding token → JWT

**Test:** POST /auth/google with a Google accessToken for an email not in DB → expect `{ onboardingToken, onboardingRequired: true }` → POST /auth/google/onboarding with `Authorization: Bearer <onboardingToken>` + `{ "countryId": 1, "acceptedTerms": true }` → expect `{ token, user }`
**Expected:** Definitive JWT issued; no 2FA required for Google users
**Why human:** Requires a real Google accessToken and a Country record with id=1 in the DB

#### 4. Google OAuth existing user → direct JWT

**Test:** POST /auth/google with a Google accessToken for an email already in the DB
**Expected:** Returns `{ token, user }` directly — no onboardingToken, no pendingToken
**Why human:** Requires a real Google accessToken linked to an existing account

#### 5. Change email end-to-end

**Test:** GET /auth/me to confirm current email → POST /auth/change-email/request with JWT + `{ "newEmail": "another@example.com" }` → check new inbox for confirmation link → POST /auth/change-email/confirm with extracted token → GET /auth/me again
**Expected:** `{ ok: true }` on both posts; final GET /auth/me shows updated email
**Why human:** Requires Mailgun delivery and DB state inspection

#### 6. pendingToken rejected by JwtAuthGuard

**Test:** GET /auth/me with `Authorization: Bearer <pendingToken>` (a token with `twoFaPending: true`)
**Expected:** 401 Unauthorized with message "Token pendiente no válido para esta operación"
**Why human:** Requires a real signed pendingToken from a fresh login

---

### Gaps Summary

No blocking gaps found. All five observable truths are verified with substantive, wired implementations. TypeScript compiles clean. The Prisma migration is applied and the schema fields are in place.

Two non-blocking observations:

1. **Deferred persistence in googleOnboarding** — `countryId` and `acceptedTerms` are validated but not persisted (no schema fields). This is an intentional, documented design decision logged as `TODO Phase 13`. The UAT only requires the endpoint to issue a JWT, which it does.

2. **Guards not in providers[]** — `TwoFaGuard` and `OnboardingGuard` are `@Injectable()` but not registered in `auth.module.ts`. Since they are only used within `AuthController` (co-located in `AuthModule`), NestJS resolves `JwtService` from the module scope at request time. This works in the current single-module usage but violates the project's established guard registration pattern. Recommended fix: add both to `providers` and `exports` in `auth.module.ts`.

3. **ID namespace collision in planning docs** — REQUIREMENTS.md and ROADMAP.md both use AUTH-01/02/03 but for different things. Not a code issue; a documentation consistency issue.

---

_Verified: 2026-05-24T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
