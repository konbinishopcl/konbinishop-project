# Phase 7: Sistema de auditoría — Research

**Researched:** 2026-05-22
**Domain:** NestJS audit logging — Prisma schema migration, interceptor/service pattern, IP extraction behind proxy
**Confidence:** HIGH

---

## Summary

La Phase 7 agrega una tabla `AuditLog` a la base de datos MySQL (vía migración Prisma) y un
módulo `audit` que registra cada acción relevante de admins y usuarios sobre las entidades del
sistema (eventos, usuarios, avisos/spots, portadas/heroes). El proyecto usa NestJS 11 +
Prisma 6 + Express bajo `NestExpressApplication`.

El patrón recomendado para este codebase es un `AuditService` **singleton** inyectable
manualmente en los métodos de servicio que ya tienen el contexto de negocio rico (entity,
entityId, acción, metadata, usuario). Para capturar IP/UserAgent sin hacer request-scoped
toda la cadena, se pasa el objeto `Request` de Express como parámetro opcional al método
`AuditService.log()`. Los servicios afectados (EventsService, UsersService,
SpotsService, HeroesService) ya reciben `JwtUser` desde el controlador — se extiende ese
patrón pasando también `req: Request`.

Para IP real detrás de Nginx se configura `app.set('trust proxy', 1)` en `main.ts`; con eso
`req.ip` devuelve la IP del cliente y no hay que parsear `x-forwarded-for` manualmente.

**Primary recommendation:** AuditService singleton + llamadas manuales en los service
methods de mutación/moderación + `trust proxy 1` en main.ts.

---

<phase_requirements>
## Phase Requirements

Los IDs `AUD-01..04` aparecen en ROADMAP.md pero no están definidos en REQUIREMENTS.md. Esta
es una brecha: el planner debe añadirlos antes de crear los planes.

| ID sugerido | Descripción | Research Support |
|-------------|-------------|------------------|
| AUD-01 | Migración Prisma: tabla `AuditLog` con todos los campos definidos | Modelo de datos detallado abajo |
| AUD-02 | `AuditService` inyectable + integración en módulos existentes | Patrón singleton + llamada manual |
| AUD-03 | Captura de IP real detrás de Nginx (trust proxy) | Express docs verificados |
| AUD-04 | `GET /audit-logs` solo ADMIN+ con filtros y paginación | Patrón QueryDto existente en EventsService |

**Acción requerida para el planner:** Añadir AUD-01..04 a REQUIREMENTS.md antes de crear PLAN.md.
</phase_requirements>

---

## Standard Stack

No se requieren dependencias nuevas. Todo lo necesario ya está instalado.

### Core (ya presente)
| Librería | Versión instalada | Propósito |
|----------|-------------------|-----------|
| `@nestjs/common` | ^11.0.1 | Módulo, Service, Controller, Interceptor |
| `@prisma/client` | ^6.7.0 | Acceso a la tabla AuditLog |
| `prisma` | ^6.7.0 | Migración para crear la tabla |
| `class-validator` | ^0.14.1 | DTOs del endpoint de consulta |
| `class-transformer` | ^0.5.1 | Transformación de query params |

### No se necesita instalar
Ninguna librería adicional. Audit logging en este contexto (MySQL + Prisma) no justifica
dependencias externas como `nestjs-audit` o Winston.

---

## Architecture Patterns

### Estructura del módulo nuevo

```
apps/api/src/audit/
├── audit.module.ts         # importa PrismaModule; exporta AuditService
├── audit.service.ts        # log(), findAll() con filtros
├── audit.controller.ts     # GET /audit-logs — solo ADMIN+
└── dto/
    └── query-audit.dto.ts  # filtros: entity, action, userId, desde, hasta, page, pageSize
```

El módulo `AuditModule` se importa en `AppModule` como cualquier otro módulo del proyecto.
Los módulos que necesitan auditar (EventsModule, UsersModule, SpotsModule, HeroesModule)
importan `AuditModule` en sus `imports[]`.

### Pattern recomendado: AuditService singleton + llamada manual en service

**Por qué no interceptor global:** Un interceptor global captura el request, pero no tiene
acceso al contexto de negocio (¿qué entityId? ¿qué metadata con el `rejectedReason`?
¿cuál fue el resultado de la operación?). Para las acciones de moderación APPROVE/REJECT/BAN
la metadata es esencial (ej. `{ reason: 'Contenido inapropiado' }`). Un interceptor tendría
que replicar esa lógica o parsear la respuesta, lo cual es frágil.

**Por qué no request-scoped:** NestJS docs y múltiples fuentes (2024) advierten
explícitamente que request-scoped providers degradan el rendimiento porque se crea una
instancia nueva por request y el efecto se propaga (cascading scope) a todos los providers
que lo inyectan. EventsService, UsersService etc. pasarían a ser request-scoped — inadmisible
para un sistema de producción.

**Por qué sí singleton + Request como parámetro:** El patrón ya existe en el codebase —
`EventsService.create(dto, user)` recibe el `JwtUser` del controlador. Extender a
`create(dto, user, req)` es mínimamente invasivo y mantiene todo singleton.

```typescript
// audit/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../utils/prisma/prisma.service';
import type { Request } from 'express';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'BAN' | 'UNBAN';
export type AuditEntity = 'EVENT' | 'USER' | 'SPOT' | 'HERO';

interface AuditLogParams {
  userId: number | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: number;
  metadata?: Record<string, unknown>;
  req?: Request;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una acción auditada. Fire-and-forget con logged error:
   * nunca debe revertir la operación de negocio si falla el log.
   */
  log(params: AuditLogParams): void {
    const ip = params.req?.ip ?? null;
    const userAgent = params.req?.get('user-agent') ?? null;
    const url = params.req?.originalUrl ?? null;

    this.prisma.auditLog
      .create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          metadata: params.metadata ?? {},
          ip,
          userAgent,
          url,
        },
      })
      .catch((err: unknown) => {
        this.logger.error('AuditLog insert failed', err instanceof Error ? err.stack : String(err));
      });
  }
}
```

```typescript
// Uso en EventsService.approve() — patrón representativo:
async approve(id: number, user: JwtUser, req?: Request) {
  const event = await this.ensure(id);
  await this.prisma.event.update({ where: { id }, data: { status: 'APPROVED', approvedById: user.sub } });
  this.audit.log({ userId: user.sub, action: 'APPROVE', entity: 'EVENT', entityId: id, req });
  // ... mail, etc.
}
```

```typescript
// Controlador — pasa req al service:
@Patch(':id/approve')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
approve(
  @Param('id', ParseIntPipe) id: number,
  @CurrentUser() user: JwtUser,
  @Req() req: Request,
) {
  return this.events.approve(id, user, req);
}
```

### Modelo Prisma para AuditLog

```prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE
  APPROVE
  REJECT
  BAN
  UNBAN
}

enum AuditEntity {
  EVENT
  USER
  SPOT
  HERO
}

model AuditLog {
  id        Int         @id @default(autoincrement())
  userId    Int?        // null si la acción es de sistema o usuario eliminado
  action    AuditAction
  entity    AuditEntity
  entityId  Int
  metadata  Json        @default("{}")
  ip        String?
  userAgent String?
  url       String?
  createdAt DateTime    @default(now())

  @@index([entity, entityId])
  @@index([userId, createdAt])
  @@index([createdAt])
  @@index([entity, action, createdAt])
}
```

**Nota:** No se agrega relación `user User? @relation(...)` para evitar que un delete de
usuario cascade-problemas en los logs históricos. `userId` es un Int sin FK explícita; si se
necesita el email del admin en la consulta, se hace un join manual en el endpoint.

### Trust proxy en main.ts

```typescript
// apps/api/src/main.ts — agregar ANTES de app.use(helmet())
app.set('trust proxy', 1);
// Con esto req.ip refleja la IP real del cliente pasada por Nginx
// vía X-Forwarded-For. Solo se confía en 1 hop (el Nginx en front).
```

Fuente verificada: [Express behind proxies docs](https://expressjs.com/en/guide/behind-proxies/)

### Endpoint de consulta admin

```typescript
// GET /api/audit-logs?entity=EVENT&action=APPROVE&userId=5&desde=2026-01-01&hasta=2026-12-31&page=1&pageSize=50
// Accesible solo para ADMIN / SUPER_ADMIN

@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
findAll(@Query() query: QueryAuditDto) {
  return this.auditService.findAll(query);
}
```

El patrón de QueryDto con `page`, `pageSize`, filtros opcionales ya existe en `QueryEventsDto`
— reutilizar exactamente ese esquema.

### Anti-patterns a evitar

- **No usar request-scoped `AuditService`**: Degrada performance de todos los servicios que
  lo inyectan; el NestJS docs lo desaconseja salvo necesidad estricta.
- **No parsear `x-forwarded-for` manualmente**: Con `trust proxy 1` en main.ts, `req.ip` ya
  tiene la IP correcta. Parsear el header manualmente es redundante y propenso a errores.
- **No bloquear la operación de negocio si el log falla**: El insert en AuditLog es
  fire-and-forget. Usar `.catch()` con logger, nunca `await` en el flujo principal.
- **No loguear datos sensibles en `metadata`**: Nunca incluir `passwordHash`, tokens de reset,
  ni contenido de headers de Authorization.
- **No auditar lecturas (GET)**: Solo mutaciones y acciones de moderación. Los endpoints de
  listado y detalle no generan AuditLog.

---

## Don't Hand-Roll

| Problema | No construir | Usar en cambio | Por qué |
|----------|--------------|----------------|---------|
| Enums en Prisma | Strings literales | `enum AuditAction` y `enum AuditEntity` en schema.prisma | Validación en DB; Prisma genera los tipos TypeScript automáticamente |
| Parsear `x-forwarded-for` | Función custom de extracción de IP | `req.ip` con `trust proxy 1` | Express ya maneja la lógica de hops de proxy |
| Paginación en `findAll` | Lógica custom | Mismo patrón de `skip`/`take` que `EventsService.findAll` | Consistencia; ya está probado en producción |
| Fire-and-forget async | `setImmediate` o `setTimeout` | `.create().catch(logger.error)` | Promesas no-await son suficientes; no requiere queue |

---

## Common Pitfalls

### Pitfall 1: Cascading scope — hacer AuditService request-scoped
**Qué sale mal:** Si se decora `AuditService` con `@Injectable({ scope: Scope.REQUEST })`
para que tenga acceso directo al `REQUEST` token, NestJS propagará el scope a todos los
providers que lo inyectan (EventsService, UsersService, etc.), aumentando latencia media.
**Por qué pasa:** NestJS eleva el scope al máximo necesario automáticamente.
**Cómo evitar:** Mantener AuditService como singleton; pasar `req: Request` como parámetro
desde el controlador.
**Señal de alerta:** Warning de NestJS "A circular dependency" o degradación de performance
inexplicable tras instalar el módulo de auditoría.

### Pitfall 2: trust proxy sin configurar — req.ip devuelve la IP de Nginx
**Qué sale mal:** Todos los registros de AuditLog muestran `127.0.0.1` o la IP interna de
Nginx en vez de la IP del cliente real.
**Por qué pasa:** Sin `trust proxy`, Express usa `req.socket.remoteAddress` (la conexión
directa, que es Nginx).
**Cómo evitar:** `app.set('trust proxy', 1)` en main.ts antes de cualquier middleware.
**Señal de alerta:** Todos los logs con ip = `127.0.0.1` o `::1`.

### Pitfall 3: FK explícita en AuditLog.userId → cascade delete borra el historial
**Qué sale mal:** Si se declara `user User? @relation(...)` en AuditLog con onDelete Cascade,
al borrar un usuario se borran todos sus registros de auditoría — lo que destruye el trail
de compliance.
**Por qué pasa:** Comportamiento default de Prisma con FKs.
**Cómo evitar:** `userId Int?` sin relación Prisma explícita; la FK no se declara en el
schema. Los logs históricos sobreviven al borrado del usuario.
**Señal de alerta:** Error de `prisma migrate` porque el schema ya no valida la FK implícita —
en MySQL esto funciona bien sin FK declarada en Prisma.

### Pitfall 4: metadata con PII o datos sensibles
**Qué sale mal:** Se guarda en `metadata` el body completo del request, que puede incluir
contraseñas, tokens o datos personales.
**Por qué pasa:** Copiar `req.body` directamente al campo metadata.
**Cómo evitar:** Solo incluir campos de negocio explícitos (`{ reason, prevStatus, newStatus }`).
Nunca `req.body` completo.
**Señal de alerta:** Campo `metadata` con claves como `password`, `token`, `authorization`.

### Pitfall 5: enum AVISO vs SPOT — terminología contradictoria
**Qué sale mal:** El roadmap dice `entity: AVISO/SPOT` pero el modelo Prisma es `Spot` (y
`Hero`, no "Portada"). Si el enum en código usa `AVISO` y otro código usa `SPOT`, los filtros
del endpoint de consulta no funcionan.
**Por qué pasa:** El roadmap fue escrito antes del commit `a3af368` que renombró
heroes→Portadas y spots→Avisos como **nombres comerciales de UI**, sin cambiar los modelos
de base de datos.
**Cómo evitar:** Ver Open Questions #1.

### Pitfall 6: Ley 21.719 — ip y userAgent son datos personales
**Qué sale mal:** La columna  almacena la dirección IP del cliente y  puede
identificar individualmente a un usuario. Según la Ley 21.719 (Ley de Protección de Datos
Personales de Chile), estos datos requieren base legal para tratarlos y no pueden retenerse
indefinidamente.
**Por qué pasa:** El proyecto ya está activamente cumpliendo Ley 21.719 (commits ,
). Agregar columnas de IP sin declararlo en la Política de Privacidad sería
incumplimiento.
**Cómo evitar:**
- Declarar el logging de auditoría (incluyendo IP) en el  de PRIVACY_POLICY.
  El planner debe verificar que el contenido actual lo menciona; si no, agregar el párrafo.
- Establecer una política de retención máxima (recomendado: 24 meses). La limpieza automática
  puede diferirse a v2, pero la política debe definirse en v1.
- Nunca incluir en  datos personales del usuario (email, nombre, RUT).
- Los registros de AuditLog donde  forman parte del derecho de acceso del titular.
  En v1 no se implementa el endpoint de acceso, pero debe estar en la hoja de ruta.
**Señal de alerta:** La Política de Privacidad no menciona logs de auditoría o retención.

---

## Open Questions

1. **Enum `AuditEntity`: SPOT/AVISO y HERO/PORTADA**
   - Lo que sabemos: El roadmap dice `AVISO/SPOT` para el enum, pero el modelo Prisma es
     `Spot` y `Hero`. El commit `a3af368` renombró los nombres de UI sin tocar los modelos DB.
   - Qué no está claro: ¿Debe el enum seguir el nombre del modelo Prisma (`SPOT`, `HERO`) o
     el nombre comercial del producto (`AVISO`, `PORTADA`)?
   - **Recomendación:** Usar `SPOT` y `HERO` en el enum — el AuditLog registra la entidad
     interna, no su label de marketing. Más fácil de mantener cuando los nombres comerciales
     cambien. El planner debe confirmar antes de crear los planes.

2. **¿Auditar acciones de usuarios no-admin?**
   - Lo que sabemos: El roadmap menciona "acciones relevantes de admins y usuarios". Los
     eventos se crean por usuarios `AUTHENTICATED`.
   - Qué no está claro: ¿Se audita `CREATE` de evento por un organizador (útil para
     compliance), o solo acciones de admin?
   - **Recomendación:** Auditar CREATE de evento (cualquier usuario autenticado) y todas las
     acciones de moderación (APPROVE/REJECT/BAN/UNBAN). Excluir UPDATE y DELETE de eventos
     por organizador (ruido sin valor de compliance en v1). El planner puede expandir.

3. **¿`AuditLog.userId` sin FK o con `NoAction` onDelete?**
   - Recomendación: Sin FK explícita en Prisma (solo `Int?`). MySQL lo permite. Si se quiere
     FK con `onDelete: SetNull` en vez de Cascade, eso también funciona pero requiere que
     la columna sea nullable (ya lo es).

4. **Ley 21.719: ¿cuánto tiempo retener los AuditLogs?**
   - Lo que sabemos: La ley exige minimización y plazo limitado de retención para datos
     personales.  y  son datos personales. La Política de Privacidad actual
     en el sistema no hace referencia explícita a logs de auditoría (pendiente de verificar).
   - Qué no está claro: ¿12 o 24 meses de retención? ¿Hay un requerimiento legal específico
     para logs de acciones de admin?
   - **Recomendación:** Definir 24 meses como plazo de retención en la Política de Privacidad
     durante esta fase. Agregar una nota en el plan para que el contenido del LegalDocument
     PRIVACY_POLICY mencione el logging de auditoría. La limpieza automática (cron job o
     scheduled task) puede diferirse a v2; la **declaración** debe hacerse en v1.

---

## Acciones que SÍ deben auditarse

| Módulo | Acción | AuditAction | AuditEntity |
|--------|--------|-------------|-------------|
| EventsService | `create()` | CREATE | EVENT |
| EventsService | `approve()` | APPROVE | EVENT |
| EventsService | `reject()` | REJECT | EVENT |
| EventsService | `ban()` | BAN | EVENT |
| EventsService | `remove()` | DELETE | EVENT |
| UsersService | `setBanned(id, true)` | BAN | USER |
| UsersService | `setBanned(id, false)` | UNBAN | USER |
| UsersService | `remove()` | DELETE | USER |
| UsersService | `update()` solo cuando cambia `role` | UPDATE | USER | con `metadata: { prevRole, newRole }` |
| SpotsService | `approve()` | APPROVE | SPOT |
| SpotsService | `reject()` | REJECT | SPOT |
| SpotsService | `ban()` | BAN | SPOT |
| HeroesService | `approve()` | APPROVE | HERO |
| HeroesService | `reject()` | REJECT | HERO |
| HeroesService | `ban()` | BAN | HERO |

## Acciones que NO deben auditarse

- Todos los GETs (listados, detalles, búsqueda)
- `auth/login`, `auth/register`, `auth/me` (son acciones de sesión, no de entidades)
- `auth/forgot-password` y `auth/reset-password` (nunca loguear tokens)
- Subidas de imágenes (UploadsController)
- Newsletter subscribe/unsubscribe
- Likes

---

## Validation Architecture

`nyquist_validation: true` en config.json; se incluye esta sección.

### Estado actual de tests

No existen archivos de test en el API (`*.spec.ts`, `*.test.ts` — verificado con `find`).
Tampoco hay configuración Jest en `package.json` (campo `"jest": null`). El CLI NestJS 11
incluye Jest por defecto en la instalación pero no se configuró en este proyecto.

Esto significa que **Wave 0 de los planes debe configurar Jest** antes de cualquier test.

### Test Framework a configurar (Wave 0)

| Property | Value |
|----------|-------|
| Framework | Jest 29 + `@nestjs/testing` |
| Config file | `apps/api/jest.config.js` — Wave 0 gap |
| Quick run command | `cd apps/api && npx jest --testPathPattern=audit --no-coverage` |
| Full suite command | `cd apps/api && npx jest --no-coverage` |

### Phase Requirements → Test Map

| Req ID | Comportamiento | Tipo | Comando automatizado | Archivo existe |
|--------|---------------|------|---------------------|----------------|
| AUD-01 | Migración crea tabla `audit_logs` | smoke | `prisma migrate status` | ❌ Wave 0 |
| AUD-02 | `AuditService.log()` inserta registro en DB | unit | `npx jest audit.service.spec` | ❌ Wave 0 |
| AUD-02 | Fallo de insert no propaga excepción | unit | `npx jest audit.service.spec` | ❌ Wave 0 |
| AUD-03 | `req.ip` retorna IP real con trust proxy | unit/smoke | `npx jest` (manual verify) | ❌ Wave 0 |
| AUD-04 | `GET /audit-logs` retorna 403 para AUTHENTICATED | e2e | `npx jest audit.e2e.spec` | ❌ Wave 0 |
| AUD-04 | Filtros por entity/action/userId funcionan | integration | `npx jest audit.service.spec` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `apps/api/jest.config.js` — configuración base Jest para NestJS
- [ ] `apps/api/src/audit/audit.service.spec.ts` — unit tests para AuditService
- [ ] `apps/api/test/audit.e2e-spec.ts` — test e2e para GET /audit-logs con roles
- [ ] Instalar devDeps: `npm install --save-dev @nestjs/testing jest @types/jest ts-jest` en `apps/api`

---

## State of the Art

| Approach antiguo | Approach actual | Impacto |
|-----------------|-----------------|---------|
| Interceptor global para todo | Interceptor para GETs (cache) + manual para writes (audit) | El interceptor de cache ya existe; el patrón coexiste |
| Parsear x-forwarded-for manual | `trust proxy` + `req.ip` | Más seguro y mantenible |
| FK con Cascade en audit tables | Sin FK explícita (userId Int?) | Preserva historia ante borrado de usuario |

---

## Sources

### Primary (HIGH confidence)
- [Express behind proxies docs](https://expressjs.com/en/guide/behind-proxies/) — trust proxy 1 behavior, req.ip parsing
- Codebase directo: `apps/api/src/`, `apps/api/prisma/schema.prisma` — patrones existentes verificados

### Secondary (MEDIUM confidence)
- [Building an Audit Trail System in NestJS (Medium)](https://medium.com/@solomoncodes/building-an-audit-trail-system-in-nestjs-222a4604a6a2) — interceptor pattern, APP_INTERCEPTOR global
- [Building a Comprehensive Audit System in NestJS (Medium)](https://medium.com/@usottah/building-a-comprehensive-audit-system-in-nestjs-and-express-js-b34af8588f58) — `req.ip || req.socket.remoteAddress`, user-agent capture
- [Understanding Scopes in NestJS (dev.to)](https://dev.to/abhivyaktii/understanding-scopes-in-nestjs-a-comprehensive-guide-8j0) — cascading scope warning, performance implications
- [NestJS Injection Scopes (wanago.io, 2024)](https://wanago.io/2024/04/01/api-nestjs-injection-scopes/) — singleton vs request-scoped performance

### Tertiary (LOW confidence — no verificado contra NestJS 11 docs directamente)
- WebSearch general sobre NestJS audit logging patterns — consistent with above

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no hay dependencias nuevas; todo verificado en package.json
- Architecture (patrón singleton + manual call): HIGH — codebase patterns verificados, Express docs para trust proxy verificados
- Pitfalls: HIGH — verificados con sources secundarios y análisis del schema
- Validation architecture: HIGH — verificado con find que no existen tests

**Research date:** 2026-05-22
**Valid until:** 2026-11-22 (stack estable; NestJS 11 + Prisma 6 sin cambios breaking esperados en 6 meses)
