# Credenciales de desarrollo

> ⚠️ Solo para uso local. No subir a producción.

## Cuentas de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Super Admin | `superadmin@konbini.cl` | `konbini123` |
| Admin | `admin@konbini.cl` | `konbini123` |
| Organizador | `organizador@konbini.cl` | `konbini123` |

## Acceso al dashboard

Inicia sesión con cualquier cuenta **Admin** o **Super Admin** → el login redirige automáticamente a `/dashboard`.

## Seed

Si la base de datos está vacía, corre el seed para crear los usuarios y datos de prueba:

```bash
cd apps/api
yarn prisma:seed
```

## Notas

- **2FA desactivado** temporalmente. Reactivar en `apps/api/src/auth/auth.service.ts` antes de producción.
- El seed borra y recrea todos los datos (eventos, avisos, portadas, etc.).
