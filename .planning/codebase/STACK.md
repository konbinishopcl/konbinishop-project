# Technology Stack

**Analysis Date:** 2026-03-23

## Languages

**Primary:**
- TypeScript 5.x - All three apps (dashboard, strapi API, website)

**Secondary:**
- SCSS/Sass - Styling in website (`apps/website/assets/styles/`)
- CSS - Global styles in dashboard (`apps/dashboard/src/app/globals.css`)

## Runtime

**Environment:**
- Node.js >=18.0.0 <=22.x.x (enforced by Strapi's `engines` field)

**Package Manager:**
- Yarn 1.22.22 (classic) — defined in root and website `package.json`
- Lockfile: `yarn.lock` present at root and per-app

## Monorepo

**Tooling:**
- Turborepo (latest) — task runner defined in `turbo.json`
- Yarn workspaces — apps registered under `apps/*`
- Nohoist rules for `konbini-dashboard/**` and Pinia-related packages
- Pinia pinned globally to `2.3.1` via root `resolutions`

## Frameworks

**Website (`apps/website`):**
- Nuxt 4.0.3 — SSR-enabled Vue meta-framework (`ssr: true`)
- Vue (latest) — component framework
- vue-router (latest) — client-side routing
- Pinia 2.3.1 — state management (with `@pinia-plugin-persistedstate/nuxt`, storage: localStorage)

**Dashboard (`apps/dashboard`):**
- Next.js 15.4.6 — React meta-framework with Turbopack in dev
- React 19.1.0 — component framework
- react-dom 19.1.0

**API (`apps/strapi`):**
- Strapi 5.23.1 — headless CMS
- React 18 + react-dom + react-router-dom — Strapi admin panel dependencies

## Key Dependencies

**Dashboard — Critical:**
- `zustand` ^5.0.7 — client state management
- `react-hook-form` ^7.62.0 + `@hookform/resolvers` ^5.2.1 — form handling
- `zod` ^4.1.1 — schema validation
- `@tiptap/*` ^3.3.0 — rich text editor (bold, italic, link, lists, alignment, etc.)
- `shadcn/ui` (new-york style, configured in `components.json`) — UI component system over Tailwind
- `tailwindcss` ^4 + `tailwind-merge` ^3.3.1 + `class-variance-authority` ^0.7.1 — utility CSS
- `lucide-react` ^0.539.0 — icon library
- `sweetalert2` ^11.22.5 — modal/alert dialogs
- `sharp` ^0.34.3 — server-side image processing (used in media proxy route)
- `photoswipe` ^5.4.4 — lightbox gallery
- `react-google-recaptcha-v3` ^1.11.0 — Google reCAPTCHA v3 integration
- `react-select` ^5.10.2 — enhanced select inputs
- `react-datepicker` ^8.7.0 + `react-calendar` ^6.0.0 + `react-time-picker` ^8.0.2 — date/time inputs

**Website — Critical:**
- `@nuxtjs/strapi` ^2.0.0 — Strapi v4 client for Nuxt
- `@nuxt/image` 1.8.1 — image optimization with ipx provider
- `@nuxtjs/seo` ^3.1.0 — SEO module (sitemap, robots configured)
- `pinia` + `@pinia/nuxt` + `@pinia-plugin-persistedstate/nuxt` — state with persistence
- `vee-validate` ^4.14.7 + `yup` ^1.5.0 — form validation
- `leaflet` ^1.9.4 — interactive maps
- `plyr` ^3.8.3 — media/video player
- `sweetalert2` ^11.14.5 — modal dialogs
- `sass` ^1.91.0 + `sass-mq` ^7.0.0 — SCSS preprocessing with media query helpers
- `@fortawesome/vue-fontawesome` ^3.1.2 + icon packs — icon system
- `@iconify/vue` ^5.0.0 — additional icons
- `lucide-vue-next` 0.486.0 — additional icons
- `vue-easy-lightbox` ^1.19.0 — lightbox gallery

**Strapi — Critical:**
- `@strapi/strapi` 5.23.1 — core CMS
- `@strapi/plugin-users-permissions` 5.23.1 — JWT auth system
- `@strapi/plugin-cloud` 5.23.1 — Strapi Cloud support
- `@strapi/plugin-sentry` ^5.23.1 — error tracking
- `better-sqlite3` 11.3.0 — default SQLite database (dev)
- `mysql` 2.18.1 + `mysql2` ^3.12.0 — MySQL support (configurable)
- `slugify` ^1.6.6 — slug generation
- `sharp` ^0.34.5 — image processing in uploads

## Build / Dev Tooling

**All apps:**
- ESLint 9.x — linting (config via `eslint.config.mjs`)
- Prettier 3.x — formatting (dashboard and website)
- Husky ^9.1.7 + lint-staged — pre-commit hooks (dashboard and website)
- TypeScript 5.x — type checking

**Dashboard-specific:**
- `@tailwindcss/postcss` ^4 + `postcss.config.mjs` — CSS build
- `tw-animate-css` ^1.3.6 — Tailwind animation utilities

**Website-specific:**
- `vite-plugin-purgecss` ^0.2.13 (currently commented out) — CSS tree-shaking
- Vite (via Nuxt) — bundler with SCSS preprocessor config

**Process Manager (production):**
- PM2 — both website (`ecosystem.config.cjs`, cluster mode) and Strapi (`ecosystem.config.js`, fork mode, max 1G memory)

## Configuration

**Environment:**
- Root `.env` picked up by Turborepo (`globalDependencies: ["**/.env"]`)
- Per-app `.env` files; examples at:
  - `apps/strapi/.env.example` — `HOST`, `PORT`, `APP_KEYS`, `JWT_SECRET`, database vars
  - `apps/website/.env.example` — `API_URL`, `GTM_ID`, `BLOCK_SEARCH_ENGINES`, `NITRO_PORT`
  - `apps/dashboard/env.example` — `NEXT_PUBLIC_STRAPI_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLOUDINARY_BASE_URL`, `NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY`

**Build outputs (cached by Turbo):**
- Nuxt: `.nuxt/`, `.output/`
- Next.js: `.next/`
- Strapi: `dist/`

## Platform Requirements

**Development:**
- Node.js 18–22
- Yarn 1.22.22

**Production:**
- PM2 process manager
- SQLite (default) or MySQL for Strapi
- Strapi runs on port 1337 by default
- Nuxt website runs on port 4000 via Nitro (PM2)
- Next.js dashboard runs on port 3001 in dev

---

*Stack analysis: 2026-03-23*
