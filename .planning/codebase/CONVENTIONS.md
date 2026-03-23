# Coding Conventions

**Analysis Date:** 2026-03-23

## Naming Patterns

**Files:**
- Dashboard (Next.js/React): kebab-case for component files (`form-event.tsx`, `event-dates-field.tsx`, `image-upload-field.tsx`)
- Website (Nuxt/Vue): PascalCase for component files (`HeroEvent.vue`, `CardPurchase.vue`, `FieldInput.vue`)
- Stores (website): kebab-case with `.store.ts` suffix (`event.store.ts`, `app.store.ts`, `region.store.ts`)
- Composables (website): camelCase with `use` prefix (`useEvents.ts`, `useImageUrl.ts`, `useScrollHeader.ts`)
- Hooks (dashboard): camelCase with `use` prefix inside `src/lib/hooks/` (`useSlugify.ts`, `useSwal.ts`)
- Pages (website): kebab-case Spanish names (`busqueda.vue`, `recuperar-contrasena.vue`)
- Type files: kebab-case with `.types.ts` suffix (`event.types.ts`, `user.types.ts`, `auth.types.ts`)

**Functions:**
- camelCase for all functions: `getEarliestDate`, `handleCategoryChange`, `generateSlug`, `makeRequest`
- Vue composables return object with named functions: `return { getEarliestDate, getLocation, getPosterImage }`
- Pinia store actions: imperative verbs - `openSearchLightbox`, `saveEvent`, `getEventBySlug`
- React event handlers: `handle` prefix - `handleCategoryChange`, `handleUserChange`, `handleRegionChange`

**Variables:**
- camelCase: `selectedCategory`, `isSubmitting`, `currentEvent`, `eventSlug`
- Boolean state: `is` prefix - `isLoading`, `isEditing`, `isSubmitting`, `isGenerating`
- Ref values in Vue stores: plain descriptive names - `events`, `loading`, `error`, `pagination`

**Types/Interfaces:**
- PascalCase: `EventFormData`, `SelectOption`, `LoginResponse`, `PaginationParams`
- Interface names are descriptive nouns without `I` prefix
- Zod schemas: camelCase with `Schema` suffix (`eventFormSchema`, `categorySchema`)
- Type aliases via `z.infer<typeof schema>` for form data types

**CSS Classes (website):**
- BEM methodology: `hero--event`, `hero--event__bg`, `hero--event__content__poster`
- Block: `hero`, `field`, `card`, `badge`
- Modifier: double dash `hero--event`, `field--input`
- Element: double underscore `hero--event__bg`, `field--input__label`

**CSS Classes (dashboard):**
- Tailwind utility classes directly in JSX
- Brand color via CSS variable: `bg-[var(--brand-primary)]`, `text-[var(--brand-primary)]`
- Responsive variants: `grid-cols-1 md:grid-cols-2`

## Code Style

**Formatting — Website (Nuxt/Vue):**
- Tool: Prettier
- Config: `apps/website/.prettierrc`
- No semicolons (`"semi": false`)
- Single quotes (`"singleQuote": true`)
- Print width: 100 characters
- Tab width: 2 spaces
- Trailing comma: `es5`
- Arrow parens: `avoid` (omit when single param)

**Formatting — Dashboard (Next.js/React):**
- Tool: Prettier
- Config: `apps/dashboard/.prettierrc`
- Semicolons required (`"semi": true`)
- Single quotes (`"singleQuote": true`)
- Print width: 80 characters
- Tab width: 2 spaces
- JSX single quote: `true`
- Line ending: `lf`

**Linting — Website:**
- Tool: ESLint with `withNuxt` config
- Config: `apps/website/eslint.config.mjs`
- `no-console`: error in production, warn in staging, off in development
- `@typescript-eslint/no-unused-vars`: disabled (not enforced yet — acknowledged technical debt in config)
- `vue/html-self-closing`: off

**Linting — Dashboard:**
- Tool: ESLint with Next.js preset
- Config: `apps/dashboard/eslint.config.mjs`
- Extends `next/core-web-vitals` and `next/typescript`

**Git Hooks:**
- Both apps use Husky with lint-staged
- Pre-commit runs `npx lint-staged`
- Website lint-staged: ESLint `--fix` on `*.{js,ts,vue}`
- Dashboard lint-staged: Prettier write + ESLint `--fix` on `*.{js,jsx,ts,tsx,json,md,css,scss}`

## Import Organization

**Website (Vue/Nuxt):**
- Vue composition API first: `import { computed, ref, watch } from 'vue'`
- Type imports second: `import type { User } from '@/types/user.types'`
- Component imports: `import HeroEvent from '@/components/HeroEvent.vue'`
- Path alias: `@/*` maps to project root (`./`)
- Nuxt auto-imports composables: `useStrapiUser`, `useStrapiClient`, `useRoute`, `useLazyAsyncData` are not explicitly imported

**Dashboard (React/Next.js):**
- `'use client'` directive at top when needed
- External packages first: `import { useRouter } from 'next/navigation'`
- Internal lib imports: `import { StrapiAPI } from '@/lib/strapi/api'`
- Relative component imports: `import EventDatesField from './event-dates-field'`
- Path alias: `@/*` maps to `./src/`
- Barrel exports via `src/components/index.ts`

## Error Handling

**Dashboard forms (React):**
- Zod schema validation with `@hookform/resolvers/zod`
- Form errors rendered inline: `{errors.fieldName && <p className='mt-1 text-sm text-red-600'>{errors.fieldName.message?.toString()}</p>}`
- API errors caught in try/catch, shown with SweetAlert2: `Swal.fire({ icon: 'error', ... })`
- `finally` block always resets loading state: `setIsSubmitting(false)`
- Error catch blocks swallow errors silently when not critical (e.g., data loading failure sets loading to false with no user message)

**Website stores (Vue/Pinia):**
- `error.value` set on catch: `error.value = err instanceof Error ? err.message : 'Fallback message'`
- Error is re-thrown after setting: `throw err`
- `finally` block resets `loading.value = false`

**Strapi middlewares:**
- Errors caught locally with `console.warn` to avoid crashing the application
- Pattern: `try { ... } catch (error) { console.warn('⚠️ Error en middleware:', error.message) }`

**API classes (dashboard):**
- `StrapiAuth` and `StrapiAPI` use static class methods
- HTTP errors thrown as: `throw new Error(\`HTTP error! status: ${response.status}\`)`
- Login errors unwrap Strapi error structure before re-throwing

## Logging

**Framework:** `console.log` / `console.warn` / `console.error` (no structured logger)

**Patterns:**
- Development-only `console.log` calls left in codebase (guarded by ESLint `no-console: off` in dev)
- `console.log` used in Vue stores for debugging: `console.log('Raw Strapi Response:', JSON.stringify(response, null, 2))`
- `console.warn` with warning emoji used in Strapi middleware: `console.warn('⚠️ ...')`
- `console.error` in Next.js middleware: `console.error('Error validating user role in middleware:', error)`
- Production builds have `no-console: error` ESLint rule in website app

## Comments

**When to Comment:**
- Section dividers in long files: `// ========================================` followed by `// HELPER METHODS`
- Spanish-language inline comments explaining business logic
- Commented-out code blocks left in place (not removed) — common pattern in this codebase

**Spanish Language:**
- All user-facing strings are in Spanish (Chilean locale)
- Code comments mix Spanish and English — Spanish more common for business logic
- Validation messages: always Spanish (`'El título es requerido'`, `'La empresa es requerida'`)

## Function Design

**Size:** Functions range from small (1–5 lines) to large (100+ lines for form components). No enforced size limit.

**Parameters:**
- Destructured props in React: `export default function EventForm({ event, isEditing = false }: EventFormProps)`
- Vue composables receive options objects with named properties

**Return Values:**
- Vue composables return named object: `return { user, initials, fullName }`
- React hooks return named object: `return { slug, setSlug, isGenerating }`
- Async functions throw on error (not return null/undefined for errors)

## Module Design

**Exports:**
- Dashboard components: default export from component file, re-exported named from `src/components/index.ts`
- Vue components: implicit default export via `<script setup>`
- Pinia stores: named export with `use` prefix (`export const useEventStore = defineStore(...)`)
- Utility classes (dashboard): static class methods (`StrapiAPI`, `StrapiAuth`)

**Barrel Files:**
- Dashboard components barrel: `src/components/index.ts` — all components exported here
- Dashboard lib barrel: `src/lib/strapi/index.ts`, `src/lib/helpers/index.ts`, `src/lib/stores/index.ts`

## TypeScript Usage

**Website:**
- `strict` mode not explicitly set (inherits from Nuxt's `.nuxt/tsconfig.json`)
- Many Vue components use `<script setup>` without `lang="ts"` (plain JS props)
- Type imports use `import type { ... }` syntax
- Zod not used; vee-validate + yup used for form validation

**Dashboard:**
- `strict: true` in `tsconfig.json`
- Zod used for form schema validation with `z.infer<typeof schema>` for type derivation
- `as` type assertions used for API response casting: `(response.data as Event[]) || []`
- `interface` preferred over `type` for object shapes

---

*Convention analysis: 2026-03-23*
