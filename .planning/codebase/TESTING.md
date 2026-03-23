# Testing Patterns

**Analysis Date:** 2026-03-23

## Test Framework

**Runner:** None detected

No test runner configuration files were found across any of the three apps:
- No `jest.config.*`
- No `vitest.config.*`
- No `playwright.config.*`
- No `cypress.config.*`

No test files (`*.test.*`, `*.spec.*`) exist in the repository.

**Assertion Library:** None

**Run Commands:**
```bash
# No test commands exist in any package.json scripts
# dashboard package.json scripts: dev, build, start, lint, lint:fix, format, format:check, format:fix, prepare
# website package.json scripts: build, dev, generate, preview, postinstall, format, start, production, lint, lint:fix, prepare
# strapi package.json scripts: build, console, deploy, dev, develop, start, strapi, upgrade, upgrade:dry
```

## Test File Organization

**Location:** Not applicable — no test files exist.

**Naming:** Not applicable.

**Structure:** Not applicable.

## Test Structure

No tests exist in this codebase. The entire test surface is zero coverage.

## Mocking

**Framework:** None

No mocking utilities, fixtures, or test factories have been established.

## Fixtures and Factories

**Test Data:** None

**Location:** No fixtures directory exists.

## Coverage

**Requirements:** None enforced

No coverage configuration or thresholds have been set in any app.

**View Coverage:**
```bash
# No coverage commands configured
```

## Test Types

**Unit Tests:** None

**Integration Tests:** None

**E2E Tests:** None

## Quality Gates in Place (Non-Test)

While there are no tests, the following quality enforcement mechanisms exist:

**Linting:**
- ESLint runs on pre-commit via Husky + lint-staged in both `apps/dashboard` and `apps/website`
- Dashboard: `prettier --write` + `eslint --fix` on `*.{js,jsx,ts,tsx,json,md,css,scss}`
- Website: `eslint --fix` on `*.{js,ts,vue}`
- Pre-commit hook: `apps/dashboard/.husky/pre-commit` and `apps/website/.husky/pre-commit`

**TypeScript:**
- Dashboard has `"strict": true` in `apps/dashboard/tsconfig.json`
- Website inherits Nuxt's TS config via `.nuxt/tsconfig.json`
- Strapi has TypeScript but no strict mode configured

**Form Validation (Runtime):**
- Dashboard forms use Zod schemas with `@hookform/resolvers/zod` (`apps/dashboard/src/components/form-event.tsx`)
- Website forms use vee-validate + yup (`apps/website/package.json`)
- These validate user input at runtime but are not automated tests

## Recommendations

Adding tests to this codebase would require:

1. **Dashboard (Next.js/React):** Install `vitest` or `jest` with `@testing-library/react`. Place test files as `*.test.tsx` co-located with components in `apps/dashboard/src/components/`.

2. **Website (Nuxt/Vue):** Install `vitest` with `@vue/test-utils`. Place test files co-located with composables in `apps/website/composables/` (e.g., `useEvents.test.ts`).

3. **Strapi (Node.js):** Install `jest` or `vitest`. Focus on custom middleware (`apps/strapi/src/middlewares/`) and any custom controllers.

4. **High-value test targets (no tests today):**
   - `apps/website/composables/useEvents.ts` — date formatting and sorting logic
   - `apps/dashboard/src/lib/hooks/useSlugify.ts` — slug generation logic
   - `apps/dashboard/src/lib/strapi/auth.ts` — auth flow
   - `apps/dashboard/src/lib/strapi/api.ts` — API request construction
   - `apps/strapi/src/middlewares/auth-response.ts` — role injection middleware

---

*Testing analysis: 2026-03-23*
