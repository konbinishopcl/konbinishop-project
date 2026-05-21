# Codebase Structure

**Analysis Date:** 2026-05-20 (re-aligned after the Strapi→NestJS migration)

## Directory Layout

```
konbini-project/
├── apps/
│   ├── api/                      # NestJS 11 + Prisma 6 — puerto 3333, prefijo /api
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Modelos: Region, Commune, Category, Tag, Article,
│   │   │   │                     #   Hero, Spot, Event (+ componentes), User; enum Role
│   │   │   └── seed.ts           # Seed idempotente: 16 regiones, 346 comunas, taxonomías,
│   │   │                         #   contenido y 3 usuarios (uno por rol)
│   │   ├── src/
│   │   │   ├── main.ts           # Bootstrap: prefijo, CORS, ValidationPipe
│   │   │   ├── app.module.ts     # Importa Prisma, Auth, Users
│   │   │   ├── app.controller.ts / app.service.ts
│   │   │   ├── prisma/           # PrismaModule + PrismaService
│   │   │   ├── auth/             # controller, service, module, guards, decorators, dto/
│   │   │   └── users/            # controller, service, module, dto/
│   │   ├── tsconfig.build.json   # rootDir=src + excluye prisma/ → dist/main.js plano
│   │   └── .env                  # PORT, DATABASE_URL, JWT_SECRET (gitignoreado)
│   │
│   └── website/                  # Next.js 15 App Router — puerto 3000
│       ├── app/
│       │   ├── layout.tsx        # Layout raíz + providers
│       │   ├── globals.css
│       │   ├── (site)/           # Sitio público (layout con Header/Footer)
│       │   │   ├── page.tsx              # Home
│       │   │   ├── categoria/[cat]/      # Listado por categoría
│       │   │   ├── evento/[id]/          # Detalle de evento
│       │   │   ├── crear/                # Formulario de creación de evento (multi-paso)
│       │   │   ├── cuenta/               # Panel del usuario / organizador
│       │   │   └── checkout/[id]/        # ⚠ Error de diseño — a eliminar (no se venden entradas)
│       │   ├── login/            # Login (2 pasos)
│       │   ├── registro/         # Registro (2 pasos)
│       │   └── dashboard/        # Panel admin (layout con AdminGuard + admin.css)
│       │       ├── page.tsx              # Resumen del panel (índice de /dashboard)
│       │       ├── events/  users/
│       │       └── payments/ categories/ reports/ logs/ settings/ help/   # placeholders
│       ├── components/           # Componentes públicos (PascalCase)
│       │   └── admin/            # Componentes del panel admin
│       └── lib/
│           ├── data.ts           # Datos mock del sitio público
│           ├── admin-data.ts     # Datos mock del panel admin
│           └── api.ts            # Cliente HTTP real (solo auth conectado hoy)
│
├── design/                       # Mockups de diseño (Konbini.html, etc.)
├── .planning/                    # Documentos GSD (este directorio)
├── pnpm-workspace.yaml           # Workspaces: apps/*
├── turbo.json
└── package.json                  # Raíz del workspace (pnpm + Turborepo)
```

## Directory Purposes

**`apps/api/src/<feature>/`** — un módulo NestJS por feature; cada uno con
`<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts` y `dto/`.
Hoy existen `auth` y `users`; `events` y las taxonomías están pendientes (ROADMAP Phase 1).

**`apps/api/prisma/`** — `schema.prisma` (fuente de verdad del modelo de datos) y `seed.ts`.

**`apps/website/app/(site)/`** — rutas del sitio público; comparten el layout del grupo.
Incluye `cuenta/`, el panel del usuario normal / organizador.

**`apps/website/app/dashboard/`** — panel de administración (ruta `/dashboard`, para ADMIN y
SUPER_ADMIN); layout protegido por `AdminGuard`; estilos en `admin.css` con scope bajo
`.admin`. `page.tsx` es el resumen/índice del panel.

**`apps/website/components/`** — componentes reutilizables; los del panel viven en
`components/admin/`.

**`apps/website/lib/`** — `data.ts` y `admin-data.ts` son mock (a reemplazar por la API);
`api.ts` es el cliente HTTP real.

## Naming Conventions

Ver `CONVENTIONS.md`.

## Where to Add New Code

- **Nuevo módulo de API:** `apps/api/src/<feature>/` con module/controller/service + `dto/`;
  registrar el módulo en `app.module.ts`
- **Cambio de modelo de datos:** editar `apps/api/prisma/schema.prisma` y crear una migración
- **Nueva ruta pública:** `apps/website/app/(site)/<ruta>/page.tsx`
- **Nueva vista de admin:** `apps/website/app/dashboard/<ruta>/page.tsx`
- **Nuevo componente:** `apps/website/components/` (público) o `components/admin/` (panel)
- **Llamada nueva a la API:** agregar método a `apps/website/lib/api.ts`

## Testing

No hay framework de tests instalado ni archivos de test. Ver `TESTING.md`.

---

*Structure analysis: 2026-05-20*
