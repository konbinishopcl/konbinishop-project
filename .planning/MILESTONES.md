# Milestones

## v1.0 MVP Konbini (Shipped: 2026-05-27)

**Phases completed:** 16 phases, 54 plans, 64 tasks

**Key accomplishments:**

- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- AUD-01..04 formalizados en REQUIREMENTS.md, Jest 29 + ts-jest operativo en apps/api, y declaración de auditoría (IP/userAgent, retención 24 meses) agregada al seeder de PRIVACY_POLICY conforme a Ley 21.719
- Tabla `audit_logs` en MySQL vía Prisma con enums AuditAction/AuditEntity, 4 índices de rendimiento, userId sin FK para preservar historial, y cliente Prisma regenerado con `prisma.auditLog`
- AuditService singleton (log fire-and-forget + findAll paginado), GET /api/admin/audit-logs restringido a ADMIN+, QueryAuditDto con 7 filtros, trust proxy 1 en main.ts y 9 tests unitarios verdes
- EventsService con 6 puntos de auditoría (CREATE/UPDATE/DELETE/APPROVE/REJECT/BAN), controller pasando @Req() a todos los handlers de mutación, y EventsModule importando AuditModule
- Tres servicios instrumentados con AuditService.log() fire-and-forget: UsersService (BAN/UNBAN/DELETE/UPDATE-de-rol con entity USER), SpotsService (APPROVE/REJECT/BAN con entity AVISO), HeroesService (APPROVE/REJECT/BAN con entity PORTADA); los tres controllers pasan actor y req; los tres módulos importan AuditModule; tsc --noEmit limpio
- Enum agregado:
- catalog module:
- OrgMember
- Category gains 5 UI/UX metadata fields; Order adds org-context (OrgOrders); OrderItem supports ARTICLE type with optional FK; Article gains sponsored-content flow (status, owner, orderItems) via PublicationStatus enum reuse; migration sch05_category_orders_v2 applied clean
- 4 modelos nuevos (ServiceOption, ServiceRequest, CrmEntry, CrmNote) + 3 enums nuevos; CrmEntry independiente de ContactMessage (KEY DECISION #2); 6 migraciones de Phase 8 aplicadas; phase gate pnpm validate + tsc + seed todos exit 0.
- One-liner:
- Global NestJS guard + decorator for X-Org-Context header validation: checks membership, ORGANIZATION type, and blocked status via Prisma, exposing req.orgContext for org-scoped endpoints
- 1. [Rule 1 - Bug] Removed `as Prisma.InputJsonValue` casts in audit.log calls
- 1. [Rule 2 - Mejora de calidad] Plantillas email via MJML en lugar de raw HTML
- 1. [Rule 2 - Missing critical type] `TwoFaUser` exportado desde el inicio
- One-liner:
- One-liner:
- One-liner:
- NotificationsService wired en Events/Spots/Heroes/Organizations/Transfers: 13 llamadas de notificación en puntos de moderación, invitación y transferencia, con regla recipient ORGANIZATION→orgId / PERSON→userId
- `apps/api/src/settings/settings.service.ts`
- SubscriptionsService
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- ContactService.create() extendido con prisma.$transaction dual-create: ContactMessage + CrmEntry atómicos sin acoplar ContactModule a CrmModule
- One-liner:
- Capa base del rediseño Phase 15 lista: design tokens CSS, Toaster global, Header/Footer/Poster/EventCard/Rail/HeroCarousel reescritos al nuevo diseño de Konbini.html
- Las 4 vistas públicas principales migradas al nuevo diseño: Home, Categoría, Búsqueda, Evento. Formulario crear/ actualizado. Build verde.
- Admin panel completamente reescrito como SPA: AdminPage shell con sidebar colapsable, 15 secciones separadas, 6 modales y build verde.
- AuthShell + LoginView + RegistroView rediseñados con nuevo layout .auth-shell; /cuenta/ expandida a 8 tabs con AccountShell sidebar — todos con su propio archivo
- 17 nuevas rutas Next.js creadas completando el diseño del sitio: noticias, perfil organizador, servicios, carrito, páginas estáticas y auxiliares. Build verde.
- One-liner:

---
