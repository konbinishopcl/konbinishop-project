# Phase 8: Schema v2 — Research

**Researched:** 2026-05-24
**Domain:** Prisma 6 schema design + MySQL migrations — nuevos modelos v2
**Confidence:** HIGH (todo verificado contra código real en el repo)

---

## Summary

Esta fase reemplaza el schema Prisma actual por el modelo de datos completo de v2. Los cambios son de tres tipos: (1) **extensión de modelos existentes** (User, Category, Order, Article, ContactMessage), (2) **sustitución de modelos** (Region+Commune → Country+State+City), y (3) **modelos nuevos** (OrgMember, OrgInvitation, Settings, Notification, SavedEvent, Subscription, Transfer, ServiceRequest, ServiceOption, CrmNote).

El blast radius de la migración es real pero manejable. Solo el módulo `catalog` (región/comuna) y el módulo `events` (regionId/communeId en DTOs y service) necesitan cambios de código inmediatos para que `tsc --noEmit` pase. Los módulos `spots`, `heroes`, `orders` y `payments` tienen referencias a env vars que **permanecen igual en código** — la migración de lógica a Settings es responsabilidad de la Phase 11, no de esta fase. Esta es una fase de schema puro: el código de aplicación no se toca más allá de lo mínimo para que compile.

La pregunta clave sobre datos de producción (¿hay organizers reales registrados?) no tiene respuesta en el repo — debe confirmarse con el usuario antes de decidir si la migración puede hacer `migrate reset` o necesita un script de data migration para los eventos con regionId/communeId.

**Recomendación primaria:** Una migración Prisma por SCH-XX (6 archivos de migración separados). La granularidad de rollback justifica el ruido extra en el historial — son cambios de dominio distintos y separados es más fácil de revisar.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCH-01 | User con type (PERSON\|ORGANIZATION), handle (único), isVerified, twoFactorCode, twoFactorExpiry | Handle debe ser único en toda la tabla User. Verificado contra API-RULES.md: "El handle debe ser único entre todos los users (personas y organizaciones)". |
| SCH-02 | Country/State/City reemplaza Region/Commune. Seeder con datos Chile. | 46 referencias a regionId/communeId/Region/Commune en código fuente. 4 archivos TypeScript afectados: catalog.service.ts, catalog.controller.ts, events.service.ts, events/dto/. El seeder actual usa regionsData con 16 regiones + ~350 comunas — se convierte a 1 país + 16 states + comunas como cities. |
| SCH-03 | OrgMember (userId, orgId, role: OWNER\|MEMBER) y OrgInvitation (token, expiry, email) | Patrón de join table con enum ya existente en el proyecto (OrderItemType). OrgMember necesita unique constraint en (userId, orgId). |
| SCH-04 | Settings (key-value), Notification, SavedEvent, Subscription, Transfer | Settings: tabla de clave única + valor String con cast en código. Notification necesita userId + orgId? opcionales (mensajes a persona o a org). SavedEvent: unique (userId, eventId). Subscription: userId/orgId + ciclo + créditos. Transfer: polymorphic — itemType enum + itemId Int. |
| SCH-05 | Category v2 (minDays, maxDays, icon, color, order) + OrderItemType agrega ARTICLE + Order agrega orgId | ARTICLE se agrega al enum OrderItemType existente. OrderItem necesita FK opcional articleId. @@unique([orderId, type]) actual ya cubre ARTICLE si se agrega al enum. Order necesita orgId? (nullable, FK a User con type=ORGANIZATION). |
| SCH-06 | ServiceRequest, ServiceOption, CrmNote + campos CRM en ContactMessage | ContactMessage actual: id, name, email, subject, message, read, createdAt. Se extiende con stage (enum CrmStage), type (enum CrmType), crmId (auto?). O bien: ContactMessage se convierte en fuente de entrada para un nuevo modelo CrmEntry unificado. Decisión arquitectónica abierta. |
</phase_requirements>

---

## Runtime State Inventory

Esta fase incluye renombrado de tablas, sustitución de modelos y extensión de enums — todos afectan estado en tiempo de ejecución.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data (MySQL) | Tabla `Region` (16 filas), tabla `Commune` (~350 filas). Tabla `Event` con columnas `regionId` (nullable Int FK) y `communeId` (nullable Int FK) — eventos de seed apuntan a regionId/communeId reales. | Crear Country/State/City, poblar con seeder, mapear IDs del seed de eventos a las nuevas FKs `cityId`, luego drop Region/Commune. Si hay datos de usuarios reales (no seed), se necesita script de data migration para preservar regionId→cityId por slug. |
| Stored data (MySQL) | Enum `OrderItemType` (EVENT, SPOT, HERO) — columna de tipo en `OrderItem`. | ALTER TABLE vía migración Prisma que agrega ARTICLE al enum MySQL. |
| Stored data (MySQL) | Enum `AuditEntity` (EVENT, USER, AVISO, PORTADA). Nuevas fases auditarán ORG, TRANSFER, SUBSCRIPTION, ARTICLE. | Agregar valores al enum en una migración futura (Phase 9+), no en esta fase. Esta fase solo define los modelos — AuditEntity se extiende cuando se implementan los módulos correspondientes. Documentado para el planner. |
| Live service config | No hay workflows n8n, schedulers externos ni configuración de servicio externo que referencie "Region" o "Commune" por nombre. | Ninguna. |
| OS-registered state | No hay pm2 save, Task Scheduler ni launchd plist con nombres de modelo Prisma. | Ninguna. |
| Secrets/env vars | `SPOT_PRICE_PER_DAY`, `HERO_PRICE_PER_DAY`, `SPOT_MIN_DAYS`, `SPOT_MAX_DAYS`, `SPOT_MAX_ACTIVE`, `HERO_MIN_DAYS`, `HERO_MAX_DAYS`, `HERO_MAX_ACTIVE` — 11 referencias en código (spots.service.ts, heroes.service.ts, orders.service.ts, payments.service.ts). Estas variables **NO se eliminan en esta fase**. La migración de lógica env → Settings DB es responsabilidad de Phase 11. | Esta fase solo crea el modelo `Settings` vacío con el seed de valores default. El código continúa leyendo de env vars hasta Phase 11. |
| Build artifacts | `apps/api/dist/` — artefactos compilados del TypeScript actual que referencian `prisma.region`, `prisma.commune`. | Limpiar con `pnpm build` tras la migración. El `dist/` no se commitea. |

**Confirmación pendiente antes de Plan 01:** ¿La base de datos de producción (VPS) contiene datos reales de organizadores o es solo datos de seed? Si contiene datos reales, el Plan 02 (Region→City) necesita un script de data migration explícito que mapee regionId/communeId → cityId. Si es solo seed, `migrate reset` o recrear las FKs con valores null es suficiente.

---

## Standard Stack

### Core (fijo — sin elección)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| prisma | 6.19.3 | ORM + migration runner | Ya instalado en el proyecto |
| @prisma/client | 6.19.3 | Cliente generado | Generado por `prisma generate` |
| MySQL | (version del VPS) | Base de datos | Decisión de stack existente |

### Herramientas de migración (ya disponibles)

```bash
# Ya configurado en apps/api/package.json
pnpm prisma migrate dev     # aplica migraciones en dev
pnpm prisma migrate deploy  # aplica en producción
pnpm prisma db seed         # ejecuta seed.ts
pnpm prisma generate        # regenera el cliente
```

### Verificación de versión actual
```
@prisma/client: 6.19.3 (confirmado en apps/api/package.json)
prisma CLI: 6.19.3 (confirmado en apps/api/package.json)
```

---

## Architecture Patterns

### Recommended Project Structure (sin cambios — schema-only phase)

```
apps/api/
├── prisma/
│   ├── schema.prisma          # archivo maestro — todos los cambios aquí
│   ├── seed.ts                # debe actualizarse para Country/State/City
│   └── migrations/
│       ├── ...existing...
│       ├── YYYYMMDD_sch01_user_v2/           # SCH-01
│       ├── YYYYMMDD_sch02_geography_v2/      # SCH-02
│       ├── YYYYMMDD_sch03_organizations/     # SCH-03
│       ├── YYYYMMDD_sch04_core_systems/      # SCH-04
│       ├── YYYYMMDD_sch05_category_orders_v2/ # SCH-05
│       └── YYYYMMDD_sch06_services_crm/      # SCH-06
└── src/
    └── catalog/               # necesita cambios mínimos tras SCH-02
        ├── catalog.service.ts     # region/commune → country/state/city
        ├── catalog.controller.ts  # endpoints /regions → /countries etc.
        └── dto/                   # update-commune.dto → update-city.dto
```

### Pattern 1: Migración separada por dominio

**What:** Una migración Prisma por SCH-XX. Cada migración toca solo su dominio.
**When to use:** Cuando los cambios son independientes y el rollback por dominio tiene valor.
**Tradeoff:** 6 archivos de migración vs 1 mega-migración. En MySQL no hay soporte nativo para down-migrations en Prisma 6 — rollback siempre manual. La granularidad ayuda a identificar qué migración causó un problema.

### Pattern 2: Enum extension en MySQL vía Prisma

**What:** Agregar un valor a un enum MySQL existente se hace editando el schema y corriendo `migrate dev`.
**Ejemplo aplicado:**
```prisma
// Antes
enum OrderItemType {
  EVENT
  SPOT
  HERO
}

// Después (SCH-05)
enum OrderItemType {
  EVENT
  SPOT
  HERO
  ARTICLE
}
```
Prisma genera el SQL `ALTER TABLE ... MODIFY COLUMN type ENUM('EVENT','SPOT','HERO','ARTICLE')`. Los datos existentes no se afectan.

**Importante:** En MySQL, agregar un valor al enum no requiere DEFAULT ni afecta filas existentes. Las filas con valores anteriores siguen válidas.

### Pattern 3: Join table explícita para many-to-many con atributos

**What:** Cuando una relación many-to-many tiene campos propios (como `role` en OrgMember), se modela como modelo explícito, no como relación implícita de Prisma.
```prisma
model OrgMember {
  userId    Int
  orgId     Int
  role      OrgRole @default(MEMBER)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  org       User    @relation("OrgMembers", fields: [orgId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, orgId])
  @@index([orgId])
}
```
El patrón ya existe en el proyecto: `OrderItem` es join explícita entre `Order` y Event/Spot/Hero.

### Pattern 4: Polymorphic reference con enum discriminator

**What:** Transfer referencia a uno de varios tipos de ítem (Event, Spot, Hero, Article). Sin FKs reales múltiples — se usa un enum + Int.
```prisma
enum TransferItemType {
  EVENT
  SPOT
  HERO
  ARTICLE
}

model Transfer {
  id         Int              @id @default(autoincrement())
  itemType   TransferItemType
  itemId     Int
  // ... etc
}
```
El patrón ya existe: `AuditLog` usa `entity` (enum) + `entityId` (Int) sin FKs. La validación de que itemId corresponde al itemType se hace en la capa de servicio, no en la DB.

### Pattern 5: Key-value Settings

**What:** Tabla con clave única y valor String. El cast a número/boolean se hace en el servicio.
```prisma
model Settings {
  key       String   @id  // PRIMARY KEY es la clave del setting
  value     String
  updatedAt DateTime @updatedAt
}
```
Alternativa: usar `@@unique([key])` con id autoincrement. La primera opción es más directa para lookups por clave.

### Anti-Patterns to Avoid

- **Una única migración mega para todo SCH-01..06:** Dificulta el debug si falla a mitad. Preferir 6 migraciones.
- **Borrar Region/Commune en la misma migración que crea Country/State/City:** El orden correcto en SCH-02 es (1) crear nuevas tablas, (2) actualizar FKs en Event, (3) drop tablas viejas. Si hay datos reales, entre (2) y (3) va un script de data migration.
- **Mover la lógica env vars → Settings en esta fase:** Scope creep. Esta fase solo define el modelo `Settings` y lo sembrada con defaults. La integración en services va en Phase 11.
- **Agregar `handle` a Profile en vez de User:** API-RULES.md confirma que el handle identifica a personas y organizaciones en el mismo namespace. Debe ir en User, no en Profile.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Migrations | Scripts SQL manuales | `prisma migrate dev` | Prisma maneja deps de FK, índices y el lock |
| Enum sync | ALTER TABLE manual | Editar schema + `migrate dev` | Prisma genera el ALTER TABLE correcto para MySQL |
| Client types | Types manuales | `prisma generate` | El cliente tipado se regenera automáticamente |
| Seed idempotencia | Lógica custom de merge | `upsert` + `deleteMany` en orden FK-safe | El seeder ya usa este patrón — seguirlo |
| Geography data | API externa de divisiones administrativas | Datos inline en seed.ts (ya existen ~350 comunas) | El set de datos Chile ya está en seed.ts; solo se reestructura la jerarquía |

---

## Open Questions

### 1. ¿Hay datos reales en la base de producción (VPS)?

- **Qué se sabe:** STATE.md menciona "e2e suite con describe.skip por DB en VPS". Hay una base de datos corriendo en producción.
- **Qué no está claro:** ¿Contiene eventos/usuarios registrados por organizadores reales, o solo datos de seed?
- **Impacto:** Si hay datos reales con regionId/communeId, el Plan 02 necesita un script de data migration que mapee por slug (p.ej. `region.slug = 'region-metropolitana-de-santiago'` → `state.slug = 'region-metropolitana-de-santiago'`). Si es solo seed, `migrate reset` o poner cityId nullable y luego re-seedear es suficiente.
- **Recomendación:** El Plan 01 debe incluir una tarea: "Confirmar con el usuario si la DB de producción tiene datos reales antes de planificar el Plan 02".

### 2. ¿Profile se mantiene separado o se fusiona con User?

- **Qué se sabe:** User tiene `firstname`, `lastname`, `rut`, `isCompany`. Profile tiene `displayName`, `bio`, `avatar`, `banner`, `website`, redes sociales, `slug`. API-RULES.md define `PATCH /users/me/organizer` que actualiza "nombre público, handle, avatar, banner, bio, redes sociales" — campos de Profile.
- **Opciones:**
  - (A) **Mantener Profile separado:** Agregar `handle`, `isVerified`, `type` a User. Profile queda para datos de perfil público. Costo mínimo de migración.
  - (B) **Fusionar Profile en User:** Mover todos los campos de Profile a User, eliminar la tabla. Simplifica queries pero requiere migración de datos no trivial.
- **Recomendación del research:** Opción A — la separación actual entre datos de cuenta (User) y datos de perfil público (Profile) es una buena separación de responsabilidades. `handle` va en User porque necesita ser único globalmente y es parte de la identidad, no del perfil.
- **Decisión:** Planner debe confirmar.

### 3. ¿ContactMessage se extiende o se crea modelo CrmEntry separado?

- **Qué se sabe:** ContactMessage actual (6 campos simples). API-RULES.md requiere pipeline CRM unificado con tipos CONTACT, PHOTOGRAPHY, CONTENT y estados NEW/CONTACTED/NEGOTIATING/WON/LOST.
- **Opciones:**
  - (A) **Extender ContactMessage:** Agregar stage, crmType, notes (relación). Mantiene la tabla unificada.
  - (B) **Nuevo modelo CrmEntry:** ContactMessage queda como tabla de mensajes raw; CrmEntry tiene el pipeline y FK opcional a ContactMessage, ServiceRequest (fotografía), ServiceRequest (creadores).
- **Recomendación:** Opción B es más limpia para v2 (el CRM va a gestionar 3 tipos de solicitudes heterogéneas). Opción A es más simple para SCH-06.
- **Decisión:** Esta fase define el schema — el planner debe elegir la arquitectura antes de escribir el Plan 06.

### 4. SCH-01..06 no existen en REQUIREMENTS.md

- **Estado actual:** REQUIREMENTS.md solo tiene requisitos v1 (AUTH, API, SITE, PUBL, MOD, SRCH, HARD, AUD). No hay sección v2 con SCH-01..06.
- **Implicación:** El Plan 01 debe incluir una tarea de documentación: agregar SCH-01..06 a REQUIREMENTS.md como primer paso.

### 5. ¿Granularidad de migración: 6 archivos o 1 mega?

- **Recomendación del research:** 6 migraciones separadas (una por SCH-XX). Facilita el debug y el rollback manual si una migración falla en producción. En desarrollo, corren en secuencia sin problema.
- **Decisión:** Planner confirma.

---

## Common Pitfalls

### Pitfall 1: FK constraint al dropear Region/Commune con datos de Event

**What goes wrong:** `prisma migrate dev` falla con "Cannot drop table — foreign key constraint fails" al intentar borrar Region o Commune mientras Event todavía tiene regionId/communeId con valores no nulos.
**Why it happens:** MySQL no permite drop de tabla referenciada por FK activa.
**How to avoid:** En SCH-02, el orden SQL debe ser: (1) ADD COLUMN cityId a Event, (2) data migration (UPDATE events SET cityId = ...), (3) DROP COLUMN regionId, DROP COLUMN communeId, (4) DROP TABLE commune, (5) DROP TABLE region. Prisma no genera este orden automáticamente para un rename — hay que revisar el SQL generado con `--create-only` antes de aplicar.
**Warning signs:** Prisma `migrate dev` falla con error 1451 (Foreign key constraint).

### Pitfall 2: Enum MySQL no es extensible sin ALTER TABLE

**What goes wrong:** Agregar un valor a un enum MySQL (por ejemplo ARTICLE a OrderItemType) en producción con datos existentes puede ser lento en tablas grandes.
**Why it happens:** MySQL necesita reconstruir la definición de la columna.
**How to avoid:** En desarrollo con datos de seed, sin problema. En producción con tabla Order grande, evaluar si el ALTER TABLE bloquea escrituras. Para la escala actual del proyecto (datos de seed), no es un problema práctico.
**Warning signs:** Migración lenta o bloqueo en producción.

### Pitfall 3: `tsc --noEmit` falla tras SCH-02 aunque la DB esté bien

**What goes wrong:** El compilador TypeScript lanza errores en catalog.service.ts y events.service.ts (y sus DTOs) porque referencias a `prisma.region`, `prisma.commune`, `regionId`, `communeId` ya no existen en el cliente generado.
**Why it happens:** El Prisma Client se genera desde el schema — al cambiar el schema, los tipos cambian y el código anterior no compila.
**How to avoid:** El Plan 02 (SCH-02) debe incluir explícitamente la tarea de actualizar el módulo `catalog` (service, controller, DTOs) y los DTOs de events para reemplazar `regionId/communeId` → `cityId`. Verificar con `pnpm tsc --noEmit` antes de dar el plan por completo.
**Files affected:**
- `apps/api/src/catalog/catalog.service.ts` — 18 referencias
- `apps/api/src/catalog/catalog.controller.ts` — 10 referencias
- `apps/api/src/catalog/dto/create-commune.dto.ts` — regionId
- `apps/api/src/catalog/dto/update-commune.dto.ts` — regionId
- `apps/api/src/events/events.service.ts` — 6 referencias (regionId, communeId, region.slug filter)
- `apps/api/src/events/dto/create-event.dto.ts` — regionId, communeId
- `apps/api/src/events/dto/update-event.dto.ts` — regionId, communeId
- `apps/api/src/profiles/profiles.service.ts` — incluye `region: true, commune: true` en profileInclude()

### Pitfall 4: Handle de usuario — colisión entre Profile.slug y User.handle

**What goes wrong:** Profile ya tiene `slug` (único) que actúa como identificador público. Si handle se agrega a User sin una estrategia de migración de datos, quedan dos identificadores públicos desincronizados.
**Why it happens:** Profile.slug fue el identificador público en v1; API-RULES.md define `GET /users/:handle` como el nuevo endpoint de perfil público.
**How to avoid:** En SCH-01, el campo `handle` en User se inicializa a partir del valor actual de `Profile.slug` para usuarios existentes. Esto puede hacerse con un DEFAULT en la migración o con un script post-migración. Profile.slug puede quedarse como alias hasta que Phase 13 migre los endpoints.
**Warning signs:** Usuarios existentes sin handle después de la migración.

### Pitfall 5: `@@unique([orderId, type])` en OrderItem rompe si se permiten múltiples ARTICLE

**What goes wrong:** El constraint `@@unique([orderId, type])` en OrderItem permite solo un ítem de cada tipo por orden. Si en el futuro se necesitan múltiples artículos en una orden, el constraint es demasiado restrictivo.
**Why it happens:** La regla de negocio actual es "un ítem por tipo por orden" — es intencional.
**How to avoid:** Para SCH-05, mantener el constraint como está (un ARTICLE por orden). Si la regla cambia en fases posteriores, se migra el constraint entonces.

---

## Code Examples

### SCH-01: Campos mínimos a agregar a User

```prisma
// Fuente: análisis de API-RULES.md + schema.prisma actual

enum UserType {
  PERSON
  ORGANIZATION
}

model User {
  // ... campos actuales se mantienen ...
  type             UserType  @default(PERSON)
  handle           String?   @unique              // único entre personas y orgs
  isVerified       Boolean   @default(false)      // badge asignado por SUPER_ADMIN
  twoFactorCode    String?                        // código 6 dígitos (texto plano o hash)
  twoFactorExpiry  DateTime?                      // expiración del código
  // ... resto igual ...
}
```

### SCH-02: Geografía 3-nivel

```prisma
// Fuente: API-RULES.md sección Geografía

model Country {
  id     Int     @id @default(autoincrement())
  name   String  @unique
  slug   String  @unique
  states State[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model State {
  id        Int     @id @default(autoincrement())
  name      String
  slug      String  @unique
  country   Country @relation(fields: [countryId], references: [id])
  countryId Int
  cities    City[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([countryId])
}

model City {
  id      Int    @id @default(autoincrement())
  name    String
  slug    String @unique
  state   State  @relation(fields: [stateId], references: [id])
  stateId Int
  events  Event[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([stateId])
}

// En Event: reemplazar regionId/communeId por cityId
model Event {
  // ... eliminar: region, regionId, commune, communeId
  city    City?  @relation(fields: [cityId], references: [id])
  cityId  Int?
  // ...
  @@index([cityId])  // reemplaza @@index([regionId]) y @@index([communeId])
}
```

### SCH-03: OrgMember y OrgInvitation

```prisma
enum OrgRole {
  OWNER
  MEMBER
}

model OrgMember {
  userId Int
  orgId  Int
  role   OrgRole  @default(MEMBER)
  user   User     @relation("UserMemberships", fields: [userId], references: [id], onDelete: Cascade)
  org    User     @relation("OrgMembers", fields: [orgId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, orgId])
  @@index([orgId])
  @@index([userId])
}

model OrgInvitation {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  email     String
  orgId     Int
  org       User     @relation(fields: [orgId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([orgId])
  @@index([token])
}
```

### SCH-04: Settings key-value

```prisma
model Settings {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

Seed de defaults:
```typescript
// En seed.ts — valores iniciales para que el código no rompa si lee de Settings
const settingsDefaults = [
  { key: 'SPOT_PRICE_PER_DAY', value: '8000' },
  { key: 'SPOT_MIN_DAYS', value: '1' },
  { key: 'SPOT_MAX_DAYS', value: '30' },
  { key: 'SPOT_MAX_ACTIVE', value: '12' },
  { key: 'HERO_PRICE_PER_DAY', value: '15000' },
  { key: 'HERO_MIN_DAYS', value: '1' },
  { key: 'HERO_MAX_DAYS', value: '30' },
  { key: 'HERO_MAX_ACTIVE', value: '5' },
  { key: 'SUBSCRIPTION_PRICE', value: '9990' },
  { key: 'SUBSCRIPTION_CREDITS', value: '10' },
  { key: 'SUBSCRIPTION_SPOT_DISCOUNT', value: '20' },
  { key: 'SUBSCRIPTION_HERO_DISCOUNT', value: '20' },
];
// upsert cada setting
```

### SCH-05: Category v2

```prisma
model Category {
  // ... campos actuales ...
  icon     String?    // nombre de icono (p.ej. lucide icon name)
  color    String?    // color hex o CSS class
  minDays  Int        @default(1)
  maxDays  Int        @default(30)
  order    Int        @default(0)
}
```

### SCH-06: ServiceRequest, ServiceOption, CrmNote

```prisma
enum ServiceType {
  PHOTOGRAPHY
  CONTENT
}

enum CrmType {
  CONTACT
  PHOTOGRAPHY
  CONTENT
}

enum CrmStage {
  NEW
  CONTACTED
  NEGOTIATING
  WON
  LOST
}

model ServiceOption {
  id         Int         @id @default(autoincrement())
  type       ServiceType
  label      String
  active     Boolean     @default(true)
  order      Int         @default(0)
  requests   ServiceRequest[]
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt

  @@index([type])
}

model ServiceRequest {
  id         Int           @id @default(autoincrement())
  type       ServiceType
  name       String
  email      String
  eventName  String?
  eventDate  DateTime?
  eventPlace String?
  options    ServiceOption[]
  stage      CrmStage      @default(NEW)
  stageReason String?
  notes      CrmNote[]
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  @@index([type])
  @@index([stage])
}

model CrmNote {
  id               Int             @id @default(autoincrement())
  content          String          @db.Text
  authorId         Int?            // userId del admin que escribe
  serviceRequestId Int?
  contactMessageId Int?
  serviceRequest   ServiceRequest? @relation(fields: [serviceRequestId], references: [id], onDelete: Cascade)
  contactMessage   ContactMessage? @relation(fields: [contactMessageId], references: [id], onDelete: Cascade)
  createdAt        DateTime        @default(now())

  @@index([serviceRequestId])
  @@index([contactMessageId])
}

// Extensión de ContactMessage existente
model ContactMessage {
  // ... campos actuales se mantienen ...
  stage  CrmStage  @default(NEW)
  notes  CrmNote[]
}
```

**Nota:** Este ejemplo asume Opción A (extender ContactMessage). Si el planner elige Opción B (modelo CrmEntry), el schema cambia. Ver Open Question #3.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest (apps/api/jest.config.js) |
| Config file | `apps/api/jest.config.js` |
| Quick run command | `cd apps/api && pnpm test --testPathPattern=spec` |
| Full suite command | `cd apps/api && pnpm test` |

### Phase Requirements → Test Map

Para una fase de schema puro, los tests son principalmente de integración con la base de datos y verificaciones de compilación. Los tests unitarios de business logic vienen en phases posteriores.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCH-01 | `prisma migrate dev` aplica sin error con User v2 | smoke | `cd apps/api && pnpm prisma migrate dev --name sch01_user_v2` | ❌ Wave 0 — es la migración misma |
| SCH-01 | `prisma generate` produce tipos UserType, handle en User | smoke | `cd apps/api && pnpm prisma generate && pnpm tsc --noEmit` | ❌ Wave 0 |
| SCH-02 | Country/State/City existen en DB, Event.cityId funciona | smoke | `cd apps/api && pnpm prisma migrate dev && pnpm db:seed` | ❌ Wave 0 |
| SCH-02 | `tsc --noEmit` pasa con catalog.service.ts actualizado | compilation | `cd apps/api && pnpm tsc --noEmit` | ❌ Wave 0 |
| SCH-03 | OrgMember unique (userId, orgId) funciona | smoke | `cd apps/api && pnpm prisma migrate dev` | ❌ Wave 0 |
| SCH-04..06 | Todas las tablas nuevas presentes y seed corre | smoke | `cd apps/api && pnpm db:seed` | ❌ Wave 0 |

### Sampling Rate

- **Por cada plan completado:** `cd apps/api && pnpm prisma migrate dev && pnpm prisma generate && pnpm tsc --noEmit`
- **Wave final (Plan 06):** `cd apps/api && pnpm db:seed` completo sin error
- **Phase gate:** `pnpm tsc --noEmit` verde + seed completo antes de `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No hay test files específicos que crear — la validación de esta fase es operacional (migrate + generate + tsc + seed). No hay lógica de negocio nueva que necesite unit tests en esta fase.
- [ ] `apps/api/package.json` — verificar que el script `prisma:seed` (o `db:seed`) existe y apunta a `prisma/seed.ts`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Region + Commune (2-nivel) | Country + State + City (3-nivel) | Phase 8 (v2) | Permite internacionalización futura; las 16 regiones → 16 states bajo Country "Chile" |
| User sin type/handle | User con type: PERSON\|ORGANIZATION + handle único | Phase 8 (v2) | User único para personas y orgs; handle reemplaza Profile.slug como identificador público |
| Env vars para precios (SPOT_PRICE_PER_DAY etc.) | Settings tabla en DB | Phase 8 schema / Phase 11 lógica | Admin puede cambiar precios sin reiniciar el servidor |
| ContactMessage simple (6 campos) | ContactMessage extendida con CRM stage | Phase 8 (v2) | Integración al pipeline CRM unificado |

**Deprecated/outdated después de esta fase:**
- `Region` model: será dropeada en SCH-02
- `Commune` model: será dropeada en SCH-02
- Endpoints `GET /regions`, `GET /communes`: serán reemplazados por `GET /countries`, `GET /states`, `GET /cities` en Phase 9+ (o al actualizar el catalog module en SCH-02)

---

## Sources

### Primary (HIGH confidence)

- `apps/api/prisma/schema.prisma` — schema actual completo, verificado manualmente
- `docs/API-RULES.md` — reglas de negocio y modelos requeridos para v2, verificado manualmente
- `.planning/ROADMAP.md` — descripción de Phase 8 y SCH-01..06
- `apps/api/prisma/seed.ts` — seeder actual con 16 regiones + ~350 comunas
- `apps/api/src/catalog/catalog.service.ts`, `catalog.controller.ts` — blast radius de Region/Commune verificado con rg

### Secondary (MEDIUM confidence)

- `apps/api/src/events/events.service.ts`, `events/dto/` — 6 referencias a regionId/communeId confirmadas con rg
- `apps/api/src/profiles/profiles.service.ts` — profileInclude() incluye `region: true, commune: true` — debe actualizarse en SCH-02
- `.planning/STATE.md` — contexto histórico de decisiones de stack

### Tertiary (LOW confidence)

- Ninguno — todos los hallazgos están soportados por lectura directa del código fuente.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Prisma 6.19.3 confirmado en package.json
- Blast radius (region/commune): HIGH — 46 referencias confirmadas con rg, archivos listados
- Architecture patterns: HIGH — basados en patrones ya existentes en el proyecto (OrderItem, AuditLog)
- Open questions: HIGH — son genuinamente preguntas abiertas que el planner debe resolver, no incertidumbre de research

**Research date:** 2026-05-24
**Valid until:** 2026-06-24 (schema Prisma es estable; solo invalida si cambia API-RULES.md)
