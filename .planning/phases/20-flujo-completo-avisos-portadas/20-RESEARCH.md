# Phase 20: Flujo completo de Avisos y Portadas — Research

**Researched:** 2026-05-28
**Domain:** Next.js frontend form wiring + NestJS API integration (Spots/Heroes)
**Confidence:** HIGH — all findings verified against source files in this repo

---

## Summary

The backend for Spots and Heroes is 100% implemented and correct. Every endpoint
needed by this phase (create, list-mine, list-admin via `GET /spots`+`GET /heroes`,
approve, reject, ban, quota) exists and works. The gap is purely frontend:
(1) form submissions send wrong fields and are missing image upload;
(2) `lib/api.ts` has no `ApiSpot` type and no spot/hero methods;
(3) `SpotsSection` and `HeroesSection` in the dashboard use 100% mock data
with empty action callbacks.

The only backend change needed is adding admin-level query-param filtering to
`GET /spots` and `GET /heroes` (mirroring the `?status=` pattern that already
exists on `GET /events`). This is a small service-layer change, not a new endpoint.

**Primary recommendation:** Fix frontend-first, add the one backend query filter,
then wire the two dashboard sections to real data using the ArticlesSection pattern.

---

## Standard Stack

All libraries are already installed. No new dependencies are needed.

| Library | Purpose | Already used |
|---------|---------|--------------|
| `zod` | Form validation, per-field errors | Yes (EventForm) |
| `sonner` (toast) | User feedback | Yes (all forms) |
| `api.uploadImage` in `lib/api.ts` | Multipart file upload to `POST /api/upload` | Yes — wired and ready |
| `useUser()` from providers | Auth token access in client components | Yes |
| `useRouter` from next/navigation | Post-submit redirect | Yes |

---

## Architecture Patterns

### Days flow — the full picture (verified)

The form's "días" slider value does NOT go into `POST /spots` or `POST /heroes`.
Those endpoints accept no `days` field. Instead:

```
1. POST /spots → returns { id, status: "DRAFT", ... }
2. POST /orders/:orderId/items → { type: "SPOT", spotId, days } ← days go here
3. Payment confirmed → activateOrderItems() writes days + amount + expirationDate
   back to the Spot/Hero row and sets status = PENDING_MODERATION
```

**Implication for forms:** The form submit should:
1. Upload image → get URL
2. `POST /spots` (or `/heroes`) → get the DRAFT id
3. `POST /orders/{cartId}/items` with `{ type: "SPOT", spotId: id, days }` → adds to cart
4. Redirect to `/carrito`

The current forms skip steps 1 and 3 entirely. The `days` field in the form must
be forwarded to the cart add-item call, not to the create call.

### Admin list — no new endpoint needed (verified)

`GET /spots` and `GET /heroes` currently return only APPROVED+non-expired items
(public view). `GET /events` solved this by checking `user.role` and accepting
`?status=` query param — the single endpoint serves both public and admin views.

The backend needs the same pattern added to SpotsService.findAll and HeroesService.findAll
(currently named `findActive`). The planner must include a Wave 1 backend task for this.

### Image upload pattern (established, copy from EventForm)

```typescript
// Source: apps/website/app/(site)/crear/EventForm.tsx (existing pattern)
const handleImageUpload = async (file: File, field: "image") => {
  if (!token) return;
  try {
    const { url } = await api.uploadImage(file, token);
    setImageUrl(url); // store the returned URL path in form state
  } catch (ex) {
    toast.error(ex instanceof Error ? ex.message : "Error al subir imagen");
  }
};

// In JSX — replace the static .upload-box div with:
<div className="upload-box" onClick={() => fileInputRef.current?.click()}>
  {imageUrl ? (
    <img src={imageUrl(spotImage)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  ) : (
    <>
      <div className="ic">{Ic.upl}</div>
      <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>Sube una imagen</div>
      <small>JPG / PNG · 1200×1500 mín · máx 5MB</small>
    </>
  )}
  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={...} />
</div>
```

### Zod validation pattern (established, copy from EventForm)

```typescript
// Source: EventForm pattern — errors displayed below each field
const [errors, setErrors] = useState<Record<string, string>>({});

const SpotSchema = z.object({
  title:     z.string().min(2, "Mínimo 2 caracteres").max(120, "Máximo 120 caracteres"),
  image:     z.string().min(1, "La imagen es requerida"),
  linkType:  z.enum(["URL", "PHONE", "EMAIL"]),
  linkValue: z.string().min(3, "El enlace es requerido"),
  days:      z.number().int().min(10, "Mínimo 10 días"),
});

// Per-field error display:
{errors.title && <div className="field-error">{errors.title}</div>}
```

### Dashboard section pattern (established — ArticlesSection)

SpotsSection and HeroesSection must follow the exact shape of ArticlesSection:
- `useCallback` fetch with AbortController
- `useEffect` triggers on token/page/filter changes
- Status filter chips map to `?status=` API param
- Actions call `PATCH /spots/:id/approve|reject|ban` and refetch

---

## Prescriptive Decisions

### SPOT — fields to keep, fields to remove

**Remove from frontend (not in Prisma model or backend DTO):**
- `description` — no such column; remove the input from forms
- `buttonText` — no such column; remove the input from forms
- `days` slider value goes to `POST /orders/:id/items`, NOT to `POST /spots`

**Keep in frontend (these map 1:1 to CreateSpotDto):**
- `title` — string, required, 2–120 chars
- `image` — string (URL from upload), optional in DTO but required in form UX
- `linkType` — enum `URL | PHONE | EMAIL` (uppercase, see mapping below)
- `linkValue` — string, required, min 3 chars

### linkType mapping — frontend → backend

Frontend UI shows 4 pills: `url | internal | email | tel`.
Backend enum `SpotLinkType` has only 3 values: `URL | PHONE | EMAIL`.

**Decision: drop the "URL interna" pill.** The design has it but the schema
does not support it (adding `INTERNAL` to the enum requires a migration and is
out of scope). The `SITE_HOST` prefix affordance was speculative UI.

Mapping at submit time:
```
"url"   → "URL"
"email" → "EMAIL"
"tel"   → "PHONE"
// "internal" pill is removed
```

### HERO — field naming fix

Frontend uses `subtitle` as the state variable name for what the backend calls
`titleAccent`. The JSON body must send `titleAccent`, not `subtitle`.

**Fix:** rename the state variable OR map at submit:
```typescript
body: JSON.stringify({
  title: heroTitle.trim(),
  titleAccent: heroSubtitle.trim() || undefined, // was sending "subtitle"
  ...
})
```

Hero image is REQUIRED in CreateHeroDto (`@IsString() @MinLength(3)`). The form
must not allow submit without an uploaded image.

### Admin endpoint — backend change required

`GET /spots` and `GET /heroes` currently accept no query params. Add:

```typescript
// In SpotsController:
@Get()
findAll(@Query() query: QuerySpotsDto, @CurrentUser() user: JwtUser | null) {
  return this.spots.findAll(query, user);
}

// In SpotsService:
findAll(query: { status?: PublicationStatus; page?: number; pageSize?: number }, user: JwtUser | null) {
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const where = isAdmin
    ? (query.status ? { status: query.status } : { status: { not: PublicationStatus.PENDING_PAYMENT } })
    : { status: PublicationStatus.APPROVED, OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }] };
  ...
}
```

Mirror exactly what EventsService.findAll does.

### Days slider — use quota endpoint, not hardcoded limits

Fetch from `GET /spots/quota` and `GET /heroes/quota` to get `maxDays` at mount.
Slider max = `quota.maxDays`. Min = 10 (hardcode is acceptable since there is no
`SPOT_MIN_DAYS` setting in the DB and adding one is out of scope).

---

## lib/api.ts Additions Required

### ApiSpot type (missing entirely)

```typescript
export type ApiSpot = {
  id: number;
  title: string;
  image: string | null;
  linkType: "URL" | "PHONE" | "EMAIL";
  linkValue: string;
  status: "DRAFT" | "PENDING_PAYMENT" | "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED";
  statusReason: string | null;
  days: number | null;
  amount: number | null;
  expirationDate: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: number;
    firstname: string | null;
    lastname: string | null;
    email: string;
  } | null;
};
```

### ApiHero type update (already exists but incomplete)

Current `ApiHero` in lib/api.ts is missing:
- `status`
- `statusReason`
- `userId`
- `createdAt`
- `owner`

Add these fields to complete it for dashboard use.

### Quota type

```typescript
export type ApiQuota = {
  max: number;
  active: number;
  available: number;
  pricePerDay: number;
  maxDays: number;
};
```

### api.ts methods to add

```typescript
// Spots
spotsQuota: () => request<ApiQuota>("/spots/quota"),
mySpots: (token: string) => request<ApiSpot[]>("/spots/mine", {}, token),
adminSpots: (token: string, query?: { status?: string; page?: number; pageSize?: number }) =>
  request<ApiSpot[]>(`/spots${qs(query ?? {})}`, {}, token),
createSpot: (body: { title: string; image?: string; linkType: string; linkValue: string }, token: string) =>
  request<ApiSpot>("/spots", { method: "POST", body: JSON.stringify(body) }, token),
approveSpot: (id: number, token: string) =>
  request<ApiSpot>(`/spots/${id}/approve`, { method: "PATCH" }, token),
rejectSpot: (id: number, reason: string, token: string) =>
  request<ApiSpot>(`/spots/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }, token),
banSpot: (id: number, reason: string, token: string) =>
  request<ApiSpot>(`/spots/${id}/ban`, { method: "PATCH", body: JSON.stringify({ reason }) }, token),

// Heroes
heroesQuota: () => request<ApiQuota>("/heroes/quota"),
myHeroes: (token: string) => request<ApiHero[]>("/heroes/mine", {}, token),
adminHeroes: (token: string, query?: { status?: string; page?: number; pageSize?: number }) =>
  request<ApiHero[]>(`/heroes${qs(query ?? {})}`, {}, token),
createHero: (body: { title: string; titleAccent?: string; lead?: string; image: string; date?: string; place?: string; link?: string; eventCategoryId?: number }, token: string) =>
  request<ApiHero>("/heroes", { method: "POST", body: JSON.stringify(body) }, token),
approveHero: (id: number, token: string) =>
  request<ApiHero>(`/heroes/${id}/approve`, { method: "PATCH" }, token),
rejectHero: (id: number, reason: string, token: string) =>
  request<ApiHero>(`/heroes/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }, token),
banHero: (id: number, reason: string, token: string) =>
  request<ApiHero>(`/heroes/${id}/ban`, { method: "PATCH", body: JSON.stringify({ reason }) }, token),
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| File upload UI | Custom drag-drop, XHR progress | `api.uploadImage(file, token)` already in lib/api.ts |
| Form validation | Manual if/else chains | Zod schema + `safeParse`, same pattern as EventForm |
| Error feedback | Custom toast system | `sonner` (already imported) |
| Approve/reject modals | New modal system | Copy the AdminApproveModal / AdminRejectModal already in SpotsSection — they just need wired callbacks |
| Days slider | Re-implementing or hardcoding limits | `/spots/quota` and `/heroes/quota` return `maxDays` |

---

## Common Pitfalls

### Pitfall 1: Sending wrong fields to POST /spots

**What goes wrong:** Sending `description`, `buttonText`, `days` to `POST /spots`.
Backend silently ignores them (class-validator strips extra fields), but `days` in the
wrong place means the OrderItem is never created and the item never goes to the cart.

**How to avoid:** `POST /spots` = `{ title, image?, linkType, linkValue }` only.
Days go to `POST /orders/:id/items` as `{ type: "SPOT", spotId: <returned id>, days }`.

### Pitfall 2: Sending "subtitle" instead of "titleAccent" to POST /heroes

**What goes wrong:** UpsellView.tsx HeroForm sends `subtitle: ...` in the JSON body.
Backend ignores unknown fields so the hero is created with `titleAccent: null`.

**How to avoid:** Map the state variable at serialization: `titleAccent: subtitle.trim() || undefined`.

### Pitfall 3: Submitting hero form without image

**What goes wrong:** Hero image is `@IsString() @MinLength(3)` — REQUIRED in the backend DTO.
A submit without an uploaded image returns HTTP 400 with a class-validator error message.

**How to avoid:** Zod schema must include `image: z.string().min(3, "La imagen es requerida")`.
The submit button must be disabled until upload is complete.

### Pitfall 4: linkType casing mismatch

**What goes wrong:** Frontend state is lowercase (`"url"`, `"email"`, `"tel"`).
Backend enum is uppercase (`URL`, `EMAIL`, `PHONE`). Sending lowercase fails
class-validator `@IsEnum(SpotLinkType)`.

**How to avoid:** Map at submit:
```
"url" → "URL", "email" → "EMAIL", "tel" → "PHONE"
```

### Pitfall 5: Dashboard sections fetch without admin token behavior

**What goes wrong:** `GET /spots` without changes only returns APPROVED+non-expired (public view).
Admin users calling the current endpoint see only active spots, not the moderation queue.

**How to avoid:** Backend change is required first (Wave 1). Dashboard fetch only works
after `SpotsService.findAll` is updated to respect `user.role` and `?status=` param.

### Pitfall 6: Ban action sends no reason body

**What goes wrong:** `PATCH /spots/:id/ban` and `PATCH /heroes/:id/ban` both accept
`RejectEventDto` with `{ reason: string }` where reason must be >= 3 chars. The current
ConfirmDialog in SpotsSection has no reason input — it only requires typing "BANEAR".

**How to avoid:** The ban modal must collect a reason. Simplest approach: reuse the
AdminRejectModal with kind="aviso" / kind="portada" and wire it to the ban endpoint.
Or add a reason textarea inside ConfirmDialog for the ban case.

---

## Validation Architecture

`nyquist_validation: true` in config.json.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Not detected — no test files exist for frontend forms or dashboard sections |
| Config file | None found |
| Quick run | N/A — no test infrastructure for this layer |
| Full suite | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Status |
|--------|----------|-----------|-------------------|--------|
| SPOT-01 | POST /spots sends correct DTO | manual smoke | curl POST /api/spots | No file |
| SPOT-02 | Image upload wired | manual | UI test upload | No file |
| SPOT-03 | Zod errors shown per-field | manual | fill form wrong | No file |
| SPOT-04 | Days forwarded to cart add-item | manual | check cart after submit | No file |
| SPOT-05 | Admin spot list shows all statuses | manual | login admin, open dashboard | No file |
| SPOT-06..10 | Approve/reject/ban call real API | manual | click buttons in dashboard | No file |
| HERO-01..08 | Mirror of SPOT requirements | manual | same as above | No file |

### Wave 0 Gaps

There is no automated test infrastructure for the website client-side forms or dashboard
sections. All validation for this phase is manual smoke testing.

- No Wave 0 test files needed — this is UI-only work with no pure-function extraction.
- Gate before `/gsd:verify-work`: manual checklist (see Open Questions below).

---

## Open Questions

1. **Ban modal reason collection**
   - What we know: `/spots/:id/ban` requires `{ reason }` (min 3 chars)
   - What's unclear: Current ConfirmDialog in SpotsSection has no reason input
   - Recommendation: Reuse AdminRejectModal for ban action (just change the title/copy),
     or add an optional reason field to ConfirmDialog when `requireReason=true`

2. **"URL interna" linkType in UpsellView**
   - What we know: Design has the pill, backend enum does not have `INTERNAL`
   - What's unclear: Does the product owner want to support internal links at all?
   - Recommendation: Remove the "URL interna" pill from both CreateProductView and UpsellView.
     If needed in future, add `INTERNAL` to the SpotLinkType enum via migration.

3. **adminSpots / adminHeroes — paginated or flat array?**
   - What we know: `GET /events` returns paginated `{ items, total, page, pageSize, totalPages }`.
     `GET /spots` currently returns a flat array.
   - Recommendation: Match the events pattern — return paginated shape from the updated
     `findAll` for admin, or accept that SpotsSection fetches all and paginates client-side
     (simpler, acceptable for small datasets). Lock this in Wave 1 backend task.

---

## Sources

### PRIMARY (HIGH confidence — read directly from repo source)

- `apps/api/src/spots/spots.controller.ts` — all spot endpoints confirmed
- `apps/api/src/spots/spots.service.ts` — create(), approve(), reject(), ban() logic
- `apps/api/src/spots/dto/create-spot.dto.ts` — exact DTO fields: `{ title, image?, linkType, linkValue }`
- `apps/api/src/heroes/heroes.controller.ts` — all hero endpoints confirmed
- `apps/api/src/heroes/heroes.service.ts` — create(), approve(), reject(), ban() logic
- `apps/api/src/heroes/dto/create-hero.dto.ts` — exact DTO fields: `{ title, titleAccent?, lead?, image, date?, place?, link?, eventCategoryId? }`
- `apps/api/src/orders/orders.service.ts` — days flow: AddItemDto.days → OrderItem
- `apps/api/src/payments/payments.service.ts` — activateOrderItems() writes days+expirationDate to Spot/Hero
- `apps/api/src/events/events.service.ts` — admin filter pattern: `?status=` + role check
- `apps/api/prisma/schema.prisma` — Spot model (no description/buttonText columns), Hero model
- `apps/website/lib/api.ts` — ApiHero exists (missing fields), ApiSpot missing entirely
- `apps/website/app/(site)/crear-producto/[kind]/CreateProductView.tsx` — current broken form
- `apps/website/app/(site)/upsell/UpsellView.tsx` — current broken upsell forms
- `apps/website/app/dashboard/sections/SpotsSection.tsx` — mock-only, confirmed
- `apps/website/app/dashboard/sections/HeroesSection.tsx` — mock-only, confirmed
- `apps/website/app/dashboard/sections/ArticlesSection.tsx` — reference pattern for real data

---

## Metadata

**Confidence breakdown:**
- Backend API shape: HIGH — read from source
- Days flow: HIGH — traced through OrdersService + PaymentsService source
- Frontend patterns: HIGH — read from existing ArticlesSection and EventForm
- Admin list query params: HIGH — confirmed missing from SpotsController, confirmed present in EventsController
- UI design contract: HIGH — read from design/Konbini.html

**Research date:** 2026-05-28
**Valid until:** 2026-07-01 (stable codebase, no external dependencies)
