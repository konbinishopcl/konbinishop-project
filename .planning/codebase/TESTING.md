# Testing

**Analysis Date:** 2026-05-20 (re-aligned after the Strapi→NestJS migration)

## Estado actual

**No hay tests automatizados.** Ninguna de las dos apps tiene framework de testing instalado
ni archivos de test. `apps/api/tsconfig.build.json` excluye un directorio `test/` por
convención de NestJS, pero ese directorio no existe. No hay scripts de test en ningún
`package.json`.

## Verificación usada hasta ahora

La verificación de las quick tasks ha sido **manual**:

- **API:** pruebas de integración contra la API corriendo + base local — login/register/me y
  endpoints protegidos devolviendo los códigos esperados (`401` sin token, `403` por rol,
  `200`/`201` con permiso).
- **Website:** `pnpm build` exitoso + smoke test de rutas (las páginas responden `200`).

## Recomendación

Cuando el comportamiento se estabilice, considerar:
- API: Jest + `supertest` para tests e2e de los endpoints (auth, roles, eventos, moderación)
- Website: tests de componentes solo si la complejidad lo justifica

Objetivos de mayor valor para cuando se adopte un framework:
- Guards y `RolesGuard` de la API (control de acceso por rol)
- Endpoints de eventos y de moderación (ROADMAP Phase 1)
- `lib/api.ts` del website (construcción de requests y manejo de errores)

No es bloqueante para v1; documentar aquí cuando se adopte un framework.

---

*Testing analysis: 2026-05-20*
