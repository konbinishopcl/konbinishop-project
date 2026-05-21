---
phase: quick
plan: 260521-kcl
type: execute
wave: 1
depends_on: []
files_modified:
  - docs/WEBSITE-VIEWS.md
autonomous: true
requirements: []

must_haves:
  truths:
    - "WEBSITE-VIEWS.md documenta el flujo completo de creación de spot (campos, linkType, cupo, precio por día)"
    - "WEBSITE-VIEWS.md documenta el upsell post-wizard de evento (spot y/o hero si hay cupo)"
    - "WEBSITE-VIEWS.md documenta la vista /carrito con sus tres tipos de ítems (EVENT, SPOT, HERO) y el cálculo de total"
    - "WEBSITE-VIEWS.md documenta las pasarelas de pago soportadas y cuál está activa"
    - "WEBSITE-VIEWS.md documenta las vistas del dashboard para regiones, comunas, categorías y tags"
    - "WEBSITE-VIEWS.md documenta las vistas /recuperar-contrasena y /reset-password/:token"
    - "WEBSITE-VIEWS.md no describe validación por código en el login (no existe en la API)"
  artifacts:
    - path: "docs/WEBSITE-VIEWS.md"
      provides: "Documentación actualizada con todas las reglas de negocio y flujos"
  key_links: []
---

<objective>
Actualizar docs/WEBSITE-VIEWS.md con todas las reglas de negocio, flujos y vistas que faltan, derivadas directamente del código de la API (controladores, servicios, DTOs y schema Prisma).

Purpose: Mantener WEBSITE-VIEWS.md como fuente de verdad del website para que cualquier implementador (Claude o humano) entienda exactamente qué construir y por qué, sin necesidad de leer la API.
Output: docs/WEBSITE-VIEWS.md actualizado con 7 secciones nuevas o expandidas.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@docs/WEBSITE-VIEWS.md
@apps/api/src/spots/spots.controller.ts
@apps/api/src/spots/spots.service.ts
@apps/api/src/spots/dto/create-spot.dto.ts
@apps/api/src/heroes/heroes.controller.ts
@apps/api/src/heroes/heroes.service.ts
@apps/api/src/orders/orders.controller.ts
@apps/api/src/orders/orders.service.ts
@apps/api/src/payments/payments.controller.ts
@apps/api/src/payments/payments.service.ts
@apps/api/src/payments/gateway.factory.ts
@apps/api/src/payments/dto/checkout.dto.ts
@apps/api/src/auth/auth.controller.ts
@apps/api/src/catalog/catalog.controller.ts
@apps/api/prisma/schema.prisma
</context>

<tasks>

<task type="auto">
  <name>Task 1: Leer todos los archivos de contexto y actualizar docs/WEBSITE-VIEWS.md</name>
  <files>docs/WEBSITE-VIEWS.md</files>
  <action>
Leer todos los archivos listados en `<context>` para entender las reglas reales de la API. Luego editar docs/WEBSITE-VIEWS.md añadiendo o expandiendo las secciones que se describen a continuación. NO tocar el texto existente salvo para corregir imprecisiones factuales evidentes.

**Hechos clave de la API (ya verificados — úsalos directamente):**

**Spots:**
- Campos al crear: `title` (2-120 chars), `image` (URL, opcional), `linkType` (enum: URL | PHONE | EMAIL), `linkValue` (URL, teléfono o email según linkType).
- El spot se crea en `DRAFT`. Los días, monto y expirationDate se asignan recién al confirmar el pago.
- Precio por día: `SPOT_PRICE_PER_DAY` (default CLP $8.000). Cupo máximo activo: `SPOT_MAX_ACTIVE` (default 10). Máximo de días: `SPOT_MAX_DAYS` (default 30).
- Cuota disponible: `GET /spots/quota` devuelve `{ max, active, available, pricePerDay, maxDays }`.
- El cupo se valida al agregar al carrito Y al iniciar el pago (doble check).
- Endpoint público: `GET /spots` devuelve solo los spots APPROVED y no expirados.
- No hay vista de detalle de spot — es solo imagen + título + link.

**Heroes:**
- Campos al crear: `title`, `titleAccent` (opcional, segunda línea en acento/naranja), `lead` (descripción corta, opcional), `image` (URL), `date` (opcional), `place` (opcional), `link` (URL CTA), `categoryId` (opcional).
- El hero se crea en `DRAFT`. Los días, monto y expirationDate se asignan al confirmar el pago.
- Precio por día: `HERO_PRICE_PER_DAY` (default CLP $15.000). Cupo máximo activo: `HERO_MAX_ACTIVE` (default 5). Máximo de días: `HERO_MAX_DAYS` (default 30).
- Cuota disponible: `GET /heroes/quota` devuelve `{ max, active, available, pricePerDay, maxDays }`.
- El cupo se valida al agregar al carrito Y al iniciar el pago.

**Carrito (Orders):**
- Un usuario tiene como máximo un carrito en estado DRAFT. `GET /orders/draft` lo obtiene o crea.
- El carrito puede tener hasta 3 ítems, uno por tipo: `EVENT`, `SPOT`, `HERO` (unique constraint `orderId_type`).
- `PUT /orders/:id/items` agrega o reemplaza un ítem. Campos: `type`, `days`, más `eventId`|`spotId`|`heroId` según el tipo.
- El precio unitario se congela al agregar al carrito: para EVENT es el `pricePerDay` más alto de sus categorías, para SPOT es `SPOT_PRICE_PER_DAY`, para HERO es `HERO_PRICE_PER_DAY`.
- `subtotal = days * unitPrice` por ítem. `total` de la orden = suma de subtotales.
- `DELETE /orders/:id/items/:type` quita un ítem por tipo.
- Solo eventos, spots y heroes en estado DRAFT se pueden agregar al carrito.
- Para EVENT: `EVENT_MAX_DAYS` (default 60). Para SPOT: 30. Para HERO: 30.

**Pago (Payments):**
- `POST /payments/:orderId/checkout` con `{ gateway: "TRANSBANK" }` inicia el pago. Devuelve `{ redirectUrl, externalId }`.
- La orden pasa a `PENDING_PAYMENT`. El frontend redirige al usuario a `redirectUrl` (Transbank WebPay Plus).
- Al regresar, Transbank llama a `POST /payments/transbank/callback` con `token_ws` (éxito) o `TBK_TOKEN` (abortado por usuario).
- Si el pago es exitoso: los ítems pasan a `PENDING_MODERATION` (con sus días y expirationDate asignados), la orden pasa a `PAID`. El frontend recibe redirect a `/checkout/success?orderId=X`.
- Si es abortado: redirect a `/checkout/failed?reason=aborted`.
- Si falla: orden pasa a `FAILED`, redirect a `/checkout/failed?orderId=X&code=Y`.
- El enum `GatewayType` actualmente solo tiene `TRANSBANK`. El `GatewayFactory` lanza error para cualquier otro valor → la arquitectura permite agregar más pasarelas (Flow, MercadoPago, etc.) sin cambiar el contrato del endpoint.

**Auth — recuperación de contraseña:**
- `POST /auth/forgot-password` con `{ email }`: busca el usuario y, si existe, genera un token de recuperación (hash SHA-256 almacenado en `User.resetToken` con expiración en `User.resetTokenExpiry`). Devuelve siempre 200 para no revelar si el email existe.
- `POST /auth/reset-password` con `{ token, password }`: valida el token, actualiza la contraseña, borra el token.
- No existe validación por código en el login (solo email + contraseña). Los botones de social login son visuales.

**Catalog — CRUD de taxonomías:**
- Regiones: `GET /regions`, `GET /regions/:id` (público), `POST/PATCH/DELETE` (ADMIN+).
- Comunas: `GET /communes?region=<slug>` (filtro opcional por slug de región), `GET /communes/:id` (público), `POST/PATCH/DELETE` (ADMIN+).
- Categorías: `GET /categories`, `GET /categories/:id` (público), `POST/PATCH/DELETE` (ADMIN+). El campo `pricePerDay` de Category define el precio de publicación de un evento.
- Tags: `GET /tags`, `GET /tags/:id` (público), `POST/PATCH/DELETE` (ADMIN+). Los tags se usan en artículos, no en eventos.

---

**Secciones a agregar o actualizar en WEBSITE-VIEWS.md:**

**A. En la sección `/crear` — agregar subsección "Selección de región y comuna":**
Documentar que el Paso 2 del wizard incluye selección de región y luego de comuna filtrada por región. El website debe:
1. Llamar `GET /regions` para poblar el selector de región.
2. Al elegir región, llamar `GET /communes?region=<slug>` para poblar el selector de comuna.
3. Enviar `regionId` y `communeId` en el `POST /events`.

**B. Agregar nueva sección "Upsell post-wizard de evento"** (después de `/crear`):
Documentar que, tras crear exitosamente el evento (respuesta 201 del `POST /events`), el website puede mostrar una pantalla intermedia de upsell antes de redirigir al carrito. Esta pantalla:
- Llama a `GET /spots/quota` y `GET /heroes/quota` en paralelo.
- Si `available > 0` para spots: muestra card con precio por día, cupo disponible y CTA para crear un aviso.
- Si `available > 0` para heroes: muestra card con precio por día, cupo disponible y CTA para crear un hero.
- Si ninguno tiene cupo: omite la pantalla y va directo al carrito.
- El usuario puede omitir el upsell ("Continuar sin publicitar").

**C. Agregar nueva sección `/carrito` (o modal de checkout):**
Documentar la vista de carrito que agrupa los ítems antes de pagar:
- `GET /orders/draft` obtiene o crea el carrito DRAFT del usuario (requiere JWT).
- Muestra los ítems del carrito con: tipo (Evento / Aviso / Hero), nombre/título, días de duración elegidos, precio unitario por día, subtotal.
- Permite modificar días con `PUT /orders/:id/items` (reemplaza el ítem existente del mismo tipo).
- Permite eliminar un ítem con `DELETE /orders/:id/items/:type`.
- Muestra el total de la orden.
- Botón "Pagar" → llama a `POST /payments/:orderId/checkout` con `{ gateway: "TRANSBANK" }`, obtiene `redirectUrl` y redirige al usuario.
- Estados posibles de la orden: `DRAFT` (editable), `PENDING_PAYMENT` (en proceso), `PAID` (completada), `FAILED` (falló).

**D. Agregar nueva sección "Pasarelas de pago"** (dentro de la sección de pagos existente o nueva):
- El sistema soporta múltiples pasarelas vía `GatewayType` enum y `GatewayFactory`.
- Actualmente activa: **Transbank WebPay Plus** (integración de producción/integración según `TRANSBANK_ENV`).
- Arquitectura preparada para agregar Flow, MercadoPago u otras sin cambiar el endpoint de checkout.
- El flujo de callback es server-side: Transbank llama a `/api/payments/transbank/callback` (POST o GET), la API confirma y redirige al frontend.
- Vistas resultantes en el frontend: `/checkout/success?orderId=X` y `/checkout/failed?reason=...`.

**E. Expandir sección del dashboard — agregar vistas de taxonomías:**
Agregar cuatro nuevas entradas de dashboard:

`/dashboard/regions` — Regiones:
- CRUD de regiones. `GET /regions` lista todas. `POST /regions` crea. `PATCH /regions/:id` edita. `DELETE /regions/:id` elimina. Solo ADMIN+.
- No implementado — PlaceholderView.

`/dashboard/communes` — Comunas:
- CRUD de comunas. `GET /communes` lista. Filtrable por región (`?region=<slug>`). `POST /communes` crea, requiere `regionId`. `PATCH/DELETE /communes/:id`. Solo ADMIN+.
- No implementado — PlaceholderView.

`/dashboard/categories` — Categorías: (ya existe en el doc, actualizar con detalle)
- `pricePerDay` (Int, default 1000 CLP) define el precio de publicación de un evento en esa categoría. Si el evento tiene múltiples categorías, se usa el precio más alto.
- Campos adicionales: `name`, `slug`, `description`.

`/dashboard/tags` — Tags:
- CRUD de tags. `GET /tags` lista. `POST/PATCH/DELETE`. Solo ADMIN+.
- Tags se asocian a artículos, no directamente a eventos.
- No implementado — PlaceholderView.

**F. Agregar vistas de recuperación de contraseña en la sección "Auth pages":**

`/recuperar-contrasena`:
- Formulario con campo email. Sin header/footer.
- Llama a `POST /auth/forgot-password` con `{ email }`.
- La API siempre responde 200 (no revela si el email existe).
- El website muestra mensaje genérico: "Si el email está registrado, recibirás un enlace de recuperación."
- El email incluye un enlace a `/reset-password/:token`.

`/reset-password/:token`:
- Formulario con campos "Nueva contraseña" y "Confirmar contraseña". Sin header/footer.
- Al enviar: llama a `POST /auth/reset-password` con `{ token, password }`.
- Éxito: muestra confirmación y redirige a `/login`.
- Error (token inválido/expirado): muestra error y link a `/recuperar-contrasena`.
- El token es un hash SHA-256 que expira (el campo `resetTokenExpiry` en el modelo `User` controla la expiración — la API rechaza tokens caducados).

**G. Confirmar que NO hay validación por código en el login:**
En la sección `/login`, agregar nota explícita: el login es solo email + contraseña. No hay OTP, código SMS ni 2FA actualmente. Los botones de social login (Google, Instagram, Apple) son visuales sin funcionalidad.

---

**Instrucciones de edición:**
- Insertar cada sección en el lugar lógico del documento (no al final en bloque).
- Mantener el estilo del documento existente: encabezados con `###`, tablas Markdown, listas, notas con `>`.
- Usar los nombres de endpoints exactos de la API.
- No duplicar información ya correcta en el documento.
  </action>
  <verify>
    <automated>grep -c "recuperar-contrasena\|reset-password\|GatewayType\|TRANSBANK\|/orders/draft\|dashboard/regions\|dashboard/communes\|dashboard/tags\|upsell" docs/WEBSITE-VIEWS.md</automated>
  </verify>
  <done>
    - docs/WEBSITE-VIEWS.md contiene documentación de `/recuperar-contrasena` y `/reset-password/:token`
    - Documenta Transbank como única pasarela activa y la arquitectura multi-gateway
    - Documenta el carrito (`/orders/draft`) con los tres tipos de ítems y cálculo de precios
    - Documenta el upsell post-wizard con consulta de cuotas de spots y heroes
    - Documenta las vistas del dashboard para regiones, comunas y tags
    - El comando `grep -c` devuelve al menos 7 (una coincidencia por término clave)
  </done>
</task>

</tasks>

<verification>
El documento resultante debe ser consistente con la API real: los endpoints, campos, reglas de cuota, precios por defecto y flujos de pago deben coincidir exactamente con lo que implementan los controladores y servicios leídos.
</verification>

<success_criteria>
docs/WEBSITE-VIEWS.md actualizado con las 7 áreas solicitadas. Cualquier implementador puede leer el doc y saber exactamente qué endpoints llamar, en qué orden, con qué campos, y qué estados esperar — sin necesidad de abrir la API.
</success_criteria>

<output>
No se necesita SUMMARY.md para esta tarea de documentación.
</output>
