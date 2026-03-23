# Feature Landscape

**Domain:** Event publication platform with paid listing (Chile/LatAm)
**Researched:** 2026-03-23
**Confidence:** HIGH (derived from direct codebase analysis + waldo-project reference + domain knowledge)

---

## Research Scope

Four research areas were investigated:
1. Payment UX patterns for SaaS/marketplace checkout flows
2. Organizer panel patterns for event listing management
3. Email notification flows for marketplace approval workflows
4. Search UX patterns for event discovery

Source notes: WebSearch was unavailable during this session. All findings are derived from: direct codebase inspection of konbini-project and waldo-project (HIGH confidence), domain expertise from analogous platforms (MEDIUM confidence), and patterns already partially implemented in the existing codebase (HIGH confidence where code exists).

---

## 1. Payment UX Patterns

### What Already Exists

The `CartDefault.vue` component has a working skeleton:
- Order summary (1 event, fixed price CLP with IVA)
- "Necesito factura" checkbox (empresa/invoice toggle)
- Confirm & Pay CTA with price repeated in the button label
- Commented-out payment method logos (Flow, Webpay, OnePay, Khipu, MACH)
- A plain alert box explaining the 24-hour moderation window

The waldo-project has a complete `IPaymentGateway` abstraction with Transbank/Webpay already implemented via `transbank-nodejs-lib`. This is directly reusable.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Redirect to gateway (Webpay/MercadoPago) | Users expect native payment UI from their bank | Low | Pattern: initTransaction → redirect → return URL |
| Return URL handler | Gateway callback must confirm or fail the payment | Low | Strapi custom route; already exists in waldo-project |
| Order summary before payment | Users need to confirm what they're paying for | Low | CartDefault.vue skeleton already exists |
| Payment confirmation page | Replaces the current stub `/anunciar/gracias` | Low | Must show event title + "under review" message |
| Payment failure page | Gateway can return failure/cancellation | Low | Redirect to failure state with retry option |
| Idempotency / duplicate prevention | Avoid double charges on network retry | Medium | Store `payment_status` on the event record before redirect |
| Factura / invoice capture | Chilean B2B standard; checkbox already in CartDefault.vue | Low | Collect RUT empresa + razón social post-approval, not blocking |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-gateway selection | Organizer chooses Webpay vs MercadoPago | Medium | Use env `PAYMENT_GATEWAY` registry pattern from waldo-project; surface as radio buttons on CartDefault |
| Payment receipt email | Organizer gets confirmation with amount, order ID, event title | Low | Trigger `sendMjmlEmail` after commitTransaction succeeds |
| Retry failed payment | If payment fails, organizer can retry without re-filling the form | Low | Keep event in `payment_pending` state; show "Reintentar pago" in organizer panel |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Building a custom payment form | PCI compliance scope explosion; Transbank/MP handle card data | Always redirect to gateway-hosted UI |
| Storing card data of any kind | Not needed for this model (single charge) | Use gateway tokens only |
| Charging before form validation | User pays then discovers form is invalid | Current flow is correct: Create → (validate) → Pay |
| Blocking moderation on invoice data | Slows down approval for B2B organizers | Collect factura data async after approval |

### Payment Flow (Recommended)

```
Organizer completes form steps 1-3
  → /anunciar/resumen (CartDefault shows summary + price)
  → POST /api/payments/init
      → create event record with is_approved=false, payment_status='pending'
      → call gateway.createTransaction(amount, orderId, sessionId, returnUrl)
      → redirect organizer to gateway URL
  → Organizer completes payment on gateway
  → Gateway redirects to /api/payments/return?token=xxx
      → call gateway.commitTransaction(token)
      → on success: set payment_status='paid', send confirmation email
      → on failure: set payment_status='failed', redirect to failure page
  → Admin dashboard shows event in moderation queue
  → Admin approves/rejects → email notification to organizer
```

**Critical decision:** Event record must be created BEFORE the payment redirect (not after), so the gateway return URL can reference a real `documentId`. The current CartDefault.vue creates the event on "Confirmar y Pagar" click — this is the right moment, just needs payment_status tracking added.

**Schema additions needed on Event:**
- `payment_status`: enum `pending | paid | failed` (required, default `pending`)
- `payment_gateway`: string (which gateway was used)
- `payment_order_id`: string (gateway order reference, for receipt)
- `payment_amount`: integer (amount charged in CLP cents)

---

## 2. Organizer Panel Patterns

### What Already Exists

`/cuenta` is a stub (`<h1>Cuenta</h1>`). The event schema has `user` relation (ManyToOne), `is_approved`, `is_rejected`, `rejected_reazon` fields — all the data needed to build the panel exists.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| List of my events with status | Core reason to have an account | Low | Query `events` filtered by `user = me`, show status badge |
| Event status labels | Organizer needs to know where each event stands | Low | Map is_approved + is_rejected + payment_status to clear labels |
| View my published event | Check how it looks live | Low | Link to `/eventos/[slug]` |
| See rejection reason | Organizer needs to understand why event was rejected | Low | `rejected_reazon` field already on schema |
| Retry payment after failure | Organizer can recover from a failed payment | Medium | Show "Reintentar pago" for events with payment_status='failed' |
| Account info / change password | Basic profile management | Low | Use Strapi's PUT /users/me endpoint |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Edit event before approval | Organizer can fix errors after submission but before review | Medium | Allow PUT on event only while is_approved=false and payment_status='paid'; disable edit once approved |
| Expiration date visibility | Organizer knows when the listing expires | Low | `expiration_date` field already on schema; show countdown |
| Renewal / re-publish | Organizer can pay again to extend listing | High | Defer to v2; requires new payment flow for existing event |
| Download receipt / payment summary | Proof of payment for accounting | Low | Generate a simple HTML receipt page; link from panel |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Edit after approval | Creates moderation inconsistency; approved content could be changed silently | Lock edit once is_approved=true; require new submission for major changes |
| Delete event from panel | Organizer deleting paid content causes support burden | Allow admin-only deletion; organizer can contact support |
| Full Strapi user profile editing | Scope creep | Limit to name, email, password for v1 |

### Organizer Event Status States

Map the existing boolean flags to user-facing labels:

| payment_status | is_approved | is_rejected | Label shown to organizer |
|---------------|-------------|-------------|-------------------------|
| pending | false | false | "Pendiente de pago" |
| failed | false | false | "Pago fallido — Reintentar" |
| paid | false | false | "En revision (24h)" |
| paid | true | false | "Publicado" |
| paid | false | true | "Rechazado — Ver motivo" |

### Organizer Panel Pages (recommended)

```
/cuenta                    → redirect to /cuenta/eventos
/cuenta/eventos            → list of my events with status
/cuenta/eventos/[slug]     → event detail / edit (only if not yet approved)
/cuenta/perfil             → name, email, password change
```

---

## 3. Email Notification Flows

### What Already Exists in waldo-project (directly adaptable)

| Template | Trigger | Variables |
|----------|---------|-----------|
| `ad-creation-user.mjml` | After successful event save | name, adUrl |
| `ad-creation-admin.mjml` | After successful event save → notify admins | name, email, slug, adUrl |
| `ad-approved.mjml` | Admin approves | name, adTitle, adUrl |
| `ad-rejected.mjml` | Admin rejects | name, adTitle, reason, frontendUrl |

These templates need brand color substitution (Konbini palette) and content copy changes (event vs. anuncio language). The sendMjmlEmail infrastructure and Mailgun plugin are reused verbatim.

### Table Stakes (what emails must exist for v1)

| Email | Recipient | Trigger | Priority |
|-------|-----------|---------|----------|
| Payment confirmed | Organizer | payment_status set to 'paid' | Critical — user has just paid |
| Event submitted for review | Organizer | Same trigger as payment confirmation | High — sets expectation |
| New event pending moderation | Admin team | Same trigger | High — alerts moderators |
| Event approved | Organizer | Admin clicks Approve in dashboard | Critical |
| Event rejected (with reason) | Organizer | Admin clicks Reject + fills reason | Critical |

### Differentiators

| Email | Recipient | Trigger | Value |
|-------|-----------|---------|-------|
| Payment receipt (with amount + order ID) | Organizer | payment_status='paid' | Accounting proof |
| Expiration reminder | Organizer | 7 days before expiration_date | Reduce churn; prompts renewal |
| Event expired | Organizer | expiration_date passes | Drives re-purchase |

### Anti-Features

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Sending email before payment commits | Organizer receives "submitted" email for events they haven't paid for |
| Admin email for every browse/view | Not a notification-worthy event |
| Welcome email on registration | Not in scope for v1 unless Strapi plugin handles it automatically |

### Email Trigger Architecture

Following waldo-project pattern: Strapi lifecycle hooks or custom controller logic calls `sendMjmlEmail`. Two implementation options:

**Option A — Strapi lifecycle hooks** (simpler, waldo-project pattern):
- `afterCreate` on Event model → send creation emails
- Custom controller method on approve/reject actions in dashboard → send outcome emails
- Payment commit controller → send payment confirmation

**Option B — Custom Strapi service** (more testable):
- `EventNotificationService` with methods: `onPaymentConfirmed()`, `onApproved()`, `onRejected()`
- Called from payment return URL handler and dashboard approve/reject endpoints

Recommend **Option A** for v1 (matches existing waldo-project pattern, less infrastructure).

### Email Template Naming Convention (for Konbini)

| Template file | Purpose |
|---------------|---------|
| `event-payment-confirmed.mjml` | To organizer after payment |
| `event-submitted-admin.mjml` | To admins after payment (moderation queue) |
| `event-approved.mjml` | To organizer after admin approval |
| `event-rejected.mjml` | To organizer after admin rejection (with reason) |
| `event-expiring-soon.mjml` | To organizer 7 days before expiration (v2) |

---

## 4. Search UX Patterns

### What Already Exists

- `SearchDefault.vue`: renders a text input + submit button; handler is a complete stub (`// TODO: Implementar búsqueda`)
- `/busqueda.vue`: empty page (`<div class="page page--search" />`)
- Event schema has: `title`, `description`, `categories` (relation), `region` (relation), `commune` (relation), `dates` (repeatable component with `date` field)
- `/category/[slug]` pages already route by category (EventsCategory component)
- Events listing at `/eventos` already fetches with `sort: createdAt:desc` and has pagination

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full-text search on title/description | Core search expectation | Medium | Strapi filters: `filters[$or][0][title][$containsi]=query&filters[$or][1][description][$containsi]=query` |
| Filter by category | Most event directories do this | Low | Category IDs already exist; pass as `filters[categories][slug][$eq]` |
| Filter by region | Chilean UX norm (Santiago vs Valparaíso etc) | Low | Region already on event schema |
| Filter by date range | Users want "this weekend" / "next month" | Medium | Filter `dates.date[$gte]` and `dates.date[$lte]` on the nested component |
| Results page at /busqueda | Dedicated URL for shareable search results | Low | `busqueda.vue` stub already exists |
| Empty state when no results | Without this the page looks broken | Low | Reuse `EmptyEvents.vue` component |
| Search from header | Users expect search everywhere | Low | `SearchDefault.vue` already in `HeaderDefault.vue`; needs to navigate to `/busqueda?q=` |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Instant URL-reflected filters | Shareable search URLs (`/busqueda?q=rock&region=rm&fecha=2026-04`) | Low | Use Nuxt's `useRoute` + `useRouter` to sync filter state with query params |
| Filter by free/paid events | Frequent user need | Low | `filters[isFree][$eq]=true/false` |
| Date preset buttons | "Hoy", "Este fin de semana", "Este mes" | Low | Compute date ranges client-side, pass to date filter |
| Sort by date (next upcoming) | More useful than sort by created | Low | Sort by `dates.date:asc` instead of `createdAt:desc` |
| Category browse via menu | Already partially implemented via MenuCategories.vue | Low | Wire `CategoryEvents` pages to show filtered events |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Elasticsearch / full-text search engine | Massive infra overhead for v1 | Use Strapi's built-in `$containsi` filter; works at current scale |
| Location-based "near me" geolocation | GPS/geocoding adds significant complexity | Stick to region/commune selection dropdowns |
| Faceted search with dynamic counts | Complex aggregation queries; Strapi doesn't support natively | Show filter options without counts for v1 |
| Auto-complete / type-ahead | Requires debounced API calls; adds complexity | Simple submit-on-enter for v1 |

### Search Implementation (Recommended)

**URL pattern:** `/busqueda?q=&categoria=&region=&desde=&hasta=&libre=`

**Strapi query mapping:**
```
q         → filters[$or][0][title][$containsi] + filters[$or][1][description][$containsi]
categoria → filters[categories][slug][$eq]
region    → filters[region][slug][$eq]
desde     → filters[dates][date][$gte]
hasta     → filters[dates][date][$lte]
libre     → filters[isFree][$eq]
```

**Component architecture (Nuxt/Vue):**
- `SearchDefault.vue` (header bar): text input only, navigates to `/busqueda?q=`
- `busqueda.vue` (results page): reads all query params, renders filter sidebar + `EventsArchive`
- Reuse existing `EventsArchive.vue` for the results grid (it already handles pagination and empty states)
- Add a new `FiltersSearch.vue` for the filter sidebar (categories dropdown, region dropdown, date range, free/paid toggle)

---

## Feature Dependencies

```
Payment flow → Organizer panel (panel needs payment_status field)
Payment flow → Email notifications (payment confirmation email)
Admin approve/reject → Email notifications (outcome emails)
Search → none (independent)
Organizer panel → Auth middleware (already exists at /cuenta)
```

---

## MVP Recommendation

Prioritize in this order based on business value and user pain:

1. **Payment integration** — without this, the business model doesn't function; this is the most critical missing piece
2. **Email notifications** — organizers need feedback after paying; without this, payment feels like a black box; low complexity with waldo-project templates
3. **Organizer panel** — organizers need to track their submissions; account page stub already exists
4. **Search** — public discovery is blocked by the stub; moderate complexity, high public UX impact

Defer:
- **Factura/invoice collection**: Implement as async flow after event approval, not blocking payment
- **Renewal / re-publish**: Requires new payment flow for existing events; defer to v2
- **Expiration reminder emails**: Nice to have; implement after core email flow is stable
- **Auto-complete search**: v2 only

---

## Sources

- Direct inspection of `/home/gab/Code/konbini-project/apps/website/components/CartDefault.vue` — existing payment UI skeleton
- Direct inspection of `/home/gab/Code/konbini-project/apps/strapi/src/api/event/content-types/event/schema.json` — event data model
- Direct inspection of `/home/gab/Code/konbini-project/apps/website/stores/create.store.ts` — multi-step form state
- Direct inspection of waldo-project MJML templates at `/home/gab/Code/waldo-project/apps/strapi/src/services/mjml/templates/` — email pattern reference (HIGH confidence)
- Direct inspection of waldo-project payment gateway abstraction at `/home/gab/Code/waldo-project/apps/strapi/src/services/payment-gateway/` — gateway interface pattern (HIGH confidence)
- Direct inspection of waldo-project Transbank implementation at `/home/gab/Code/waldo-project/apps/strapi/src/services/transbank/` — Webpay integration pattern (HIGH confidence)
- `/home/gab/Code/konbini-project/.planning/codebase/CONCERNS.md` — known gaps and bugs including search stub (HIGH confidence)
- `/home/gab/Code/konbini-project/.planning/PROJECT.md` — validated requirements and constraints (HIGH confidence)
