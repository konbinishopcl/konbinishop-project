# Codebase Concerns

**Analysis Date:** 2026-03-23

---

## Security Considerations

**JWT Cookie Missing HttpOnly and Secure Flags:**
- Risk: JWT stored in a plain `document.cookie` without `HttpOnly` or `Secure` flags, making it readable by JavaScript and vulnerable to XSS token theft.
- Files: `apps/dashboard/src/lib/strapi/auth.ts` (line 88)
- Current mitigation: None — cookie is set as `document.cookie = \`${cookieName}=${response.jwt}; path=/; max-age=...\``
- Recommendations: Set cookie server-side using a Next.js API route with `HttpOnly; Secure; SameSite=Strict` attributes.

**Stats Endpoint is Publicly Unauthenticated:**
- Risk: The `/api/stats` endpoint exposes full system statistics (user counts, content counts, event data) without requiring authentication.
- Files: `apps/strapi/src/api/stats/routes/stats.ts` (line 12: `auth: false`)
- Current mitigation: None
- Recommendations: Add authentication to the stats route, or scope it to dashboard-role users only.

**CORS Wildcard on Strapi (`origin: ['*']`):**
- Risk: Strapi accepts requests from any origin with credentials enabled, which could allow cross-origin requests from malicious sites.
- Files: `apps/strapi/config/middlewares.ts` (line 9: `origin: ['*']`)
- Current mitigation: None
- Recommendations: Restrict `origin` to known domain(s) such as the dashboard and website URLs.

**Sentry DSN Hardcoded in Source:**
- Risk: The Sentry DSN for both Strapi and the website are hardcoded as string literals in committed source files, not loaded from environment variables.
- Files: `apps/strapi/config/plugins.ts` (line 10), `apps/website/nuxt.config.ts` (line 23)
- Current mitigation: DSN itself is not a secret key, but embedding it can lead to abuse (spam events to Sentry project).
- Recommendations: Move DSNs to environment variables.

**Dashboard Role Enforcement Disabled:**
- Risk: Role-based access control for the admin dashboard is fully commented out. Any valid Strapi user (including end-users of the public website) can log in to the dashboard. The `hasDashboardRole()` function unconditionally returns `true`.
- Files: `apps/dashboard/src/lib/stores/useUserStore.ts` (line 88), `apps/dashboard/src/lib/strapi/auth.ts` (lines 78-82), `apps/dashboard/src/app/dashboard/layout.tsx` (lines 52-58, 112-138), `apps/dashboard/src/middleware.ts` (lines 48-57)
- Current mitigation: None — the role check `validateUserRole()` does run at login (`StrapiAuth.validateUserRole()` in `form-login.tsx`), but the in-app guards are bypassed entirely.
- Recommendations: Re-enable the role check in `useUserStore.setUser`, `hasDashboardRole`, and the layout guard. Remove commented-out blocks and restore enforcement.

**Hardcoded Username Blocklist (brittle security):**
- Risk: The layout uses a hardcoded name/username check (`user.firstname === 'Prueba' || user.username === 'jokukapi'`) to force logout a specific test user. This is not a scalable or secure access control mechanism.
- Files: `apps/dashboard/src/app/dashboard/layout.tsx` (lines 44-50)
- Current mitigation: Only blocks one specific user by name
- Recommendations: Remove this specific-user blocklist. Reinstate proper role-based guards.

**Dev Mode Password with Hardcoded Fallback:**
- Risk: The website dev-mode login falls back to hardcoded credentials (`konbinishop` / `konbinishopdev`) if env vars are not set.
- Files: `apps/website/nuxt.config.ts` (lines 12-13: `devUsername: process.env.DEV_USERNAME || 'konbinishop'`)
- Current mitigation: Only affects `devMode === true` environments; prod should not have this enabled.
- Recommendations: Remove hardcoded fallback credentials; throw an error if vars are missing when `devMode` is true.

---

## Tech Debt

**Role Check Code Commented Out Across Multiple Files:**
- Issue: Large blocks of role-validation logic are commented out in at least four files with no clear plan to restore them. Dead code is mixed with live code, making auth flow hard to reason about.
- Files: `apps/dashboard/src/lib/stores/useUserStore.ts`, `apps/dashboard/src/lib/strapi/auth.ts`, `apps/dashboard/src/app/dashboard/layout.tsx`, `apps/dashboard/src/middleware.ts`
- Impact: All dashboard routes are accessible to any authenticated Strapi user; no role isolation.
- Fix approach: Restore the `role.type === 'dashboard'` check in `validateUserRole` and the `hasDashboardRole` guard; remove the commented-out blocks.

**Pervasive `unknown` Return Types in API Layer:**
- Issue: Nearly every method in `StrapiAPI` returns `unknown[]`, `{ data: unknown }`, or `unknown` instead of typed responses. Type casting (`as Hero[]`, `as Array<...>`) is scattered in consumer pages.
- Files: `apps/dashboard/src/lib/strapi/api.ts` (lines 171, 213, 267, 294, 333, 360, 395, 422, 455, 520, 580, 642)
- Impact: Loss of type safety throughout the entire dashboard; runtime errors are not caught at compile time.
- Fix approach: Define typed response interfaces for each content type and propagate them through the API class return types.

**`populate=*` Used for All API Queries:**
- Issue: Every list and detail fetch uses `populate=*` which retrieves all nested relations in a single query, fetching far more data than is displayed.
- Files: `apps/dashboard/src/lib/strapi/api.ts` (16 occurrences)
- Impact: Over-fetching of data on every page load; increased payload size and Strapi DB query cost.
- Fix approach: Replace `populate=*` with explicit field-level populate specs (e.g., `populate[categories][fields][]=name`).

**`pageSize=1000` Used as Workaround for Select Dropdowns:**
- Issue: Form pages fetch up to 1000 records for categories, regions, communes, events, tags, and heroes to populate select dropdowns. This is a workaround for the absence of a proper search/autocomplete component.
- Files: `apps/dashboard/src/app/dashboard/heroes/create/page.tsx`, `apps/dashboard/src/app/dashboard/heroes/[documentId]/edit/page.tsx`, `apps/dashboard/src/app/dashboard/articles/create/page.tsx`, `apps/dashboard/src/app/dashboard/articles/[documentId]/edit/page.tsx`, `apps/dashboard/src/app/dashboard/users/[id]/page.tsx`
- Impact: Page load requires fetching hundreds of records on every open; will slow down as data grows.
- Fix approach: Replace with server-side search/autocomplete using a debounced query against the Strapi API.

**`strapi.entityService` Used (Deprecated in Strapi v5):**
- Issue: The stats controller uses `strapi.entityService.count()`, which is deprecated in Strapi v5 in favour of `strapi.documents()`.
- Files: `apps/strapi/src/api/stats/controllers/stats.ts` (10 occurrences)
- Impact: Will break on Strapi v5 upgrade; currently works on Strapi v4.
- Fix approach: Migrate to the Strapi v5 Document Service API.

**Custom Middlewares Commented Out in Production Config:**
- Issue: Two custom middlewares (`auth-error-logger`, `auth-response`) are implemented but commented out in the active middleware stack.
- Files: `apps/strapi/config/middlewares.ts` (lines 21-22), `apps/strapi/src/middlewares/auth-error-logger.ts`, `apps/strapi/src/middlewares/auth-response.ts`
- Impact: The `auth-response` middleware enriches login responses with the user's role object; without it, the role may not be included in login responses when `validateUserRole` is called.
- Fix approach: Decide whether these middlewares are needed, uncomment or delete them.

---

## Known Bugs

**ETag Generated with `Date.now()` Breaks Cache Semantics:**
- Symptoms: Every request to the media proxy endpoint generates a new ETag value, which defeats the purpose of ETags for conditional caching. Clients can never use `If-None-Match` to get a `304 Not Modified`.
- Files: `apps/dashboard/src/app/api/media/[...path]/route.ts` (lines 55, 121)
- Trigger: Any request to `/api/media/[...path]`
- Workaround: None — cache headers say `immutable` but ETag changes every request, causing inconsistency.

**Hero Edit Page Leaves Debug `console.log` Calls in Production Code:**
- Symptoms: Loading the hero edit page emits 7 `console.log` statements including full API response payloads, which can be a minor performance hit and exposes internal data structure in browser DevTools.
- Files: `apps/dashboard/src/app/dashboard/heroes/[documentId]/edit/page.tsx` (lines 78-89)
- Trigger: Navigating to any hero edit page
- Workaround: Remove the debug lines.

**Search Component Is a Non-Functional Stub:**
- Symptoms: `SearchDefault.vue` renders a search form with a submit handler that does nothing (`// TODO: Implementar búsqueda`). Users who interact with it get no response.
- Files: `apps/website/components/SearchDefault.vue` (line 17)
- Trigger: Submitting the search form on any page that uses `SearchDefault`
- Workaround: None

---

## Performance Bottlenecks

**Stats Endpoint Makes 14 Sequential/Parallel DB Count Queries per Request:**
- Problem: Every dashboard home page load triggers 14 `entityService.count()` calls to Strapi.
- Files: `apps/strapi/src/api/stats/controllers/stats.ts`
- Cause: No caching layer; counts recalculate on every request.
- Improvement path: Add short-lived server-side cache (e.g., 60 second TTL in-memory or Redis), or move counts to a scheduled job.

**Media Proxy Buffers Full Image in Memory Before Streaming:**
- Problem: The media proxy reads the entire upstream image into memory (`await response.arrayBuffer()`) before processing and responding, which could cause high memory usage with large images or many concurrent requests.
- Files: `apps/dashboard/src/app/api/media/[...path]/route.ts` (line 44)
- Cause: Sharp requires a full buffer, but no size limits or concurrent request caps are in place.
- Improvement path: Add max image size validation before buffering; consider streaming directly when no transformation is needed.

---

## Fragile Areas

**Next.js API Proxy Is an Unrestricted Pass-Through:**
- Files: `apps/dashboard/src/app/api/[...path]/route.ts`
- Why fragile: The proxy passes any path segment to `STRAPI_BASE_URL/api/{path}` without validation or allowlisting. A client can construct a request to hit any Strapi API endpoint, including admin endpoints, if they have a valid JWT. There is no path sanitization.
- Safe modification: Add an allowlist of permitted path prefixes before forwarding.
- Test coverage: None

**Zustand Store Clears `localStorage` on Every `setUser` Call:**
- Files: `apps/dashboard/src/lib/stores/useUserStore.ts` (lines 65-67)
- Why fragile: Calling `localStorage.removeItem('user-storage')` before `set({user, isAuthenticated: true})` creates a brief window where no user is stored. If anything reads from storage between the remove and the next persist cycle, it will see an unauthenticated state.
- Safe modification: Remove the manual `localStorage.removeItem` call; let Zustand persist handle storage consistently.
- Test coverage: None

**Debug Auth Component Exposed in Codebase:**
- Files: `apps/dashboard/src/components/debug-auth.tsx`
- Why fragile: Component displays JWT presence, user ID, email, and a token prefix in a fixed overlay. If rendered on a production page it leaks auth state to anyone who views the page source or UI.
- Safe modification: Verify the component is never mounted in production routes. Consider deleting it or gating it behind `process.env.NODE_ENV === 'development'`.
- Test coverage: None

**Settings Page Is an Empty Placeholder:**
- Files: `apps/dashboard/src/app/dashboard/settings/page.tsx`
- Why fragile: The settings page is a stub with placeholder text ("Esta página estará disponible próximamente."). Any feature depending on system settings has no implementation path.
- Safe modification: Implement or remove the settings menu item from the sidebar.
- Test coverage: None

---

## Test Coverage Gaps

**No Tests Exist in Any App:**
- What's not tested: The entire codebase — zero test files were found across `apps/dashboard`, `apps/website`, and `apps/strapi`.
- Files: All source files across the monorepo.
- Risk: Any regression in auth flow, API proxy logic, form validation, or Strapi controllers will not be caught before deployment.
- Priority: High — particularly for auth logic, API proxy, and form submission flows.

---

## Missing Critical Features

**Search Functionality Not Implemented:**
- Problem: The `SearchDefault.vue` component renders a search UI but the handler is an empty stub.
- Blocks: Users cannot search for content on the public website.

**Settings Page Not Implemented:**
- Problem: The dashboard settings page shows a "coming soon" placeholder.
- Blocks: Any admin configuration or preference management features.

**GTM ID Falls Back to `GTM-XXXXXXXX` Placeholder:**
- Problem: If the `GTM_ID` environment variable is not set, the website injects a script tag pointing to a placeholder container ID.
- Files: `apps/website/nuxt.config.ts` (line 19), `apps/website/plugins/gtm-head.client.ts` (line 9)
- Blocks: Analytics events will not track in environments where the variable is absent.

---

*Concerns audit: 2026-03-23*
