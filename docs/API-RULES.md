# Reglas de negocio — API Konbini

## Roles

| Rol | Descripción |
|---|---|
| Anónimo | Sin token. Solo lectura pública. |
| `AUTHENTICATED` | Usuario logueado. Puede crear eventos, spots, heroes y artículos patrocinados. |
| `ADMIN` | Modera contenido (aprueba, rechaza, banea). Accede a todos los recursos. |
| `SUPER_ADMIN` | Todo lo de ADMIN + gestión de usuarios, asignación de badge Verificado y eliminación de datos. |

---

## Tipos de usuario

El modelo `User` tiene un campo `type: PERSON | ORGANIZATION`.

- `PERSON` — usuario normal con credenciales de autenticación.
- `ORGANIZATION` — cuenta sin credenciales propias. No puede hacer login directamente. Solo se accede mediante el contexto de un miembro autorizado. Se crea y gestiona como cualquier user, pero sin password ni 2FA.

Ambos tipos comparten el mismo modelo, los mismos endpoints y los mismos estados. Las diferencias se manejan con el campo `type` y las reglas de membresía.

---

## Estados de publicación

Aplica a **Event**, **Spot**, **Hero** y **Article** (artículos patrocinados).

```
DRAFT → PENDING_PAYMENT → PENDING_MODERATION → APPROVED
                                             → REJECTED
                                             → BANNED (desde APPROVED)
```

- **DRAFT**: recién creado, sin pagar.
- **PENDING_PAYMENT**: en carrito, esperando confirmación de pago.
- **PENDING_MODERATION**: pago confirmado, esperando revisión del admin.
- **APPROVED**: visible públicamente.
- **REJECTED**: rechazado por el admin (incluye motivo).
- **BANNED**: baneado por el admin tras haber sido aprobado (incluye motivo). El contenido baneado deja de ser visible públicamente pero no se elimina.

Solo los ítems en `DRAFT` se pueden agregar al carrito.
El baneo solo aplica desde `APPROVED` — un ítem rechazado no se puede banear directamente.

---

## Estados de orden

```
DRAFT → PENDING_PAYMENT → PAID
                        → FAILED
     → CANCELLED
```

- Solo se pueden modificar órdenes en `DRAFT`.
- Solo se pueden pagar órdenes en `DRAFT`.
- Un usuario (o una organización actuando como contexto) tiene máximo una orden en `DRAFT` a la vez (carrito único por contexto).

---

## Organizaciones

- Cualquier usuario autenticado puede crear una organización (`type: ORGANIZATION`).
- Al crear, el creador queda automáticamente como Owner (`role: OWNER` en la tabla de membresías).
- La organización queda activa de inmediato — sin aprobación previa.
- Un admin puede banear una organización igual que a un usuario. Al banearse, su perfil público desaparece y sus miembros no pueden operar en su nombre.
- Una organización no tiene credenciales propias — nunca aparece como `req.user` directamente. Las acciones se realizan en nombre de la org mediante el header `X-Org-Context: <orgId>`, que la API valida contra la membresía del usuario autenticado.

### Membresías

| Rol | Permisos |
|---|---|
| `OWNER` | Todo lo de MEMBER + editar datos críticos de la org (nombre, handle, avatar, banner) + gestionar miembros + eliminar la organización |
| `MEMBER` | Crear y editar borradores en nombre de la org. Ver todos los borradores del equipo. Operar el carrito compartido (agregar, pagar, eliminar ítems). |

- `POST /organizations` — crea una organización. El usuario autenticado queda como OWNER.
- `GET /organizations/:id/members` — lista de miembros. Requiere ser miembro.
- `POST /organizations/:id/members/invite` — invita por email. Solo OWNER. Genera un token de invitación con expiración de 72 horas.
- `POST /organizations/invitations/:token/accept` — acepta la invitación. El usuario autenticado queda como MEMBER.
- `PATCH /organizations/:id/members/:userId` — cambia el rol de un miembro. Solo OWNER. No se puede degradar al único OWNER.
- `DELETE /organizations/:id/members/:userId` — elimina un miembro. Solo OWNER. No puede eliminarse a sí mismo si es el único OWNER.

---

## Transferencia de contenido

Permite mover un evento, spot, hero o artículo de una cuenta personal a una organización.

- Solo se puede transferir a organizaciones a las que el usuario pertenece.
- **Si el usuario es OWNER de la org destino**: la transferencia se aplica inmediatamente sin aprobación.
- **Si el usuario es MEMBER**: se crea una solicitud de transferencia pendiente. El OWNER recibe una notificación en el sistema de mensajes y un email. El OWNER puede aceptar o rechazar.
- Hasta que sea aceptada, el ítem sigue perteneciendo al usuario original.
- Un admin puede transferir cualquier ítem directamente sin aprobación, para asistir a usuarios que publicaron en el contexto equivocado.

Endpoints:
- `POST /transfers` — `{ itemType, itemId, targetOrgId }`. Crea la transferencia.
- `GET /transfers/incoming` — solicitudes pendientes para el OWNER de una org (requiere contexto de org).
- `POST /transfers/:id/accept` — acepta. Solo OWNER de la org destino.
- `POST /transfers/:id/reject` — rechaza. Solo OWNER de la org destino.
- `POST /admin/transfers` — transferencia directa por admin, sin aprobación.

---

## Eventos

- Cualquier usuario autenticado (o contexto de organización) puede crear un evento. Queda en `DRAFT`.
- El precio se calcula como `pricePerDay` de la categoría del evento × días elegidos.
- Un evento sin `expirationDate` es visible indefinidamente una vez aprobado.
- `GET /events` responde diferente según el rol:
  - Anónimo / usuario: solo `APPROVED` y no expirados.
  - Admin: todos los estados, incluye datos del dueño.
- Solo el dueño (usuario u organización) o un admin puede eliminar o editar un evento.
- El admin aprueba con `POST /events/:id/approve` (incluye asignación de tags) y rechaza con `POST /events/:id/reject` (requiere `reason`).
- El admin banea con `POST /events/:id/ban` (requiere `reason`) y restaura con `POST /events/:id/restore`.

---

## Spots (avisos)

- Cualquier usuario autenticado (o contexto de organización) puede crear un spot. Queda en `DRAFT`.
- Precio por día, días mínimos, días máximos y cupo máximo se leen desde la tabla `Settings` en DB (no desde env vars). Los env vars actúan solo como valores de inicialización si la tabla está vacía.
- `GET /spots` devuelve solo los `APPROVED` y no expirados (siempre público).
- `GET /spots/quota` es público: muestra cupos disponibles y precio actual.
- El link puede ser URL, teléfono o email (`linkType: URL | PHONE | EMAIL`).
- Acciones de admin: aprobar, rechazar (con motivo), banear (con motivo), restaurar.

---

## Heroes (portadas)

- Cualquier usuario autenticado (o contexto de organización) puede crear un hero. Queda en `DRAFT`.
- Precio por día, días mínimos, días máximos y cupo máximo se leen desde `Settings` en DB.
- `GET /heroes` devuelve solo los `APPROVED` y no expirados (siempre público).
- `GET /heroes/quota` es público: muestra cupos disponibles y precio actual.
- El link es una URL simple (`link?: string`).
- Acciones de admin: aprobar, rechazar (con motivo), banear (con motivo), restaurar.

---

## Artículos

- `GET /articles` y `GET /articles/:slug` son públicos.
- El admin tiene CRUD completo sobre artículos editoriales.
- Los usuarios autenticados pueden **enviar artículos patrocinados** (`POST /articles/sponsored`). Quedan en `DRAFT` y siguen el mismo flujo de estados que eventos, spots y heroes (pago → moderación → aprobado/rechazado/baneado).
- El slug se genera automáticamente desde el título al crear.
- Acciones de admin sobre artículos patrocinados: aprobar, rechazar (con motivo legal), banear (con motivo), editar.

---

## Carrito (Orders)

- `GET /orders/draft` crea el carrito si no existe, o devuelve el existente (idempotente). Funciona tanto en contexto personal como en contexto de organización.
- Tipos de ítem soportados: `EVENT`, `SPOT`, `HERO`, `ARTICLE`.
- Solo un ítem por tipo por orden. Agregar el mismo tipo reemplaza el ítem anterior (upsert).
- Al agregar un ítem se valida:
  1. Que el ítem pertenezca al usuario o a la organización en contexto.
  2. Que esté en estado `DRAFT`.
  3. Que los días estén dentro del rango permitido (mínimo y máximo según tipo).
  4. Que haya cupo disponible (spots y heroes).
- El `total` se recalcula automáticamente tras cada cambio.
- El precio por día queda congelado al momento de agregar al carrito.
- Para usuarios con suscripción activa con créditos disponibles, el ítem de tipo `EVENT` se agrega sin costo y con duración fija (45 días o hasta la fecha del evento si es antes). El selector de días no aplica.

---

## Pago (checkout)

1. `POST /payments/checkout` con `{ orderId, gateway }` inicia la transacción.
   - Valida cuota nuevamente (doble check: al agregar y al pagar).
   - Aplica descuento de suscripción sobre spots y heroes si corresponde.
   - Transiciona la orden a `PENDING_PAYMENT`.
   - Devuelve `redirectUrl` para enviar al usuario a la pasarela.
2. Transbank redirige al callback de la API.
3. Si el pago es exitoso:
   - Todos los ítems pasan a `PENDING_MODERATION`.
   - La orden pasa a `PAID`.
   - Se asigna `expirationDate = hoy + días` a cada ítem.
   - Si se usó un crédito de suscripción, se descuenta del contador del ciclo actual.
4. Si el pago falla: la orden pasa a `FAILED`, los ítems quedan en `DRAFT`.
5. El callback es idempotente: si llega duplicado con la orden ya en `PAID`, devuelve éxito sin llamar a Transbank de nuevo.

---

## Suscripción

- `GET /subscriptions/me` — estado de la suscripción activa del usuario (o de la org en contexto), créditos usados y disponibles del ciclo actual.
- `POST /subscriptions` — activa el plan mensual. Genera una orden de suscripción y redirige a la pasarela.
- `DELETE /subscriptions/me` — cancela la suscripción. Vence al final del ciclo actual; no se cobra el siguiente mes. Los créditos restantes del mes se pierden.
- Los créditos no usados no se acumulan al mes siguiente.
- `GET /subscriptions` — admin: lista todas las suscripciones activas.

---

## Likes

- Solo usuarios autenticados pueden dar like.
- Un usuario solo puede dar like una vez por publicación (409 si intenta de nuevo).
- Se puede quitar el like con `DELETE`.
- Todas las respuestas de eventos y artículos incluyen `_count.likes`.

| Endpoint | Acción |
|---|---|
| `POST /events/:id/like` | Dar like a un evento |
| `DELETE /events/:id/like` | Quitar like de un evento |
| `POST /articles/:id/like` | Dar like a un artículo |
| `DELETE /articles/:id/like` | Quitar like de un artículo |

Respuesta: `{ liked: boolean, likes: number }`

---

## Favoritos

- Solo usuarios autenticados pueden guardar eventos.
- `POST /events/:id/save` — guarda el evento. Idempotente (no lanza error si ya está guardado).
- `DELETE /events/:id/save` — quita el guardado.
- `GET /users/me/saved-events` — lista de eventos guardados por el usuario autenticado.
- Las respuestas de eventos incluyen `isSaved: boolean` cuando hay sesión.

---

## Catálogo

### Geografía

Reemplaza `regions` y `communes`. Jerarquía: **País → División administrativa → Ciudad**.

| Recurso | Público | Admin |
|---|---|---|
| `GET /countries` | ✓ | — |
| `GET /states?country=slug` | ✓ | — |
| `GET /cities?state=slug` | ✓ | — |
| `POST/PATCH/DELETE` en cualquiera | — | ✓ |

### Categorías

| Recurso | Público | Admin |
|---|---|---|
| `GET /categories` | ✓ | — |
| `POST/PATCH/DELETE /categories` | — | ✓ |

Cada categoría tiene: `name`, `slug`, `icon`, `color`, `pricePerDay`, `minDays`, `maxDays`, `order`.

### Tags

| Recurso | Público | Admin |
|---|---|---|
| `GET /tags` | ✓ | — |
| `POST/PATCH/DELETE /tags` | — | ✓ |

Los tags se asignan automáticamente por IA al aprobar un evento o artículo. El admin puede sobreescribirlos manualmente en el mismo flujo de aprobación.

---

## Settings (configuración del sistema)

Solo admin. Tabla única en DB con los valores configurables del sistema.

| Clave | Descripción | Default |
|---|---|---|
| `SPOT_PRICE_PER_DAY` | Precio por día de un aviso (CLP) | 8000 |
| `SPOT_MIN_DAYS` | Días mínimos de publicación de un aviso | 10 |
| `SPOT_MAX_DAYS` | Días máximos de publicación de un aviso | 30 |
| `SPOT_MAX_ACTIVE` | Cupo máximo de avisos activos simultáneos | 12 |
| `HERO_PRICE_PER_DAY` | Precio por día de una portada (CLP) | 15000 |
| `HERO_MIN_DAYS` | Días mínimos de publicación de una portada | 10 |
| `HERO_MAX_DAYS` | Días máximos de publicación de una portada | 30 |
| `HERO_MAX_ACTIVE` | Cupo máximo de portadas activas simultáneas | 5 |
| `SUBSCRIPTION_PRICE` | Precio mensual de la suscripción (CLP) | — |
| `SUBSCRIPTION_CREDITS` | Créditos de eventos por mes | 10 |
| `SUBSCRIPTION_SPOT_DISCOUNT` | Descuento en spots para suscriptores (%) | — |
| `SUBSCRIPTION_HERO_DISCOUNT` | Descuento en heroes para suscriptores (%) | — |

- `GET /settings` — admin: devuelve todos los valores.
- `PATCH /settings` — admin: actualiza uno o más valores.
- `GET /settings/public` — público: devuelve solo los valores necesarios para el frontend (precios, cupos, días).

---

## Perfil público / Organizador

- `GET /users/:handle` — perfil público de un usuario o una organización. Solo visible si tiene al menos un evento aprobado.
- `PATCH /users/me/organizer` — actualiza el perfil público del usuario autenticado (nombre público, handle, avatar, banner, bio, redes sociales).
- El handle debe ser único entre todos los users (personas y organizaciones).
- El badge Verificado solo puede asignarlo o revocarlo un `SUPER_ADMIN` mediante `PATCH /users/:id/verified`.

---

## Uploads

- `POST /uploads` acepta una imagen y devuelve su URL relativa (`/uploads/filename.ext`).
- Solo usuarios autenticados pueden subir archivos.

---

## Auth

### Login y registro

- `POST /auth/register` — registra un nuevo usuario. Devuelve token de sesión pendiente de 2FA.
- `POST /auth/login` — inicia sesión con email y contraseña. Devuelve token pendiente de 2FA.
- `POST /auth/2fa/verify` — valida el código de 6 dígitos enviado por email. Devuelve el token de sesión definitivo.
- `POST /auth/2fa/resend` — reenvía el código de 2FA.

### Google OAuth

- `GET /auth/google` — inicia el flujo OAuth.
- `GET /auth/google/callback` — callback. Si el usuario ya existe: login directo (sin 2FA). Si es nuevo: devuelve token de onboarding para completar el mini-registro (país, T&C).
- `POST /auth/google/onboarding` — completa el registro de un usuario nuevo de Google. Requiere token de onboarding. Crea la cuenta y devuelve el token de sesión definitivo.

### Recuperación de contraseña

- `POST /auth/forgot-password` — genera un token (hash SHA-256) y lo guarda con expiración de 1 hora.
- `POST /auth/reset-password` — valida el token, actualiza la contraseña y lo invalida.

### Cambio de email y contraseña

- `PATCH /auth/change-password` — requiere contraseña actual + nueva contraseña.
- `POST /auth/change-email/request` — recibe email actual + contraseña. Si son correctos, envía link de confirmación al nuevo email.
- `POST /auth/change-email/confirm` — valida el token del link y aplica el cambio.

---

## Notificaciones / Mensajes

- `GET /notifications` — lista de mensajes del usuario autenticado (o de la org en contexto), ordenados por fecha descendente.
- `PATCH /notifications/:id/read` — marca un mensaje como leído.
- `PATCH /notifications/read-all` — marca todos como leídos.
- `GET /notifications/unread-count` — número de mensajes no leídos (usado por el badge del header).

Los mensajes se generan automáticamente por el sistema en eventos como: aprobación, rechazo, baneo de contenido, invitaciones a organizaciones, solicitudes de transferencia.

---

## Servicios externos (Fotografía y Creadores de contenido)

Formularios de cotización que llegan a los admins como solicitudes.

### Fotografía

- `POST /services/photography` — público (no requiere auth). Campos: nombre, email, nombre del evento, fecha, lugar, servicios solicitados (array de IDs de opciones).
- `GET /services/photography` — admin: lista de solicitudes con estados del pipeline CRM.
- `PATCH /services/photography/:id` — admin: actualiza estado o archiva.

### Creadores de contenido

- `POST /services/content-creators` — público. Mismos campos base que fotografía + opciones propias del servicio.
- `GET /services/content-creators` — admin: lista de solicitudes.
- `PATCH /services/content-creators/:id` — admin: actualiza estado o archiva.

### Opciones de servicios (configurables desde settings)

- `GET /services/photography/options` — público: lista de checkboxes disponibles para el formulario de fotografía.
- `POST/PATCH/DELETE /services/photography/options` — admin: CRUD de opciones.
- `GET /services/content-creators/options` — público.
- `POST/PATCH/DELETE /services/content-creators/options` — admin: CRUD de opciones.

---

## CRM

Pipeline comercial unificado para solicitudes de Contacto, Fotografía y Creadores de contenido.

Estados del pipeline: `NEW | CONTACTED | NEGOTIATING | WON | LOST`

- `GET /crm` — admin: lista de todas las solicitudes con su estado de pipeline y tipo (`CONTACT | PHOTOGRAPHY | CONTENT`).
- `PATCH /crm/:id/stage` — admin: mueve una solicitud a otro estado. Si el nuevo estado es `LOST`, requiere `reason`.
- `POST /crm/:id/notes` — admin: agrega una nota interna con timestamp y autor.
- `GET /crm/:id/notes` — admin: historial de notas de una solicitud.

---

## Contacto

- `POST /contact` — público. Campos: nombre, email, asunto, mensaje. Crea una entrada en el CRM con tipo `CONTACT` y estado `NEW`.
- `GET /contact` — admin: lista de mensajes de contacto (alias de `GET /crm?type=CONTACT`).
