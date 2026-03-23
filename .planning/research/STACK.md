# Technology Stack

**Project:** Konbini — Payment-Integrated Event Publication Platform
**Researched:** 2026-03-23
**Base:** Turbo monorepo — Strapi 5.23.1 / Next.js 15 / Nuxt 4

---

## Existing Stack (Do Not Change)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Monorepo | Turborepo | latest | yarn workspaces, nohoist for sharp/pinia |
| CMS/API | Strapi | 5.23.1 | MySQL + SQLite support, postgres config present |
| Admin Dashboard | Next.js | 15.4.6 | App Router, Turbopack, React 19, Tailwind 4 |
| Public Website | Nuxt | 4.0.3 | Pinia, @nuxtjs/strapi v2, Vue 3 |
| Error Tracking | Sentry | ^10 | In all three apps |
| Auth | users-permissions plugin | 5.23.1 | JWT, user→event relation already exists |
| DB (prod target) | MySQL / PostgreSQL | — | Config present for both; SQLite for dev |

---

## Recommended Additions by Domain

### 1. Payment Gateways

**Recommendation: Implement a unified payment abstraction layer in Strapi as a custom plugin.**

Each gateway lives behind a common interface: `{ createOrder, confirmPayment, refund }`. This allows swapping or adding gateways without touching the event purchase flow.

#### Gateway SDKs

| Gateway | Package | Version | Market |
|---------|---------|---------|--------|
| Stripe | `stripe` | ^17.x | International cards |
| Mercado Pago | `mercadopago` | ^2.x | LATAM (MX, AR, CL, BR) |
| Transbank / Webpay | `transbank-sdk` | ^4.x | Chile only |

**Stripe** — The `stripe` npm package (maintained by Stripe Inc.) is the reference implementation for Node.js. Use the server-side SDK only; never expose the secret key to the browser. Stripe Checkout or Payment Intents API are both viable — Payment Intents gives finer control for SPA flows.

**Mercado Pago** — The official `mercadopago` v2 SDK (released 2023, breaking from v1) uses a class-based API: `new MercadoPagoConfig({ accessToken })` then `new Payment(client).create(...)`. The v1 SDK (`mercadopago@1.x`) used a global singleton — do NOT use it. Preference objects (checkout links) are the easiest integration path; Payment Intents exist but are less mature outside Brazil.

**Transbank / Webpay** — `transbank-sdk` is the official Transbank Node.js library. Webpay Plus is the standard redirect-based flow used by virtually all Chilean e-commerce. The SDK handles HMAC signing internally. Integration requires Chilean RUT, commerce codes, and an API key issued by Transbank. The test environment (`Integration` environment constant) is fully functional without real credentials.

**Confidence:** MEDIUM — SDK API shapes verified against August 2025 training data; exact latest versions should be confirmed at install time via `npm info [package] version`.

#### Payment Abstraction Pattern (inside Strapi custom plugin)

```typescript
// src/plugins/payments/server/services/gateway.ts
interface PaymentGateway {
  createOrder(amount: number, currency: string, metadata: OrderMetadata): Promise<OrderResult>;
  handleWebhook(rawBody: Buffer, headers: Record<string, string>): Promise<WebhookEvent>;
  refund(paymentId: string, amount?: number): Promise<void>;
}
```

Register all three gateways under the plugin service map; select by `gateway` field on the `Order` content type.

---

### 2. Order / Ticket Content Types (New in Strapi)

These must be added as new collection types in Strapi:

| Collection | Key Fields | Notes |
|------------|-----------|-------|
| `order` | event, user, gateway (enum: stripe/mercadopago/transbank), status (enum), gateway_order_id, gateway_payment_id, amount_cents, currency, expires_at | Central payment record |
| `ticket` | order, event, holder_name, holder_email, qr_code, used_at | One row per attendee seat |
| `payment-log` | order, raw_payload (json), source (webhook/poll), created_at | Immutable audit trail |

`amount_cents` (integer) avoids floating-point rounding bugs. Never store amounts as decimals.

---

### 3. Webhook Handling in Strapi 5

Strapi 5 does not have a built-in "incoming webhook receiver" — you create a custom route in your plugin or API that accepts POST requests from the payment provider.

**Pattern: Raw body preservation for signature verification**

Stripe and Transbank both require the raw (un-parsed) request body to verify HMAC signatures. Strapi's default `strapi::body` middleware parses JSON before your controller sees it. To work around this:

```typescript
// config/middlewares.ts — add a raw body capture before strapi::body
{
  name: 'global::raw-body',
  config: {},
}

// src/middlewares/raw-body.ts
export default () => {
  return async (ctx, next) => {
    if (ctx.path.startsWith('/api/webhooks/')) {
      ctx.request.rawBody = await new Promise((resolve) => {
        const chunks: Buffer[] = [];
        ctx.req.on('data', (chunk) => chunks.push(chunk));
        ctx.req.on('end', () => resolve(Buffer.concat(chunks)));
      });
    }
    await next();
  };
};
```

Register this middleware **before** `strapi::body` in `config/middlewares.ts`.

**Pattern: Idempotency via gateway_payment_id**

Payment providers retry webhooks on failure. Always check for an existing `payment-log` with the same `gateway_payment_id` before processing:

```typescript
const existing = await strapi.db.query('api::payment-log.payment-log').findOne({
  where: { gateway_payment_id: event.id },
});
if (existing) return ctx.send({ received: true }); // already processed
```

**Pattern: Respond 200 immediately, process async**

Webhook handlers must respond within ~5 seconds or the provider retries. Validate the signature synchronously, log the raw payload, respond 200, then update the order status in a `setImmediate` or background task.

**Confidence:** HIGH — these patterns are standard across Strapi 4/5 and well-established in the Node.js payment ecosystem.

---

### 4. Email: MJML + Mailgun via Strapi Email Plugin

#### Provider Package

| Package | Purpose |
|---------|---------|
| `@strapi/provider-email-mailgun` | Official Mailgun provider for Strapi email plugin |
| `mjml` | MJML → HTML compiler |
| `mjml-browser` | Do NOT use — server-only rendering required |

**Configuration in `config/plugins.ts`:**

```typescript
email: {
  config: {
    provider: 'mailgun',
    providerOptions: {
      key: env('MAILGUN_API_KEY'),
      domain: env('MAILGUN_DOMAIN'),
      url: env('MAILGUN_URL', 'https://api.mailgun.net'), // use api.eu.mailgun.net for EU
    },
    settings: {
      defaultFrom: env('EMAIL_FROM', 'noreply@konbini.cl'),
      defaultReplyTo: env('EMAIL_REPLY_TO', 'contacto@konbini.cl'),
    },
  },
},
```

#### MJML Template Pattern

Do NOT use MJML in the browser. Compile templates at boot time or at send time on the server. The recommended pattern for a Strapi plugin:

```typescript
// src/plugins/mailer/server/services/templates.ts
import mjml2html from 'mjml';
import { readFileSync } from 'fs';
import { join } from 'path';

const cache = new Map<string, string>();

export function renderTemplate(name: string, variables: Record<string, string>): string {
  if (!cache.has(name)) {
    const mjmlSource = readFileSync(
      join(__dirname, '../templates', `${name}.mjml`),
      'utf-8'
    );
    const { html, errors } = mjml2html(mjmlSource, { validationLevel: 'strict' });
    if (errors.length) throw new Error(`MJML errors in ${name}: ${JSON.stringify(errors)}`);
    cache.set(name, html);
  }

  let html = cache.get(name)!;
  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}
```

Store `.mjml` template files under `src/plugins/mailer/server/templates/`. Variables use `{{VARIABLE_NAME}}` convention (simple string replace — no templating engine dependency required for transactional emails).

#### Email Templates Needed (per feature scope)

| Template | Trigger |
|----------|---------|
| `ticket-confirmation` | Order status → `paid` |
| `ticket-resend` | Organizer action or user request |
| `event-approved` | Moderator approves event |
| `event-rejected` | Moderator rejects event (includes `rejected_reazon`) |
| `organizer-welcome` | New organizer account created |
| `order-refunded` | Refund processed |

**Confidence:** HIGH — Strapi email plugin + Mailgun provider pattern is stable and documented. MJML server-side compilation is standard Node.js.

---

### 5. Search

#### Options Evaluated

| Option | Hosting | Latency | Strapi 5 Support | Best For |
|--------|---------|---------|-----------------|----------|
| **Strapi built-in filters** | None (DB) | Medium | Native | Simple filtering, <10K records |
| **PostgreSQL FTS** (`tsvector`) | Same DB | Low–Medium | Via raw query / Knex | Structured data, no infra cost |
| **Meilisearch** | Self-hosted | Very Low | `strapi-plugin-meilisearch` | Typo-tolerant, faceted search |
| **Algolia** | SaaS | Very Low | `strapi-plugin-search` | Large scale, paid, best DX |
| **Typesense** | Self-hosted | Very Low | Manual integration | Algolia alternative, MIT license |

#### Recommendation: Meilisearch

**Use Meilisearch** for this project. Rationale:

1. The `strapi-plugin-meilisearch` package (maintained by Meili team) syncs Strapi collection types to Meilisearch indexes automatically on create/update/delete via Strapi lifecycle hooks.
2. Meilisearch is MIT-licensed and trivially self-hosted (single Rust binary, Docker image `getmeili/meilisearch`).
3. Typo-tolerance is critical for event search (users search band/artist names with variable spelling).
4. Faceted filtering maps directly to the existing `categories`, `region`, `commune` relations on the `event` content type.
5. At the project's likely scale (<100K events), Meilisearch running on the same VPS as Strapi is entirely sufficient.

**Do not use PostgreSQL FTS unless already on Postgres and unwilling to add infra.** FTS setup requires raw Knex queries bypassing Strapi's ORM, breaking type safety and future migrations.

**Do not use Algolia** unless the project is SaaS-funded — costs grow quickly with event writes at scale.

#### Meilisearch Setup

| Package | Version | Purpose |
|---------|---------|---------|
| `strapi-plugin-meilisearch` | ^0.13.x | Strapi ↔ Meilisearch sync |
| `meilisearch` | ^0.41.x | JS client (for Nuxt website search UI) |

```typescript
// config/plugins.ts addition
meilisearch: {
  config: {
    host: env('MEILISEARCH_HOST', 'http://localhost:7700'),
    apiKey: env('MEILISEARCH_MASTER_KEY'),
    event: {
      indexName: 'events',
      entriesQuery: {
        populate: ['categories', 'region', 'commune', 'banner'],
        filters: { is_approved: true },
      },
      transformEntry({ entry }) {
        return {
          id: entry.id,
          title: entry.title,
          slug: entry.slug,
          description: entry.description,
          categories: entry.categories?.map((c) => c.name) ?? [],
          region: entry.region?.name,
          commune: entry.commune?.name,
          address: entry.address,
          bannerUrl: entry.banner?.url,
        };
      },
    },
  },
},
```

Only approved events (`is_approved: true`) should be indexed. The `transformEntry` function strips internal fields before sending to Meilisearch.

**Confidence:** MEDIUM — `strapi-plugin-meilisearch` is actively maintained and supports Strapi 5 as of early 2025. Confirm current Strapi 5 compatibility at `https://github.com/meilisearch/strapi-plugin-meilisearch` before installing.

---

### 6. Organizer Panel

The organizer panel adds a new user role to the existing `users-permissions` plugin flow.

#### Role Architecture

| Role | Capabilities |
|------|-------------|
| `Public` | Read approved events |
| `Authenticated` | Purchase tickets, view own orders |
| `Organizer` | Create/edit own events, view own event orders/ticket sales |
| `Moderator` | Approve/reject events, view all organizers |
| `Admin` | Full Strapi admin panel access |

**Implementation:** Custom role via users-permissions (not a new plugin). The `event` content type already has `user` (author) and `approved_by` / `rejected_by` relations. Add `organizer_profile` as a separate collection type linked 1:1 to user, holding: `company_name`, `rut`, `bank_account`, `verified`.

#### Organizer Panel Placement

**Use the existing Next.js 15 dashboard** (`konbini-dashboard`) rather than building a separate app. The dashboard already has TipTap, react-hook-form, Zod, react-select, date/time pickers — everything needed for an event creation form.

Add a `/organizer` route group in the Next.js App Router with its own layout that gates access by the `Organizer` role.

---

### 7. QR Code for Tickets

| Package | Purpose | Confidence |
|---------|---------|-----------|
| `qrcode` | Server-side QR PNG/SVG generation | HIGH |

Generate QR at ticket creation time on the Strapi server. Store the QR as a data URL in the `ticket.qr_code` field or upload to Strapi media library. The QR payload should be a signed JWT containing `{ ticketId, eventId }` — not raw IDs — so scanning apps can verify authenticity without a DB lookup.

---

### 8. Background Jobs / Queuing

Payment webhook processing and email sending need reliability. For this scale (events platform, not fintech), the simplest viable approach:

**Recommendation: No queue broker for MVP. Use Strapi lifecycle hooks + `setImmediate`.**

If job reliability becomes a concern post-MVP, add **BullMQ** with Redis:

| Package | Purpose |
|---------|---------|
| `bullmq` | Job queue backed by Redis |
| `ioredis` | Redis client |

This avoids introducing Redis in Phase 1 while leaving a clear upgrade path.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Email provider | Mailgun | SendGrid, Resend | Mailgun is well-supported by official Strapi provider; Resend lacks official Strapi provider as of mid-2025 |
| Email templating | MJML | React Email, Handlebars | React Email requires React render environment; MJML is purpose-built for email HTML |
| Search | Meilisearch | Algolia | Algolia costs money per write operation; Meilisearch is free and self-hosted |
| Search (alt) | Meilisearch | PostgreSQL FTS | FTS bypasses Strapi ORM, complicates schema management |
| Payment abstraction | Custom Strapi plugin | Separate microservice | Overkill at this scale; keeps all webhook endpoints under one deployable |
| Organizer UI | Next.js 15 dashboard (existing) | New Nuxt app | Unnecessary app proliferation; dashboard has all needed form components |
| Ticket QR | `qrcode` npm | ZXing, canvas-based | `qrcode` is a zero-dependency server-side solution, well-maintained |

---

## Full Dependency List (New Additions to Strapi)

```bash
# Payment gateways
yarn workspace konbini-api add stripe mercadopago transbank-sdk

# Email
yarn workspace konbini-api add @strapi/provider-email-mailgun mjml

# Search
yarn workspace konbini-api add strapi-plugin-meilisearch

# QR codes
yarn workspace konbini-api add qrcode
yarn workspace konbini-api add -D @types/qrcode

# MJML types
yarn workspace konbini-api add -D @types/mjml
```

```bash
# Search client (Nuxt website — for search UI)
yarn workspace konbini-website add meilisearch
```

---

## Environment Variables to Add

```bash
# Payment — Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Payment — Mercado Pago
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=

# Payment — Transbank
TRANSBANK_COMMERCE_CODE=
TRANSBANK_API_KEY=
TRANSBANK_ENVIRONMENT=Integration  # or Production

# Email
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_URL=https://api.mailgun.net
EMAIL_FROM=
EMAIL_REPLY_TO=

# Search
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=
```

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Stripe integration | HIGH | Stable API since 2019, well-documented, widely used in Strapi projects |
| Mercado Pago v2 SDK | MEDIUM | SDK v2 released 2023, breaking changes from v1; verify import style at install |
| Transbank SDK | MEDIUM | Official Chilean SDK, stable, but Transbank occasionally deprecates test credentials |
| Strapi email plugin + Mailgun | HIGH | Official provider, stable since Strapi v3 |
| MJML server-side | HIGH | Standard Node.js pattern, no edge cases with Strapi |
| Meilisearch + Strapi plugin | MEDIUM | Plugin supports Strapi 5 as of early 2025 — confirm version compatibility |
| Webhook raw body pattern | HIGH | Standard Koa middleware pattern, Strapi middleware order is documented |
| Idempotency pattern | HIGH | Industry standard, no Strapi-specific concerns |

---

## Sources

- Knowledge base: Strapi 5 plugin/middleware architecture (training cutoff August 2025)
- Mercado Pago SDK v2 changelog and migration guide (training data)
- Transbank official SDK for Node.js (training data)
- Meilisearch Strapi plugin repository: https://github.com/meilisearch/strapi-plugin-meilisearch
- Stripe Node.js SDK: https://github.com/stripe/stripe-node
- MJML official docs: https://mjml.io/documentation
- `@strapi/provider-email-mailgun`: https://www.npmjs.com/package/@strapi/provider-email-mailgun

**Note:** WebSearch and WebFetch were denied during this research session. All findings are based on training data (cutoff August 2025). Verify package versions with `npm info [package] version` before installing, and confirm `strapi-plugin-meilisearch` Strapi 5 compatibility at the GitHub repo above.
