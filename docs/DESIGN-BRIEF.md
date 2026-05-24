# Konbini — Design Brief

**Versión:** 1.1
**Fecha:** Mayo 2026
**Tipo:** Rediseño completo (web responsivo)

---

## 1. Qué es Konbini

**Konbini** es el medio de referencia de cultura geek y otaku en Chile. Nació como cuenta de noticias en Instagram (@konbinishop.cl, 244K seguidores, cuenta verificada) y creció hasta convertirse en la comunidad más grande del nicho en el país.

El nuevo sitio unifica dos productos bajo una misma marca:

- **Noticias** — cobertura editorial de anime, manga, cine, gaming y cultura otaku (actualmente en konbinishop.com)
- **Directorio de eventos** — listing de eventos geek en Chile donde los organizadores pagan por publicar

**Los eventos son la fuente de ingresos principal.** Las noticias son el motor de tráfico que alimenta el descubrimiento de eventos. La conexión entre ambos es intencional: alguien llega por una noticia y desde ahí descubre eventos relacionados.

Konbini no vende entradas — conecta a personas con eventos y a organizadores con su audiencia.

### Roles de usuario

| Rol | Qué hace en el sitio |
| --- | --- |
| **Visitante** | Navega el sitio público sin sesión |
| **Registrado** | Lo anterior + crea eventos, avisos y portadas, gestiona su cuenta y perfil público |
| **Admin** | Lo anterior + modera contenido (aprueba, rechaza, banea eventos, avisos y portadas) |
| **Super Admin** | Lo anterior + gestión completa de usuarios y eliminación de datos |

> No existe un rol "organizador" separado. Cualquier usuario registrado puede publicar eventos y contratar avisos o portadas. La diferencia entre un usuario que solo guarda eventos y uno que publica es de uso, no de rol.

### Modelo de negocio

La publicación de un evento tiene costo, calculado en días de publicación × precio por categoría. Junto al evento, el organizador puede contratar opcionalmente:

- **Portadas** — aparición en el carrusel principal del home. **Máximo 5 simultáneas.**
- **Avisos (Spots)** — banner pagado que aparece en el home y al final de todas las páginas de categoría. **Máximo 12 simultáneos.** Los avisos no tienen categoría — son placements globales del sitio.

Los cupos limitados son intencionales: la escasez le da valor al espacio. Cuando un placement vence, el cupo se libera y otro organizador puede tomarlo.

Un cuarto producto opcional es el **artículo patrocinado** — el organizador entrega el contenido (título, texto, imágenes, video) y Konbini lo revisa, edita y publica con su estilo editorial. El artículo aparece en la sección de noticias con un badge "Artículo patrocinado" y tiene el evento directamente vinculado, apareciendo destacado en el bloque de eventos relacionados del artículo.

Los cuatro productos del carrito (evento, aviso, portada y artículo patrocinado) se gestionan como ítems de un **carrito de compras**. El organizador elige cuántos días quiere publicar cada ítem (mínimo 10, máximo 60 días para eventos y 30 días para avisos y portadas) y paga todo junto al finalizar. El precio por día varía según la categoría del evento.

---

## 2. Dirección Visual

El sitio ya tiene una identidad visual establecida. **El objetivo del rediseño no es cambiar la línea actual, sino extenderla y completarla** — aplicarla de forma consistente a las pantallas y componentes que faltan.

El diseñador debe tomar el sistema visual existente (paleta, tipografía, estilo de componentes) como punto de partida obligatorio, no como una referencia opcional.

**Dark mode es la identidad principal.** El perfil de Instagram y el sitio actual operan sobre fondos oscuros — es el modo con el que la audiencia asocia la marca. El sitio soporta ambos modos (dark y light); el diseñador debe asegurarse de que ambos funcionen bien, pero dark mode es la experiencia prioritaria y la que debe sentirse más pulida.

**Iconografía:** El sitio no debe usar emojis como elementos de UI. Todos los íconos deben venir de una librería consistente — se recomienda [Lucide Icons](https://lucide.dev) por su compatibilidad con React y su estilo limpio y neutral. El diseñador debe elegir y documentar la librería, y aplicarla de forma uniforme en todo el sistema.

**Principio guía:** Las pantallas nuevas deben sentirse parte del mismo sitio, no como secciones rediseñadas desde cero.

Referencias funcionales (solo para patrones de UX/interacción, no de estilo visual):

- [Fever](https://feverup.com) — estructura editorial del home, balance entre curaduría y listing
- [Bandsintown](https://bandsintown.com) — jerarquía de información en cards de evento
- [Time Out](https://timeout.com) — mezcla de noticias editoriales con listado de eventos, filtros contextuales
- [Meetup](https://meetup.com) — estructura del perfil de organizador

---

## 3. Pantallas a Diseñar

### Prioridad Alta

#### 3.1 Home

La página más importante. Debe comunicar "qué hay pronto" de un vistazo.

Estructura fija de arriba a abajo:

1. **Carrusel de portadas** — placements pagados a pantalla completa. Cada slide tiene imagen de fondo, título, descripción corta, fecha, lugar y botón CTA. Si hay cupos disponibles (menos de 5 portadas activas), los últimos slides del carrusel muestran un **slide de venta** ("Tu portada aquí") que invita a contratar el espacio — el organizador ve el placement en contexto real antes de comprarlo. Si no hay portadas activas, la sección no aparece.
2. **Destacados** — grilla con los 12 eventos más likeados.
3. **Avisos (Spots)** — franja de avisos pagados. Cada aviso tiene imagen y un CTA cuyo destino puede ser una URL externa, una URL interna, un email o un teléfono. El diseño del botón debe contemplar estos casos (ícono y texto varían según el tipo de enlace). **Los avisos deben tener el mismo tamaño de card que los Destacados** — son un producto pagado y deben tener la misma prominencia visual. Si hay cupos disponibles (menos de 12 avisos activos), los slots vacíos muestran una **card de venta** con diseño diferenciado (ej: borde punteado, tono apagado) y texto tipo "Tu aviso aquí".
4. **Rails por categoría** — una sección horizontal por cada categoría que tenga al menos un evento, con hasta 6 cards y un botón "Ver todos".
5. **Últimas noticias** — rail horizontal con 4-6 cards de artículos editoriales y un botón "Ver todas" que lleva a `/noticias`. Va al final del home: los eventos tienen prioridad, las noticias son el cierre para quienes quieren más contenido.
6. **Últimos en unirse** — franja de cierre con avatares de los organizadores más recientes y un contador social ("Únete a +500 organizadores"). CTA hacia la página de precios. Funciona como prueba social para convertir visitantes en organizadores.

Estados a diseñar: sin portadas activas (sección oculta), sin eventos publicados aún (estado de lanzamiento), cargando.

---

#### 3.2 Article Card

Aparece en: rail de "Últimas noticias" del home, listado de artículos, búsqueda y bloque de artículos relacionados en el detalle de evento.

Información a mostrar:

- Imagen
- Categoría (Anime / Manga / Cine / Gaming / etc.)
- Titular
- Fecha
- Badge **"Artículo patrocinado"** si es un artículo patrocinado
- Indicador de eventos relacionados cuando los tiene (ej: "2 eventos relacionados") — comunica desde el card que hay contenido adicional

---

#### 3.3 Event Card (Componente central)

Es el componente más repetido en todo el sitio. Aparece en: home, listados, búsqueda, perfil de organizador, dashboard de admin.

Información a mostrar (jerarquía por definir con el diseñador):

- Imagen (banner o poster)
- Nombre del evento
- Fecha y hora
- Lugar / Ciudad
- Categoría (tag visual)
- Organizador
- Precio (gratis / de pago / ver entradas)
- Botón "Guardar"

**Imagen obligatoria:** La card siempre muestra el poster o banner del evento como imagen real. No se usan composiciones tipográficas, gradientes decorativos ni HTML como sustituto de la imagen. Si el organizador no subió imagen, se usa un placeholder genérico de Konbini (fondo neutro con logo). El diseñador debe definir cómo se ve ese placeholder.

Variantes necesarias:

- **Card estándar** — tamaño único para Destacados, rails por categoría y Avisos. **Todos los rails del home usan el mismo tamaño de card.** 6 por fila en desktop. Es la referencia de tamaño del sistema.
- **Card horizontal** — vista alternativa en listados y búsqueda.
- **Card compacta** — relacionados, sidebar.

> Las cards de los rails por categoría deben medir exactamente lo mismo que las de Destacados — misma altura, mismo ancho, misma estructura visual. No existe una "card pequeña" para el home.

Estados: guardado / no guardado, evento pasado, evento hoy.

---

#### 3.4 Event Detail

La página individual de cada evento. Es el corazón del sitio — la página que el organizador quiere que la gente vea y comparta.

##### Banner de evento en revisión

Cuando el evento aún no ha sido aprobado, solo el dueño puede verlo. En ese caso aparece un banner fijo en la parte superior de la página (sobre el hero) con un mensaje como: *"Este evento aún no es público — está en revisión y solo tú puedes verlo por ahora."* El banner desaparece una vez que el admin aprueba el evento.

##### Hero

Imagen de fondo a pantalla completa (banner o poster) con overlay oscuro. Encima: badge de categoría, nombre del evento, empresa organizadora, fecha y lugar. No se toca.

##### Galería adaptativa

Debajo del hero, la galería se adapta según la cantidad de fotos subidas:

- 0 fotos — no aparece la sección
- 1 foto — imagen a ancho completo
- 2 fotos — lado a lado, 50/50
- 3 fotos — una grande a la izquierda + dos apiladas a la derecha
- 4 fotos — grilla 2×2
- 5 fotos — una grande + cuatro en grilla 2×2

Cualquier foto abre un lightbox a pantalla completa con navegación entre imágenes.

##### Layout de dos columnas (referencia: Airbnb)

Columna izquierda — contenido principal:

- Descripción completa y sección "acerca de"
- Videos (links, sin embed por ahora)
- Redes sociales del evento
- Mini perfil del organizador con link a su página pública
- Mapa embed de la ubicación
- Eventos relacionados (misma categoría/ciudad)
- Artículos relacionados — noticias de Konbini relevantes al evento

Columna derecha — sidebar sticky (se fija al hacer scroll):

- Precios por tipo de entrada o badge "Entrada liberada"
- Fechas y horarios (puede haber múltiples funciones)
- Dirección
- Botón CTA principal: link externo a venta de entradas (siempre visible)
- Botón "Guardar evento" (toggle, para usuarios con sesión)
- Botón "Compartir"

##### Comportamiento del botón Compartir

- Móvil — dispara el panel nativo del sistema operativo (Web Share API). El usuario elige entre sus apps instaladas: WhatsApp, Instagram, Telegram, etc.
- Desktop — abre un dropdown junto al botón con opciones: Copiar link, WhatsApp Web, X, Facebook

---

#### 3.5 Listado / Categoría

Vista de todos los eventos bajo un filtro (categoría, región, búsqueda).

Elementos:

- Nombre de la categoría y contador de resultados ("34 eventos")
- Toggle de vista: Grilla | Lista | Calendario
- **Barra de filtros sticky** — se fija al tope de la pantalla al hacer scroll, siempre accesible sin tener que volver arriba. Contiene: chips de filtro rápido (Hoy / Esta semana / Este mes), rango de fechas, ciudad, precio (gratis / de pago), formato (presencial / online) y ordenamiento
- Resultados paginados

Estado vacío: mensaje contextual ("No hay eventos de Cosplay en Valparaíso este mes") con sugerencias de ampliar la búsqueda.

Al final de la grilla paginada, debajo de la paginación, aparece la **franja de Avisos** — todos los spots activos del sitio (sin filtro por categoría), más los slots vacíos con card de venta si hay cupos disponibles. Los avisos no se paginan, se muestran todos.

---

#### 3.6 Vista Calendario

Tercera opción del toggle en la vista de listado. Permite saber "¿qué hay este sábado?".

Interacción:

- Grilla mensual estándar
- Días con eventos tienen indicador visual (punto de color o número)
- Clic en un día muestra los eventos de ese día (panel lateral o expansión inline)
- Navegación entre meses

---

#### 3.7 Búsqueda

Elementos:

- Input de texto libre (accesible desde el header)
- Filtros inline: categoría, ciudad, fechas
- Resultados mezclados: eventos y artículos en la misma lista, ordenados por relevancia. Cada card lleva un badge de tipo ("Evento" / "Noticia") para diferenciarlos visualmente sin separarlos en secciones
- Estado sin resultados con sugerencias

---

### Prioridad Media

#### 3.8 Perfil Público del Organizador

Página pública del organizador. URL con formato `/@nombre`. Solo visible si tiene al menos un evento aprobado. La identidad pública (nombre, avatar, banner) es independiente del perfil personal y se configura desde `/cuenta/organizador`.

Contenido:

- Banner e imagen de perfil
- Nombre público y bio
- Sitio web y redes sociales (Instagram, TikTok, Facebook, X, YouTube, Twitch, LinkedIn)
- Badge "Verificado" (asignado manualmente por el admin desde el dashboard)
- Contador: "23 eventos realizados"
- Grilla de eventos con tabs Próximos | Pasados. Los eventos expirados se muestran en escala de grises para indicar visualmente que ya terminaron — todos los eventos son visibles, no se ocultan.
- Tab **Artículos** — solo visible si el organizador tiene al menos un artículo patrocinado publicado. Muestra las notas patrocinadas que Konbini escribió para ese organizador.

---

#### 3.9 Página de Precios / Publicar

Landing para organizadores que quieren publicar. Es parte del funnel de ventas — necesita diseño orientado a conversión.

Contenido:

- Propuesta de valor ("Llega a miles de fans geeks en Chile")
- Explicación del modelo: el costo es por días de publicación, el precio varía según la categoría del evento
- Productos disponibles: Publicación de evento / Aviso / Portada — qué es cada uno y para qué sirve
- CTA principal: "Publicar mi evento"
- Preguntas frecuentes de publicación

---

#### 3.10 Mi Cuenta (`/cuenta`)

Panel personal transversal — lo usan todos los usuarios, incluyendo admins. Layout de dos columnas: sidebar de navegación a la izquierda, contenido a la derecha.

##### Navegación del sidebar

Links en orden, el ítem activo resaltado:

- Mi perfil → `/cuenta`
- Organizador → `/cuenta/organizador` *(aparece en el sidebar solo después del primer pago)*
- Mis eventos → `/cuenta/mis-eventos`
- Mis avisos → `/cuenta/mis-avisos`
- Mis portadas → `/cuenta/mis-portadas`
- Mis artículos → `/cuenta/mis-articulos`
- Favoritos → `/cuenta/favoritos`
- Mensajes → `/cuenta/mensajes` *(muestra badge con número de no leídos)*
- Historial de pagos → `/cuenta/pagos`
- **Cerrar sesión** — al fondo del sidebar, separado del resto con un divisor visual. Al hacer clic abre un **lightbox de confirmación** ("¿Seguro que quieres cerrar sesión?") antes de ejecutar la acción.

---

##### `/cuenta` — Mi perfil

Página de entrada. **No es un modal** — es una página completa.

Contenido:

- Avatar, nombre y email
- Formulario de edición inline: nombre y apellido, país (selector), avatar, banner, bio, sitio web y redes sociales (Instagram, TikTok, Facebook, X, YouTube, Twitch, LinkedIn)

Zona Danger (al final de la página, sección claramente delimitada). Cada acción es una fila con título, descripción corta y botón a la derecha:

- **Cambiar username** — visible solo si el usuario tiene al menos un evento. El nuevo username puede afectar links existentes (advertencia visible). Envía un correo de confirmación al email del usuario antes de aplicar el cambio, igual que el flujo de cambio de email.
- **Cambiar contraseña** — abre formulario inline: contraseña actual, nueva contraseña, repetir nueva contraseña.
- **Cambiar email** — flujo de verificación: el usuario ingresa email actual y contraseña; si es correcto, aparece el campo para el nuevo email; se envía link de confirmación al nuevo email; el usuario confirma desde el link y el cambio se aplica.
- **Eliminar cuenta** — abre un **lightbox de confirmación**. Advierte que la acción es permanente e irreversible, y pide confirmación explícita. Obligatorio por Ley 21.719.

---

##### `/cuenta/organizador`

Página exclusiva para configurar la identidad pública como organizador. **Aparece en el sidebar solo después del primer pago.** Separa la identidad personal (Gabriel) de la identidad pública (Cinépolis).

Campos:

- Nombre del organizador — nombre público que verá la audiencia (requerido)
- Handle / URL — define la dirección `/@handle` (requerido, único, validación en tiempo real; advertencia de que cambiarlo puede romper links existentes)
- Avatar (opcional)
- Banner (opcional)
- Bio corta (opcional)
- Sitio web (opcional)
- Redes sociales: Instagram, TikTok, Facebook, X, YouTube, Twitch, LinkedIn (opcionales)

Link directo a `/@handle` para ver el perfil público (visible solo cuando tiene al menos un evento aprobado).

---

##### `/cuenta/mis-eventos`

Lista de eventos creados por el usuario. Tabs con contador de ítems por estado: Todos · En revisión · Publicados · Rechazados · Baneados · Archivados

- **En revisión** — esperando aprobación del admin
- **Publicados** — activos en el sitio, con métricas: vistas, guardados y clicks al link de entradas
- **Rechazados** — muestra el motivo de rechazo
- **Archivados** — eventos cuya publicación venció. Cada card tiene botón **"Renovar"** que lleva al carrito para elegir nuevos días y volver a publicar

Empty state: CTA para crear el primer evento.

> Las métricas (vistas, guardados, clicks) son una funcionalidad pendiente de diseñar. Actualmente solo se muestra el estado. Es una mejora prioritaria para retener a los organizadores que pagan.

---

##### `/cuenta/mis-avisos`

Lista de avisos. Tabs con contador: Todos · En revisión · Activos · Expirados · Rechazados · Baneados

Acciones por ítem según estado: editar y eliminar si está en borrador o rechazado. Los expirados tienen botón **"Renovar"** igual que en mis-eventos. Botón "Crear aviso" en la parte superior — visible solo si hay cupo disponible (menos de 12 activos).

Empty state según disponibilidad de cupo:

- **Hay cupo** — CTA para crear el primer aviso.
- **Sin cupo** (12/12 ocupados) — "No hay cupos disponibles en este momento. Cuando se libere un cupo podrás crear tu aviso." Sin botón de crear.

---

##### `/cuenta/mis-portadas`

Lista de portadas con preview de imagen y fechas. Tabs con contador: Todos · En revisión · Activas · Expiradas · Rechazadas · Baneadas

Los expirados tienen botón **"Renovar"**. Botón "Crear portada" en la parte superior — visible solo si hay cupo disponible (menos de 5 activas).

Empty state según disponibilidad de cupo:

- **Hay cupo** — CTA para crear la primera portada.
- **Sin cupo** (5/5 ocupadas) — mensaje informativo equivalente al de avisos. Sin botón de crear.

---

##### `/cuenta/mis-articulos`

Lista de artículos patrocinados encargados por el organizador a Konbini. Cada fila muestra el título, estado (en revisión / publicado / rechazado) y un link al artículo publicado si aplica. Botón "Solicitar artículo" en la parte superior.

Empty state: CTA para solicitar el primer artículo patrocinado, con una breve explicación de qué es y para qué sirve.

---

##### `/cuenta/favoritos`

Lista de todos los eventos guardados con el corazón. Card compacta con nombre, fecha y estado del evento (próximo / hoy / pasado). Opción de quitar de guardados.

Empty state: mensaje invitando a explorar eventos y guardar los que les interesen.

---

##### `/cuenta/mensajes`

Centro de notificaciones del usuario. Muestra el historial completo de mensajes del sistema: aprobaciones y rechazos de eventos, avisos y portadas, y comunicaciones de Konbini.

Cada mensaje tiene estado leído / no leído (diferenciado visualmente). Al abrir un mensaje se marca como leído. El badge de la campanita en el header se actualiza en tiempo real.

Los mensajes de rechazo incluyen el motivo y un link directo al ítem rechazado en la sección correspondiente de `/cuenta`.

Los eventos también se notifican por email — el mensaje en `/cuenta/mensajes` es el registro interno, el email es la notificación inmediata.

Empty state: "No tienes mensajes aún."

---

##### `/cuenta/pagos`

Historial cronológico de todas las transacciones del usuario. Cada fila muestra: fecha, detalle de los ítems comprados (evento, aviso, portada, artículo), monto total y estado del pago (aprobado / fallido / reembolsado). Cada fila tiene opción de descargar el comprobante.

Empty state: mensaje informando que aún no hay transacciones.

---

#### 3.11 Flujo Crear Evento + Upsell + Carrito

El flujo completo de publicación tiene tres etapas encadenadas.

##### Etapa 1 — Wizard de 4 pasos (`/crear`)

Layout dedicado sin header ni footer global. Solo logo + indicador de progreso + botones de navegación del wizard.

- **Paso 1:** Título, empresa organizadora, categoría (define el precio), descripción, tipo de entrada (gratis o con precios por tipo)
- **Paso 2:** Fechas y horarios (múltiples), país → división administrativa → ciudad (la cascada viene pre-seleccionada con el país del perfil del usuario, pero es editable; al cambiar el país se resetea división y ciudad), dirección, URL de tickets, redes sociales del evento
- **Paso 3:** Banner, poster, galería (máx 10 fotos), videos
- **Paso 4 — Revisión:** Resumen de todos los datos ingresados en los pasos anteriores, organizados por sección (info básica, fechas y lugar, multimedia). No es un preview de cómo se verá en la web pública — es una revisión de datos para que el organizador confirme que todo está correcto antes de enviar. Incluye un aviso destacado: *"Revisa bien tu información — una vez enviado el evento no podrá ser editado."* Botón de envío al final.

UX importante:

- Barra de progreso visible en todo momento
- Preview del card en tiempo real mientras se llenan los pasos 1 y 2
- Validación inline por campo, no al enviar el paso
- El evento queda en revisión tras el envío hasta que un admin lo apruebe

##### Etapa 2 — Upsell post-evento

Aparece inmediatamente después de enviar el evento, dentro del mismo layout dedicado. Primero muestra un resumen del evento creado. Luego presenta tres preguntas secuenciales e independientes:

1. "¿Quieres agregar un aviso?" — muestra precio por día y disponibilidad en tiempo real ("3 de 12 spots disponibles"). Si no hay cupo (12/12 ocupados), este paso se omite completamente.
2. "¿Quieres agregar una portada?" — ídem ("1 de 5 portadas disponibles"). Si no hay cupo (5/5 ocupadas), se omite.
3. "¿Quieres un artículo patrocinado?" — el organizador entrega el contenido (título, texto, imágenes, video) y Konbini lo revisa, edita y publica con su estilo editorial. No tiene cupo limitado.

Responder "No" en cualquiera no omite las siguientes. Si no hay cupo en aviso y portada, igual se muestra la pregunta del artículo.

Si el usuario acepta, se despliega el formulario correspondiente dentro del mismo layout:

**Formulario de Aviso:**

- Título (requerido)
- Imagen (opcional)
- Tipo de enlace: URL / Teléfono / Email (requerido) — el tipo cambia el campo siguiente y el ícono del CTA
- Valor del enlace: la URL, teléfono o email según el tipo elegido (requerido)
- Días de publicación: mínimo 10, máximo 30

**Formulario de Portada:**

- Título (requerido)
- Subtítulo en color de acento — es la parte del título que se resalta (opcional)
- Descripción corta (opcional)
- Imagen de fondo a pantalla completa (requerida)
- Fecha a mostrar (opcional)
- Lugar a mostrar (opcional)
- URL de destino al hacer clic (opcional)
- Días de publicación: mínimo 10, máximo 30

**Formulario de Artículo Patrocinado:**

- Título del artículo (requerido)
- Contenido — editor WYSIWYG con barra de herramientas (negrita, cursiva, headers, listas) que trabaja en Markdown internamente. Es el mismo componente que usa el admin en `/dashboard/articles` (requerido)
- Imagen principal (requerida)
- Video — URL de YouTube (opcional)
- Galería de imágenes adicionales (opcional)

> Aviso visible en el formulario: "Konbini revisará el contenido antes de publicarlo. El texto puede sufrir cambios de redacción para alinearse al estilo editorial de Konbini."

Este formulario es idéntico al que aparece en `/cuenta/mis-articulos` — es el mismo componente reutilizado en dos contextos.

##### Etapa 3 — Carrito (`/carrito`)

Muestra los ítems seleccionados: evento, aviso, portada y/o artículo patrocinado. Para evento, aviso y portada el usuario elige el número de días de publicación (mínimo 10) — el selector no aparece para el artículo patrocinado, que es una publicación fija sin límite de días. El subtotal por ítem y el total se calculan en tiempo real.

El carrito incluye un selector de **medio de pago**. Al lanzamiento solo estará disponible Transbank (WebPay), que aparece preseleccionado. El diseño debe contemplar múltiples opciones (Flow, MercadoPago, etc.) para que puedan incorporarse sin rediseñar esta pantalla — el patrón típico es una lista de opciones tipo radio button o cards, una por pasarela.

Estados del carrito: borrador → en proceso de pago → pagado / fallido.

Al pagar: redirige a la pasarela seleccionada. Al volver, hay dos pantallas dedicadas:

- **Éxito** — pantalla de confirmación con cuatro elementos:
  1. **Resumen del pago** — detalle de los ítems recién comprados (evento, aviso, portada y/o artículo), monto total y estado ("tu contenido está en revisión")
  2. **Aviso de perfil de organizador** — mensaje que invita a completar o actualizar los datos del perfil público en `/cuenta` para que la audiencia los encuentre
  3. **Formulario de satisfacción** — valoración de 5 estrellas + campo de texto opcional + botón enviar. Simple y rápido.
  4. **CTAs de salida** — dos opciones: "Ver mi evento" (preview del evento recién creado, visible solo para el dueño aunque esté en revisión) y "Ir al home"

- **Fallido** — mensaje claro del motivo, opción de reintentar con la misma pasarela u opción de cambiar a otra.

> Los avisos y portadas también pueden crearse de forma independiente desde `/cuenta`, sin necesidad de pasar por el flujo de creación de evento.

---

#### 3.12 Artículos

Konbini ya produce contenido editorial activamente (anime, manga, cine, gaming). Esta sección no es un blog secundario — es el motor de tráfico del sitio.

Listado de artículos:

- Grilla de cards con imagen, titular, categoría y fecha
- **Barra de filtros sticky** — igual que en la vista de categoría, se fija al tope al hacer scroll. Contiene: filtro por categoría (Anime, Manga, Cine, Gaming, etc.) y búsqueda por texto

Detalle de artículo — layout de dos columnas:

Columna izquierda (contenido principal):

1. Título del artículo
2. Imagen principal — acompaña al contenido, no ocupa el ancho completo como un hero
3. Meta — fecha, autor, tiempo de lectura estimado, tags, botón compartir (Web Share API en móvil, dropdown en desktop)
4. Contenido completo del artículo
5. Badge "Artículo patrocinado" si el artículo fue contratado por un organizador

Columna derecha — sidebar sticky (se fija al hacer scroll, igual que en Event Detail):

- Bloque de eventos relacionados. Si el artículo es un artículo patrocinado, el evento vinculado directamente aparece primero y destacado. Debajo, eventos relacionados orgánicamente por categoría o tags.

Debajo de ambas columnas — ancho completo:

- Artículos relacionados — otras noticias del mismo tema o categoría

---

### Prioridad Baja

#### 3.13 About

Página que presenta a Konbini — quiénes son, de dónde viene la comunidad, qué es el directorio de eventos y por qué existe. Es la página a la que llega alguien que no conoce la marca y quiere entender con quién está tratando.

Contenido sugerido:

- Historia de Konbini (nació en Instagram, 244K comunidad)
- Qué es el directorio y para quién es
- El equipo o las caras detrás de la marca
- CTA hacia "Publicar evento" y hacia Noticias

#### 3.14 Ayuda

Agrupa cuatro páginas bajo una misma sección con submenu compartido. El submenu es horizontal en desktop (o sidebar en móvil), está presente en las cuatro páginas y resalta la activa — el usuario se mueve entre ellas sin volver al home.

Páginas incluidas:

- **Preguntas frecuentes** — acordeón de preguntas y respuestas
- **Términos y condiciones** — contenido gestionado por el admin
- **Política de privacidad** — contenido gestionado por el admin
- **Contacto** — formulario con nombre, email, asunto y mensaje

El acceso a "Ayuda" va en el footer.

#### 3.15 Auth — Login, Registro y 2FA

Todas las pantallas de autenticación usan layout dedicado sin header ni footer global.

Login — wizard de 2 pasos:

1. Email
2. Contraseña

Registro — wizard de 2 pasos:

1. Email
2. Nombre, apellido, país (selector), contraseña y confirmación — más checkboxes obligatorios: aceptación de T&C y política de privacidad, confirmación de ser mayor de 18 años; y uno opcional desmarcado por defecto para comunicaciones de Konbini

> El username se genera automáticamente al registrarse. Solo puede cambiarse desde la Zona Danger de `/cuenta`, y únicamente si el usuario tiene perfil de organizador activo.

2FA — pantalla intermedia obligatoria tras login y registro exitosos:

- Konbini envía un código de 6 dígitos al email del usuario
- El usuario ingresa el código para completar el acceso
- Opción de reenviar código si no llega
- El código expira en un tiempo determinado

Acceso con Google (One Tap / OAuth):

El botón "Continuar con Google" aparece en las pantallas de login y registro como alternativa al flujo por email.

- **Login con cuenta existente** — acceso directo sin 2FA (Google ya verificó la identidad). Redirige según rol.
- **Registro nuevo (primera vez)** — después del OAuth de Google se muestra un **mini onboarding** antes de crear la cuenta. Es una pantalla amigable, no un formulario seco:
  - Nombre y apellido pre-llenados desde Google (editables)
  - Selector de País (requerido)
  - Checkboxes obligatorios: aceptación de T&C y política de privacidad, confirmación de mayoría de edad
  - Checkbox opcional desmarcado por defecto: comunicaciones de Konbini
  - Este paso es obligatorio por Ley 21.719 — no se puede omitir aunque el usuario venga desde Google

El mini onboarding usa el mismo layout dedicado del registro. El username se genera automáticamente igual que en el flujo normal.

Recuperación de contraseña — flujo de 2 pasos:

1. Solicitar link por email
2. Formulario de nueva contraseña (desde el link recibido)

Redirección post-autenticación — aplica tanto al login como al registro:

- **Usuario registrado** → Home
- **Admin / Super Admin** → Dashboard (`/dashboard`)

---

#### 3.16 Página 404

Página de error personalizada — no puede ser la pantalla genérica del servidor.

Contenido:

- Mensaje con personalidad de marca (tono geek, no técnico)
- CTA principal hacia el Home
- Buscador inline para que el usuario pueda intentar encontrar lo que buscaba sin salir de la página

---

#### 3.17 Evento Expirado

Pantalla que reemplaza el detalle de un evento cuya fecha ya pasó. **No es un 404** — la URL sigue válida y la página sigue indexada en Google. Eliminarla sería desperdiciar ese tráfico SEO.

Contenido:

- Badge o banner "Este evento ya terminó"
- Información básica del evento (nombre, fecha pasada, imagen) — el contexto es importante para quien llega desde un buscador
- Bloque "Próximos eventos relacionados" — misma categoría, para retener al visitante y convertir ese tráfico en descubrimiento de eventos futuros

---

#### 3.18 Vista de Tag

Página que agrupa todo el contenido etiquetado con un tag específico. Se accede al hacer clic en cualquier tag visible en el sitio (artículos, eventos). URL tipo `/tag/shonen`.

Los tags **no los crea el usuario** — son asignados automáticamente por IA durante la revisión del admin.

Contenido:

- Título del tag
- Resultados mezclados: eventos y artículos con ese tag, diferenciados con badge de tipo ("Evento" / "Noticia")
- Paginación

---

### Dashboard — Panel de Administración

Área exclusiva para roles ADMIN y SUPER_ADMIN. Inaccesible para usuarios normales. Layout propio: sidebar izquierdo fijo con logo, grupos de navegación y usuario activo en el pie; topbar superior con título de sección y acciones contextuales. El sidebar distingue visualmente los ítems solo disponibles para SUPER_ADMIN.

#### 3.19 Home `/dashboard`

Vista general del sistema.

- KPIs en grid: ingresos del mes, eventos publicados, eventos en revisión, avisos activos, portadas activas, usuarios registrados
- Gráfico de ingresos por mes con selector de período

> Konbini no vende entradas — no hay métricas de "tickets vendidos". Los ingresos corresponden a los pagos de los organizadores por publicar eventos, avisos, portadas y artículos patrocinados.

- Cola de revisión rápida: eventos, avisos y portadas pendientes (máx 5 de cada tipo), con acciones de aprobar y rechazar inline
- Feed de actividad reciente: acciones del equipo admin con timestamp
- Distribución de eventos por categoría (barras horizontales)

---

#### 3.20 Eventos `/dashboard/events`

Moderación de eventos enviados por organizadores.

Tabla con columnas: imagen miniatura, título + categoría, organizador + email, fecha del evento, precio mínimo, estado.

Estados posibles: En revisión · Publicado · Rechazado · Baneado

Filtros: estado, categoría, búsqueda por título u organizador.

Acciones según estado:

- En revisión: **Aprobar** — abre panel lateral con campo de tags (input con ícono sparkle ✦ a la derecha; por defecto la IA asigna tags automáticamente al aprobar, si el admin hace clic en el ícono puede editarlos manualmente antes de confirmar). **Rechazar** — requiere motivo que se le muestra al organizador.
- Publicado: Ver en sitio (link externo), **Banear** (con motivo).
- Rechazado: opción de re-revisar.
- Baneado: opción de restaurar.

---

#### 3.21 Avisos `/dashboard/spots`

Moderación de avisos publicitarios.

Tabla con columnas: imagen, evento asociado, organizador, fechas de activación (inicio–fin), estado.

Indicador de ocupación en el header de la tabla: **X / 12 avisos activos**.

Estados posibles: Pendiente · Activo · Rechazado · Baneado · Expirado

Acciones: Aprobar, Rechazar (con motivo), Banear, Restaurar.

---

#### 3.22 Portadas `/dashboard/heroes`

Moderación de portadas (hero banners del home).

Tabla con columnas: imagen banner, evento asociado, organizador, fechas de activación (inicio–fin), estado.

Indicador de ocupación en el header de la tabla: **X / 5 portadas activas**.

Estados posibles: Pendiente · Activo · Rechazado · Baneado · Expirado

Acciones: Aprobar, Rechazar (con motivo), Banear, Restaurar.

---

#### 3.23 Artículos `/dashboard/articles`

Gestión y moderación de artículos patrocinados enviados por organizadores.

Tabla con columnas: título, autor/organizador, categoría, fecha de envío, estado.

Estados posibles: En revisión · Publicado · Rechazado · Baneado

Al abrir un artículo para revisar o editar, se muestra un editor WYSIWYG con barra de herramientas (negrita, cursiva, headers, listas) que trabaja en **Markdown** internamente (no HTML, por seguridad).

El editor incluye un botón de IA (ícono sparkle ✦) que sugiere una corrección del texto completo. Al activarlo se muestra un preview lado a lado del original vs. la versión corregida; el admin acepta (se guarda la nueva versión) o descarta (permanece el original). El original se preserva siempre independientemente de la acción tomada.

Acciones: Aprobar, Rechazar con motivo legal, Banear, Editar.

---

#### 3.24 Usuarios `/dashboard/users` — Solo SUPER_ADMIN

Gestión de cuentas de la plataforma.

Tabla con columnas: avatar, nombre completo, username, email, rol, fecha de registro, estado.

Filtros: rol (Admin / Organizador / Usuario), estado (Activo / Baneado), búsqueda.

Acciones: Ver perfil público (si es organizador), cambiar rol, bannear/desbanear, asignar o revocar badge Verificado al perfil de organizador.

---

#### 3.25 Pagos & ventas `/dashboard/payments`

Historial de transacciones de la plataforma.

KPIs: ingresos del mes, total histórico, transacciones pendientes.

Tabla con columnas: ID de transacción, organizador, tipo de producto (Evento / Aviso / Portada / Artículo), monto, fecha, estado (Pendiente / Completado / Reembolsado).

Filtros: tipo de producto, estado, rango de fechas, búsqueda por organizador.

Acción: Exportar CSV.

---

#### 3.26 Mantenedores

Secciones CRUD para la información que alimenta los selectores del formulario de creación de eventos y otras partes del sistema. Todos los mantenedores protegen la eliminación si el registro tiene contenido asociado.

**Categorías `/dashboard/categories`**

Lista con nombre, slug, ícono/color y cantidad de eventos. CRUD completo. Permite reordenar manualmente el listado (determina el orden de los filtros en el sitio público).

El formulario de crear/editar categoría incluye los siguientes campos de configuración de precios:

- **Precio por día** (CLP) — cuánto cuesta publicar un evento de esta categoría por cada día
- **Días mínimos** de publicación
- **Días máximos** de publicación

Estos valores son los que se usan al calcular el costo del evento en el carrito. Cada categoría puede tener su propia tarifa — las categorías de mayor demanda o más especializadas pueden tener precios distintos.

**Tags `/dashboard/tags`**

Lista con nombre, slug y cantidad de contenido asociado (eventos + artículos). CRUD completo. Los tags se generan automáticamente por IA al aprobar un evento; el admin puede crearlos y editarlos también de forma manual.

**Países `/dashboard/countries`**

Lista con nombre, código ISO y bandera. CRUD completo.

**Divisiones administrativas `/dashboard/states`**

Lista con nombre, tipo de división (Región / Provincia / Estado / Departamento según el país) y país al que pertenece. CRUD completo. Filtro por país.

**Ciudades `/dashboard/cities`**

Lista con nombre, división administrativa y país. CRUD completo. Filtros por país y por división.

Los tres mantenedores geográficos funcionan en cascada en los formularios del sitio: País → División → Ciudad.

---

#### 3.27 Reportes `/dashboard/reports`

Reportes exportables de la plataforma.

- Ventas por período (día / semana / mes / año)
- Distribución por categoría
- Top organizadores por ingresos y por eventos publicados

Exportar en CSV.

---

#### 3.28 Logs & auditoría `/dashboard/logs`

Historial completo de acciones administrativas. Solo lectura.

Cada entrada muestra: quién realizó la acción, qué acción fue, sobre qué entidad, y cuándo.

Filtros: admin responsable, tipo de acción, rango de fechas.

---

#### 3.29 Contacto `/dashboard/contact`

Bandeja de mensajes recibidos desde el formulario de contacto del sitio público.

Cada mensaje muestra: nombre, email, asunto, texto completo y fecha.

Estados: Nuevo · Leído · Archivado.

Acciones: marcar como leído, archivar. La respuesta se hace fuera de la plataforma (email externo).

---

#### 3.30 FAQ `/dashboard/faq`

Gestión del contenido de la sección de preguntas frecuentes del sitio público.

CRUD de pares pregunta/respuesta. Permite reordenar manualmente.

---

#### 3.31 Configuración `/dashboard/settings`

##### Precios y límites de Avisos

Bloque de configuración con cuatro campos:

- Precio por día (CLP)
- Días mínimos de publicación
- Días máximos de publicación
- Cupo máximo de avisos activos simultáneos

Valores por defecto al instalar: 8.000 CLP/día · mínimo 10 días · máximo 30 días · cupo 12.

##### Precios y límites de Portadas

Mismo bloque para portadas:

- Precio por día (CLP)
- Días mínimos de publicación
- Días máximos de publicación
- Cupo máximo de portadas activas simultáneas

Valores por defecto al instalar: 15.000 CLP/día · mínimo 10 días · máximo 30 días · cupo 5.

> Los indicadores de ocupación en `/dashboard/spots` (X / N avisos activos) y `/dashboard/heroes` (X / N portadas activas) reflejan el cupo configurado aquí. Los formularios de crear aviso y portada también usan los límites de días de esta sección.

##### Textos legales

Términos y condiciones, Política de privacidad, Política de cookies — editables con el mismo editor WYSIWYG Markdown de artículos.

##### Integraciones

Configuración de pasarela de pago.

---

## 4. Componentes Globales

### Header / Navegación

La estructura del header ya está definida en el sitio actual. Solo se extiende con los elementos nuevos:

- **Logo** — link al home
- **4 categorías con más eventos** — las más activas, dinámicas
- **[+]** — icono que abre un dropdown con el resto de categorías
- **Separador visual** — divide categorías de secciones secundarias
- **Noticias · About · Contacto** — secciones secundarias del sitio
- **Iconos derecha** — buscador, toggle de tema (sin cambios)
- **Campanita de notificaciones** — visible solo con sesión iniciada. Muestra un badge con el número de mensajes no leídos. Al hacer clic abre un dropdown con los últimos mensajes (aprobaciones, rechazos, avisos del sistema). Link "Ver todos" que lleva a `/cuenta/mensajes`.
- **Ingresar** — visible solo sin sesión. Con sesión activa se reemplaza por el avatar del usuario con un dropdown: Mi cuenta, y Cerrar sesión.
- **+ Crear evento** — CTA principal destacado en color de acento (sin cambios)

#### Navegación móvil

En mobile y tablet, el menú se colapsa. El ícono hamburguesa abre un **overlay a pantalla completa** con la navegación completa: todas las categorías, secciones secundarias y los dos CTAs (Ingresar, Crear evento). El overlay cierra con el ícono X o deslizando hacia arriba. No se usa bottom nav — el overlay es coherente con el estilo visual del sitio.

### Footer

- Redes sociales de Konbini
- Links para organizadores ("Publicar evento", "¿Cómo funciona?")
- Sección **Ayuda** — FAQ, Términos, Privacidad, Contacto

### Toasts (notificaciones flotantes)

Todas las acciones muestran feedback mediante toast en la esquina inferior-derecha, con auto-dismiss.

- Verde — éxito
- Rojo — error
- Neutro — información (ej: "Enlace copiado")
- Amarillo — advertencia

Los errores de validación de campos van inline bajo el campo, no en toast.

### Modal de Login contextual

Cuando un visitante sin sesión intenta guardar un evento, en vez de redirigir a /login se muestra un modal de login encima del evento. El usuario se autentica (incluyendo 2FA) y al terminar el modal se cierra — el evento sigue visible y el guardado se ejecuta automáticamente.

### Cookie Consent Banner

Barra fija en la parte inferior de la pantalla, aparece en el primer acceso. No es un modal bloqueante — el usuario puede seguir navegando.

- Botón "Aceptar todo"
- Botón "Solo esenciales"
- Link a Política de privacidad

Al elegir, el banner desaparece y la preferencia se guarda. Obligatorio por Ley 21.719 (vigente diciembre 2026).

### Skeleton Screens

Las secciones con contenido dinámico muestran skeletons durante la carga, no spinners. Necesitan diseño propio:

- Home — skeleton del carrusel, grilla de destacados y rails por categoría
- Listado / Categoría — skeleton de la grilla de eventos
- Búsqueda — skeleton de resultados mixtos

### Estados Vacíos

Cada sección vacía necesita diseño propio:

- Home sin portadas activas (sección oculta)
- Home en lanzamiento con pocos eventos
- Categoría sin eventos
- Búsqueda sin resultados
- `/cuenta` sin publicaciones (onboarding al organizador)

---

## 5. Flujos de Usuario Clave

### Visitante descubre un evento

`Home → card evento → detalle → guarda o comparte`

### Visitante busca algo específico

`Header search → resultados con filtros → detalle evento`

### Usuario se registra y publica su primer evento

`Página de precios → Registro → Wizard 4 pasos → Upsell (aviso/portada/artículo) → Carrito → Pago → Confirmación (con aviso para completar perfil en /cuenta/organizador)`

### Organizador crea un aviso o portada por su cuenta

`/cuenta → tab Mis avisos o Mis portadas → Formulario → Carrito → Pago`

### Organizador revisa el rendimiento de sus eventos

`Login → /cuenta → Mis eventos → métricas del evento (vistas, guardados, clicks)`

### Lector llega por una noticia y descubre eventos

`Artículo (desde Google o RRSS) → lee la noticia → sidebar derecho con eventos relacionados (el primero es el evento directamente vinculado) → detalle del evento → guarda o comparte`

### Admin modera contenido

`Login → /dashboard → cola de revisión rápida (eventos / avisos / portadas pendientes) → aprobar (con asignación de tags IA) o rechazar con motivo → contenido publicado queda sujeto a baneo posterior si viola las reglas`

`Artículos: /dashboard/articles → revisar con editor WYSIWYG → opcionalmente aplicar corrección IA (preview original vs. corregido) → aprobar o rechazar con motivo legal`

---

## 6. Notas Finales

- **El sitio debe funcionar muy bien en móvil.** La mayoría del tráfico vendrá desde teléfonos. El wizard de creación de eventos en móvil es especialmente crítico.
- **Las portadas y avisos son productos del negocio.** Deben integrarse visualmente en el home sin parecer publicidad disruptiva.
- **El card de evento es el átomo del sistema.** Conviene iterar en ese componente antes de diseñar las páginas completas.
- **Los estados vacíos importan.** Al lanzamiento habrá poco contenido — el diseño debe funcionar bien con densidad baja.
- **El CTA de los avisos es flexible.** Puede ser URL externa, URL interna, email o teléfono. El diseño del botón debe contemplar los distintos casos con ícono y texto apropiados.
 
---

Brief v1.1 — Mayo 2026 — Konbini redesign
