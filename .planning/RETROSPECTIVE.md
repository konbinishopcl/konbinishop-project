# Retrospective: Konbini

---

## Milestone: v1.0 — MVP Konbini

**Shipped:** 2026-05-27
**Phases:** 16 (0-16, Phase 6 skipped) | **Plans:** 54

### What Was Built

- **API NestJS completa:** eventos CRUD + moderación, taxonomías, organizaciones con membresías,
  transferencias polimórficas, 2FA + Google OAuth, notificaciones internas, settings en DB,
  suscripciones con créditos, artículos patrocinados, favoritos, servicios fotografía/contenido,
  CRM pipeline unificado, sistema de auditoría
- **Website Next.js rediseñado:** vistas públicas (home, categoría, búsqueda, evento), dashboard
  de organizador con EventForm completo (arrays dinámicos, uploads, preview), panel admin con
  15 secciones y 6 modales, autenticación (login, registro, 2FA), /cuenta/ con 8 tabs,
  17+ rutas nuevas (noticias, perfil, servicios, carrito, etc.)
- **Schema Prisma v2:** geografía 3-nivel con datos Chile, modelos organizaciones, suscripciones,
  CRM, transferencias, notificaciones — 6 migraciones aplicadas

### What Worked

- **GSD con parallelization:** ejecutar planes en waves paralelas redujo significativamente el
  tiempo por fase en fases grandes (Schema v2, Rediseño UI)
- **Phase insertions (Phase 16):** insertar una fase decimal para arreglar el EventForm sin
  interrumpir el flujo del roadmap funcionó bien
- **Separar schema antes de lógica:** Phase 8 (Schema v2) primero permitió que todas las fases
  posteriores tuvieran los modelos listos
- **CSS plano fiel al diseño:** sin Tailwind, el CSS del diseño Konbini.html se portó directamente
  sin adaptación

### What Was Inefficient

- **Phase 6 (Hardening) skipped:** se postergó demasiado y quedó como known gap. Debería haberse
  completado antes de los milestones de features avanzadas
- **REQUIREMENTS.md con checkboxes desactualizados:** los checkboxes de los requirements no se
  fueron marcando conforme se completaban las fases — al cerrar el milestone había ~22 reqs
  completados pero sin marcar
- **Fases v2 en el mismo ROADMAP que v1:** mezclar los dos milestones en un solo archivo generó
  confusion sobre el scope

### Patterns Established

- `ImageUploadBox` con `URL.createObjectURL` para preview local sin upload inmediato — patrón
  reutilizable para cualquier formulario con imágenes
- Arrays dinámicos en formularios (PriceRow/DateRow/LinkRow) con estado tipado en React
- `OrgContextGuard` + `X-Org-Context` header como convención para endpoints multi-tenant
- `prisma.$transaction` callback form para dual-creates entre módulos desacoplados
- `fire-and-forget void` para notificaciones y auditoría: el fallo nunca revierte la operación

### Key Lessons

1. **Marcar requirements al completar cada fase**, no al final del milestone
2. **Phase 6 Hardening primero** — antes de agregar features complejas, el baseline de seguridad
   debe estar listo
3. **Un ROADMAP por milestone** — separar los roadmaps de v1 y v2 desde el inicio

### Cost Observations

- Model mix: balanced (sonnet executor / opus planner)
- Sesiones: múltiples sesiones distribuidas en ~66 días (2026-03-22 → 2026-05-27)
- Notable: fases con research previo (Schema v2, UI) tuvieron mejor calidad de ejecución

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Timeline | Hardening |
|-----------|--------|-------|----------|-----------|
| v1.0 | 16 | 54 | 66 días | Known gap HARD-01..04 |

*Más milestones se agregarán aquí conforme se completen.*
