# konbini-nest-api

API base construida con [NestJS](https://nestjs.com/) y [Prisma](https://www.prisma.io/).

## Setup

```bash
# desde la raíz del monorepo
yarn install

# copiar variables de entorno
cp apps/api/.env.example apps/api/.env
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `yarn dev` | Levanta la API en modo watch |
| `yarn build` | Compila a `dist/` |
| `yarn start` | Ejecuta la build (`dist/main`) |
| `yarn prisma:generate` | Genera el cliente de Prisma |
| `yarn prisma:migrate` | Crea/aplica migraciones en desarrollo |
| `yarn prisma:studio` | Abre Prisma Studio |

La API corre por defecto en `http://localhost:3333/api` (health check en `/api/health`).
