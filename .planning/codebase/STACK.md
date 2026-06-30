# Technology Stack

**Analysis Date:** 2026-06-29

## Languages

**Primary:**
- TypeScript 5.7+ - Used across both API and website apps, with strict mode enabled
- JavaScript (ES2023/ES2022) - Build output targets

**Secondary:**
- SQL (Prisma schema) - Data modeling at `apps/api/prisma/schema.prisma`

## Runtime

**Environment:**
- Node.js v22+ (no version lock file; uses pnpm package manager)

**Package Manager:**
- pnpm 10.11.0
- Lockfile: `pnpm-lock.yaml` present
- Monorepo setup: `pnpm-workspace.yaml` configured at root

## Frameworks

**Core:**
- NestJS 11.0+ (`apps/api`) - Backend API framework with decorators and dependency injection
- Next.js 15.1.0 (`apps/website`) - Frontend framework using App Router with SSR-first architecture (Next-gen turbopack support)

**Build/Dev:**
- Turbo (latest) - Monorepo task orchestration; configured at `turbo.json`
- Nest CLI 11.0.0 - NestJS build tooling at `apps/api`

**Testing:**
- Jest 29.7.0 - Test runner for API (`apps/api/jest.config.js`)
- ts-jest 29.4.11 - TypeScript support in Jest
- Supertest 7.2.2 - HTTP assertion library for E2E tests
- @nestjs/testing 11.1.23 - NestJS testing utilities

## Key Dependencies

**Critical Infrastructure:**
- Prisma 6.19.3 - ORM + database tooling; migrations and code generation
  - Binary targets: `native` (local) + `rhel-openssl-3.0.x` (Vercel Functions runtime)
- @prisma/client 6.19.3 - Prisma runtime client

**Authentication:**
- @nestjs/jwt 11.0.0 - JWT signing/verification for auth endpoints
- google-auth-library 10.6.2 - Google OAuth token verification
- bcryptjs 2.4.3 - Password hashing (bcrypt)
- class-validator 0.14.1 - DTO validation with decorators
- class-transformer 0.5.1 - DTO serialization

**Database & Caching:**
- ioredis 5.10.1 - Redis client for HTTP cache layer (optional in serverless; degrades gracefully)

**File Storage & Uploads:**
- @vercel/blob 2.5.0 - Cloud file storage integration (replaces local disk in production)
- sharp 0.34.5 - Image processing (compiled native dependency, in pnpm `onlyBuiltDependencies`)

**Email:**
- mailgun.js 13.1.0 - Transactional email delivery via Mailgun API
- mjml 5.2.2 - MJML email template language (compiles to HTML)
- form-data 4.0.5 - Form data encoding for Mailgun API

**Payment Gateway:**
- Custom integration at `apps/api/services/transbank/` - Transbank WebPay Plus (Chilean payment processor)

**Frontend:**
- react 19.0.0 - UI framework for website
- react-dom 19.0.0 - DOM rendering for React
- @react-oauth/google 0.13.5 - Google Sign-In button component
- react-hook-form 7.76.0 - Form state management
- @hookform/resolvers 5.4.0 - Form validation resolver bridge
- zod 4.4.3 - Schema validation for forms
- recharts 3.8.1 - Charting library for dashboard
- lucide-react 1.16.0 - SVG icon library
- sonner 2.0.7 - Toast notification component
- next-nprogress-bar 2.4.7 - Page progress indicator
- nprogress 0.2.0 - Progress bar library

**API & HTTP:**
- @nestjs/platform-express 11.0.1 - Express adapter for NestJS
- @nestjs/config 4.0.2 - Environment configuration management
- @nestjs/swagger 11.4.4 - Swagger API documentation (dev only)
- helmet 8.1.0 - Security headers middleware
- dotenv 17.4.2 - Environment variable loading

**Utilities:**
- reflect-metadata 0.2.2 - Decorator runtime metadata (required by NestJS)
- rxjs 7.8.1 - Reactive stream utilities for NestJS
- slugify 1.6.9 - URL-safe slug generation

## Configuration

**Environment:**

Root level: `turbo.json` - Global build cache and task dependencies

- `apps/api`:
  - `.env` (gitignored) - Local development
  - `.env.example` - Template with all required vars
  - Key env vars: `DATABASE_URL`, `DIRECT_URL` (Neon Postgres), `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `REDIS_URL`, `BLOB_READ_WRITE_TOKEN`, `MAILGUN_API_KEY`, `TRANSBANK_COMMERCE_CODE`, `TRANSBANK_API_SECRET`

- `apps/website`:
  - `.env` (gitignored) - Local development
  - `.env.example` - Template
  - Key env vars: `API_URL` (server-side), `API_KEY` (server-side), `NEXT_PUBLIC_*` (client-safe public vars)

**Build:**
- `apps/api/tsconfig.json` - TypeScript config for NestJS (ES2023 target, CommonJS output)
- `apps/website/tsconfig.json` - TypeScript config for Next.js (ES2022 target, ESM module format, path alias `@/*`)
- `apps/api/jest.config.js` - Jest configuration (ts-jest, node environment)
- `apps/website/next.config.ts` - Next.js config (turbopack, article redirects)
- `apps/api/prisma/schema.prisma` - Prisma schema (PostgreSQL provider with pooled + direct URLs)

**Build Outputs:**
- API: `dist/` directory (defined in turbo.json)
- Website: `.next/` directory (defined in turbo.json)

## Platform Requirements

**Development:**
- Node.js v22+
- pnpm 10.11.0+
- PostgreSQL (Neon Postgres recommended for dev; local Postgres for local testing)

**Production:**
- API: Vercel Functions (serverless) - Entry point at `apps/api/api/index.ts` (HTTP handler wrapper)
- Website: Vercel (Node.js runtime with App Router optimization)
- Database: Neon Postgres (managed PostgreSQL)
- File Storage: Vercel Blob (v2.5.0 API)
- Cache: Redis (optional; if unavailable, API degrades to no-cache)
- Email: Mailgun (US endpoint)
- Payments: Transbank WebPay Plus (sandbox/production selectable)

**Vercel-Specific:**
- Binary targets in Prisma schema include `rhel-openssl-3.0.x` for Functions runtime
- Environment detection via `process.env.VERCEL` flag
- Static asset serving: Local disk uploads in dev; Vercel Blob in production

---

*Stack analysis: 2026-06-29*
