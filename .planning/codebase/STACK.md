# Technology Stack

**Analysis Date:** 2026-05-20 (re-aligned after the Strapi→NestJS migration)

## Languages

- **TypeScript 5.x** — ambas apps (`apps/api`, `apps/website`)
- **CSS plano** — estilos del website (`globals.css`, `admin.css`); sin Tailwind ni
  preprocesador

## Runtime

- **Node.js** — ejecutado dentro de WSL Ubuntu
- **PostgreSQL 16** — base de datos local en WSL

## Monorepo

- **pnpm** `10.11.0` — gestor de paquetes; workspaces vía `pnpm-workspace.yaml`
  (`packages: ["apps/*"]`), lockfile `pnpm-lock.yaml`
- **Turborepo** (`latest`) — task runner; tareas `dev`, `build`, `start`, `lint` en
  `turbo.json`
- `pnpm.overrides` fija `pinia` a `2.3.1` — residuo del stack anterior, sin efecto actual

## Apps

### `apps/api` — `konbini-nest-api`

- **NestJS 11** (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- **Prisma 6** (`@prisma/client` + `prisma`) — ORM sobre PostgreSQL
- **@nestjs/jwt 11** — emisión/verificación de JWT (sin Passport)
- **@nestjs/config 4** — variables de entorno (`ConfigModule` global)
- **bcryptjs 2** — hashing de contraseñas
- **class-validator / class-transformer** — validación de DTOs vía `ValidationPipe` global
- Dev: `@nestjs/cli`, `ts-node`, `tsconfig-paths`
- Puerto **3333**, prefijo global `/api`

### `apps/website` — `konbini-website`

- **Next.js 15** (App Router, `--turbopack` en dev)
- **React 19** + **react-dom 19**
- TypeScript 5; sin librerías de UI ni de estado externas — estado vía React Context
  (`components/providers.tsx`)
- Puerto **3000**

## Build / Dev Tooling

- `nest build` (API) → `dist/main.js`; `next build` (website) → `.next/`
- `tsconfig.build.json` de la API fuerza `rootDir: ./src` y excluye `prisma/` para emitir
  `dist/main.js` plano
- Sin ESLint/Prettier configurado por app actualmente; sin Husky
- Sin framework de tests instalado

## Configuration

**Variables de entorno** (archivos `.env`, gitignoreados):

- `apps/api/.env` — `PORT=3333`, `DATABASE_URL` (PostgreSQL local), `JWT_SECRET`
- `apps/website` — `NEXT_PUBLIC_API_URL` (default `http://localhost:3333/api`)

## Platform Requirements

- **Desarrollo:** Windows 11 + WSL Ubuntu. El proyecto vive en WSL; instalaciones y builds
  (`pnpm install`, `pnpm build`) se ejecutan **dentro de WSL**, no desde Windows (un
  `pnpm`/`yarn` lanzado desde la ruta `\\wsl.localhost\...` falla con `EISDIR`).
- PostgreSQL 16 escuchando en `localhost:5432`.

---

*Stack analysis: 2026-05-20*
