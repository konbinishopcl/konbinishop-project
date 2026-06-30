---
phase: quick-260629-riy
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/api/prisma/schema.prisma
  - apps/api/prisma/migrations/migration_lock.toml
  - apps/api/prisma/migrations/0_init/migration.sql
  - apps/api/prisma/seed.ts
  - apps/api/package.json
  - apps/api/src/uploads/uploads.service.ts
  - apps/api/utils/cache/http-cache.interceptor.ts
  - apps/api/src/main.ts
  - apps/api/api/index.ts
  - apps/api/vercel.json
  - apps/api/tsconfig.build.json
  - apps/api/.env.example
autonomous: true
requirements: [NEON-MIGRATION]
must_haves:
  truths:
    - "Prisma schema targets postgresql with directUrl + serverless binaryTarget; prisma validate passes"
    - "A single fresh Postgres init migration replaces the 22 MySQL migrations and applies cleanly to Neon"
    - "prisma db seed runs against Neon and populates data with Blob image URLs (.webp)"
    - "UploadsService.save() uploads to Vercel Blob and returns an absolute https URL"
    - "The Redis cache interceptor never throws a 500 on a GET when Redis is unreachable — it serves uncached"
    - "main.ts exports createApp() (init, no listen); listen + static assets only run locally"
    - "apps/api/api/index.ts and vercel.json exist; the handler typechecks and compiles via nest build"
  artifacts:
    - path: "apps/api/prisma/migrations/0_init/migration.sql"
      provides: "Fresh Postgres init migration"
      contains: "CREATE TABLE"
    - path: "apps/api/api/index.ts"
      provides: "Vercel serverless handler caching the Express instance"
    - path: "apps/api/vercel.json"
      provides: "Route rewrites to the serverless function"
  key_links:
    - from: "apps/api/api/index.ts"
      to: "apps/api/src/main.ts createApp()"
      via: "import { createApp }"
      pattern: "createApp"
    - from: "apps/api/src/uploads/uploads.service.ts"
      to: "@vercel/blob put()"
      via: "put(... { access: 'public' })"
      pattern: "put\\("
---

<objective>
Migrate the NestJS API (`apps/api`) from MySQL to Neon Postgres and make it deployable as a Vercel serverless function.

Purpose: develop's DB target is now Neon Postgres; the API must run on Vercel Functions where there is no persistent local disk and Redis may be unavailable.
Output: Postgres-ready Prisma schema + fresh init migration + reseed, Vercel Blob uploads, Redis graceful degradation, and a serverless wrapper (createApp + api/index.ts + vercel.json) that compiles and typechecks.
</objective>

<execution_context>
All commands run from `apps/api` unless stated otherwise. Use pnpm.
The real `apps/api/.env` (gitignored) ALREADY contains Neon `DATABASE_URL` (pooled, host has `-pooler`), `DIRECT_URL` (direct, no `-pooler`), and `BLOB_READ_WRITE_TOKEN`. DO NOT overwrite or read secrets out of `.env`. Only edit `.env.example`.
Migrations against Neon MUST use `$DIRECT_URL` (the pooled URL cannot run DDL reliably).
Data is disposable — a full reset + reseed is expected and fine.
</execution_context>

<context>
@apps/api/prisma/schema.prisma
@apps/api/prisma/seed.ts
@apps/api/src/main.ts
@apps/api/src/uploads/uploads.service.ts
@apps/api/utils/cache/http-cache.interceptor.ts
@apps/api/utils/redis/redis.service.ts
@apps/api/package.json
@apps/api/tsconfig.build.json

<interfaces>
<!-- Contracts the executor needs. Use these directly — no exploration required. -->

Vercel Blob (from `@vercel/blob`):
```typescript
import { put } from '@vercel/blob';
// reads BLOB_READ_WRITE_TOKEN from env automatically
const blob = await put(pathname, body /* Buffer */, { access: 'public', contentType });
// blob.url is an absolute https URL on *.public.blob.vercel-storage.com
```

RedisService (apps/api/utils/redis/redis.service.ts) — ioredis with `enableOfflineQueue:false`:
```typescript
get(key: string): Promise<string | null>      // REJECTS if Redis is down
set(key, value, ttlSeconds): Promise<'OK'>     // REJECTS if Redis is down
deletePattern(pattern: string): Promise<void>  // REJECTS if Redis is down
```

main.ts bootstrap currently: NestFactory.create<NestExpressApplication> → setGlobalPrefix('api') → disable x-powered-by → set trust proxy → helmet → CORS → ValidationPipe → HttpExceptionFilter → useStaticAssets('/api/uploads') → Swagger (dev only) → app.listen(port). Top-level `void bootstrap()` runs on import.

Already-uploaded Blob assets (base = `https://2w45nhh8p6jdklcj.public.blob.vercel-storage.com/seed/`):
hero-1.webp, hero-2.webp, poster-1.webp … poster-12.webp, banner-1.webp … banner-12.webp
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Convert Prisma schema to Postgres, regenerate the init migration, and reseed Neon</name>
  <files>apps/api/prisma/schema.prisma, apps/api/prisma/migrations/migration_lock.toml, apps/api/prisma/migrations/0_init/migration.sql, apps/api/prisma/seed.ts, apps/api/package.json</files>
  <action>
1. **Schema edits** in `apps/api/prisma/schema.prisma` — this is the WHOLE diff, do not over-correct:
   - `generator client` block: add `binaryTargets = ["native", "rhel-openssl-3.0.x"]` (Vercel Functions runtime).
   - `datasource db`: change `provider = "mysql"` → `provider = "postgresql"`, and add `directUrl = env("DIRECT_URL")` below the existing `url = env("DATABASE_URL")` line.
   - The ONLY MySQL-only attribute is `LegalDocument.content String @db.LongText` (~line 514) → change to `@db.Text`.
   - LEAVE everything else as-is: `@db.Date`, `@db.Text`, the 17 enums, and `Json @default("[]")` are all valid native Postgres. Do not touch them.

2. **Add the seed entry point** to `apps/api/package.json` (it is currently MISSING — `prisma db seed` will error "no seed command" without it). Add a top-level block, sibling to "scripts":
   ```json
   "prisma": { "seed": "ts-node prisma/seed.ts" }
   ```
   (`ts-node` is already a devDependency.)

3. **Regenerate migrations for Postgres** — NON-INTERACTIVE sequence (do NOT use `prisma migrate dev`; it prompts on drift and needs a shadow DB that the Neon role may lack). Data is disposable. Run from `apps/api`, sourcing `.env` so `$DIRECT_URL` is available (`set -a; . ./.env; set +a`):
   - Delete all 22 MySQL migrations AND the lock file: `rm -rf prisma/migrations` (the lock file currently says `provider = "mysql"` and MUST be regenerated for postgres).
   - Reset the Neon schema over the DIRECT url:
     `printf 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;' | pnpm prisma db execute --url "$DIRECT_URL" --stdin`
   - Generate the fresh init SQL from the schema (empty → datamodel):
     `mkdir -p prisma/migrations/0_init`
     `pnpm prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql`
   - Recreate `prisma/migrations/migration_lock.toml` with provider postgresql:
     ```
     # Please do not edit this file manually
     # It should be added in your version-control system (e.g., Git)
     provider = "postgresql"
     ```
   - Apply the init SQL to Neon and baseline it (so future `migrate deploy` is consistent):
     `pnpm prisma db execute --url "$DIRECT_URL" --file prisma/migrations/0_init/migration.sql`
     `DATABASE_URL="$DIRECT_URL" pnpm prisma migrate resolve --applied 0_init`
   - Regenerate the client: `pnpm prisma generate`

4. **Fix seed image URLs** in `apps/api/prisma/seed.ts` (extension is `.webp`, base = `https://2w45nhh8p6jdklcj.public.blob.vercel-storage.com/seed/`):
   - Heroes (~lines 444, 459): `'/uploads/hero-1.jpg'` → `'https://2w45nhh8p6jdklcj.public.blob.vercel-storage.com/seed/hero-1.webp'`; same for hero-2.
   - Events (~lines 697-699): replace the three `/uploads/...-${ev.img}.jpg` template strings:
     - banner → `` `https://2w45nhh8p6jdklcj.public.blob.vercel-storage.com/seed/banner-${ev.img}.webp` ``
     - poster → `` `https://2w45nhh8p6jdklcj.public.blob.vercel-storage.com/seed/poster-${ev.img}.webp` ``
     - gallery → `[poster URL, banner URL]` using the same two Blob URLs.
   - Leave the spots' `https://placehold.co/...` URLs untouched (out of scope).

5. **Reseed** Neon: `DATABASE_URL="$DIRECT_URL" pnpm prisma db seed`
  </action>
  <verify>
    <automated>cd apps/api && set -a && . ./.env && set +a && pnpm prisma validate && test -f prisma/migrations/0_init/migration.sql && grep -q 'provider = "postgresql"' prisma/migrations/migration_lock.toml && DATABASE_URL="$DIRECT_URL" pnpm prisma migrate status && DATABASE_URL="$DIRECT_URL" pnpm prisma db seed</automated>
  </verify>
  <done>schema.prisma is postgresql with directUrl + binaryTargets; only `0_init` migration exists; `prisma migrate status` reports the DB is up to date; `prisma db seed` completes and prints final counts with no errors; seeded hero/event image fields hold absolute `.public.blob.vercel-storage.com/seed/*.webp` URLs.</done>
</task>

<task type="auto">
  <name>Task 2: Vercel Blob uploads + Redis graceful degradation + .env.example</name>
  <files>apps/api/src/uploads/uploads.service.ts, apps/api/utils/cache/http-cache.interceptor.ts, apps/api/.env.example, apps/api/package.json</files>
  <action>
1. **Install `@vercel/blob`**: from `apps/api`, `pnpm add @vercel/blob` (adds to dependencies + lockfile).

2. **Rewrite `UploadsService.save()`** (`apps/api/src/uploads/uploads.service.ts`) to use Vercel Blob instead of local disk. Keep the existing validation EXACTLY (no file → BadRequest; mimetype not in EXT_BY_MIME jpg/png/webp → BadRequest; size > 5 MB → BadRequest). Then:
   - Remove the `fs` / `join` / `UPLOADS_DIR` disk logic.
   - `import { put } from '@vercel/blob';`
   - Build filename: `const filename = \`${Date.now()}-${randomBytes(6).toString('hex')}.${ext}\`;`
   - `const blob = await put(\`uploads/${filename}\`, file.buffer, { access: 'public', contentType: file.mimetype });`
   - Return `{ url: blob.url, filename }` (blob.url is absolute https — the website's imageUrl() passes absolute URLs through unchanged).
   - Keep the `UploadedImage` interface, `MAX_BYTES`, `EXT_BY_MIME`, and `@Injectable()` class otherwise unchanged. `BLOB_READ_WRITE_TOKEN` is read from env automatically by `put()`.

3. **Harden the Redis cache interceptor** (`apps/api/utils/cache/http-cache.interceptor.ts`) so a GET NEVER returns 500 when Redis is down. The GET path already has `.catch(() => null)` on `get()`, but `JSON.parse(cached)` can still throw on a corrupt value. Wrap the cached-hit branch so a parse failure falls through to `next.handle()` instead of throwing:
   ```typescript
   if (cached) {
     try {
       const parsed = JSON.parse(cached);
       res.setHeader('X-Cache', 'HIT');
       return of(parsed);
     } catch {
       // corrupt cache entry → ignore and serve fresh
     }
   }
   res.setHeader('X-Cache', 'MISS');
   return next.handle().pipe(tap((data) => { this.redis.set(key, JSON.stringify(data), TTL).catch(() => {}); }));
   ```
   The mutation/invalidation path already swallows errors with `.catch(() => {})` — leave it. Do NOT change RedisService.

4. **Update `apps/api/.env.example`** (keep all existing keys; edit only the DB section and add Blob):
   - Replace the `# MySQL` comment + `DATABASE_URL="mysql://..."` line with a Neon block:
     ```
     # Neon Postgres — pooled connection for the app (host includes -pooler)
     DATABASE_URL="postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
     # Neon Postgres — direct connection for migrations/DDL (no -pooler)
     DIRECT_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
     ```
  </action>
  <verify>
    <automated>cd apps/api && pnpm ls @vercel/blob >/dev/null 2>&1 && grep -q "from '@vercel/blob'" src/uploads/uploads.service.ts && grep -q "access: 'public'" src/uploads/uploads.service.ts && grep -q "DIRECT_URL" .env.example && grep -q "BLOB_READ_WRITE_TOKEN" .env.example && pnpm build</automated>
  </verify>
  <done>@vercel/blob is in dependencies; UploadsService.save() returns blob.url (absolute https) with no fs writes; the cache interceptor's GET hit path is try/wrapped so a parse failure or Redis outage serves fresh instead of 500; .env.example documents Neon pooled+direct and BLOB_READ_WRITE_TOKEN; `pnpm build` compiles.</done>
</task>

<task type="auto">
  <name>Task 3: Serverless wrapper — createApp() in main.ts, api/index.ts, vercel.json, build include</name>
  <files>apps/api/src/main.ts, apps/api/api/index.ts, apps/api/vercel.json, apps/api/tsconfig.build.json</files>
  <action>
1. **Refactor `apps/api/src/main.ts`** to separate app construction from listening:
   - Export an async `createApp()` that builds and fully initializes the Nest app but does NOT call `app.listen()`. It must perform every middleware/config step the current bootstrap does EXCEPT the listen:
     setGlobalPrefix('api'), disable('x-powered-by'), set('trust proxy', 1), helmet(), enableCors(... same origin callback ...), useGlobalPipes(ValidationPipe), useGlobalFilters(HttpExceptionFilter), Swagger setup (keep `NODE_ENV !== 'production'` guard).
   - **Guard `useStaticAssets`** so it only runs OUTSIDE Vercel (no local disk on Functions): `if (!process.env.VERCEL) app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/uploads' });`
   - For serverless, the Express instance must be initialized but not listening. Use:
     ```typescript
     export async function createApp(): Promise<NestExpressApplication> {
       const app = await NestFactory.create<NestExpressApplication>(AppModule);
       // ...all config above...
       await app.init();           // initialize without binding a port
       return app;
     }
     ```
   - Keep a local `bootstrap()` that calls `createApp()` then `app.listen(port)` for local dev.
   - **Guard the auto-run** so importing this module on Vercel does NOT start a listener:
     ```typescript
     if (require.main === module && !process.env.VERCEL) {
       void bootstrap();
     }
     ```
     (Replaces the bare top-level `void bootstrap()`.)

2. **Create `apps/api/api/index.ts`** — the Vercel handler that caches the Express instance across warm invocations:
   ```typescript
   import type { IncomingMessage, ServerResponse } from 'http';
   import { createApp } from '../src/main';

   let cached: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;

   async function getHandler() {
     if (!cached) {
       const app = await createApp();
       cached = app.getHttpAdapter().getInstance(); // the underlying Express app
     }
     return cached;
   }

   export default async function handler(req: IncomingMessage, res: ServerResponse) {
     const express = await getHandler();
     express(req, res);
   }
   ```
   Import `createApp` from `../src/main` (SOURCE, so it typechecks against real types and is emitted by tsc).

3. **Add `api/**/*` to the build include** in `apps/api/tsconfig.build.json` so `nest build` (tsc) compiles the handler WITH decorator metadata intact:
   `"include": ["src/**/*", "services/**/*", "api/**/*"]`

4. **Create `apps/api/vercel.json`** rewriting all routes to the function:
   ```json
   {
     "version": 2,
     "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
   }
   ```

5. **Deploy-time note (DO NOT attempt to verify here — no live deploy in scope):** Vercel's `@vercel/node` bundles `api/` with esbuild, which drops `emitDecoratorMetadata` and breaks NestJS DI at runtime. The deploy must run the **tsc-compiled `dist/` output** (metadata intact), not esbuild-bundled source. Record this in the plan as the #1 NestJS-on-Vercel runtime risk; wiring/proving it is a deploy-config concern beyond this plan's local verification bar.
  </action>
  <verify>
    <automated>cd apps/api && test -f api/index.ts && test -f vercel.json && grep -q "createApp" api/index.ts && grep -q "export async function createApp" src/main.ts && grep -q "!process.env.VERCEL" src/main.ts && grep -q "api/\*\*/\*" tsconfig.build.json && pnpm build && test -f dist/api/index.js</automated>
  </verify>
  <done>main.ts exports createApp() (init, no listen) and only listens locally via the `require.main===module && !process.env.VERCEL` guard; useStaticAssets is skipped when VERCEL is set; api/index.ts imports createApp from ../src/main and caches the Express instance; vercel.json rewrites all routes to /api; tsconfig.build.json includes api/**/*; `pnpm build` produces dist/api/index.js with no type errors.</done>
</task>

</tasks>

<verification>
From `apps/api`, with `.env` sourced (`set -a; . ./.env; set +a`):
1. `pnpm prisma validate` — schema is valid postgresql.
2. `grep -q 'provider = "postgresql"' prisma/migrations/migration_lock.toml` and only `prisma/migrations/0_init/` exists.
3. `DATABASE_URL="$DIRECT_URL" pnpm prisma migrate status` — DB up to date (0_init applied).
4. `DATABASE_URL="$DIRECT_URL" pnpm prisma db seed` — completes, prints counts, seeded image URLs are `.public.blob.vercel-storage.com/seed/*.webp`.
5. `pnpm build` — compiles; `dist/api/index.js` exists (serverless handler typechecks).
6. Source greps: `@vercel/blob` import + `access: 'public'` in uploads.service.ts; cache interceptor GET hit branch is try/wrapped; main.ts has `createApp` + `!process.env.VERCEL` guard; vercel.json rewrites to /api.
</verification>

<success_criteria>
- Prisma schema is postgresql with `directUrl` + `binaryTargets = ["native","rhel-openssl-3.0.x"]`; `@db.LongText` removed.
- The 22 MySQL migrations are replaced by a single applied `0_init` Postgres migration; Neon is reseeded with Blob `.webp` image URLs.
- Uploads go to Vercel Blob and return absolute https URLs (no local disk).
- A GET request never 500s when Redis is unreachable (serves uncached).
- The API exports `createApp()` and runs as a Vercel function via `api/index.ts` + `vercel.json`; `pnpm build` compiles the handler.
- No secrets were written; only `.env.example` was edited.
</success_criteria>

<output>
After completion, create `.planning/quick/260629-riy-migrar-api-nestjs-a-neon-postgres-server/260629-riy-SUMMARY.md` documenting: schema/migration changes, the non-interactive migrate sequence used, Blob upload wiring, the Redis hardening, the serverless wrapper, and the unresolved deploy-time decorator-metadata risk (must run tsc `dist/`, not esbuild-bundled source).
</output>
