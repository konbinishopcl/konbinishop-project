# Domain Pitfalls: Payment Integration (Chile/LatAm)

**Domain:** Multi-gateway payment integration on Strapi 5 + Nuxt 4
**Researched:** 2026-03-23
**Confidence note:** WebSearch and WebFetch were unavailable during this research session. All findings are drawn from training data (cutoff August 2025) combined with direct analysis of the existing codebase via CONCERNS.md. Confidence levels reflect this constraint honestly. Verify Transbank-specific claims against https://www.transbankdevelopers.cl before implementing.

---

## Critical Pitfalls

Mistakes that cause rewrites, financial loss, or security incidents.

---

### Pitfall 1: Transbank Webpay — Confirmation Step Is Mandatory and Non-Idempotent

**What goes wrong:** Webpay Plus uses a two-step flow. Step 1 redirects the buyer to Transbank's hosted page. Step 2 requires your server to call `transaction.commit()` (or the equivalent PUT to `/rswebpaytransaction/api/webpay/v1.2/transactions/{token}`) within a tight time window after the user returns. Many developers skip or delay this commit call, or call it more than once. Calling commit twice on the same token returns a different status on the second call (the transaction is already committed), causing incorrect "failed" states in the DB.

**Why it happens:** The flow feels like a simple redirect, so the confirmation step is treated as optional or as a mere "check." It is not — it is the action that finalises the charge.

**Consequences:** Double-commit returns status `FAILED` or an error code. If the system interprets this as a real failure, it may allow the user to retry (and be charged twice), or incorrectly mark a successful order as unpaid.

**Prevention:**
- Store the Webpay `token_ws` in your DB the moment you receive the return redirect, with status `PENDING_COMMIT`.
- Use a DB-level unique constraint on `token_ws` so only one commit attempt can proceed.
- If commit returns an already-committed error code, look up the existing order by token and return the existing result rather than treating it as a new failure.
- Set a conservative timeout: the commit window is approximately 5 minutes from when the user lands on your return URL. Do not queue commits for later processing.

**Detection:** Transbank returns HTTP 422 with error code `TRANSACTION_STATUS_CERO_MONTO` or similar if you attempt to commit an already-finalised transaction. Log all commit responses with the full token and status for auditability.

**Confidence:** MEDIUM — drawn from Transbank developer docs patterns known at training cutoff. Verify exact error codes at https://www.transbankdevelopers.cl/documentacion/webpay-plus.

---

### Pitfall 2: Transbank Test vs Production — Credentials, URLs, and Behavior Are Completely Different

**What goes wrong:** Transbank provides separate SDK/API credentials for integration (test) and production. The integration environment uses a shared, public API key (`579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1`). Shipping this key to production silently routes real transactions through the test sandbox — they appear to succeed in your UI but no actual charge happens. The reverse (using production keys in staging) charges real cards.

**Why it happens:** Environment variable misconfiguration at deploy time. The integration key is publicly documented and looks "real," so it does not trigger any obvious error.

**Consequences:** Real users pay nothing (revenue loss), or test users are charged real money (legal/financial liability).

**Prevention:**
- Validate at app startup that `TRANSBANK_ENV` matches the deployed environment. Throw a hard error if `NODE_ENV=production` and the integration commerce code is detected.
- Use a checklist for the Transbank certification process — production access requires submitting test transaction logs to Transbank and receiving production credentials manually. This is not automatic.
- The production URL base is `https://webpay3g.transbank.cl`; integration is `https://webpay3gint.transbank.cl`. Log the base URL on startup so it is visible in deployment logs.

**Detection:** Add an assertion: `if (process.env.NODE_ENV === 'production' && transbankCommerceCode === '597055555532') throw new Error('Transbank integration credentials detected in production')`.

**Confidence:** MEDIUM — publicly documented integration commerce code. Verify current test credentials at https://www.transbankdevelopers.cl/referencia/webpay#ambientes.

---

### Pitfall 3: Webpay Returns `token_ws` via POST, Not GET — Nuxt Route Must Accept POST

**What goes wrong:** After the user completes payment on Transbank's hosted page, Transbank POSTs `token_ws` as a form field to your return URL. Many developers configure the return URL handler as a GET route (natural for a "redirect landing page"). The POST body is silently ignored, `token_ws` is undefined, and the commit call fails or throws.

**Why it happens:** The flow is documented as a "redirect back," which implies GET. The POST behaviour is a Webpay quirk not present in Stripe or Mercado Pago.

**Consequences:** Every payment appears to fail on return. Users are charged but the order is never confirmed.

**Prevention:** The Nuxt page or server route handling `/payment/webpay/return` must read `token_ws` from `req.body` (POST body), not from query params. In Nuxt 4 with `useServerRoute`, use `await readBody(event)`. If using a Nuxt page component, it cannot read POST bodies — use a Nitro server route (`server/routes/payment/webpay/return.post.ts`) instead.

**Detection:** Log the full incoming request method and body on the return URL handler during development. If `token_ws` is undefined, the handler is receiving GET or the body parser is not configured.

**Confidence:** HIGH — this is a foundational, well-documented Webpay behavior present since Webpay Plus v1.

---

### Pitfall 4: Webhook Replay Without Idempotency Causes Duplicate Order Fulfillment

**What goes wrong:** All three gateways (Transbank via polling/IPN, Mercado Pago, Stripe) can deliver the same payment event more than once. If the webhook handler creates an order or sends a confirmation email on every delivery, users receive duplicate emails and orders are double-counted. Under load, two webhook deliveries can arrive within milliseconds of each other and both pass a naive "order not yet confirmed?" check before either commits.

**Why it happens:** Webhook delivery is at-least-once by design at all major gateways. Race conditions occur because webhook endpoints are stateless HTTP handlers with no built-in mutual exclusion.

**Consequences:** Duplicate order records, duplicate confirmation emails, incorrect revenue reporting, potential double-seat allocation for events.

**Prevention:**
1. **Idempotency key per payment event.** Store the gateway's event/notification ID (`stripe_event_id`, `mercadopago_notification_id`, Transbank `token_ws`) in a `payment_events` table with a unique constraint.
2. **Check-then-act inside a DB transaction.** Within a single transaction: attempt to INSERT the event ID (will fail if duplicate), then process the order only if the insert succeeded.
3. **Use Strapi lifecycle hooks carefully.** Do not trigger fulfillment logic inside `beforeCreate`/`afterCreate` on the Order content type — these fire for any creation, not just payment-confirmed ones. Use an explicit service method called only from the webhook handler.
4. **Return HTTP 200 immediately.** If the event is a known duplicate, return 200 (not 4xx). Returning an error code causes gateways to retry, amplifying the problem.

**Detection:** Add a `processed_at` timestamp and `idempotency_key` to every order. Alert if two orders share the same `idempotency_key`.

**Confidence:** HIGH — standard distributed systems pattern, applies identically to all three gateways.

---

### Pitfall 5: Mercado Pago Webhook Requires Server-Side Re-fetch — Never Trust the Payload

**What goes wrong:** Mercado Pago sends an IPN (Instant Payment Notification) or webhook with a `data.id` field and a `type`. Many developers read payment status directly from the webhook body and act on it. The webhook body is not signed in the same way as Stripe webhooks and can be spoofed or replayed with a forged `status: approved`.

**Why it happens:** The webhook payload looks like a complete payment object, making a re-fetch feel redundant.

**Consequences:** Fraudulent payment confirmations — an attacker POSTs a fake webhook with `status: approved` and receives event access without paying.

**Prevention:**
- On webhook receipt, extract only the `data.id`.
- Call `GET /v1/payments/{id}` using your server-side Mercado Pago credentials to retrieve the authoritative payment status.
- Only proceed with fulfillment if the re-fetched status is `approved`.
- Validate the `x-signature` header (Mercado Pago v2 webhooks include HMAC-SHA256 signatures). Reject requests where the signature does not match.

**Detection:** Log the webhook body status vs. the re-fetched status. Any discrepancy is a potential fraud attempt.

**Confidence:** HIGH — this pattern is documented in Mercado Pago's official security guidance and is a well-known gotcha in LatAm payment integrations.

---

### Pitfall 6: Stripe Webhook Signature Validation Broken by Body Parsing Middleware

**What goes wrong:** Stripe webhook signature validation (`stripe.webhooks.constructEvent`) requires the **raw, unparsed request body** as a Buffer. In Nuxt 4 / Nitro, the default `readBody(event)` JSON-parses the body, which causes signature verification to fail with `No signatures found matching the expected signature`. The webhook endpoint appears to reject all Stripe events.

**Why it happens:** Body parsing is usually a convenience, not something you think to disable. The error message from Stripe is not intuitive about the root cause.

**Consequences:** All Stripe webhooks fail signature validation. Either you disable validation (security hole) or payments never confirm.

**Prevention:** In the Nitro server route for Stripe webhooks, read the raw body using `await readRawBody(event)` (returns a Buffer/string). Pass this raw body to `stripe.webhooks.constructEvent(rawBody, stripeSignatureHeader, webhookSecret)`. Do not use `readBody()` on this route.

**Detection:** If `constructEvent` throws "No signatures found matching," the body has been parsed. Log `typeof rawBody` — it should be `string` or `Buffer`, not `object`.

**Confidence:** HIGH — documented in Stripe's Node.js integration guide and a very common Nitro/Next.js integration mistake.

---

### Pitfall 7: Existing CORS Wildcard Directly Enables Payment Endpoint Abuse

**What goes wrong:** The existing codebase has `origin: ['*']` in Strapi's CORS config (see CONCERNS.md). Once payment endpoints are added to Strapi, any website can make credentialed cross-origin requests to `/api/orders`, `/api/payments`, and `/api/webhook/*`. Combined with the disabled dashboard role enforcement, an attacker from any origin can manipulate payment state.

**Why it happens:** The wildcard was likely set during development for convenience. It was never tightened before new sensitive endpoints were added.

**Consequences:** Cross-site request forgery against payment endpoints; ability to read order data for all users from any origin.

**Prevention:** Before adding any payment routes to Strapi, restrict `origin` in `apps/strapi/config/middlewares.ts` to the explicit list of known front-end domains. This must happen before, not after, payment integration.

**Confidence:** HIGH — directly observed in CONCERNS.md, cross-referenced with standard CORS security principles.

---

## Moderate Pitfalls

---

### Pitfall 8: Multi-Gateway Abstraction — Divergent Flow Models Cannot Be Unified Cleanly

**What goes wrong:** Stripe, Mercado Pago, and Transbank have fundamentally different flow models:
- **Stripe:** Client creates a PaymentIntent, client confirms it using Elements/Stripe.js, webhook confirms server-side.
- **Mercado Pago:** Client submits card data to MP SDK, server creates a preference or uses Checkout Pro redirect, IPN webhook confirms.
- **Transbank:** Server creates a transaction, user is redirected to Transbank's hosted page, user POSTs token back to your return URL, server commits.

Developers try to write a single `PaymentProvider` interface with `createPayment()`, `confirmPayment()`, `handleWebhook()` methods and force all three gateways into it. The mismatch between server-redirect (Transbank) and client-side confirmation (Stripe) makes a clean abstraction nearly impossible without leaking gateway-specific details through the interface.

**Why it happens:** DRY instinct. The abstraction looks clean on a whiteboard.

**Consequences:** The abstraction becomes a leaky facade with gateway-specific `if` blocks inside supposedly generic methods. It is harder to maintain than explicit gateway-specific handlers.

**Prevention:**
- Use a **strategy pattern** but accept that strategy interfaces will be thin. Each gateway gets its own service class (`WebpayService`, `MercadoPagoService`, `StripeService`) with no forced common interface beyond `getGatewayName(): string` and `validateWebhook(req): boolean`.
- The Order content type in Strapi should store `gateway: enum('transbank' | 'mercadopago' | 'stripe')` and `gateway_payment_id: string`. Fulfillment logic reads `gateway` and dispatches to the correct service.
- Shared logic (order creation, email notification, idempotency check) lives in an `OrderService` that all three gateway services call. Gateway-specific logic stays in gateway services.

**Confidence:** HIGH — well-documented pattern from multi-gateway implementations; the specific flow divergence is factual for all three named gateways.

---

### Pitfall 9: Strapi 5 Document Service API — `entityService` Is Gone, Lifecycle Hook Signatures Changed

**What goes wrong:** The existing codebase already uses the deprecated `strapi.entityService` (noted in CONCERNS.md). Strapi 5 replaces this with `strapi.documents()` (the Document Service API). The method signatures are different: `entityService.findMany` → `documents('api::order.order').findMany`, and the filter/populate syntax changed slightly. Lifecycle hooks (`beforeCreate`, `afterCreate`, etc.) now receive a `context` object shaped differently from v4 — notably, the `data` property is nested differently and `result` in `after*` hooks is a Document, not an Entity.

**Why it happens:** Strapi 5 is a major version with breaking changes. Teams migrating from v4 or writing new code based on v4 patterns will hit these silently.

**Consequences:** Payment confirmation webhooks that write to Strapi using `entityService` will throw at runtime. Lifecycle hooks that read `event.params.data` may read undefined fields.

**Prevention:**
- All new payment-related Strapi controllers must use `strapi.documents('api::order.order').create({data: {...}})` exclusively.
- Do not use lifecycle hooks for payment fulfillment logic. Use explicit service methods called from webhook controllers. This avoids lifecycle hook shape uncertainty entirely.
- Run `strapi.documents()` calls in development first and log the return shape before writing production logic.

**Confidence:** HIGH — directly confirmed by existing CONCERNS.md (`strapi.entityService` deprecated note) and Strapi 5 migration guide known at training cutoff.

---

### Pitfall 10: Strapi Custom Route Permissions Default to Public — New Payment Endpoints Are Exposed

**What goes wrong:** When you add a new Strapi API (e.g., `api/order`, `api/payment-webhook`) via `strapi generate api`, the generated routes have no permissions assigned by default in the Strapi admin panel. Permissions must be manually set in Settings > Roles > Public/Authenticated after generation. Developers often test with public access and forget to restrict before go-live.

**Why it happens:** Strapi's permission model is managed in the admin UI, not in code by default. There is no code-level enforcement unless you write custom route middleware.

**Consequences:** `/api/orders` is publicly readable and writable. Anyone can create fake orders or read all order data.

**Prevention:**
- For webhook endpoints (called by payment gateways, not users), do not use Strapi's role-based permissions at all. Write them as custom Nitro server routes in Nuxt or as Strapi custom routes with `auth: false` protected instead by webhook signature validation middleware.
- For order creation/reading, restrict to `Authenticated` role only, and add owner-scoping so users can only read their own orders.
- Add a post-deploy checklist item: verify all payment-related Strapi routes have explicit permission configuration.

**Confidence:** HIGH — standard Strapi behavior, unchanged between v4 and v5 for permission management.

---

### Pitfall 11: JWT Cookie Vulnerability Amplified by Payment Context

**What goes wrong:** The existing codebase stores the JWT in a plain JavaScript-readable cookie (CONCERNS.md, line 10). Once payment is integrated, that JWT is used to authorise order creation, payment initiation, and order history. An XSS vulnerability (which becomes much more attractive once real money is involved) can steal the JWT and impersonate a user to initiate or cancel payments.

**Why it happens:** The cookie was set this way before payments were in scope. The risk was acceptable for a content platform; it is not acceptable when the JWT authorises financial transactions.

**Consequences:** Session hijacking leading to fraudulent order creation or order status manipulation.

**Prevention:** Fix the JWT cookie issue (CONCERNS.md recommendation) before adding payment routes. Set the cookie server-side with `HttpOnly; Secure; SameSite=Strict`. This must be a pre-payment prerequisite, not a future cleanup item.

**Confidence:** HIGH — directly derived from existing CONCERNS.md finding, severity escalated by payment context.

---

### Pitfall 12: Email Notification Sent Before Payment Confirmation Is Durable

**What goes wrong:** A common implementation sends the MJML/Mailgun confirmation email inside the webhook handler synchronously before returning a response to the gateway. If the email send fails or times out, the webhook handler returns a 5xx, the gateway retries, and the email is sent again on the retry (duplicate email). Alternatively, if the email is sent optimistically on the return URL page load (not the webhook), emails are sent for payments that were never actually confirmed.

**Why it happens:** "Send email on payment" feels like a single event. The two-phase nature of payment confirmation (redirect return + webhook) makes it ambiguous which event should trigger the email.

**Consequences:** Users receive 2-3 duplicate confirmation emails, or receive confirmation emails for failed payments.

**Prevention:**
- Canonical trigger for confirmation email: the webhook handler, after successfully committing the order to `CONFIRMED` status in the DB.
- Decouple email send from webhook response: mark the order as `CONFIRMED` and set `email_queued: true` in the DB within the webhook handler, return HTTP 200, then send the email in a background job or afterCommit DB hook.
- Use the idempotency key (Pitfall 4) to ensure the email is sent exactly once per order.

**Confidence:** HIGH — standard webhook processing pattern, applies equally to all three gateways.

---

### Pitfall 13: Transbank Certification Process Delays Production Launch

**What goes wrong:** Unlike Stripe and Mercado Pago, Transbank requires a manual certification process before issuing production credentials. You must run a defined set of test transactions (typically 10-15 specific scenarios including approved, rejected, timeout, and cancelled flows), capture logs/screenshots, and submit them to Transbank support. This process takes 3-10 business days and may require back-and-forth if any scenario fails.

**Why it happens:** Transbank is a bank-operated network (operated by a consortium of Chilean banks), not a startup SaaS. It operates like a financial institution, not a developer platform.

**Consequences:** If certification is not started early, the entire payment feature is blocked from going live even if the code is complete.

**Prevention:**
- Start the Transbank certification process at least 2 weeks before the intended launch date.
- Build the test scenario runner into the development environment: a page that walks through each required test case with the integration credentials.
- Designate one person to own the certification submission — it requires back-and-forth with Transbank support.

**Confidence:** MEDIUM — certification requirement is factual and well-known in Chilean dev circles. Timelines are estimates; verify current process at https://www.transbankdevelopers.cl/documentacion/como_empezar#proceso-de-afiliacion-y-contratacion.

---

## Minor Pitfalls

---

### Pitfall 14: Mercado Pago Sandbox Cards Are Country-Specific

**What goes wrong:** Mercado Pago operates in 18 countries with different test card numbers per country. Chilean test cards differ from Argentine or Mexican ones. Using the wrong country's test cards returns generic declines with no useful error message.

**Prevention:** Use the test cards listed specifically for `cl` (Chile) in the Mercado Pago developer portal. Bookmark the page for `https://www.mercadopago.cl/developers/es/docs/checkout-api/integration-test/test-cards`.

**Confidence:** MEDIUM — country-specific test card behavior is documented; specific URLs may have changed.

---

### Pitfall 15: Stripe Price IDs vs. Amount — Don't Pass Raw Amounts from the Client

**What goes wrong:** For single-price event publications, it is tempting to pass the price amount from the Nuxt frontend to the Strapi endpoint that creates the PaymentIntent: `POST /api/payment/stripe/create-intent { amount: 15000 }`. This allows a buyer to modify the amount in browser DevTools before submitting.

**Prevention:** The Strapi webhook/payment controller must look up the price from the Event record in the database using the `eventId`, never from the client request body. The client sends only `{ eventId: 'xxx' }`. The server fetches `event.price` and uses that to create the PaymentIntent.

**Confidence:** HIGH — standard payment security principle, independent of gateway choice.

---

### Pitfall 16: Nuxt 4 Server Routes for Webhooks — Nitro Body Size Limits

**What goes wrong:** Nitro (Nuxt's server engine) has default request body size limits. Stripe webhooks with large metadata objects or Mercado Pago notifications with full payment objects can exceed the default. The webhook silently fails with a 413 or truncated body.

**Prevention:** Configure `nitro.bodyParser` in `nuxt.config.ts` to increase limits for webhook routes, or handle raw body reading explicitly. Stripe events in particular can be large if they include full expanded objects.

**Confidence:** MEDIUM — Nitro body size default behavior is known; specific limits may vary by Nitro version.

---

### Pitfall 17: `populate=*` on Order Queries Exposes Unintended Relations

**What goes wrong:** The existing codebase already uses `populate=*` for all queries (CONCERNS.md). If Orders relate to Users, Events, and PaymentDetails, a `populate=*` on `/api/orders` will return nested user PII and full event data to whoever can query the endpoint — amplifying the scope of any authorization gap.

**Prevention:** Payment-related endpoints must use explicit, minimal populate specs. Define a dedicated `OrderSummary` populate config that includes only `event.title`, `event.price`, and `status` — never the full user object or payment method details.

**Confidence:** HIGH — directly derived from existing CONCERNS.md finding, compounded by payment data sensitivity.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Transbank initial integration | POST return URL (Pitfall 3), test credentials in prod (Pitfall 2) | Nitro `.post.ts` server route, startup env assertion |
| Webhook handlers (all gateways) | Duplicate fulfillment (Pitfall 4), raw body parsing (Pitfall 6), MP payload spoofing (Pitfall 5) | Idempotency table, `readRawBody()` for Stripe, re-fetch for MP |
| Multi-gateway abstraction | Forced unified interface (Pitfall 8) | Strategy pattern, thin shared interface |
| Strapi schema/controllers | `entityService` deprecated (Pitfall 9), permissions default open (Pitfall 10) | Use Document Service API, explicit role config |
| Security hardening pre-launch | CORS wildcard (Pitfall 7), JWT cookie (Pitfall 11), client-side price (Pitfall 15) | Fix CORS and JWT before any payment route goes live |
| Email notifications | Duplicate emails (Pitfall 12) | Decouple from webhook response, use idempotency key |
| Production certification | Transbank certification delay (Pitfall 13) | Start 2 weeks before target launch |
| Strapi query layer | `populate=*` on order endpoints (Pitfall 17) | Explicit populate specs for all payment routes |

---

## Pre-Payment Security Prerequisites

The following items from CONCERNS.md **must be resolved before any payment code is written**, because they directly amplify payment security risk:

1. **JWT cookie — set HttpOnly/Secure server-side** (CONCERNS.md line 10). The JWT will authorise financial transactions. XSS token theft becomes a direct financial attack vector.
2. **CORS wildcard removed** (CONCERNS.md line 21). Payment endpoints added to Strapi with `origin: '*'` are callable from any origin.
3. **Dashboard role enforcement re-enabled** (CONCERNS.md line 34). If any admin payment management UI is added, role bypass means any user can access it.
4. **Unrestricted API proxy path-through** (CONCERNS.md line 134). The Next.js proxy passes any path to Strapi. Payment routes added to Strapi are immediately reachable through the proxy with no allowlisting.

---

## Sources

All findings are from training data (cutoff August 2025). No live web sources were available during this session.

Authoritative sources to verify against before implementation:

- Transbank developer docs: https://www.transbankdevelopers.cl/documentacion/webpay-plus
- Transbank environments reference: https://www.transbankdevelopers.cl/referencia/webpay#ambientes
- Mercado Pago Chile docs: https://www.mercadopago.cl/developers/es/docs
- Stripe webhook best practices: https://stripe.com/docs/webhooks/best-practices
- Stripe raw body (Node.js): https://stripe.com/docs/webhooks/signatures
- Strapi 5 Document Service: https://docs.strapi.io/dev-docs/api/document-service
- Strapi 5 migration guide: https://docs.strapi.io/dev-docs/migration/v4-to-v5/overview
- Nitro body parsing: https://nitro.build/config#bodyparser
