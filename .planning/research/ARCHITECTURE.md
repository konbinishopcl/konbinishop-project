# Architecture Patterns: Payment Integration in Strapi 5 Monorepo

**Domain:** Payment-gated event publishing workflow
**Researched:** 2026-03-23
**Overall confidence:** HIGH (based on direct codebase analysis + well-established Strapi 5 and payment integration patterns)

---

## Context: What the Codebase Already Does

Before recommending anything, it is critical to understand the existing shape:

- `apps/strapi/src/api/event/` — pure factory pattern. Controller, service, and router are all single-line `createCoreController/Service/Router` calls. Zero custom logic.
- `apps/strapi/src/api/stats/` — the only custom controller in the project. Shows the team already knows how to write a standalone route with a custom handler (`routes` array format + plain export default object).
- `apps/strapi/src/middlewares/` — two Koa-style middlewares exist. They follow the `(config, { strapi }) => async (ctx, next) => {}` signature correctly.
- `apps/strapi/src/index.ts` — `register()` is empty, `bootstrap()` runs seeders. This is where app-level singleton services (e.g. a payment service) should be registered.
- `apps/website/components/CartDefault.vue` — the payment UI already exists. Currently `handlePayment` saves the event to Strapi and redirects to `/anuncios/gracias` — **there is no actual payment call yet**. The commented-out `<p>Pagarás usando Flow</p>` block and logos (Webpay, Onepay, Khipu, MACH) confirm Transbank/Flow was the original intent.
- The current event `schema.json` has `is_approved: boolean` and `is_rejected: boolean` as separate flags. There is no `payment_status` field today.

---

## Focus 1: Where to Handle Payment Logic in Strapi 5

### Recommendation: Dedicated `payment` API with a custom service, not lifecycle hooks

**Confidence: HIGH**

**Do NOT use lifecycle hooks (`beforeCreate`, `afterCreate`) for payment logic.** Lifecycle hooks fire on every create/update, cannot be disabled per-call, cannot return data to the caller, and have no way to conditionally skip. Using them for payment would make every event save attempt trigger payment initialization, which breaks admin-created events, seeder events, and future programmatic creates.

**Do NOT put payment logic in the existing `event` controller.** The event controller is currently a pure factory. Adding payment logic there conflates content management with payment processing. When payment providers change or need debugging, you don't want to touch the event CRUD layer.

**Use the `stats` controller as your architectural reference.** It shows the pattern: a new API directory (`apps/strapi/src/api/payment/`) with a plain routes array, a custom controller object, and a service. This is the established pattern in this codebase.

### Structure to Build

```
apps/strapi/src/api/payment/
  controllers/payment.ts     — HTTP handlers: initiate, webhook, status
  services/payment.ts        — Business logic, provider abstraction, state transitions
  routes/payment.ts          — Custom routes array (same pattern as stats)
```

**The payment service** is the core piece. It should be registered on the strapi instance and be callable from anywhere (webhook controller, event lifecycle if you ever need it, admin actions). Register it in `apps/strapi/src/index.ts` `register()` hook:

```typescript
// apps/strapi/src/index.ts
register({ strapi }) {
  // Makes strapi.service('api::payment.payment') available everywhere
}
```

The service handles:
1. Creating a payment session with the chosen provider
2. Receiving and verifying webhook payloads
3. Transitioning event `payment_status` based on webhook outcome
4. Triggering email notifications after state changes

**The payment controller** handles HTTP concerns only:
- `POST /api/payment/initiate` — authenticated, receives `eventDocumentId`, delegates to service
- `POST /api/payment/webhook/stripe` — public (no auth), raw body required for signature verification
- `POST /api/payment/webhook/mercadopago` — public
- `POST /api/payment/webhook/transbank` — public
- `GET /api/payment/status/:eventDocumentId` — authenticated, returns current payment state

### Why Not a Strapi Plugin?

A plugin is appropriate when you're building reusable, independently deployable functionality. For a payment integration tightly coupled to the `event` content-type and the existing user model, a plugin adds indirection (plugin service resolution, plugin-specific config) without benefit. The `stats` custom API precedent shows the team prefers simple API extensions over plugins.

---

## Focus 2: Webhook Handling for Multiple Payment Gateways

### Recommendation: Provider-specific routes + unified internal handler

**Confidence: HIGH** (these are industry-standard patterns, not Strapi-specific)

### Signature Verification

Each provider signs webhooks differently. Verification MUST happen before any payload processing:

| Provider | Mechanism | Header |
|---|---|---|
| Stripe | HMAC-SHA256 of raw body + timestamp | `stripe-signature` |
| Mercado Pago | `x-signature` header with HMAC-SHA256 | `x-signature` + `x-request-id` |
| Transbank / Flow | MD5 or SHA256 of concatenated params + secret | varies by product |

**Critical Strapi 5 constraint:** Strapi's body parser runs before your controller and parses JSON by default. For Stripe, you need the **raw** request body (a Buffer) to verify the signature. Strapi 5 (Koa-based) exposes `ctx.request.rawBody` — but only if you configure the body parser to preserve it. You must add middleware or configure `body.includeUnparsed: true` in `apps/strapi/config/middlewares.ts`.

Each webhook route should have its own middleware that:
1. Reads the raw body
2. Verifies the provider-specific signature
3. Rejects with `401` on failure before any business logic runs
4. Passes a verified, typed payload to the controller

### Idempotency

Payment webhooks are delivered at-least-once. Stripe, Mercado Pago, and Transbank all retry on failure. You must deduplicate.

**Recommendation: Add a `payment_transactions` collection type** (or a simple table via Strapi's `strapi.db.connection` raw query) that stores processed webhook event IDs. Before processing any webhook:

```
1. Extract provider event ID (e.g. Stripe's evt_xxx, MP's payment id)
2. Check if this ID already exists in payment_transactions
3. If yes: return 200 immediately (idempotent ack)
4. If no: process, then insert the ID
```

This collection also serves as an audit log (timestamp, provider, event type, outcome, linked event documentId).

### Route Configuration

Webhook routes must be **unauthenticated** (payment providers cannot provide a JWT), but they must NOT be open to arbitrary callers — signature verification IS the authentication. In Strapi 5 route config:

```typescript
{
  method: 'POST',
  path: '/payment/webhook/stripe',
  handler: 'payment.stripeWebhook',
  config: {
    auth: false,          // disable JWT auth
    policies: [],
    middlewares: ['api::payment.verify-stripe-signature'],
  }
}
```

### Flow / Transbank Note

Flow is the Chilean aggregator that wraps Transbank (Webpay Plus) and also supports Khipu and MACH — this matches the commented-out logos in `CartDefault.vue`. Flow's webhook pattern is a `POST` to your `return_url` with a `token` parameter. The integration is: (1) create order via Flow API, (2) redirect user to Flow payment page, (3) Flow POSTs back to your `return_url` with the token, (4) you call Flow API with the token to confirm the payment. This is different from Stripe's pure webhook model — it requires a redirect flow and a confirmation API call.

---

## Focus 3: State Machine for Event Lifecycle

### Recommendation: Single `payment_status` enum field on the event, no external state machine library

**Confidence: HIGH**

### The State Enum

Add a single `payment_status` field to the event schema:

```json
"payment_status": {
  "type": "enumeration",
  "enum": [
    "pending_payment",
    "payment_processing",
    "payment_confirmed",
    "payment_failed",
    "pending_approval",
    "approved",
    "rejected"
  ],
  "default": "pending_payment",
  "required": true
}
```

**Do NOT replace `is_approved` and `is_rejected` with `payment_status` in one step.** The dashboard currently queries `is_approved: false, is_rejected: false` to show pending events (confirmed in `stats` controller). Replacing those flags breaks the stats controller and the dashboard's event filtering immediately. Migrate incrementally: add `payment_status`, keep `is_approved`/`is_rejected` in sync during a transition period, then remove the old flags.

### Valid Transitions

```
pending_payment
  → payment_processing   (user initiates payment, provider session created)
  → payment_failed       (webhook: failure / expiry with no completion)

payment_processing
  → payment_confirmed    (webhook: success confirmed)
  → payment_failed       (webhook: declined / timeout)

payment_confirmed
  → pending_approval     (automatic, triggered immediately after payment_confirmed)

pending_approval
  → approved             (dashboard moderator action)
  → rejected             (dashboard moderator action, sets rejection reason)

approved
  → (terminal state for payment flow; expiration_date handles archival)

rejected
  → pending_payment      (if re-submission is allowed — optional, explicit)
payment_failed
  → pending_payment      (user retries)
```

### Implementation: Guard Function in the Payment Service

No need for `xstate` or similar libraries at this scale. A guard function in `apps/strapi/src/api/payment/services/payment.ts`:

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending_payment:    ['payment_processing'],
  payment_processing: ['payment_confirmed', 'payment_failed'],
  payment_confirmed:  ['pending_approval'],
  pending_approval:   ['approved', 'rejected'],
  approved:           [],
  rejected:           ['pending_payment'],
  payment_failed:     ['pending_payment'],
};

async function transitionEvent(documentId: string, toState: string) {
  const event = await strapi.documents('api::event.event').findOne({ documentId });
  const allowed = VALID_TRANSITIONS[event.payment_status] ?? [];
  if (!allowed.includes(toState)) {
    throw new Error(`Invalid transition: ${event.payment_status} → ${toState}`);
  }
  // Keep legacy flags in sync
  const patch: Record<string, unknown> = { payment_status: toState };
  if (toState === 'approved') patch.is_approved = true;
  if (toState === 'rejected') patch.is_rejected = true;
  if (toState === 'pending_payment' || toState === 'payment_processing') {
    patch.is_approved = false;
    patch.is_rejected = false;
  }
  await strapi.documents('api::event.event').update({ documentId, data: patch });
}
```

This function is called by the webhook handler after confirming payment, and by the dashboard moderation endpoints after approve/reject actions.

### Stats Controller Impact

The stats controller queries `is_approved` and `is_rejected` directly. It counts `eventPendingCount` as `is_approved: false, is_rejected: false`. After adding `payment_status`, "pending" events will include events in `pending_payment`, `payment_processing`, and `pending_approval` states — these are conceptually different queues. The stats controller should be updated to add payment-aware counts:

```
pending_payment:   waiting to pay
pending_approval:  paid, waiting moderation
approved + active: live on site
```

---

## Focus 4: Extending the Event Content-Type Without Breaking Existing Functionality

### Recommendation: Additive schema changes only; sync legacy flags; use Strapi migrations for the enum

**Confidence: HIGH**

### What "Breaking" Means Here

Existing code that reads events will receive new fields it doesn't know about — this is safe (JSON is additive). Breaking occurs when:
- Required fields are added without defaults (existing rows get null, validation fails)
- Existing fields are removed or renamed (dashboard TypeScript types break)
- Enum fields change names of existing values (data migration needed)

### Safe Additions to `schema.json`

```json
"payment_status": {
  "type": "enumeration",
  "enum": ["pending_payment", "payment_processing", "payment_confirmed",
           "payment_failed", "pending_approval", "approved", "rejected"],
  "default": "pending_payment",
  "required": true
},
"payment_provider": {
  "type": "enumeration",
  "enum": ["stripe", "mercadopago", "transbank_flow"],
  "required": false
},
"payment_provider_id": {
  "type": "string",
  "required": false
}
```

All new fields have either a `default` value or `required: false`. Existing rows will get `pending_payment` for `payment_status` automatically, which is semantically wrong for already-approved events — but the sync logic in `transitionEvent` will keep `is_approved` as the source of truth during the transition period. A one-time data migration script (run in `bootstrap()` guarded by an env flag) can set `payment_status: 'approved'` for all events where `is_approved: true`.

### Dashboard TypeScript Types

The dashboard's `Event` interface (visible in `/apps/dashboard/src/app/dashboard/events/[documentId]/page.tsx`) is manually maintained — it is not auto-generated from Strapi schemas. You must manually add `payment_status` and related fields to the dashboard's type definitions. This is a documentation/coordination concern, not a breaking change at the API level.

### The `StrapiAPI` Class

`StrapiAPI` uses static methods and a generic `makeRequest()`. Adding new methods for payment-related endpoints (e.g. `StrapiAPI.getEventPaymentStatus(documentId)`) follows the same pattern without touching any existing methods.

### Website `event.store.ts` / `create.store.ts`

The current `handlePayment` in `CartDefault.vue` does:
1. Prepares event data from `createStore.form`
2. Calls `eventStore.saveEvent()` (POST to `/api/events`)
3. Resets form, redirects to `/anuncios/gracias`

After payment integration, step 2 must become:
1. POST to `/api/events` → get back `documentId`
2. POST to `/api/payment/initiate` with `documentId` → get back provider redirect URL
3. Redirect user to provider payment page

The form reset and success redirect must move to the post-webhook confirmation page, not happen immediately after initiating payment. The `/anunciar/gracias` page currently exists but is empty — it becomes the landing page for the redirect from the payment provider.

---

## Component Boundaries for Payment Integration

| Component | Responsibility | New or Modified |
|---|---|---|
| `apps/strapi/src/api/payment/services/payment.ts` | Provider abstraction, state transitions, idempotency checks, email triggers | New |
| `apps/strapi/src/api/payment/controllers/payment.ts` | HTTP layer: initiate, webhook handlers, status query | New |
| `apps/strapi/src/api/payment/routes/payment.ts` | Route declarations, auth config, signature verification middleware assignment | New |
| `apps/strapi/src/api/payment/middlewares/verify-*.ts` | Per-provider raw body signature verification | New |
| `apps/strapi/src/api/event/content-types/event/schema.json` | Add `payment_status`, `payment_provider`, `payment_provider_id` fields | Modified |
| `apps/strapi/src/api/stats/controllers/stats.ts` | Add payment-aware event counts | Modified |
| `apps/website/components/CartDefault.vue` | Replace fake `handlePayment` with real initiate + redirect | Modified |
| `apps/website/pages/anunciar/gracias.vue` | Handle return from payment provider, show payment result | Modified |
| `apps/dashboard/src/lib/strapi/api.ts` | Add `StrapiAPI` methods for payment status | Modified |
| `apps/dashboard/src/app/dashboard/events/` | Show `payment_status` badge in event list and detail | Modified |

---

## Data Flow: New Event Creation with Payment

```
User (Website)
  1. Completes 3-step form → form state in localStorage via create.store.ts

  2. Clicks "Confirmar y Pagar" on /anunciar/resumen
     CartDefault.vue → POST /api/events (creates event with payment_status: pending_payment)
                     → receives documentId

  3. CartDefault.vue → POST /api/payment/initiate { documentId, provider: 'flow', needsInvoice }
     payment.controller.ts → payment.service.ts.initiate()
       → Calls provider API (Flow/Stripe/MP) to create payment session
       → Saves payment_provider_id on event
       → Transitions event: pending_payment → payment_processing
       → Returns { redirectUrl: 'https://flow.cl/app/pay/...' }

  4. CartDefault.vue redirects user to provider payment page

Provider (Stripe/Flow/MP)
  5. User completes payment on provider page
  6. Provider POSTs webhook to /api/payment/webhook/:provider
     verify-signature middleware → rejects if invalid
     payment.controller.ts.webhook()
       → Checks idempotency (payment_transactions table)
       → Calls payment.service.ts.handleWebhookEvent()
         → Transitions: payment_processing → payment_confirmed
         → Transitions: payment_confirmed → pending_approval (auto)
         → Keeps is_approved: false, is_rejected: false in sync
         → Sends email to user: "Payment received, under review"
         → Sends email to admin: "New event awaiting approval"
       → Records in payment_transactions

  7. Provider redirects user back to /anunciar/gracias?token=...
     gracias.vue calls GET /api/payment/status/:documentId
       → Shows "Payment received, under review" UI

Dashboard Admin
  8. Admin sees event in pending_approval queue
  9. Admin clicks Approve/Reject
     → PATCH /api/events/:documentId { is_approved: true }
     → (or new dedicated endpoint /api/payment/moderate)
     → payment.service.ts.transitionEvent() runs
     → Transitions: pending_approval → approved / rejected
     → Sends email to user with outcome
```

---

## Architecture Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Payment logic placement | Dedicated `api/payment` module | Separation from CRUD; matches `stats` precedent; testable in isolation |
| Lifecycle hooks for payment | No | Cannot skip per-call; no return value; fires on admin operations too |
| State representation | `payment_status` enum on event | Single source of truth; queryable; dashboard-visible |
| Legacy flag migration | Keep `is_approved`/`is_rejected`, sync from `payment_status` | Non-breaking; stats controller unchanged during transition |
| Webhook idempotency | `payment_transactions` collection + provider event ID check | At-least-once delivery is guaranteed; must deduplicate |
| Multi-provider webhooks | Separate routes + per-provider signature middleware | Each provider has different signature schemes; isolation required |
| State machine library | None (guard function) | Overkill at 7 states; the guard pattern is sufficient and already used in the team's style |
| Flow vs direct Transbank | Flow aggregator | Covers Webpay, Khipu, MACH, OnePay in one integration; matches the commented logos in CartDefault.vue |

---

## Pitfalls Specific to This Architecture

### Raw Body Parsing for Stripe Webhooks
Strapi 5's default Koa body parser converts the request body to a parsed object. Stripe requires the raw Buffer to verify `stripe-signature`. Configure `config.middlewares.ts` to expose `ctx.request.rawBody`, or use a custom middleware that reads the stream before the body parser runs.

### Event Created Before Payment Is Confirmed
The current `handlePayment` in `CartDefault.vue` saves the event first and redirects to "gracias" — there is no actual payment. After integration, events will exist in `pending_payment` state. These orphaned events need a cleanup strategy: a scheduled job (Strapi CRON or external) that marks events as `payment_failed` if they remain in `pending_payment` or `payment_processing` for more than N minutes.

### Website Calls Strapi Directly (No Proxy)
The website uses `@nuxtjs/strapi` which calls Strapi directly. For the payment initiation call, the website will POST to Strapi at port 1337. The new `/api/payment/initiate` endpoint must require a valid user JWT (the website user is already authenticated via `useStrapiUser`). This is the same auth flow as `POST /api/events` today — no architectural change needed.

### Dashboard Moderation Queue Must Filter by `payment_status`
After adding `payment_status`, the dashboard events page must filter by `payment_status: 'pending_approval'` to show the moderation queue, not by `is_approved: false`. If the filter is not updated, admins will see events in `pending_payment` too, creating a confusing queue.

### Strapi 5 `documents()` vs `entityService`
The `stats` controller uses `strapi.entityService.count()`. In Strapi 5, the preferred API for document operations is `strapi.documents('api::event.event').findOne()` / `.update()`. The `entityService` is deprecated in favor of the Document Service API. New payment code should use `strapi.documents()` consistently.

---

*Architecture research: 2026-03-23*
