---
phase: quick-260521-mkj
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/api/package.json
  - apps/api/.env.example
  - apps/api/src/app.module.ts
  - apps/api/src/mail/mail.module.ts
  - apps/api/src/mail/mail.service.ts
  - apps/api/src/mail/templates.ts
  - apps/api/src/auth/auth.module.ts
  - apps/api/src/auth/auth.service.ts
  - apps/api/src/events/events.module.ts
  - apps/api/src/events/events.service.ts
  - apps/api/src/payments/payments.module.ts
  - apps/api/src/payments/payments.service.ts
autonomous: true
requirements: [MKJ-MAIL]
user_setup:
  - service: mailgun
    why: "Envío transaccional de emails (bienvenida, recuperación, moderación, pago)"
    env_vars:
      - name: MAILGUN_API_KEY
        source: "Mailgun Dashboard -> Settings -> API Keys"
      - name: MAILGUN_DOMAIN
        source: "Mailgun Dashboard -> Sending -> Domains (dominio verificado)"
      - name: MAIL_FROM
        source: "Remitente, ej: Konbini <no-reply@tudominio.cl>"

must_haves:
  truths:
    - "Al registrarse, el usuario recibe un email de bienvenida"
    - "POST /auth/forgot-password envía el enlace de recuperación por email (ya no solo lo loguea)"
    - "Al aprobar o rechazar un evento, el organizador recibe un email de notificación"
    - "Tras un pago Transbank exitoso, el comprador recibe un email de confirmación"
    - "Si el envío de email falla, la operación del caller igual termina con éxito (no se lanza excepción)"
  artifacts:
    - path: "apps/api/src/mail/mail.service.ts"
      provides: "MailService con 5 métodos de envío gracefulmente envueltos"
      contains: "sendPaymentConfirmed"
    - path: "apps/api/src/mail/mail.module.ts"
      provides: "MailModule @Global que exporta MailService"
      contains: "@Global"
    - path: "apps/api/src/mail/templates.ts"
      provides: "Helper renderTemplate (MJML -> HTML) + las 5 plantillas"
      contains: "mjml2html"
  key_links:
    - from: "apps/api/src/auth/auth.service.ts"
      to: "MailService"
      via: "inyección + sendWelcome / sendPasswordReset"
      pattern: "mail\\.send(Welcome|PasswordReset)"
    - from: "apps/api/src/events/events.service.ts"
      to: "MailService"
      via: "inyección + sendEventApproved / sendEventRejected con owner.email"
      pattern: "mail\\.sendEvent(Approved|Rejected)"
    - from: "apps/api/src/payments/payments.service.ts"
      to: "MailService"
      via: "inyección + sendPaymentConfirmed con owner.email"
      pattern: "mail\\.sendPaymentConfirmed"
---

<objective>
Implementar envío de emails transaccionales en la API NestJS usando Mailgun (`mailgun.js`)
para el transporte y MJML (`mjml`) para compilar plantillas HTML responsivas.

Purpose: Hoy la API no envía ningún correo — el token de recuperación se loguea en consola
y las acciones de moderación / pago no notifican a nadie. Esto cierra esa brecha con un
servicio reutilizable y tolerante a fallos.

Output: Un `MailModule` global con `MailService` (5 métodos de envío) y 5 plantillas MJML,
cableado en auth, events y payments.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@apps/api/src/auth/auth.service.ts
@apps/api/src/events/events.service.ts
@apps/api/src/payments/payments.service.ts

<interfaces>
<!-- Contratos relevantes ya existentes en el código. Usarlos directamente. -->

Build del workspace (pnpm + turbo): `pnpm --filter konbini-nest-api build`

PrismaModule es @Global — PrismaService se inyecta sin importar nada.
ConfigModule.forRoot({ isGlobal: true }) — ConfigService disponible globalmente.

Patrón de logging en NestJS (ver PaymentsService):
```typescript
private readonly logger = new Logger(MailService.name);
this.logger.error('mensaje', err);
```

AuthService.register devuelve { token, user } — el user (sanitizado) trae email, firstname, lastname.
AuthService.forgotPassword genera `token` (hex plano) — actualmente: console.log(`🔑 Token... ${token}`).

EventsService.EVENT_INCLUDE NO incluye `owner`. EVENT_INCLUDE_ADMIN SÍ:
  owner: { select: { id: true, firstname: true, lastname: true, email: true } }
Los métodos approve()/reject() usan EVENT_INCLUDE (sin owner) → hay que traer el owner.

PaymentsService.handleTransbankCallback hace prisma.order.findFirst con
  include: { items: { include: { event, spot, hero } } }  — NO incluye `owner`.
Order tiene relación `owner User` (userId obligatorio).

ConfigService keys ya usadas: FRONTEND_URL (default http://localhost:3000), API_BASE_URL.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Crear MailModule + MailService + plantillas MJML</name>
  <files>apps/api/package.json, apps/api/.env.example, apps/api/src/app.module.ts, apps/api/src/mail/mail.module.ts, apps/api/src/mail/mail.service.ts, apps/api/src/mail/templates.ts</files>
  <action>
    1. Instalar dependencias en el paquete de la API:
       `pnpm --filter konbini-nest-api add mailgun.js form-data mjml`
       (`form-data` es peer dep de `mailgun.js`; `mjml` incluye sus propios tipos).

    2. Crear `apps/api/src/mail/templates.ts`:
       - Helper `renderTemplate(opts: { title: string; greeting: string; body: string;
         ctaLabel?: string; ctaUrl?: string }): string` que arma un layout MJML SIMPLE
         (header con el nombre del sitio "Konbini", cuerpo con el mensaje, botón CTA
         opcional, footer) y lo compila con `mjml2html` de `mjml`. Si `mjml2html`
         devuelve errores, loguearlos pero igual devolver el `html`.
       - Importar como `import mjml2html from 'mjml';`
       - Exportar 5 funciones que devuelven `{ subject: string; html: string }`:
         `welcomeTemplate(name)`,
         `passwordResetTemplate(resetUrl)`,
         `eventApprovedTemplate(name, eventTitle, eventUrl)`,
         `eventRejectedTemplate(name, eventTitle, reason)`,
         `paymentConfirmedTemplate(name, orderId, amount)`.
       - Mensajes en español, tono cordial. CTA donde aplique (recuperación → resetUrl;
         evento aprobado → eventUrl).

    3. Crear `apps/api/src/mail/mail.service.ts` — `@Injectable() MailService`:
       - Constructor inyecta `ConfigService`. Construir el cliente Mailgun en el
         constructor: `const mg = new Mailgun(FormData); this.client = mg.client({
         username: 'api', key: MAILGUN_API_KEY })`. Guardar `domain` y `from` de config.
       - Bandera privada `enabled`: `true` solo si `MAILGUN_API_KEY` y `MAILGUN_DOMAIN`
         están definidos. Si no, loguear un warn una vez ("MailService deshabilitado:
         faltan MAILGUN_API_KEY/MAILGUN_DOMAIN").
       - Método PRIVADO `send(to: string, subject: string, html: string): Promise<void>`
         — TODA la lógica graceful vive aquí: si `!enabled` loguear y retornar; envolver
         la llamada `this.client.messages.create(domain, { from, to, subject, html })`
         en try/catch; en catch loguear `this.logger.error(...)` y NO relanzar.
       - 5 métodos PÚBLICOS async, cada uno arma su plantilla y llama a `send(...)`:
         `sendWelcome(to, name)`,
         `sendPasswordReset(to, resetUrl)`,
         `sendEventApproved(to, name, eventTitle, eventUrl)`,
         `sendEventRejected(to, name, eventTitle, reason)`,
         `sendPaymentConfirmed(to, name, orderId, amount)`.
       - Contrato graceful: ningún método público lanza excepción — los callers hacen
         `await this.mail.sendX(...)` sin try/catch propio.

    4. Crear `apps/api/src/mail/mail.module.ts`: `@Global() @Module` que provee y
       exporta `MailService`.

    5. Registrar `MailModule` en los `imports` de `apps/api/src/app.module.ts`.

    6. Añadir al final de `apps/api/src/auth/auth.service.ts` NADA aún (Task 2).

    7. Actualizar `apps/api/.env.example` agregando una sección:
       ```
       # Mailgun — envío de emails transaccionales
       MAILGUN_API_KEY=
       MAILGUN_DOMAIN=
       MAIL_FROM="Konbini <no-reply@tudominio.cl>"
       ```
  </action>
  <verify>
    <automated>cd /home/gab/Code/konbini-project && pnpm --filter konbini-nest-api build</automated>
  </verify>
  <done>
    Build de la API pasa. Existen mail.module.ts (@Global), mail.service.ts (5 métodos
    públicos + send privado graceful) y templates.ts (renderTemplate + 5 plantillas).
    MailModule registrado en AppModule. .env.example tiene las 3 vars de Mailgun.
  </done>
</task>

<task type="auto">
  <name>Task 2: Cablear MailService en auth, events y payments</name>
  <files>apps/api/src/auth/auth.service.ts, apps/api/src/events/events.service.ts, apps/api/src/payments/payments.service.ts</files>
  <action>
    MailModule es @Global, así que MailService se inyecta directamente sin tocar los
    `imports` de los módulos consumidores. Solo añadir el parámetro al constructor.

    1. `auth.service.ts`:
       - Inyectar `private readonly mail: MailService` en el constructor.
       - En `register()`, tras crear el profile y antes del `return`, añadir:
         `await this.mail.sendWelcome(user.email, user.firstname ?? user.email);`
       - En `forgotPassword()`, dentro del bloque `if (user && !user.blocked)`,
         reemplazar el `console.log` del token por:
         construir `resetUrl = `${FRONTEND_URL}/recuperar-contrasena?token=${token}``
         (leer `FRONTEND_URL` con un `ConfigService` inyectado — agregarlo también al
         constructor) y llamar `await this.mail.sendPasswordReset(user.email, resetUrl);`
         Mantener el `console.log` del token SOLO como fallback de desarrollo cuando
         `MAILGUN_API_KEY` no esté definido (`if (!config.get('MAILGUN_API_KEY')) console.log(...)`),
         para no perder esa ayuda en local. Quitar el comentario `TODO(v2)`.

    2. `events.service.ts`:
       - Inyectar `private readonly mail: MailService` en el constructor.
       - En `approve()`: el método usa `EVENT_INCLUDE` que NO trae `owner`. Cambiar el
         `include` del `prisma.event.update` de `approve` a uno que incluya el owner
         (`{ ...EVENT_INCLUDE, owner: { select: { email: true, firstname: true } } }`),
         y tras el update, si `event.owner?.email`, llamar:
         `await this.mail.sendEventApproved(event.owner.email,
           event.owner.firstname ?? event.owner.email, event.title,
           `${FRONTEND_URL}/eventos/${event.slug}`)`.
         Inyectar `ConfigService` para leer `FRONTEND_URL`. Devolver el `event` (con el
         shape ampliado está bien).
       - En `reject()`: misma estrategia — ampliar el `include` con el owner, y tras el
         update llamar `await this.mail.sendEventRejected(owner.email,
           owner.firstname ?? owner.email, event.title, reason)`.

    3. `payments.service.ts`:
       - Inyectar `private readonly mail: MailService` en el constructor.
       - En `handleTransbankCallback()`, ampliar el `include` del `prisma.order.findFirst`
         para traer el `owner`: `include: { owner: { select: { email: true, firstname: true } },
         items: { include: { event: true, spot: true, hero: true } } }`.
       - En el bloque de pago exitoso (tras `activateOrderItems` y el update a PAID,
         antes del `return` de success), si `order.owner?.email` llamar:
         `await this.mail.sendPaymentConfirmed(order.owner.email,
           order.owner.firstname ?? order.owner.email, order.id, order.total)`.

    Importar `MailService` desde `'../mail/mail.service'` en cada archivo.
  </action>
  <verify>
    <automated>cd /home/gab/Code/konbini-project && pnpm --filter konbini-nest-api build</automated>
  </verify>
  <done>
    Build de la API pasa. AuthService.register llama sendWelcome; forgotPassword llama
    sendPasswordReset (con console.log como fallback dev). EventsService.approve/reject
    traen el owner e invocan sendEventApproved/sendEventRejected. PaymentsService trae el
    owner de la orden e invoca sendPaymentConfirmed en el path de pago exitoso. Ninguna
    de estas operaciones lanza si el email falla (graceful dentro de MailService).
  </done>
</task>

</tasks>

<verification>
- `pnpm --filter konbini-nest-api build` pasa sin errores de tipos.
- `grep -rn "mail.send" apps/api/src/{auth,events,payments}` muestra las 5 llamadas.
- `MailService` está marcado como `@Global` en su módulo y NO requiere imports en los
  módulos consumidores.
- El método privado `send` de `MailService` envuelve el envío en try/catch y no relanza.
</verification>

<success_criteria>
- 5 emails transaccionales implementados: bienvenida (register), recuperación
  (forgot-password), evento aprobado, evento rechazado, pago confirmado (Transbank).
- Transporte vía `mailgun.js`, plantillas HTML compiladas con `mjml`.
- `MailService` es graceful: si falta config o falla el envío, loguea y NO interrumpe
  al caller.
- `apps/api/.env.example` documenta `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAIL_FROM`.
</success_criteria>

<output>
After completion, create
`.planning/quick/260521-mkj-implementar-envio-de-emails-mailgun-mjml/260521-mkj-SUMMARY.md`
</output>
