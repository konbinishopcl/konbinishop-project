# Codebase Concerns

**Analysis Date:** 2026-05-20 (re-aligned after the Strapi→NestJS migration)

> Este documento reemplaza al análisis de 2026-03-23, que cubría el stack Strapi/Nuxt ya
> descartado. Todas las preocupaciones anteriores (proxy de Strapi, role enforcement del
> dashboard, ETag del media proxy, etc.) pertenecen a código que ya no existe.

---

## Seguridad

**CORS abierto en la API:**
- `apps/api/src/main.ts` usa `app.enableCors({ origin: true, credentials: true })`, que
  refleja cualquier origen. Aceptable en desarrollo; debe restringirse al origen del website
  antes de producción. → ROADMAP Phase 6 (HARD-01).

**JWT en `localStorage`:**
- El website guarda el token en `localStorage` (`kb-token`), legible por JavaScript y por
  tanto expuesto a robo vía XSS. Es una decisión consciente para v1; revisarla al endurecer.

**`JWT_SECRET` sin garantía de estar definido:**
- `AuthModule` arma la firma desde `JWT_SECRET`. Si la variable falta, el arranque no falla
  de forma evidente. Debe exigirse explícitamente y nunca tener un default en código.
  → ROADMAP Phase 6 (HARD-02).

**Sesión no revalidada:**
- Al cargar, el website confía en el `user` y el `role` guardados en `localStorage`; no
  revalida contra `GET /auth/me`. `AdminGuard` es un guard **de cliente**: alguien que
  manipule `kb-user` puede ver la UI de `/admin` (las llamadas a la API igual responden
  `403`, pero la UI no debería renderizar). → ROADMAP Phase 6 (HARD-03).

---

## Alcance / Diseño

**Checkout y venta de entradas (error de diseño):**
- El diseño y la maqueta incluyen un flujo de compra que NO corresponde: ruta
  `app/(site)/checkout/[id]`, botones "Comprar entradas" y la pasarela "Konbini Pay".
  Konbini no vende entradas — eso ocurre en una plataforma externa. Debe eliminarse.
  → ROADMAP Phase 2 (SITE-04).

**Vistas admin obsoletas:**
- `/admin/payments` y otras vistas placeholder reflejan un modelo con pagos que ya no aplica
  en v1. Hay que retirarlas o re-perfilarlas. → ROADMAP Phase 4 (MOD-05).

---

## Tech Debt

**El sitio funciona con datos mock:**
- Salvo login/registro, todas las vistas del website (home, categorías, detalle de evento,
  `/crear`, panel admin) leen de `lib/data.ts` / `lib/admin-data.ts` (hardcoded). Falta
  cablearlas a la API real. → ROADMAP Phases 2–4.

**`/admin/users` es un placeholder:**
- La API CRUD de usuarios existe y está protegida a `SUPER_ADMIN`, pero la página
  `/admin/users` no tiene UI funcional. → ROADMAP Phase 4 (MOD-04).

**Comentario obsoleto en `schema.prisma`:**
- El encabezado de `apps/api/prisma/schema.prisma` aún dice que los usuarios "se delegan a
  Neon Auth: no hay modelo User aquí" — falso: el modelo `User` y el enum `Role` ya existen
  en ese mismo archivo. Corregir el comentario para no confundir.

**`pnpm.overrides` con `pinia`:**
- El `package.json` raíz fija `pinia@2.3.1` vía overrides — residuo del stack Nuxt anterior.
  Sin efecto hoy; se puede eliminar.

---

## Fragilidad de build

**`apps/api/tsconfig.build.json`:**
- Necesitó `rootDir: ./src` + excluir `prisma/` para que `nest build` emita un `dist/main.js`
  plano. Un `tsconfig.build.tsbuildinfo` stale ya causó una vez que `tsc` no emitiera nada.
  Si un build falla raro, sospechar de artefactos stale (`dist/`, `*.tsbuildinfo`, `.next/`).

**Builds desde Windows:**
- Ejecutar `pnpm`/`yarn` desde la ruta `\\wsl.localhost\...` falla con `EISDIR`. Las
  instalaciones y builds deben correr dentro de WSL.

---

## Sin tests

No existe cobertura automatizada. Ver `TESTING.md`. Prioridad alta para guards y endpoints de
moderación una vez que se estabilicen.

---

## Datos de seed

`prisma/seed.ts` crea 3 usuarios (uno por rol) con la misma contraseña `konbini123`. Es
conveniente para desarrollo, pero no debe usarse esa contraseña en ningún entorno expuesto.

---

*Concerns audit: 2026-05-20*
