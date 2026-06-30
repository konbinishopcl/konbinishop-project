# Codebase Concerns

**Analysis Date:** 2026-06-29

## Tech Debt

### Article images: 645 images still using `/uploads` paths (not migrated to Vercel Blob)

**Issue:** Post-migration to Vercel serverless + Neon Postgres, article images remain stored as local `/uploads/` file paths in the database:
- **269 featured images** (article.image field) stored as `/uploads/1780064689183-59efabc9ad8e.webp` etc.
- **376 gallery images** (articleImages.url field) similarly stored as `/uploads/...` paths
- Seed data in `apps/api/prisma/data/articles.json` contains 645 unmigrated paths
- Physical files on disk: **692 actual `.webp` files** in `apps/api/uploads/`

**Mechanism:** The `/api/media` proxy that `imageUrl()` expects to resolve at `apps/website/lib/api.ts:6-10` works locally and during SSR/preview (Next.js can reach the API), but **on Vercel production**, article images break because:
1. Frontend `imageUrl('/uploads/...')` converts to `/api/media/uploads/...`
2. Website's `apps/website/app/api/media/[...path]/route.ts` proxies to `${BACKEND_URL}/${path.join("/")}`
3. Backend's `apps/api/src/main.ts:46-48` only serves static assets via `app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/uploads' })` when `!process.env.VERCEL`
4. On Vercel, `process.env.VERCEL` is set → static handler disabled → `/api/uploads` returns 404 → cascades to frontend as broken images

**Current status:** Only **26 hero/event images** (2 heroes + 12 poster + 12 banner images from seed) are correctly stored in Vercel Blob (`https://2w45nhh8p6jdklcj.public.blob.vercel-storage.com/seed/`). Articles hardcode unmigrated paths.

**Files involved:**
- `apps/api/prisma/seed.ts:489-489` - Hero/event seed images correctly reference Blob URLs
- `apps/api/prisma/seed.ts:344` - Article seed stores `image: art.image` (the unmigrated `/uploads/` path)
- `apps/api/prisma/seed.ts:351` - Gallery images similarly stored raw as `url: string`
- `apps/api/src/uploads/uploads.service.ts:35-39` - New uploads correctly go to Vercel Blob
- `apps/api/src/main.ts:46-48` - Static handler disabled on Vercel
- `apps/website/app/api/media/[...path]/route.ts:3-28` - Proxy that expects `/api/uploads` to exist
- `apps/website/lib/api.ts:6-10` - `imageUrl()` function expects `/api/media/uploads/...` pattern

**Impact:** 
- Featured article images (269): missing/broken on Vercel production
- Gallery images (376): stored but possibly not displayed (template only renders featured image via `article.image`, not `articleImages` gallery)
- Users cannot see ~645 images worth of article content on production

**Fix approach:**
1. Write migration: read 645 `/uploads` paths from database, upload files to Vercel Blob (batch to avoid cold-start timeouts)
2. Update article records with new Blob URLs (`https://2w45nhh8p6jdklcj.public.blob.vercel-storage.com/uploads/...`)
3. Verify `imageUrl()` remains compatible (already handles `http://` paths)
4. Delete local `/uploads` directory post-migration or retain for local dev only (add to `.gitignore` if keeping)
5. Consider feature: render gallery (`articleImages`) in article detail view instead of storing orphaned data

---

## Security Considerations

### Stored XSS in article content via `dangerouslySetInnerHTML`

**Risk:** Article content rendered without HTML sanitization exposes stored XSS vector.

**Files:** 
- `apps/website/app/(site)/noticias/[slug]/ArticleView.tsx:175` - `dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}`
- `apps/website/app/(site)/noticias/[slug]/ArticleView.tsx:58-74` - `renderMarkdown()` function applies minimal escaping

**Current mitigation:** The `renderMarkdown()` function implements basic markdown (headers, blockquotes, bold/italic, code), BUT:
- No HTML escaping on input text: `<h2>${trimmed.slice(3)}</h2>` where `trimmed` is user-controlled
- No sanitization library (e.g., `DOMPurify`, `xss`): raw HTML tags in content pass through
- Content only comes from APPROVED articles (admin or authorized creator), which provides partial mitigation

**Trigger:** Admin/authorized user creates article with `<img src=x onerror="alert(1)">` in content → stored in database → renders on public article detail page

**Recommendation:** 
1. Add HTML sanitization library: `npm install isomorphic-dompurify` (or `xss`)
2. Wrap `renderMarkdown()` return with sanitizer: `DOMPurify.sanitize(html)`
3. OR adopt a markdown library with built-in XSS protection (e.g., `marked` + `marked-sanitize-html`)
4. Test with payload: `# Heading\n\n<img src=x onerror="console.log('xss')">`

---

### Loose CORS origin validation

**Risk:** CORS check uses substring match instead of exact comparison, allowing bypass.

**File:** `apps/api/src/main.ts:34-36`

**Code:**
```typescript
if (origin.includes('konbini-project-website') && origin.endsWith('.vercel.app')) return cb(null, true);
```

**Issue:** Substring `.includes()` matches `https://attacker-konbini-project-website-fake.vercel.app` because the subdomain contains the needle. Attacker-controlled Vercel preview URL could bypass CORS.

**Recommendation:** Use strict origin whitelist or regex:
```typescript
if (/^https:\/\/.+-konbini-project-website\.vercel\.app$/.test(origin)) return cb(null, true);
```

---

### Demo credentials file untracked in repo

**Risk:** `demo-credentials.md` exists at repo root (seen in git status) — unknown contents, possible secret leakage if committed.

**File:** `/home/gab/Code/konbini-project/demo-credentials.md` (EXISTENCE ONLY — content not read per forbidden policy)

**Current status:** Untracked (appears in `git status` with `??`), so not committed yet.

**Recommendation:** 
1. Verify file contains no actual API keys/tokens
2. If it's test/demo data only, add to `.gitignore`
3. If credentials are needed for development documentation, use template variables instead of literals

---

### Transbank sandbox secret in `.env.example`

**File:** `apps/api/.env.example:56-58` — contains `TRANSBANK_API_SECRET` and `TRANSBANK_COMMERCE_CODE` with literal sandbox values

**Current status:** This is the **public sandbox credential** (not production), so risk is low, but pattern is concerning.

**Recommendation:** Replace with placeholder comments or make clear these are sandbox-only. Real production credentials should never touch version control.

---

## Performance Bottlenecks

### Seed performance: ~645 article records created with sequential DB round-trips

**Problem:** `apps/api/prisma/seed.ts:331-378` seeds articles with chunking optimization (`CHUNK=20`), BUT each chunk still includes cascading operations:
- `article.upsert()` for each article (calls to Neon)
- `articleCategories.set()` (connection operation)
- `articleTags.connect()` (connection operation)
- `articleImages.create()` (nested creation for gallery)

**Files:** 
- `apps/api/prisma/seed.ts:330-378` - Article seeding loop with 20-article chunks
- `apps/api/prisma/seed.ts:203-210` - City seeding uses `Promise.all()` to parallelize 386 cities

**Current mitigation:** Cities seeded in parallel (`Promise.all(communes.map(...))`), articles seeded in 20-article chunks with `Promise.all(articlesData.slice(i, i + CHUNK).map(...))`.

**Impact:** Seed still takes minutes against Neon (previously experienced, mitigated with batching). Cold starts on Vercel first invoke may timeout.

**Improvement path:**
1. Increase `CHUNK` size if timeouts don't recur (current batch=20 is conservative)
2. Consider conditional skipping: if articles already exist, skip seed (idempotence)
3. Monitor first serverless invocation: `maxDuration: 60` in `apps/api/vercel.json` has headroom; consider reducing if consistently under 30s

---

### NestJS serverless cold starts

**Problem:** NestJS framework initialization (dependency injection, Prisma client setup, module loading) adds latency to first invocation on Vercel.

**File:** `apps/api/api/index.ts:9-14` - Caches app instance between invocations (optimization in place)

**Current mitigation:** 
- Fluid Compute (Vercel's dynamic concurrency) reuses process between requests → app initialized once per container, not per request
- `cached` handler stored in module scope; subsequent requests use cached instance
- Vercel serverless `maxDuration: 60s` in `apps/api/vercel.json` (1 min timeout is sufficient for seed/startup)

**Impact:** First request to a cold container still incurs ~2-5s initialization; subsequent requests < 100ms.

**Observation:** This is expected behavior; optimization is in place. Not a high-priority concern if acceptance SLA permits cold-start latency.

---

### Redis optional but interceptor silently swallows errors

**Problem:** HTTP cache interceptor (`apps/api/utils/cache/http-cache.interceptor.ts`) depends on Redis but degrades gracefully via `.catch(() => {})`.

**Files:**
- `apps/api/utils/cache/http-cache.interceptor.ts:48-52, 72-75` - `.catch()` handlers suppress Redis errors
- `apps/api/utils/redis/redis.service.ts:13-18` - Redis connection lazy but error logged

**Current behavior:**
- Cache `MISS` if Redis unavailable
- Public GET requests execute backend query without caching
- No visible error to client; server continues operating
- Admin/authorized users bypass cache anyway (line 57: `if (req.headers.authorization) return next.handle()`)

**Impact:** Graceful degradation working as designed. If Redis unavailable, site is slower but functional.

**Recommendation:** Log Redis errors explicitly for monitoring (already done in `redis.service.ts:17`).

---

## Fragile Areas

### Article moderation logic split across multiple files with incomplete permission checks

**Problem:** Permission checks for article modification scattered; potential for admin bypasses.

**Files:**
- `apps/api/src/articles/articles.service.ts:129-143` - `assertOwnerOrAdmin()` checks ownership
- `apps/api/src/articles/articles.controller.ts` - Route handlers call service methods
- `apps/api/src/articles/dto/update-article.dto.ts` - No embedded validation

**Why fragile:**
- `assertOwnerOrAdmin()` allows ADMIN/SUPER_ADMIN unconditionally; no resource-level gating
- `findById()` (line 113) has comment "NO gate of status" — used in approve/reject, which bypass publication status checks
- No audit trail for who approved/rejected/banned articles (approval tracked via `approvedById` but change history not logged)

**Safe modification:**
1. Add guard to reject mutation endpoints if not owner/admin
2. Log all article status changes to audit table (timestamp, user, old status → new status)
3. Add integration test for permission matrix (owner can edit own, admin can edit any, viewer cannot)

---

### Seed idempotence relies on `upsert` but doesn't handle data integrity across runs

**Problem:** `apps/api/prisma/seed.ts` is marked idempotent (comment line 2), but nuanced:
- `deleteMany()` on all tables (lines 164-181) → full data wipe every run
- Then `upsert` with `.create()` → if seed fails mid-run, state is partially deleted

**Files:** `apps/api/prisma/seed.ts:160-181`

**Impact:** If seed crashes after delete but before re-create, database is left empty.

**Safe approach:**
1. Run migrations first: `apps/api/src/main.ts:10` already includes `prisma migrate deploy`
2. Add transaction wrapper to seed if critical: `prisma.$transaction(async (tx) => { ... })`
3. Document: "Seed is destructive; only run in dev/test environments"

---

### Article gallery not displayed in UI

**Problem:** Articles seed stores `articleImages` (gallery) in 376 records via `apps/api/prisma/seed.ts:351`, but frontend only renders featured image.

**Files:**
- `apps/api/prisma/seed.ts:349-352` - Creates gallery images in DB
- `apps/website/app/(site)/noticias/[slug]/ArticleView.tsx:157-169` - Renders only `article.image` (featured)
- `apps/api/src/articles/articles.service.ts:34` - Query includes `articleImages: { orderBy: { order: 'asc' } }` in detail response

**Impact:** 376 images stored but orphaned; waste of storage quota and database space.

**Recommendation:**
1. Add gallery carousel component to `ArticleView.tsx` if UI design supports it
2. OR remove gallery from seed and schema if feature is not planned
3. Update API response to exclude `articleImages` if not consumed

---

## Scaling Limits

### Database connection pool: serverless edge case

**Issue:** Neon Postgres with pooler (`-pooler` endpoint) vs. direct connection (`DATABASE_URL` vs. `DIRECT_URL` in `apps/api/.env.example:8-10`).

**Files:** `apps/api/.env.example:8-10` and `apps/api/prisma/schema.prisma` (datasource config)

**Current:** Prisma configured for both:
- Runtime (queries): pooled connection `*-pooler` (low connection count, optimized for serverless)
- Migrations: direct connection `*` (full Postgres for DDL)

**Limit:** Neon pooler typically caps connections ~10-20 per deployment. With multiple concurrent Vercel functions, connection starvation could occur under load.

**Monitoring:** No explicit connection pool size limit logging. Add monitoring or consider Connection Pool warning in production.

**Improvement path:** If connection exhaustion occurs, migrate to Neon's new autoscaling pool or reduce concurrent requests with rate limiting.

---

## Test Coverage Gaps

### No test coverage for Redis cache interceptor

**Untested area:** `apps/api/utils/cache/http-cache.interceptor.ts` — HTTP caching logic, cache invalidation patterns

**Files:** `apps/api/utils/cache/http-cache.interceptor.ts`

**Risk:** Cache invalidation bugs (e.g., wrong pattern in `deletePattern()`) could cause stale data to persist across mutations.

**Example gap:** `deletePattern('http:articles:*')` invalidates on article create, but if tag-filtered queries exist (`/articles?articleTag=anime`), they cache separately — updating article status might not invalidate all related caches.

**Recommendation:**
1. Write interceptor tests:
   - Cache miss → executes handler, caches result
   - Cache hit → returns cached response
   - POST/PUT/DELETE → invalidates pattern
   - Authorized requests → no caching
2. Test edge case: article update with multiple tag filters

---

### No E2E tests for article publishing workflow

**Untested area:** Full article creation, approval, publication, and image rendering pipeline

**Files:**
- `apps/api/src/articles/articles.service.ts` (service logic)
- `apps/api/src/articles/articles.controller.ts` (endpoints)
- `apps/website/app/(site)/noticias/[slug]/ArticleView.tsx` (rendering)

**Risk:** Changes to approval status logic or image URL handling could silently break article display without test coverage.

**Recommendation:**
1. Add E2E test scenario:
   - Create article with title + featured image + gallery
   - Verify image upload stores URL in DB
   - Approve article via admin endpoint
   - Fetch article via public API
   - Render in Playwright and verify image `src` attribute is correct URL
   - Verify gallery images (if implemented) display

---

### No tests for article moderation edge cases

**Untested area:** Permission checks in `articles.controller.ts` and `articles.service.ts`

**Gap examples:**
- Admin editing another user's article (should be allowed)
- User editing their own article after rejection (should be allowed)
- User approving their own article (should NOT be allowed, only admin)
- Orphan (userId=null) article edited by non-admin (should fail)

**Recommendation:** Write permission matrix test covering role × resource ownership × action combinations.

---

## Missing Critical Features

### No image optimization or fallback strategy for broken images

**Problem:** Articles now depend on two image storage backends (unmigrated `/uploads` on-disk vs. Vercel Blob for new uploads), with no fallback if one is inaccessible.

**Files:**
- `apps/website/app/(site)/noticias/[slug]/ArticleView.tsx:157-169` - Falls back to gradient div if `article.image` is missing, but no fallback if URL 404s after fetch

**Impact:** Broken image on article detail (gradient shows but title/content is confusing without visual context).

**Recommendation:**
1. Migrate all `/uploads` paths to Blob (see Tech Debt #1)
2. Add `onError` handler to `<img>` tags to show fallback placeholder
3. Client-side image validation: ping URL in `<head>` to pre-detect 404s before render

---

## Known Bugs

### (None explicitly marked as bugs in code comments)

Code review found no `// BUG:` or explicit issue markers beyond the TODOs and architectural concerns listed above.

---

---

*Concerns audit: 2026-06-29 — Post MySQL→Neon + Vercel serverless migration*
