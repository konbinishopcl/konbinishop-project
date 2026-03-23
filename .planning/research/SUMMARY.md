# Research Summary: Konbini Event Publication Platform

**Synthesized:** 2026-03-23
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Synthesizer:** gsd-research-synthesizer

---

## Executive Summary

Konbini is a Chilean event publication platform where organizers pay a single listing fee to publish events. The business model is straightforward — no ticketing, no per-seat commerce — but the technical scope is significant: three payment gateways (Mercado Pago, Stripe, Transbank/Webpay), a moderation workflow, email notifications, search, and a self-serve organizer panel. The existing monorepo (Turborepo, Strapi 5, Next.js 15 dashboard, Nuxt 4 website) already has a skeleton for nearly every feature — CartDefault.vue, SearchDefault.vue, /busqueda stub, /cuenta stub, MJML email infrastructure in waldo-project — and the primary work is connecting these stubs to real backend logic, not building from scratch.

The recommended approach is to treat payment integration as the critical path and everything else as dependent on it. A dedicated `api/payment` module in Strapi (following the existing `stats` custom API pattern) handles all three gateways behind a strategy pattern without forcing a leaky common interface. The event schema gains a `payment_status` enum (7 states) that drives the entire moderation workflow. Email notifications use the established MJML + Mailgun pattern from waldo-project with brand and copy changes only. Search is implemented using Strapi's built-in `$containsi` filters for v1, with Meilisearch as a clear upgrade path once the platform scales. The organizer panel lives inside the existing Next.js 15 dashboard, not as a new app.

The primary risks are security-related and must be resolved before any payment code is written: a CORS wildcard, a JavaScript-readable JWT cookie, and an unrestricted API proxy path-through. The second tier of risk is Transbank-specific: the certification process takes 3–10 business days, the Webpay return URL requires a POST handler (not GET), and test/production credentials are completely separate. These are known, well-documented pitfalls with clear prevention strategies.

---

## Key Findings

### From STACK.md

**Core technology additions confirmed:**

| Package | Rationale |
|---------|-----------|
| `stripe` ^17.x | International cards; Payment Intents API gives SPA-level control |
| `mercadopago` ^2.x | LATAM; class-based API (v1 singleton must not be used) |
| `transbank-sdk` ^4.x | Chile-only; SDK handles HMAC signing; test env fully functional |
| `@strapi/provider-email-mailgun` | Official Strapi provider; stable since v3 |
| `mjml` | Server-side HTML compilation; `mjml-browser` must not be used |
| `strapi-plugin-meilisearch` ^0.13.x | Auto-syncs Strapi collection types; MIT-licensed |
| `qrcode` | Zero-dependency server-side QR generation |

**Key version/compatibility note:** Mercado Pago SDK v2 (2023) has breaking changes from v1. The `strapi-plugin-meilisearch` Strapi 5 compatibility should be verified at install time. All three gateway SDK versions should be confirmed via `npm info [package] version` at install.

**Architecture decision from STACK.md:** No queue broker for MVP. Use `setImmediate` pattern for async webhook processing. BullMQ + Redis is the documented upgrade path if job reliability becomes a concern.

**New environment variables required:** 13 variables across Stripe, Mercado Pago, Transbank, Mailgun, and Meilisearch. These must be added to all deployment environments.

---

### From FEATURES.md

**Confirmed from codebase inspection (HIGH confidence):**

- `CartDefault.vue` already has the payment summary UI and a `handlePayment` stub that saves the event and redirects — no actual payment call exists yet.
- The event schema already has `is_approved`, `is_rejected`, `rejected_reazon`, `expiration_date`, and a `user` relation.
- `/cuenta` is a stub (`<h1>Cuenta</h1>`). All data needed for the organizer panel exists on the schema.
- `SearchDefault.vue` has a complete stub with `// TODO: Implementar búsqueda`. `/busqueda.vue` is an empty page.
- waldo-project has directly reusable MJML templates (`ad-creation-user.mjml`, `ad-approved.mjml`, `ad-rejected.mjml`) that need brand color substitution only.

**MVP feature priority order (business value + pain):**

1. Payment integration — without this, the business model does not function
2. Email notifications — payment is a black box without feedback; low complexity via waldo-project templates
3. Organizer panel — stub exists, all data exists; moderate complexity
4. Search — public discovery is broken; moderate complexity, high public UX impact

**Must-have features for v1:**

| Feature | Trigger/Notes |
|---------|--------------|
| Redirect to gateway (Webpay/MP) + return URL handler | Core payment flow |
| Order summary page (CartDefault.vue) | Skeleton exists |
| Payment confirmation / failure pages | `/anunciar/gracias` stub exists |
| Idempotency / duplicate prevention | DB-level unique constraint on gateway event ID |
| Payment confirmed email | Organizer; after `payment_status = paid` |
| Event submitted email | Organizer; same trigger |
| New event pending moderation email | Admin team |
| Event approved / rejected email | Organizer; from dashboard action |
| Organizer event list with status | `/cuenta/eventos` |
| Event status labels (5 states) | Map boolean flags to readable labels |
| Full-text search + filter by category/region/date | `/busqueda?q=` |

**Defer to v2+:**
- Factura/invoice collection (async after approval, not blocking)
- Event renewal / re-publish (new payment flow for existing events)
- Expiration reminder emails
- Auto-complete search

**Critical flow decision:** The event record must be created BEFORE the payment redirect so the gateway return URL can reference a real `documentId`. The current `handlePayment` timing is correct — it just needs `payment_status` tracking added.

---

### From ARCHITECTURE.md

**Payment logic placement:** Dedicated `apps/strapi/src/api/payment/` module (controllers, services, routes, per-provider signature-verification middlewares). This follows the existing `stats` custom API precedent. Do NOT use lifecycle hooks for payment — they cannot be skipped per-call, cannot return data to callers, and fire on admin operations.

**State machine:** Single `payment_status` enum on the event schema with 7 states:

```
pending_payment → payment_processing → payment_confirmed → pending_approval
                                     → payment_failed    → pending_payment (retry)
pending_approval → approved (terminal)
               → rejected → pending_payment (if re-submission allowed)
```

**Legacy flag migration strategy:** Keep `is_approved` and `is_rejected` in sync during a transition period. Do not remove them in the same step as adding `payment_status` — the stats controller and dashboard both query these flags. A one-time bootstrap script sets `payment_status: 'approved'` for existing approved events.

**Data flow summary:** Website creates event (gets `documentId`) → POSTs to `/api/payment/initiate` → redirected to provider → provider webhooks to `/api/payment/webhook/:provider` → signature middleware validates → idempotency check → state transition → emails triggered → admin sees event in `pending_approval` queue → approve/reject → email to organizer.

**Modified components:**
- New: `api/payment/` (controllers, services, routes, middlewares)
- Modified: `event/schema.json` (add `payment_status`, `payment_provider`, `payment_provider_id`)
- Modified: `stats/controllers/stats.ts` (add payment-aware counts)
- Modified: `CartDefault.vue` (real initiate + redirect instead of fake redirect)
- Modified: `anunciar/gracias.vue` (handle return URL, show payment result)
- Modified: `apps/dashboard` (show `payment_status` badge in event list/detail)

**Strapi 5 API usage:** All new code must use `strapi.documents()` (Document Service API). `strapi.entityService` is deprecated in Strapi 5 — the existing codebase already has this debt noted in CONCERNS.md.

---

### From PITFALLS.md

**Top pitfalls ranked by severity:**

**Critical — Pre-payment security prerequisites (must be fixed FIRST):**

| Pitfall | Risk | Fix |
|---------|------|-----|
| CORS wildcard (`origin: ['*']`) | Any origin can call payment endpoints | Restrict to explicit frontend domains before writing any payment routes |
| JWT stored in JS-readable cookie | XSS becomes financial attack vector | Set `HttpOnly; Secure; SameSite=Strict` server-side before payment routes go live |
| Unrestricted Next.js API proxy | Payment routes immediately exposed through proxy | Add path allowlisting to Next.js proxy before payment routes exist |
| Dashboard role enforcement disabled | Admin payment UI accessible to any user | Re-enable before adding payment management to dashboard |

**Critical — Transbank-specific:**

| Pitfall | Risk | Fix |
|---------|------|-----|
| Webpay return URL sends POST, not GET | `token_ws` is undefined; all payments appear to fail | Nitro `.post.ts` server route; use `readBody()` not query params |
| Commit step is mandatory and non-idempotent | Double-commit marks confirmed payment as failed | DB unique constraint on `token_ws`; look up existing order on double-commit |
| Test vs. production credentials are completely different | Real users charged nothing, or test users charged real money | Startup assertion: throw if `NODE_ENV=production` and integration commerce code detected |
| Transbank certification takes 3–10 business days | Code complete but blocked from going live | Start certification process 2 weeks before target launch date |

**Critical — All gateways:**

| Pitfall | Risk | Fix |
|---------|------|-----|
| Webhook replay without idempotency | Duplicate orders, duplicate emails, double-seat allocation | `payment_events` table with unique constraint on provider event ID; check before processing |
| Mercado Pago webhook payload can be spoofed | Fraudulent payment confirmations | Re-fetch payment from MP API using `data.id`; never trust webhook body status |
| Stripe requires raw body for signature verification | All Stripe webhooks fail validation | `readRawBody()` in Nitro route; do not use `readBody()` |
| Price must come from DB, not client | Buyer can modify amount in DevTools | Server fetches `event.price` by `eventId`; client sends only `eventId` |

**Moderate:**

- Multi-gateway abstraction: strategy pattern, not forced unified interface — the three gateways have fundamentally different flow models
- `strapi.entityService` is deprecated in Strapi 5; all new code must use `strapi.documents()`
- New Strapi custom routes default to public permissions; explicitly configure Authenticated-only access
- Email notifications must be decoupled from webhook response to avoid duplicates on retry

---

## Implications for Roadmap

### Suggested Phase Structure

**Phase 0: Security Hardening (prerequisite — blocks everything else)**

Rationale: Four security issues from CONCERNS.md become critical vulnerabilities the moment payment routes exist. These are non-negotiable prerequisites identified by the pitfalls research. No payment code should be written before this is complete.

Delivers:
- CORS locked to explicit origins
- JWT cookie set HttpOnly/Secure server-side
- Next.js API proxy path allowlisted
- Dashboard role enforcement re-enabled

Pitfalls addressed: 7 (CORS), 11 (JWT), 10 (route permissions), plus proxy path-through from CONCERNS.md.

Research flag: Standard security hardening — no phase research needed.

---

**Phase 1: Payment Integration (critical path)**

Rationale: The business model does not function without this. Everything else (email, organizer panel) depends on `payment_status` existing. The waldo-project provides a direct reference implementation for Transbank/Webpay.

Delivers:
- `api/payment` module in Strapi (initiate, webhook handlers, status)
- `payment_status` enum added to event schema
- Per-provider signature verification middlewares
- Idempotency via `payment_events` collection
- `payment_processing → payment_confirmed → pending_approval` state transitions
- CartDefault.vue wired to real initiate endpoint
- `/anunciar/gracias.vue` handles return URL and shows result
- Webpay return URL as Nitro `.post.ts` server route

Pitfalls addressed: 1–6, 8, 9, 15.
Research flag: NEEDS PHASE RESEARCH — Transbank certification process, MP v2 SDK exact API shape, Strapi 5 Document Service API.

---

**Phase 2: Email Notifications**

Rationale: Low complexity (waldo-project templates are directly reusable), high business value (organizers need feedback after paying). Depends on Phase 1 state transitions as triggers.

Delivers:
- MJML templates: `event-payment-confirmed`, `event-submitted-admin`, `event-approved`, `event-rejected`
- Mailgun provider configured in Strapi
- Email triggers wired to payment state transitions and dashboard approve/reject actions
- Template compilation on boot with variable substitution

Pitfalls addressed: 12 (email decoupled from webhook response via idempotency key).
Research flag: Standard pattern — no phase research needed. Direct waldo-project port.

---

**Phase 3: Organizer Panel**

Rationale: Organizers need to track their submissions. The `/cuenta` stub, all required schema fields, and the Next.js dashboard with existing form components are already in place. Depends on Phase 1 (payment_status field) and Phase 2 (email flow).

Delivers:
- `/cuenta/eventos` — list of organizer's events with 5 payment/moderation status states
- `/cuenta/eventos/[slug]` — event detail/edit (locked once approved)
- `/cuenta/perfil` — name, email, password
- Retry payment flow for `payment_failed` events
- `Organizer` role added via users-permissions

Pitfalls addressed: 10 (role permissions explicitly configured).
Research flag: No phase research needed — all patterns established by Phase 1/2.

---

**Phase 4: Search**

Rationale: Public discovery is fully broken (stub). Independent of payment phases — no blockers. Can be built in parallel if capacity allows, but sequenced last due to its independence.

Delivers:
- `/busqueda` page with text input, category/region/date filters, free/paid toggle
- URL-reflected filter state (`/busqueda?q=&categoria=&region=&desde=&hasta=&libre=`)
- SearchDefault.vue navigates to `/busqueda?q=`
- Strapi `$containsi` filters (no new infrastructure for v1)
- FiltersSearch.vue component
- Empty state reusing EmptyEvents.vue

Pitfalls addressed: None payment-specific — standard Strapi query patterns.
Research flag: No phase research needed. Meilisearch upgrade path documented for v2.

---

### Dependency Graph

```
Phase 0 (Security)
  └── Phase 1 (Payment)
        ├── Phase 2 (Email) — depends on payment_status transitions
        └── Phase 3 (Organizer Panel) — depends on payment_status field + email flow
Phase 4 (Search) — independent, can parallelize with Phase 2/3
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH (Stripe/email/webhooks), MEDIUM (Mercado Pago v2, Meilisearch plugin) | Verify gateway SDK versions at install; confirm strapi-plugin-meilisearch Strapi 5 compat |
| Features | HIGH | Based on direct codebase inspection + waldo-project reference, not assumptions |
| Architecture | HIGH | Direct codebase analysis; patterns match existing `stats` precedent |
| Pitfalls | HIGH (critical pitfalls), MEDIUM (Transbank-specific) | Transbank certification timeline and error codes should be verified at transbankdevelopers.cl |
| Overall | HIGH | Four of five highest-risk areas have HIGH confidence; Transbank is the main uncertainty |

**Gaps to address in planning:**

1. **Transbank certification timeline** — start this process as early as Phase 1 implementation, not after. Verify current process at https://www.transbankdevelopers.cl/documentacion/como_empezar.
2. **Mercado Pago v2 SDK exact import style** — verify class-based API shape at install time (`new MercadoPagoConfig`, `new Payment(client).create()`).
3. **`strapi-plugin-meilisearch` Strapi 5 compatibility** — confirm at https://github.com/meilisearch/strapi-plugin-meilisearch before committing to Meilisearch for v1 search.
4. **Existing event data migration** — bootstrap script needed to set `payment_status: 'approved'` for all events where `is_approved: true` before Phase 1 deploys.
5. **One-price model confirmed** — all research assumes a single fixed listing price. If the business adds variable pricing tiers, the payment abstraction layer needs to accommodate multiple price points.

---

## Sources Aggregated

- Direct codebase inspection: `CartDefault.vue`, `event/schema.json`, `create.store.ts`, `stats` controller, `middlewares/`, `index.ts` (HIGH confidence)
- waldo-project: MJML templates, `IPaymentGateway` abstraction, Transbank implementation (HIGH confidence)
- `.planning/codebase/CONCERNS.md` — known security issues and API concerns (HIGH confidence)
- `.planning/PROJECT.md` — validated requirements (HIGH confidence)
- Strapi 5 documentation patterns (training data, cutoff August 2025)
- Stripe Node.js SDK: https://github.com/stripe/stripe-node
- Mercado Pago SDK v2 migration guide (training data)
- Transbank developer docs: https://www.transbankdevelopers.cl
- MJML docs: https://mjml.io/documentation
- `strapi-plugin-meilisearch`: https://github.com/meilisearch/strapi-plugin-meilisearch
- `@strapi/provider-email-mailgun`: https://www.npmjs.com/package/@strapi/provider-email-mailgun

**Note on research limitations:** WebSearch and WebFetch were unavailable during all four research sessions. All findings are based on direct codebase analysis (HIGH confidence) and training data (cutoff August 2025). Verify gateway SDK versions and Transbank certification process details against live documentation before implementation.
