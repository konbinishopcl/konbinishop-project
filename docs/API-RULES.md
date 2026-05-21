# Reglas de negocio — API Konbini

## Roles

| Rol | Descripción |
|---|---|
| Anónimo | Sin token. Solo lectura pública. |
| `AUTHENTICATED` | Usuario logueado. Puede crear eventos, spots y heroes. |
| `ADMIN` | Modera contenido. Accede a todo. |
| `SUPER_ADMIN` | Igual que ADMIN. |

---

## Estados de publicación

Aplica a **Event**, **Spot** y **Hero**.

```
DRAFT → PENDING_PAYMENT → PENDING_MODERATION → APPROVED
                                             → REJECTED
```

- **DRAFT**: recién creado, sin pagar.
- **PENDING_PAYMENT**: en carrito, esperando confirmación de pago.
- **PENDING_MODERATION**: pago confirmado, esperando revisión del admin.
- **APPROVED**: visible públicamente.
- **REJECTED**: rechazado por el admin (incluye motivo).

Solo los ítems en `DRAFT` se pueden agregar al carrito.

---

## Estados de orden

```
DRAFT → PENDING_PAYMENT → PAID
                        → FAILED
     → CANCELLED
```

- Solo se pueden modificar órdenes en `DRAFT`.
- Solo se pueden pagar órdenes en `DRAFT`.
- Un usuario tiene máximo una orden en `DRAFT` a la vez (carrito único).

---

## Eventos

- Cualquier usuario autenticado puede crear un evento. Queda en `DRAFT`.
- El precio se calcula como `max(pricePerDay de las categorías del evento)`.
- Un evento sin `expirationDate` es visible indefinidamente una vez aprobado.
- `GET /events` responde diferente según el rol:
  - Anónimo / usuario: solo `APPROVED` y no expirados.
  - Admin: todos los estados, incluye datos del dueño.
- Solo el dueño o un admin puede eliminar o editar un evento.
- El admin aprueba con `POST /events/:id/approve` y rechaza con `POST /events/:id/reject` (requiere `reason`).

---

## Spots (avisos)

- Cualquier usuario autenticado puede crear un spot. Queda en `DRAFT`.
- Precio fijo por día: `SPOT_PRICE_PER_DAY` (env, default 8.000 CLP).
- Cupo máximo de spots activos simultáneos: `SPOT_MAX_ACTIVE` (env, default 10).
- Máximo de días por publicación: `SPOT_MAX_DAYS` (env, default 30).
- `GET /spots` devuelve solo los `APPROVED` y no expirados (siempre público).
- `GET /spots/quota` es público: muestra cupos disponibles y precio.
- El link puede ser URL, teléfono o email (`linkType: URL | PHONE | EMAIL`).

---

## Heroes

- Cualquier usuario autenticado puede crear un hero. Queda en `DRAFT`.
- Precio fijo por día: `HERO_PRICE_PER_DAY` (env, default 15.000 CLP).
- Cupo máximo de heroes activos simultáneos: `HERO_MAX_ACTIVE` (env, default 5).
- Máximo de días por publicación: `HERO_MAX_DAYS` (env, default 30).
- `GET /heroes` devuelve solo los `APPROVED` y no expirados (siempre público).
- `GET /heroes/quota` es público: muestra cupos disponibles y precio.
- El link es una URL simple (`link?: string`), no tipado como el Spot.

---

## Carrito (Orders)

- `GET /orders/draft` crea el carrito si no existe, o devuelve el existente (idempotente).
- Solo un ítem por tipo por orden: un EVENT, un SPOT y un HERO máximo.
  - Agregar el mismo tipo reemplaza el ítem anterior (upsert).
- Al agregar un ítem se valida:
  1. Que el ítem le pertenezca al usuario.
  2. Que esté en estado `DRAFT`.
  3. Que no se supere el máximo de días.
  4. Que haya cupo disponible (spots y heroes).
- El `total` se recalcula automáticamente tras cada cambio.
- El precio por día queda congelado al momento de agregar al carrito.

---

## Pago (checkout)

1. `POST /payments/checkout` con `{ orderId, gateway }` inicia la transacción.
   - Valida cuota nuevamente (doble check: al agregar y al pagar).
   - Transiciona la orden a `PENDING_PAYMENT`.
   - Devuelve `redirectUrl` para enviar al usuario a la pasarela.
2. Transbank redirige al callback de la API.
3. Si el pago es exitoso:
   - Todos los ítems pasan a `PENDING_MODERATION`.
   - La orden pasa a `PAID`.
   - Se asigna `expirationDate = hoy + días` a cada ítem.
4. Si el pago falla: la orden pasa a `FAILED`, los ítems quedan en `DRAFT`.
5. El callback es idempotente: si llega duplicado con la orden ya en `PAID`, devuelve éxito sin llamar a Transbank de nuevo.

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

## Catálogo (solo lectura pública / CRUD para admin)

| Recurso | Público | Admin |
|---|---|---|
| `GET /regions` | ✓ | — |
| `GET /communes?region=slug` | ✓ | — |
| `GET /categories` | ✓ | — |
| `GET /tags` | ✓ | — |
| `POST/PATCH/DELETE` en cualquiera | — | ✓ |

---

## Artículos

- `GET /articles` y `GET /articles/:slug` son públicos.
- CRUD completo solo para admin.
- El slug se genera automáticamente desde el título al crear.

---

## Uploads

- `POST /uploads` acepta una imagen y devuelve su URL relativa (`/uploads/filename.ext`).
- Solo usuarios autenticados pueden subir archivos.

---

## Recuperación de contraseña

1. `POST /auth/forgot-password` con `{ email }` genera un token (hash SHA-256) y lo guarda con expiración de 1 hora.
2. `POST /auth/reset-password` con `{ token, newPassword }` valida el token, actualiza la contraseña y lo invalida.
