# Integrations

**Analysis Date:** 2026-05-20 (re-aligned after the Strapi→NestJS migration)

## Servicios externos actuales

**Ninguno en runtime.** El proyecto hoy no depende de ningún servicio externo de terceros.
En la migración se descartaron Strapi, Neon (PostgreSQL gestionado) y Neon Auth. Tampoco hay
Sentry, Cloudinary, GTM ni Mailgun activos — todos pertenecían al stack anterior.

## Integraciones internas

**API ↔ Base de datos:**
- Prisma 6 conecta a **PostgreSQL 16 local** vía `DATABASE_URL` (`apps/api/.env`)
- Cadena típica: `postgresql://konbini:konbini@localhost:5432/konbini?schema=public`
- Migraciones y seed con la CLI de Prisma (`prisma migrate`, `prisma db seed`)

**Website ↔ API:**
- El website llama a la API NestJS a través de `lib/api.ts`
- Base URL en `NEXT_PUBLIC_API_URL` (default `http://localhost:3333/api`)
- Autenticación con header `Authorization: Bearer <jwt>`

## Enlaces salientes (no integraciones)

- **Plataforma externa de entradas:** los eventos guardan `ticketUrl`; el detalle de evento
  enlaza ahí para comprar tickets. Konbini no procesa la venta — solo enlaza.

## Integraciones planeadas

- **Almacenamiento de imágenes** (ROADMAP Phase 1, API-04): los eventos guardan banner,
  poster y galería como URLs. Falta decidir el proveedor — disco local, Cloudinary o S3.

## Diferido (v2)

- Emails transaccionales (proveedor SMTP / Mailgun)
- Login social / OAuth (Google, Instagram, Apple) — los botones de RRSS están en la UI de
  login/registro sin conexión

## Configuración de entorno

| App | Variable | Propósito |
|-----|----------|-----------|
| api | `PORT` | Puerto HTTP (default 3333) |
| api | `DATABASE_URL` | Conexión PostgreSQL |
| api | `JWT_SECRET` | Firma de los JWT |
| website | `NEXT_PUBLIC_API_URL` | Base URL de la API |

## Webhooks

Ninguno — ni entrantes ni salientes.

---

*Integrations analysis: 2026-05-20*
