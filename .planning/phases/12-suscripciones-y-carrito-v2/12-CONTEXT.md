# Phase 12: Suscripciones y carrito v2 - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Plan de suscripción mensual con créditos de eventos, descuentos en spots/heroes para
suscriptores, y carrito actualizado con contexto de org, tipo ARTICLE y lógica de créditos.

Entregables concretos:
1. **Módulo `subscriptions`** — activar (orden especial + Transbank), cancelar (fin de ciclo),
   GET estado + créditos; admin GET lista + configuración.
2. **Orders v2** — tipo ARTICLE operativo en carrito (upsert); validaciones de cupo
   re-verificadas al pagar; migrar `OrdersService` de `ConfigService` a `SettingsService`.
3. **Créditos de suscripción en carrito** — EVENT con suscripción activa → price = 0,
   days = 45 fijos; descuentos SPOT/HERO aplicados automáticamente al checkout.
4. **Pago suscripción** — flujo checkout con Transbank, callback `/subscriptions/confirm`
   activa el plan y registra ciclo.

</domain>

<decisions>
## Implementation Decisions

### Flujo de pago de suscripción (discutido)

- **D-01:** `POST /subscriptions` crea una **Order especial** con un ítem de tipo `SUBSCRIPTION`
  y la pasa a Transbank igual que un checkout normal. Reutiliza `GatewayFactory` +
  `PaymentGateway.initiate()` — sin duplicar lógica de pago.
- **D-02:** Callback de Transbank para suscripciones va a un **endpoint dedicado**
  `POST /subscriptions/confirm`. Ese endpoint activa el plan, registra `cycleStart`/`cycleEnd`
  (hoy + 30 días), y copia el valor de `Settings.SUBSCRIPTION_CREDITS` a
  `Subscription.creditsTotal`.
- **D-03:** Si Transbank rechaza el pago, **la suscripción NO se crea en DB**. Solo existe tras
  confirmación exitosa. El usuario puede reintentar desde `/cuenta/suscripcion`.
- **D-04:** Si el usuario ya tiene suscripción ACTIVE, `POST /subscriptions` lanza **409 Conflict**.
  El schema tiene `@unique` en `userId` y `orgId` — el usuario debe cancelar primero.

### Créditos en carrito (reglas de negocio — Design Brief §3.12, §3.13)

- **D-05:** Cuando el usuario tiene suscripción activa con créditos disponibles
  (`creditsUsed < creditsTotal`), agregar un EVENT al carrito **auto-aplica** el crédito:
  - `unitPrice = 0`, `subtotal = 0`
  - `days` = 45 fijos (o días hasta fecha del evento si cae antes de 45 días)
  - El selector de días desaparece en el frontend
  - Etiqueta visible: "Crédito de suscripción (X restantes este mes)"
- **D-06:** Si el usuario tiene suscripción activa pero `creditsUsed >= creditsTotal` (0 créditos),
  el EVENT se cobra normalmente (sin descuento ni días fijos).
- **D-07:** Descuento para suscriptores en SPOT y HERO:
  - Se aplica automáticamente al agregar el ítem al carrito
  - `unitPrice = precioBase * (1 - descuento/100)`
  - `SUBSCRIPTION_SPOT_DISCOUNT` y `SUBSCRIPTION_HERO_DISCOUNT` se leen desde `SettingsService`
    (ya seedeados en Phase 11: ambos = 20 por defecto)
  - El descuento se muestra como línea separada en el carrito (no oculto en el unitPrice)
- **D-08:** Al confirmar el pago de un carrito con crédito usado, `Subscription.creditsUsed`
  se incrementa en 1 dentro de la misma transacción Prisma del checkout.

### Cancelación y ciclos (Design Brief §3.12 /cuenta/suscripcion)

- **D-09:** `DELETE /subscriptions/me` (o `PATCH /subscriptions/me/cancel`) **no cancela
  inmediatamente** — marca `cancelledAt = now()` y la suscripción permanece ACTIVE hasta
  `cycleEnd`. No se cobra el ciclo siguiente.
- **D-10:** Los créditos restantes al cancelar **se pierden** al llegar a `cycleEnd` (no se
  acumulan ni devuelven). El frontend advierte esto en el lightbox de confirmación.
- **D-11:** Renovación automática fuera del scope de Phase 12 — no hay cron job. El ciclo
  actual simplemente vence. Si el usuario quiere renovar, vuelve a suscribirse manualmente.
- **D-12:** Créditos no usados al fin del ciclo **se pierden** (no se acumulan). Design Brief
  lo especifica explícitamente: "Los créditos no utilizados se pierden al final del mes."

### Alcance de suscripción

- **D-13:** Tanto personas (User.type=PERSON) como organizaciones (User.type=ORGANIZATION)
  pueden suscribirse. El schema ya soporta `Subscription.userId` y `Subscription.orgId`
  con `@unique` separados. El `OrgContextGuard` determina si la sub es personal u org.
- **D-14:** `GET /subscriptions/me` devuelve el estado, créditos y `cycleEnd` del suscriptor
  activo (userId o orgId según `X-Org-Context`). Si no hay suscripción, devuelve `{ active: false }`.

### ARTICLE en carrito (COM-02)

- **D-15:** `OrderItemType.ARTICLE` ya existe en el schema. Agregar un ARTICLE al carrito
  sigue el **patrón upsert** existente (una sola entrada por tipo por Order — `@@unique([orderId, type])`).
- **D-16:** El precio de un artículo patrocinado es fijo (no por día). Se lee desde
  `SettingsService` clave `ARTICLE_PRICE` (si no existe aún, se crea en seed de Phase 12).
  `days = 0` o campo no aplicable; `subtotal = unitPrice` fijo.

### Migración OrdersService → SettingsService (COM-02)

- **D-17:** `OrdersService` hoy lee `HERO_MAX_DAYS` y `SPOT_MAX_DAYS` desde `ConfigService`.
  Phase 12 migra estos a `SettingsService` (igual que hicieron SpotsService/HeroesService en
  Phase 11). `EVENT_MAX_DAYS` también se migra a Settings si la clave existe; si no, se crea
  en seed con valor 60.

### Endpoints admin

- **D-18:** `GET /subscriptions` (ADMIN+) devuelve lista paginada de todas las suscripciones
  con userId/orgId, estado, créditos y fechas de ciclo.

### Claude's Discretion

- Estructura interna de `SubscriptionsModule` (service + controller + DTOs)
- Si crear `OrderItemType.SUBSCRIPTION` en el enum o usar un Order sin items para el pago
- Cómo calcular "días hasta fecha del evento" para el caso de crédito < 45 días
- Nombre del método que aplica crédito (`applySubscriptionCredit()` o inline en `addItem()`)
- Validación de si el evento pertenece al usuario/org antes de aplicar crédito

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Reglas de negocio de suscripción y carrito
- `docs/DESIGN-BRIEF.md` §1 (Modelo de negocio), §3.12 (/cuenta/suscripcion), §3.13 (Carrito)
  — Reglas de créditos, cancelación, descuentos, flujo de pago de suscripción

### Schema existente
- `apps/api/prisma/schema.prisma` — Modelos `Subscription`, `Order`, `OrderItem`, enum
  `OrderItemType` (ya incluye ARTICLE), enum `SubscriptionStatus`

### Pasarela de pago existente
- `apps/api/src/payments/gateway.interface.ts` — Interfaz `PaymentGateway` que la suscripción debe reutilizar
- `apps/api/src/payments/gateway.factory.ts` — `GatewayFactory` con Transbank
- `apps/api/src/payments/payments.service.ts` — Lógica de checkout existente (referencia)
- `apps/api/src/payments/payments.controller.ts` — Endpoint `confirm` existente (referencia)

### Orders existente
- `apps/api/src/orders/orders.service.ts` — Lógica de carrito actual a extender (addItem, checkout)
- `apps/api/src/orders/orders.module.ts` — Módulo actual

### Settings Phase 11 (claves disponibles)
- `.planning/phases/11-notificaciones-y-settings/11-CONTEXT.md` — Claves ya seedeadas:
  SUBSCRIPTION_CREDITS=10, SUBSCRIPTION_PRICE=9990, SUBSCRIPTION_SPOT_DISCOUNT=20,
  SUBSCRIPTION_HERO_DISCOUNT=20

### Patrones de módulos existentes
- `apps/api/src/notifications/notifications.module.ts` — Patrón de módulo non-global (referencia)
- `apps/api/src/settings/settings.service.ts` — SettingsService con `get()` y `getNum()` (Phase 11)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PaymentGateway` interface + `GatewayFactory`: `initiate(orderId, amount, returnUrl)` +
  `confirm(token)` — la suscripción reutiliza esto pasando el orderId de la "orden especial"
- `OrdersService.getOrCreateDraft()`: patrón de carrito ya implementado con soporte `orgId`
- `OrgContextGuard` + `@OrgContext()`: para determinar si la sub es personal u org
- `JwtAuthGuard` + `@CurrentUser()`: para todos los endpoints autenticados
- `SettingsService.getNum(key)`: para leer SUBSCRIPTION_CREDITS, SUBSCRIPTION_PRICE,
  SUBSCRIPTION_SPOT_DISCOUNT, SUBSCRIPTION_HERO_DISCOUNT

### Established Patterns
- Fire-and-forget services: `NotificationsService.create()` void — las notificaciones
  SUBSCRIPTION_ACTIVATED/CANCELLED se emiten igual (Phase 11-02 lo dejó diferido a Phase 12)
- Orders con `@@unique([orderId, type])`: upsert de ARTICLE sigue este patrón
- `OrdersService` usa `ConfigService` para maxDays — migrar a `SettingsService` en este phase
- Seed con `upsert + update:{}`: para ARTICLE_PRICE y EVENT_MAX_DAYS si no existen

### Integration Points
- `apps/api/src/app.module.ts` — importar `SubscriptionsModule`
- `apps/api/src/orders/orders.module.ts` — importar `SubscriptionsModule` para leer
  estado de suscripción al agregar items al carrito
- `apps/api/src/notifications/notifications.service.ts` — emitir SUBSCRIPTION_ACTIVATED
  y SUBSCRIPTION_CANCELLED (diferidos desde Phase 11-02)
- `apps/api/prisma/seed.ts` — agregar ARTICLE_PRICE y EVENT_MAX_DAYS si no existen

</code_context>

<specifics>
## Specific Ideas

- El Design Brief §3.13 especifica explícitamente: el selector de días **desaparece** en el
  carrito para ítems EVENT cubiertos por crédito — la duración es fija, no elegible.
- El Design Brief §3.13 especifica que el descuento en spots/heroes para suscriptores se muestra
  como **línea de descuento separada** en el carrito (no oculto en el precio unitario).
- El Design Brief §3.12 especifica que la pantalla `/cuenta/suscripcion` muestra historial de
  créditos usados: "lista de los eventos publicados con cada crédito (título del evento, fecha de uso)".
  Esto implica que al usar un crédito se registra qué eventId se publicó — considerar en el schema
  o en la lógica de checkout.

</specifics>

<deferred>
## Deferred Ideas

- Renovación automática de suscripción (cron job) — Phase 14 o posterior
- Notificación push cuando quedan pocos créditos (ej: solo 2 restantes)
- Historial detallado de créditos con eventId — puede requerir un modelo `SubscriptionCreditLog`
  nuevo; si el planner considera que es necesario para el requerimiento del Design Brief, puede
  incluirlo; si no, difiere a Phase 13
- Reembolsos de suscripción — fuera del scope v2

</deferred>

---

*Phase: 12-suscripciones-y-carrito-v2*
*Context gathered: 2026-05-25*
