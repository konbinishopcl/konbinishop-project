# Vistas del Website — Konbini

> **Cómo usar este documento**
> - **Parte 1 — Diseño:** qué ve el usuario, secciones, estados y flujos. Sin código ni APIs. Úsala para diseño y UI.
> - **Parte 2 — Desarrollo:** stack, endpoints, guards, estado de implementación. Úsala para desarrollo.
> - **Nomenclatura:** Los productos de publicidad paga tienen nombre técnico (código/API) y nombre comercial (UI/textos): `hero` → **Portada**, `spot` → **Aviso**. La Parte 1 usa siempre el nombre comercial; la Parte 2 usa los nombres técnicos que coinciden con los endpoints.
> - **Feedback al usuario:** Todos los estados de error y éxito se comunican mediante **toasts** (notificación flotante esquina inferior-derecha, auto-dismiss 4s). Los formularios muestran errores inline solo para validación de campos; el resultado del submit siempre va al toast.
> - **Privacidad (Ley 21.719):** Ver sección "Cumplimiento Ley de Protección de Datos" al final de la Parte 1.

---

# PARTE 1 — DISEÑO

## Acceso por tipo de usuario

| Usuario | Puede ver |
|---|---|
| Visitante | Todo el sitio público |
| Registrado | Lo anterior + `/cuenta`, `/crear`, `/carrito` |
| Admin / Super Admin | Lo anterior + `/cuenta` (igual que cualquier registrado) + `/dashboard` |

> **`/cuenta` y `/dashboard` son vistas distintas.** `/cuenta` es el panel personal de cualquier usuario registrado (editar perfil, mis eventos, mis avisos, mis portadas). `/dashboard` es la herramienta de moderación exclusiva de admins. Un admin usa ambas: `/dashboard` para moderar, `/cuenta` para gestionar su propio contenido.

---

## Mapa de rutas

```text
/ (home)

├── /busqueda

├── /[category]
│   └── /[category]/[slug]

├── /articulos
│   └── /articulos/[slug]

├── /@[slug]

├── /info                          ← submenu compartido
│   ├── /contacto
│   ├── /faq
│   ├── /terminos
│   └── /privacidad

├── /login
├── /registro
├── /recuperar-contrasena
├── /reset-password/:token

├── /cuenta
│   ├── Mis publicaciones
│   ├── Mis avisos
│   │   └── Formulario aviso
│   └── Mis portadas
│       └── Formulario portada

├── /crear
│   ├── Paso 1
│   ├── Paso 2
│   ├── Paso 3
│   └── Upsell post-evento
│       ├── Formulario aviso
│       └── Formulario portada

├── /carrito
│   ├── /checkout/success
│   └── /checkout/failed

└── /dashboard
    ├── /dashboard/events
    ├── /dashboard/users
    ├── /dashboard/regions
    ├── /dashboard/communes
    ├── /dashboard/categories
    ├── /dashboard/tags
    ├── /dashboard/spots        ← Avisos
    ├── /dashboard/heroes       ← Portadas
    ├── /dashboard/payments
    ├── /dashboard/contact
    └── /dashboard/faq
```

---

## Vistas públicas

### Home `/`

Página principal. Carga en el servidor. Secciones de arriba a abajo:

**1. Carousel de portadas**

Slides a pantalla completa. Cada slide tiene imagen de fondo, título, subtítulo en color de acento, descripción corta, fecha, lugar y botón CTA.

- Si no hay portadas activas: la sección no aparece.

**2. Destacados — Top 12**
Grilla de 6 columnas × 2 filas con los 12 eventos más likeados. Sin botón "Ver todos".
- Si hay menos de 12: muestra los que haya.
- Si no hay ninguno: ilustración + mensaje "Aún no hay eventos publicados" + botón "Publicar el primero".

**3. Últimos en unirse**
Franja horizontal con avatares (foto o iniciales) de los últimos organizadores registrados, un contador total y texto tipo "Únete a +500 organizadores que ya publican en Konbini".
- Si no hay usuarios: la sección no aparece.

**4. Newsletter**
Sección con titular vendedor, campo de email y botón de suscripción.
- Estados: esperando → cargando → éxito ("¡Listo! Te avisamos de los mejores eventos") → error.
- No requiere cuenta.

**5. Rails por categoría**
Una sección horizontal por cada categoría que tenga al menos un evento. Cada rail muestra hasta 6 event cards en formato landscape y un botón "Ver todos" que lleva a la página de esa categoría.
- Categorías sin eventos se omiten silenciosamente.

> **No modificar:** Los rails por categoría ya están implementados y funcionan correctamente.

---

### `/[category]` — Eventos por categoría

Ejemplo: `konbini.cl/musica`

Muestra el nombre de la categoría, el número de resultados y una grilla de event cards.

Tiene chips de filtro (Hoy, Esta semana, etc.) y barra de filtros (fecha, región, orden) que son **visuales — aún sin funcionalidad**.

---

### `/[category]/[slug]` — Detalle de evento

Ejemplo: `konbini.cl/musica/concierto-de-jazz`

Solo visible para eventos publicados y vigentes. Si no existe: 404.

**Contenido principal:**
- Imagen de fondo (banner o poster) con overlay oscuro
- Badge de categoría
- Empresa organizadora
- Título del evento
- Fecha y lugar
- Descripción completa
- Sección "about"
- Galería de imágenes (máx 5)
- Links sociales
- Videos (mostrados como links, sin embed)

**Panel lateral:**
- Lista de precios o badge "Entrada liberada"
- Botón de compra si hay URL de tickets (redirige a sitio externo)
- Fechas y horarios
- Dirección y ubicación

---

### `/busqueda` — Búsqueda

Barra de búsqueda por texto libre, selector de categoría y selector de región. Los resultados se actualizan al cambiar los filtros. La URL refleja los filtros activos y es compartible.

---

### Submenu informativo

Las vistas `/contacto`, `/faq`, `/terminos` y `/privacidad` comparten un submenu de navegación horizontal (o sidebar en mobile) que aparece en todas ellas, permitiendo moverse entre las cuatro sin volver al home. El submenu muestra las 4 opciones y resalta la activa.

---

### `/contacto` — Contacto

Formulario de contacto público. No requiere sesión.

**Campos:**
- Nombre (requerido)
- Email (requerido)
- Asunto (requerido)
- Mensaje (requerido, mínimo 10 caracteres)

Al enviar:

- Se muestra mensaje de éxito: "Hemos recibido tu mensaje. Te responderemos a la brevedad."
- El formulario se limpia.
- Estados: esperando → cargando → éxito → error.

---

### `/faq` — Preguntas frecuentes

Lista de preguntas y respuestas ordenadas por el campo `order`. Renderizado en el servidor.

Cada pregunta se muestra como un acordeón: título visible, respuesta se despliega al hacer clic. Solo una puede estar abierta a la vez.

Si no hay preguntas publicadas: mensaje "Aún no hay preguntas frecuentes."

---

### `/terminos` — Términos y condiciones

Renderiza el campo `content` (HTML) del documento de tipo `TERMS_OF_SERVICE`. Renderizado en el servidor.

Si el administrador aún no ha publicado el documento: mensaje "Los términos y condiciones están siendo actualizados."

---

### `/privacidad` — Política de privacidad

Renderiza el campo `content` (HTML) del documento de tipo `PRIVACY_POLICY`. Renderizado en el servidor.

Si el administrador aún no ha publicado el documento: mensaje "La política de privacidad está siendo actualizada."

---

## Vistas autenticadas

### `/cuenta` — Mi cuenta

Requiere sesión. Tiene dos zonas:

**Sidebar:**
- Avatar (foto de perfil o iniciales)
- Nombre y email
- Botón "Editar perfil" — abre modal con: nombre para mostrar, bio, avatar, banner, sitio web y redes sociales (Instagram, TikTok, Facebook, X, YouTube, Twitch, LinkedIn)
- Botón "Cambiar contraseña" — abre modal con: contraseña actual, nueva contraseña y confirmación.
- Link al perfil público (solo visible si tiene al menos un evento aprobado)
- Botón "Cerrar sesión"

**Área principal — tabs:**

- **Mis publicaciones** — lista de eventos propios con tabs Todos / En revisión / Publicados / Rechazados. Cada evento muestra estado, motivo de rechazo si aplica, precio y link a la publicación.
- **Mis avisos** — lista de avisos propios con estado y fechas de vigencia. Botón "Crear aviso" para abrir el formulario. Puede editar o eliminar avisos en borrador o rechazados.
- **Mis portadas** — lista de portadas propias con estado, imagen y título. Botón "Crear portada" para abrir el formulario. Puede editar o eliminar portadas en borrador o rechazadas.

---

### `/crear` — Crear evento

Requiere sesión. Wizard de 3 pasos.

**Paso 1:** Título, empresa organizadora, categoría, descripción, sección "about", tipo de entrada (gratis o con precios — nombre y valor por tipo de entrada).

**Paso 2:** Fechas y horarios (múltiples), región → comuna (selector en cascada), dirección, URL de tickets, links de redes sociales.

**Paso 3:** Banner, poster, galería de fotos (máx 10), videos, confirmación antes de enviar.

---

### Upsell post-evento

Mini-wizard de 2 pasos que aparece después de crear un evento exitosamente, antes de ir al carrito. Los pasos son secuenciales e independientes: responder "No" en el primero no omite el segundo.

**Paso 1 — Aviso:** "¿Quieres agregar un aviso?" Muestra precio por día y cupos disponibles. Si acepta, abre el formulario de aviso. Si no hay cupo, este paso se omite.

**Paso 2 — Portada:** "¿Quieres agregar una portada?" Muestra precio por día y cupos disponibles. Si acepta, abre el formulario de portada. Si no hay cupo, este paso se omite.

Si no hay cupo en ninguno de los dos, el upsell se omite completamente y se va directo al carrito.

---

### Formulario de aviso

Modal o sección inline. Aparece en dos contextos: desde el upsell post-evento y desde el tab "Mis avisos" en `/cuenta`.

**Campos:**
- Título (requerido)
- Imagen (opcional)
- Tipo de enlace: URL / Teléfono / Email (requerido)
- Valor del enlace: la URL, teléfono o email según el tipo elegido (requerido)

**Pendiente:** En versión futura debería incluir selección de regiones y/o comunas donde se mostrará el aviso.

---

### Formulario de portada

Modal o sección inline. Aparece en dos contextos: desde el upsell post-evento y desde el tab "Mis portadas" en `/cuenta`.

**Campos:**
- Título (requerido)
- Subtítulo acento — parte del título en color de acento (opcional)
- Descripción corta (opcional)
- Imagen de fondo a pantalla completa (requerida)
- Fecha a mostrar (opcional)
- Lugar a mostrar (opcional)
- URL de destino al hacer clic (opcional)
- Categoría asociada (opcional)

---

### `/carrito` — Carrito de compras

Requiere sesión.

Muestra los ítems seleccionados: evento, aviso y/o portada. Cada ítem tiene nombre, selector de días de publicación, precio por día y subtotal. El total se calcula automáticamente.

**Estado del carrito:**
- **Borrador** — el usuario puede agregar, modificar o eliminar ítems y elegir los días.
- **En proceso de pago** — bloqueado mientras se procesa el pago externo.
- **Pagado** — los ítems quedan en revisión del administrador.
- **Fallido** — se muestra pantalla de error con opción de reintentar.

Botón "Pagar" inicia el proceso de pago con Transbank y redirige al sitio de WebPay.

**Días máximos por ítem:** Evento 60 días, Aviso 30 días, Portada 30 días.

---

### `/checkout/success`

Pantalla de confirmación de pago exitoso. Informa al usuario que sus ítems están en revisión y serán aprobados por un administrador. CTA al home o a `/cuenta`.

### `/checkout/failed`

Pantalla de pago fallido o abortado. Muestra el motivo si está disponible. Botón para reintentar el pago.

---

## Auth — Sin header ni footer

### `/login`
Wizard de 2 pasos: primero pide email, luego contraseña. Tiene botones de acceso con Google, Instagram y Apple (visuales — sin funcionalidad). Al autenticarse redirige al home.

### `/registro`
Wizard de 2 pasos: primero pide email, luego nombre, apellido, contraseña y confirmación. Mismos botones sociales sin funcionalidad.

### `/recuperar-contrasena`
Formulario con un solo campo de email. Al enviar muestra mensaje genérico: "Si el email está registrado, recibirás un enlace de recuperación." No confirma ni niega si el email existe.

### `/reset-password/:token`
Formulario con "Nueva contraseña" y "Confirmar contraseña".
- Éxito: confirmación + redirige a `/login`.
- Token inválido o expirado: mensaje de error + link a `/recuperar-contrasena`.

---

## Dashboard — Solo administradores

> Los admins también tienen acceso completo a `/cuenta` (documentada en "Vistas autenticadas"). El dashboard es adicional, no reemplaza la cuenta personal.

### `/dashboard` — Panel principal

KPI cards alimentadas por `GET /stats`:

- Total usuarios registrados
- Eventos publicados (APPROVED)
- Contenido pendiente de revisión (eventos + avisos + portadas en PENDING_MODERATION)
- Ingresos totales (suma de órdenes en estado PAID)
- Avisos activos / Portadas activas

Cola de revisión: últimos 5 eventos esperando aprobación, con botones de aprobar o rechazar.
Gráfico de actividad. Feed de actividad reciente. Desglose de eventos por categoría.

### `/dashboard/events` — Moderación de eventos
Tabla de todos los eventos con búsqueda por texto y filtro por estado. Acciones por evento: aprobar, rechazar (con campo de motivo) y ver la publicación. Paginación.

### `/dashboard/users` — Usuarios
Solo Super Admin. Tabla de usuarios con opciones de bloquear/desbloquear y cambiar rol. **Pendiente de implementar.**

### `/dashboard/regions` — Regiones
CRUD de regiones (nombre y slug). **Pendiente de implementar.**

### `/dashboard/communes` — Comunas
CRUD de comunas (nombre, slug, región asociada). **Pendiente de implementar.**

### `/dashboard/categories` — Categorías
CRUD de categorías (nombre, slug, descripción, precio de publicación por día). El precio define cuánto paga el organizador al publicar un evento en esa categoría. **Pendiente de implementar.**

### `/dashboard/tags` — Tags
CRUD de tags. Los tags se asocian a artículos, no a eventos. **Pendiente de implementar.**

### `/dashboard/spots` — Avisos
Moderación de avisos: lista con estado, aprobar, rechazar, eliminar. **Pendiente de implementar.**

### `/dashboard/heroes` — Portadas

Moderación de portadas: lista con estado, imagen y título, aprobar, rechazar, eliminar. **Pendiente de implementar.**

### `/dashboard/payments` — Pagos

Historial de órdenes y transacciones. **Pendiente de implementar.**

### `/dashboard/contact` — Mensajes de contacto

Lista de mensajes enviados por el formulario de contacto, ordenados por fecha descendente. Muestra nombre, email, asunto y estado de lectura. Permite marcar como leído/no leído y eliminar. **Pendiente de implementar.**

### `/dashboard/faq` — Preguntas frecuentes

CRUD de preguntas frecuentes con control de orden. Permite crear, editar, reordenar y eliminar preguntas. **Pendiente de implementar.**

---

## Vistas pendientes (no existen aún)

### `/@[slug]` — Perfil público de organizador
Solo visible si el organizador tiene al menos un evento aprobado.

- Banner de perfil
- Avatar
- Nombre público
- Bio
- Sitio web y redes sociales (Instagram, TikTok, Facebook, X, YouTube, Twitch, LinkedIn)
- Grilla de eventos aprobados y vigentes

### `/articulos` — Listado de artículos

Grilla de artículos con barra de búsqueda por texto y filtro por tag. Los resultados se actualizan al cambiar los filtros. La URL refleja los filtros activos y es compartible. Paginación. Pendiente de implementar.

### `/articulos/[slug]` — Detalle de artículo
Contenido del artículo, tags y eventos relacionados. Pendiente de implementar.

---

## Sistema de feedback — Toasts

Todas las acciones que producen un resultado (éxito o error) lo comunican mediante un **toast**: notificación flotante en la esquina inferior-derecha, auto-dismiss en 4 segundos, con botón de cierre manual.

**Variantes:**
- **Éxito** (verde) — acción completada correctamente.
- **Error** (rojo) — fallo del servidor o error de red. Mensaje legible, nunca un stack trace.
- **Info** (neutro) — confirmación sin valor positivo/negativo (ej: "Enlace copiado").
- **Advertencia** (amarillo) — acción completada con matices (ej: "Guardado, pero la imagen tardará en procesarse").

**Regla general:**
- Validación de campos del formulario → error **inline** bajo el campo.
- Resultado del submit (éxito o fallo de red/servidor) → **toast**.
- El toast no reemplaza el estado de la UI: si un evento se aprueba, la fila también cambia de estado visualmente.

**Casos concretos:**
- Login incorrecto → toast error "Credenciales incorrectas."
- Registro exitoso → toast éxito "¡Bienvenido/a a Konbini!"
- Evento enviado a revisión → toast éxito "Tu evento fue enviado. Lo revisaremos pronto."
- Error de red (500, timeout) → toast error "Algo salió mal. Intenta de nuevo."
- Perfil actualizado → toast éxito "Perfil guardado."
- Contraseña cambiada → toast éxito "Contraseña actualizada."
- Mensaje de contacto enviado → toast éxito "Mensaje enviado. Te responderemos a la brevedad." (el formulario también muestra el mensaje inline, pero el toast se superpone como confirmación inmediata).
- Copia de enlace → toast info "Enlace copiado."

---

## Cumplimiento Ley de Protección de Datos — Ley 21.719

> La Ley 21.719 fue publicada el 13 de diciembre de 2024 y entra en plena vigencia el **1 de diciembre de 2026**. Existe una ventana de gracia (dic 2026 – dic 2027) donde infracciones leves de PYMEs reciben amonestaciones antes de multas. Las multas máximas son 20.000 UTM (~$1.400M CLP). Todo lo descrito a continuación debe estar implementado antes de esa fecha.

### Banner de cookies / almacenamiento analítico

La Ley 21.719 no regula cookies con el detalle del GDPR, pero sí aplica a cualquier tratamiento de datos que derive de ellas (analytics, pixels de remarketing). Si se usa cualquier herramienta de analytics de terceros, se necesita consentimiento previo.

Aparece en el primer acceso al sitio (sin preferencia guardada). Es un banner fijo en la parte inferior, no un modal bloqueante.

**Contenido:**
- Texto breve: qué cookies se usan y para qué.
- Botón principal "Aceptar todo".
- Botón secundario "Solo esenciales".
- Link "Política de privacidad" → `/privacidad`.

**Comportamiento:**
- Al elegir, el banner desaparece y se guarda la preferencia en `localStorage`.
- Analytics de terceros (GA, Meta Pixel, etc.) no se cargan hasta que el usuario acepte.
- En `/privacidad` debe existir un link "Cambiar preferencias" que reabre el banner.

**Almacenamiento esencial (no necesita consentimiento previo):**
- `kb-token` — JWT de autenticación.
- `kb-user` — datos de sesión.
- `kb-theme` — preferencia de tema.
- Preferencia de consentimiento de cookies.

### Consentimiento en el registro (`/registro`)

El formulario de registro debe incluir, antes del botón "Crear cuenta", dos checkboxes separados:

1. **Checkbox obligatorio** (sin él el botón permanece deshabilitado) — "He leído y acepto los [Términos y condiciones](/terminos) y la [Política de privacidad](/privacidad)."
2. **Checkbox opcional, desmarcado por defecto** — "Quiero recibir novedades y ofertas de Konbini por email." Este consentimiento debe guardarse con timestamp en la base de datos (`newsletter_consent_at`). El consentimiento para el newsletter debe ser independiente del consentimiento de uso del servicio — la ley lo exige explícitamente (Art. 12).
3. **Checkbox obligatorio** — "Confirmo que tengo 18 años o más." Ver sección de menores de edad.

### Consentimiento en newsletter (home y otros puntos)

El campo de suscripción al newsletter incluye bajo el botón:

- Texto: "Al suscribirte aceptas recibir emails de Konbini. Puedes darte de baja en cualquier momento."

La acción de suscribirse es el consentimiento (opt-in explícito). No se requiere checkbox adicional, pero sí guardar el timestamp de cuando se suscribió.

Todos los emails de marketing/newsletter deben incluir enlace de unsubscribe al final.

### Menores de edad

La ley distingue dos tramos (Art. 16 quáter):

- **Menores de 14 años:** el consentimiento debe ser de los padres o representantes legales. Un checkbox del menor no es válido.
- **14–17 años:** pueden consentir directamente para el servicio, pero con protección reforzada para marketing y perfilado.

Konbini no está diseñado para menores. Por ello el registro debe incluir el checkbox "Confirmo que tengo 18 años o más" y la Política de Privacidad debe indicar explícitamente que el servicio no está dirigido a menores de 18.

### Derechos del titular (ARCOPB)

En `/cuenta` debe existir una sección "Mis datos" (pendiente de implementar) con:

- **Botón "Descargar mis datos"** — exporta un archivo JSON/CSV con todos los datos del usuario: perfil, eventos, avisos, portadas, órdenes. Ejercicio del derecho de **portabilidad**. Plazo de respuesta: 30 días.
- **Botón "Eliminar mi cuenta"** — elimina o anonimiza todos los datos del usuario, previa confirmación con contraseña. Se conservan solo los datos que la ley obliga a retener (registros contables). Ejercicio del derecho de **supresión**. Plazo: 30 días.
- **Texto informativo** con email dedicado (ej. `privacidad@konbini.cl`) para ejercer otros derechos: acceso, rectificación, oposición, bloqueo. Plazo de respuesta siempre 30 días.

El footer del sitio debe incluir un link "Mis derechos de privacidad" o similar que apunte a esta sección o al email de contacto.

### Contenido mínimo de la Política de Privacidad (`/privacidad`)

La política no es solo una página — la ley exige que cubra todos estos puntos (Art. 14 y 14 bis):

- Identidad del responsable: nombre legal de la empresa, RUT, domicilio, email de contacto.
- Categorías de datos tratados y finalidades de cada una.
- Base legal de cada tratamiento: consentimiento / ejecución de contrato / interés legítimo / obligación legal.
- Destinatarios y encargados: Transbank (pagos), Mailgun (emails), proveedor de cloud/hosting. Indicar relación jurídica con cada uno.
- Transferencias internacionales: si Mailgun u otros operan fuera de Chile, indicarlo y señalar el mecanismo de garantía (cláusulas contractuales estándar).
- Plazos de conservación por categoría de dato.
- Derechos ARCOPB y cómo ejercerlos (canal y plazo de 30 días).
- Mecanismo para notificar cambios a la política.
- Link "Cambiar preferencias de cookies".

### Plazos de retención de datos

La ley no fija plazos universales — cada responsable debe establecerlos y publicarlos en la política. Referencia para Konbini:

| Dato | Plazo sugerido | Fundamento |
|---|---|---|
| Datos de cuenta (nombre, email) | Vigencia de la cuenta + 5 años | Prescripción civil (Art. 2515 CC) |
| Contraseñas hasheadas | Solo mientras la cuenta está activa | No hay fin después del cierre |
| Fotos/imágenes de perfil | Hasta que el usuario las elimine o cierre cuenta | Consentimiento del servicio |
| Datos de transacciones | 6 años mínimo | Prescripción tributaria SII |
| Lista newsletter | Mientras el consentimiento esté vigente | Base: consentimiento; se retira, se elimina |
| Logs de acceso/auditoría | 2–5 años | Proporcional al riesgo y posibles disputas |

Se debe implementar un proceso de purga automática o anonimización cuando venzan los plazos.

---

## Flujos de usuario

### Organizador
1. `/registro` — crea cuenta
2. `/crear` — publica su evento
3. Upsell — opcionalmente crea un aviso y/o portada
4. `/carrito` — revisa ítems, elige días y paga
5. Administrador aprueba — el contenido aparece en el sitio
6. `/cuenta` — edita su perfil público
7. `/@[slug]` — su perfil público es visible cuando tiene al menos un evento aprobado

También puede crear avisos y portadas de forma independiente desde `/cuenta`, sin necesidad de crear un evento primero.

### Visitante
1. Home — descubre eventos en el carousel, la grilla de destacados o los rails
2. `/[category]` o `/busqueda` — filtra y explora
3. `/[category]/[slug]` — ve el detalle, fechas, precios y link de tickets

### Administrador
1. `/dashboard` — revisa la cola de moderación
2. `/dashboard/events` — aprueba o rechaza eventos con motivo
3. `/cuenta` — edita su propio perfil (igual que cualquier usuario)

---

---

# PARTE 2 — DESARROLLO

## Stack y configuración

- **Framework:** Next.js 15 + React 19 + TypeScript
- **Estilos:** CSS custom con variables, sin UI library
- **Rendering:** Server Components para data fetching, Client Components solo para interactividad
- **Auth:** JWT en localStorage via React Context (`UserCtx`). Guards client-side con `useUser()` + flag `ready`.
- **API Base:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3333/api`)

## Roles y guards

| Rol | Acceso |
|---|---|
| Anónimo | Sitio público |
| `AUTHENTICATED` | Lo anterior + `/cuenta`, `/crear`, `/carrito` |
| `ADMIN` / `SUPER_ADMIN` | Lo anterior + `/dashboard` |

- `/cuenta` protegida con redirect a `/login` si no hay JWT.
- `/dashboard` protegida por `AdminGuard` (client component) — redirige si el rol no es admin.
- `/dashboard/users` solo accesible para `SUPER_ADMIN`.

## Routing y convención de URLs

- `[category]` es un segmento dinámico. Las rutas estáticas del proyecto tienen precedencia en Next.js App Router: `/busqueda`, `/login`, `/registro`, `/cuenta`, `/crear`, `/carrito`, `/dashboard`.
- Los eventos usan `slug` único generado desde el título.
- Los perfiles públicos usan la convención `/@[slug]` (con arroba). El `@` actúa como disambiguador: si la URL empieza con `@` es un perfil de organizador, si no es una ruta predefinida o categoría, 404. En Next.js se implementa con middleware que reescribe `/@[slug]` → `/profile/[slug]` internamente, manteniendo la URL bonita en el browser.

### URLs externas — Spots y Heroes

Todos los enlaces de destino de **spots** (`spot.url`) y **heroes** (`hero.url`) son URLs externas y deben abrirse siempre con `target="_blank" rel="noopener noreferrer"`.

Además, antes de redirigir se deben inyectar parámetros UTM para trazabilidad:

| Parámetro     | Valor fijo                                     |
| ------------- | ---------------------------------------------- |
| `utm_source`  | `konbini`                                      |
| `utm_medium`  | `spot` o `hero` según el tipo                  |
| `utm_campaign`| slug del spot/hero o su `id` si no tiene slug  |

Ejemplo de URL final: `https://anunciante.com?utm_source=konbini&utm_medium=spot&utm_campaign=zapatillas-running`

La construcción se hace en el cliente antes del redirect; no se almacena en la base de datos.

## APIs por sección

### Home
- `GET /events?pageSize=12&sortBy=likes` — top 12 más likeados
- `GET /categories` — para los rails
- `GET /events?category=<slug>&pageSize=6` — eventos por rail
- `GET /heroes` — heroes aprobados para el carousel
- `GET /users/recent` — últimos 10 usuarios: `{ id, firstname, lastname, profile: { avatar } }`
- `POST /subscribers` — suscripción al newsletter con `{ email }`

### Categoría y detalle
- `GET /categories` — lista de categorías
- `GET /events?category=<slug>` — eventos por categoría
- `GET /events/:slug` — detalle de evento por slug (solo `APPROVED` y no expirados)

### Búsqueda
- `GET /events?q=&category=&region=` — búsqueda con filtros

### Cuenta
- `GET /auth/me` — datos del usuario autenticado
- `PATCH /auth/password` — `{ currentPassword, newPassword }` — cambiar contraseña estando autenticado
- `GET /events/mine` — eventos propios
- `PUT /profiles/me` — actualizar perfil (displayName, bio, avatar, banner, slug, website, redes)
- `POST /uploads` — subir imagen, devuelve `{ url, filename }`
- `GET /spots/mine` — avisos propios
- `GET /heroes/mine` — heroes propios
- `PATCH /spots/:id` / `DELETE /spots/:id` — editar/eliminar aviso propio
- `PATCH /heroes/:id` / `DELETE /heroes/:id` — editar/eliminar hero propio

### Crear evento
- `GET /regions` — lista de regiones
- `GET /communes?region=<slug>` — comunas de una región
- `GET /categories` — categorías disponibles
- `POST /uploads` — subir imágenes
- `POST /events` — crea evento en `DRAFT`

### Upsell post-evento
- `GET /spots/quota` — `{ max, active, available, pricePerDay, maxDays }`
- `GET /heroes/quota` — `{ max, active, available, pricePerDay, maxDays }`
- `POST /spots` — crea aviso en `DRAFT`
- `POST /heroes` — crea hero en `DRAFT`

### Carrito
- `GET /orders/draft` — obtiene o crea la orden en `DRAFT` del usuario
- `PUT /orders/:id/items` — agrega o reemplaza ítem `{ type, days, eventId|spotId|heroId }`
- `DELETE /orders/:id/items/:type` — elimina ítem por tipo (`EVENT`, `SPOT`, `HERO`)
- `POST /payments/:orderId/checkout` — inicia pago `{ gateway: "TRANSBANK" }` → `{ redirectUrl, externalId }`

### Pasarela de pago — Transbank
El backend redirige al frontend tras el callback de Transbank:
- Éxito → `/checkout/success?orderId=X`
- Abortado → `/checkout/failed?reason=aborted`
- Rechazado → `/checkout/failed?orderId=X&code=Y`

El sistema tiene arquitectura multi-gateway (`GatewayFactory`). Hoy solo Transbank WebPay Plus está activo. Agregar Flow, MercadoPago u otra pasarela no requiere cambiar el endpoint de checkout.

### Auth
- `POST /auth/login` — `{ email, password }` → `{ token, user }`
- `POST /auth/register` — `{ email, password, firstname, lastname }` → `{ token, user }`. Crea el `Profile` del usuario automáticamente.
- `POST /auth/forgot-password` — `{ email }`. Siempre responde 200, nunca revela si el email existe. El token SHA-256 se registra en el log del servidor (v2: envío por email).
- `POST /auth/reset-password` — `{ token, password }`. Token expira en 1 hora.

### Dashboard

- `GET /stats` (ADMIN+) — `{ users, eventsApproved, pendingModeration, totalRevenue, activeSpots, activeHeroes }`
- `GET /events` (con JWT admin) — todos los eventos, todos los estados
- `PATCH /events/:id/approve` — aprueba evento
- `PATCH /events/:id/reject` — rechaza con `{ reason }`
- `PATCH /events/:id/ban` — banea con `{ reason }`
- `GET /users` (ADMIN+) — lista de usuarios
- `PATCH /users/:id/ban` — bloquear/desbloquear
- `GET /regions` / `POST /regions` / `PATCH /regions/:id` / `DELETE /regions/:id`
- `GET /communes` / `POST /communes` / `PATCH /communes/:id` / `DELETE /communes/:id`
- `GET /categories` / `POST /categories` / `PATCH /categories/:id` / `DELETE /categories/:id`
- `GET /tags` / `POST /tags` / `PATCH /tags/:id` / `DELETE /tags/:id`
- `GET /spots` (ADMIN+, todos los estados) / `PATCH /spots/:id/approve` / `PATCH /spots/:id/reject` / `PATCH /spots/:id/ban` / `DELETE /spots/:id`
- `GET /heroes` (ADMIN+, todos los estados) / `PATCH /heroes/:id/approve` / `PATCH /heroes/:id/reject` / `PATCH /heroes/:id/ban` / `DELETE /heroes/:id`
- `GET /articles` / `POST /articles` / `PATCH /articles/:id` / `DELETE /articles/:id`
- `GET /subscribers` (ADMIN+) — lista de suscriptores al newsletter
- `DELETE /subscribers/:id` — eliminar suscriptor
- `GET /contact` / `PATCH /contact/:id/read` / `DELETE /contact/:id`
- `GET /faq` / `POST /faq` / `PATCH /faq/:id` / `DELETE /faq/:id`
- `PATCH /terms` / `DELETE /terms`
- `PATCH /privacy` / `DELETE /privacy`

### Contacto

- `POST /contact` — `{ name, email, subject, message }`. Dispara 2 emails: confirmación al remitente + notificación a `CONTACT_NOTIFY_EMAILS`.

### FAQ

- `GET /faq` — lista ordenada por `order` asc, luego `createdAt` asc.

### Términos y Privacidad

- `GET /terms` — documento de tipo `TERMS_OF_SERVICE`. 404 si no existe.
- `GET /privacy` — documento de tipo `PRIVACY_POLICY`. 404 si no existe.

### Perfil público
- `GET /profiles/:slug` — devuelve 404 si el usuario no tiene eventos aprobados

### Artículos
- `GET /articles` — listado
- `GET /articles/:slug` — detalle con tags y eventos relacionados

## Estado de implementación

| Vista | Estado |
|---|---|
| Home — carousel portadas | Implementado |
| Home — rails por categoría | Implementado |
| Home — destacados top 12 | Pendiente (frontend) |
| Home — últimos en unirse | Pendiente (frontend) |
| Home — newsletter | Pendiente (frontend) |
| `/[category]` | Implementado (filtros visuales sin función) |
| `/[category]/[slug]` | Implementado |
| `/busqueda` | Implementado (SSR + client refetch) |
| `/cuenta` — perfil (persistencia API) | Pendiente |
| `/cuenta` — tabs avisos/portadas | Pendiente |
| `/crear` | Implementado (sin flujo de pago) |
| Upsell post-evento | Pendiente |
| Formulario de aviso | Pendiente |
| Formulario de portada | Pendiente |
| `/carrito` | Pendiente |
| `/checkout/success` | Pendiente |
| `/checkout/failed` | Pendiente |
| `/contacto` | Pendiente |
| `/faq` | Pendiente |
| `/terminos` | Pendiente |
| `/privacidad` | Pendiente |
| `/login` | Implementado |
| `/registro` | Implementado |
| `/recuperar-contrasena` | Pendiente |
| `/reset-password/:token` | Pendiente |
| `/@[slug]` | Pendiente |
| `/articulos` | Pendiente |
| `/articulos/[slug]` | Pendiente |
| `/dashboard` | Parcial (datos mock/hardcodeados) |
| `/dashboard/events` | Implementado |
| `/dashboard/users` | Pendiente |
| `/dashboard/regions` | Pendiente |
| `/dashboard/communes` | Pendiente |
| `/dashboard/categories` | Pendiente |
| `/dashboard/tags` | Pendiente |
| `/dashboard/spots` | Pendiente |
| `/dashboard/heroes` | Pendiente |
| `/dashboard/payments` | Pendiente |
| `/dashboard/contact` | Pendiente |
| `/dashboard/faq` | Pendiente |

## Componentes clave

| Componente | Propósito | Estado |
|---|---|---|
| `Header` | Nav con categorías y menú de usuario | Completo. "Mis tickets" y "Configuración" redirigen a `/cuenta` (stubs) |
| `Footer` | Links del sitio | Visual. Todos los `href` apuntan a `#` |
| `HeroBlock` | Carousel de portadas | Completo |
| `Rail` | Sección horizontal de event cards | Completo |
| `EventCard` | Card de evento | Completo |
| `ProfileModal` | Editar perfil | Solo actualiza contexto local — no llama a la API |

## Cache

Los `GET` públicos están cacheados en Redis con TTL de 1 día. Al hacer `POST`, `PATCH` o `DELETE` sobre una colección, el cache de esa colección se invalida automáticamente. Las peticiones con header `Authorization` no se cachean (el admin puede ver estados distintos al público).

---

## Checklist Ley 21.719 — Pendiente de implementar

Vigencia: **1 de diciembre de 2026**. Todo esto debe estar listo antes de esa fecha.

### Frontend / UX

- [ ] Banner de cookies con "Aceptar todo" / "Solo esenciales" — guardar preferencia en `localStorage`
- [ ] No cargar analytics de terceros hasta que el usuario acepte el banner
- [ ] Link "Cambiar preferencias de cookies" en `/privacidad`
- [ ] Checkbox requerido en `/registro`: aceptación de T&C y política de privacidad
- [ ] Checkbox opcional desmarcado en `/registro`: consentimiento newsletter (separado del anterior)
- [ ] Checkbox requerido en `/registro`: "Confirmo que tengo 18 años o más"
- [ ] Texto de consentimiento bajo el formulario de newsletter del home: "Al suscribirte aceptas recibir emails de Konbini. Puedes darte de baja en cualquier momento."
- [ ] Enlace de unsubscribe en todos los emails de marketing (implementar en las plantillas de Mailgun)
- [ ] Sección "Mis datos" en `/cuenta` con botones de exportar y eliminar cuenta
- [ ] Link "Mis derechos de privacidad" o email `privacidad@konbini.cl` en el footer
- [ ] Política de privacidad (`/privacidad`) con contenido completo según los campos requeridos por la ley

### Backend / API

- [ ] Campo `newsletterConsentAt DateTime?` en el modelo `User` — guardar timestamp del consentimiento
- [ ] `GET /auth/export` — exporta todos los datos del usuario autenticado en JSON (portabilidad). Plazo: 30 días, pero idealmente inmediato.
- [ ] `DELETE /auth/account` — elimina o anonimiza todos los datos del usuario. Conserva solo datos de transacciones (obligación tributaria 6 años). Requiere confirmación con contraseña.
- [ ] Campo `blockedForProcessing Boolean` en `User` — para el derecho de bloqueo temporal mientras se resuelve una disputa
- [ ] Endpoint o proceso interno para recibir y registrar solicitudes ARCO+
- [ ] Job/cron de purga automática: anonimizar cuentas inactivas según plazos de retención definidos en la política
- [ ] Logs de auditoría para accesos administrativos a datos de usuarios

### Documentos y procesos (no técnicos pero necesarios)

- [ ] DPA firmado con Mailgun (disponible en su sitio como "Data Processing Agreement")
- [ ] DPA firmado con proveedor de cloud/hosting (AWS, GCP, Hetzner, etc.)
- [ ] Verificar cobertura de Transbank en sus términos de servicio para tratamiento de datos de pago
- [ ] Registro de Actividades de Tratamiento (RAT) — documento interno, no público
- [ ] Procedimiento documentado de respuesta a brechas de seguridad (Incident Response Plan)
- [ ] Proceso interno para gestionar solicitudes ARCO+ con registro de cada una y resolución en 30 días
