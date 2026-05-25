"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ic } from "@/components/icons";
import { toast } from "sonner";

/* ─── FAQs ─────────────────────────────────────────── */
const FAQS: [string, string][] = [
  ["¿Cómo publico un evento?", "Ve a Crear evento, rellena el formulario con los datos de tu evento y haz clic en Enviar. Un admin revisará tu evento en menos de 24 horas."],
  ["¿Cuánto cuesta publicar?", "Desde $4.990 CLP por día. Puedes elegir entre 10 y 60 días de visibilidad. También existe una suscripción mensual de $29.990 con 10 créditos de publicación."],
  ["¿Cómo me registro?", "Haz clic en Ingresar y completa el formulario de registro. Recibirás un email de confirmación."],
  ["¿Puedo editar mi evento después de publicarlo?", "Una vez aprobado, no se puede editar. Te recomendamos revisar bien antes de enviar. Para cambios urgentes, contáctanos."],
  ["¿Cómo recupero mi contraseña?", "En la pantalla de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?' y sigue las instrucciones."],
  ["¿Qué es un Aviso?", "Un Aviso es un banner pagado que aparece en el home y al final de las categorías. Máximo 12 simultáneos. Precio desde $8.000 CLP/día."],
  ["¿Qué es una Portada?", "Una Portada es una imagen de fondo del carrusel principal del home. Máximo 5 simultáneas. Precio desde $15.000 CLP/día."],
  ["¿Puedo crear avisos o portadas sin un evento?", "Sí. Desde Mi Cuenta → Mis avisos o Mis portadas puedes crearlos directamente, siempre que haya cupo disponible (12 avisos / 5 portadas)."],
  ["¿Qué incluye la suscripción mensual?", "10 créditos de publicación al mes (cada crédito = 45 días o hasta la fecha del evento), 20% off en avisos y portadas, y soporte prioritario. Los créditos no usados se pierden al final del mes."],
  ["¿Puedo transferir un evento a una organización?", "Sí. Desde cada evento puedes pulsar \"Transferir a organización\". Si eres Owner, se aplica inmediato; si eres Member, se envía solicitud al Owner."],
  ["¿Dónde reporto un evento que no es seguro?", "Escríbenos a hola@konbini.cl con el link. Los admins pueden banear cualquier contenido que viole las reglas."],
];

const TERMS: [string, string][] = [
  ["1. Sobre Konbini", "Konbini es un medio editorial y directorio de eventos operado en Chile. No vendemos entradas — conectamos personas con eventos y a organizadores con su audiencia."],
  ["2. Uso del servicio", "Al registrarte, declaras tener al menos 18 años y aceptas no publicar contenido que viole las leyes chilenas o derechos de terceros. Nos reservamos el derecho de banear contenido y cuentas que violen estas reglas."],
  ["3. Pagos y reembolsos", "Los pagos se procesan a través de pasarelas certificadas (WebPay y otras). Las publicaciones rechazadas no se cobran. Las publicaciones aprobadas no son reembolsables salvo error de Konbini."],
  ["4. Propiedad intelectual", "Los organizadores conservan los derechos sobre las imágenes y textos que suben. Al publicar, otorgan a Konbini licencia no exclusiva para mostrarlos en el sitio."],
  ["5. Limitación de responsabilidad", "Konbini no es responsable por el cumplimiento de los eventos publicados. La compra de entradas se hace en el sitio del organizador — cualquier disputa se resuelve directamente con quien organiza."],
  ["6. Modificaciones", "Podemos actualizar estos términos en cualquier momento. Te avisaremos por email si los cambios son materiales. El uso continuado del servicio implica aceptación de la nueva versión."],
];

const PRIVACY: [string, string][] = [
  ["1. Datos que recopilamos", "Email, nombre, país, y datos opcionales del perfil (avatar, bio, redes sociales). Para organizadores: nombre público y handle. Para pagos: el procesador (Transbank) maneja directamente los datos de tarjeta — Konbini nunca los almacena."],
  ["2. Para qué los usamos", "Operar el servicio (autenticación, notificaciones), proteger contra abuso, y enviarte comunicaciones de Konbini si lo aceptaste explícitamente al registrarte. Nunca vendemos ni compartimos tus datos con terceros para fines de marketing."],
  ["3. Tus derechos", "Puedes pedir copia de tus datos, corregirlos o eliminarlos en cualquier momento desde /cuenta. La eliminación es permanente e irreversible. La Ley 21.719 te respalda en estos derechos."],
  ["4. Cookies", "Usamos cookies esenciales para el funcionamiento del sitio, y analíticas si las aceptaste en el banner. Puedes cambiar tu preferencia desde el footer en cualquier momento."],
  ["5. Almacenamiento", "Tus datos se guardan en servidores en Chile. Los respaldos se cifran en reposo. Solo personal autorizado de Konbini puede acceder a información personal."],
  ["6. Cómo contactarnos", "Para ejercer cualquiera de tus derechos o reportar un incidente de datos personales, escríbenos a privacidad@konbini.cl. Te responderemos en máximo 30 días hábiles según la ley."],
];

const HELP_SECTIONS = [
  { id: "faq",     label: "Preguntas frecuentes" },
  { id: "terms",   label: "Términos y condiciones" },
  { id: "privacy", label: "Política de privacidad" },
  { id: "contact", label: "Contacto" },
] as const;
type HelpTab = (typeof HELP_SECTIONS)[number]["id"];

/* ─── Contact form ──────────────────────────────────── */
function ContactForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "Consulta general", message: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Nombre, email y mensaje son requeridos");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), subject: form.subject, message: form.message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "Error al enviar");
      }
      router.push("/gracias/contacto");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al enviar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 56, alignItems: "start" }}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Nombre <span style={{ color: "var(--err)" }}>*</span></label>
          <input type="text" placeholder="Tu nombre" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="field">
          <label>Email <span style={{ color: "var(--err)" }}>*</span></label>
          <input type="email" placeholder="tu@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
        <div className="field">
          <label>Asunto</label>
          <select value={form.subject} onChange={(e) => set("subject", e.target.value)}>
            <option>Consulta general</option>
            <option>Soporte técnico</option>
            <option>Quiero publicar un evento</option>
            <option>Servicio de fotografía</option>
            <option>Servicio de creadores de contenido</option>
            <option>Prensa / partnerships</option>
            <option>Reportar contenido</option>
          </select>
        </div>
        <div className="field">
          <label>Mensaje <span style={{ color: "var(--err)" }}>*</span></label>
          <textarea placeholder="Cuéntanos en qué te podemos ayudar" value={form.message} onChange={(e) => set("message", e.target.value)} style={{ minHeight: 140 }} required />
        </div>
        <button type="submit" className="btn primary lg" disabled={busy}>
          {busy ? "Enviando…" : "Enviar mensaje"} {!busy && "→"}
        </button>
      </form>

      <aside style={{ display: "flex", flexDirection: "column", gap: 28, paddingTop: 8 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 10 }}>EMAIL DIRECTO</div>
          <a href="mailto:hola@konbini.cl" style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-.01em", color: "var(--ink)", textDecoration: "none" }}>hola@konbini.cl</a>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>Respondemos en 48h hábiles</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 10 }}>RESPUESTA RÁPIDA</div>
          <a href="https://instagram.com/konbinishop.cl" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-2)", fontWeight: 600, textDecoration: "none" }}>
            {Ic.insta} @konbinishop.cl
          </a>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>DM en Instagram · 244K seguidores</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 10 }}>REPORTAR CONTENIDO</div>
          <a href="mailto:abuso@konbini.cl" style={{ color: "var(--ink-2)", fontFamily: "var(--font-mono)", fontSize: 14, textDecoration: "none" }}>abuso@konbini.cl</a>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>Para reportar contenido que viole las reglas</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 10 }}>OFICINA</div>
          <div style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Av. Providencia 1234<br />Of. 502, Providencia<br />Santiago, Chile
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ─── Main content ──────────────────────────────────── */
function AyudaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") as HelpTab) ?? "faq";

  return (
    <main className="container help-shell">
      <aside className="help-side">
        <div className="eyebrow" style={{ marginBottom: 16 }}>AYUDA · ヘルプ</div>
        <nav className="menu-h">
          {HELP_SECTIONS.map((s) => (
            <button
              key={s.id}
              className={tab === s.id ? "on" : ""}
              onClick={() => router.push(`/ayuda?tab=${s.id}`)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      <div>
        {tab === "faq" && (
          <>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, letterSpacing: "-.025em", margin: "0 0 8px" }}>
              Preguntas frecuentes
            </h1>
            <p style={{ color: "var(--ink-3)", marginBottom: 24 }}>Todo lo que la gente nos pregunta más seguido.</p>
            <div>
              {FAQS.map(([q, a], i) => (
                <details key={i} className="faq-item" open={i === 0}>
                  <summary>{q}</summary>
                  <div className="faq-a">{a}</div>
                </details>
              ))}
            </div>
          </>
        )}

        {tab === "terms" && (
          <>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, letterSpacing: "-.025em", margin: "0 0 8px" }}>
              Términos y condiciones
            </h1>
            <p style={{ color: "var(--ink-3)", marginBottom: 24, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: ".08em" }}>
              ÚLTIMA ACTUALIZACIÓN · 01 MAY 2026
            </p>
            <div>
              {TERMS.map(([s, body], i) => (
                <details key={i} className="faq-item" open={i === 0}>
                  <summary>{s}</summary>
                  <div className="faq-a">{body}</div>
                </details>
              ))}
            </div>
          </>
        )}

        {tab === "privacy" && (
          <>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, letterSpacing: "-.025em", margin: "0 0 8px" }}>
              Política de privacidad
            </h1>
            <p style={{ color: "var(--ink-3)", marginBottom: 24, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: ".08em" }}>
              CUMPLIMIENTO LEY 21.719 · CHILE
            </p>
            <div>
              {PRIVACY.map(([s, body], i) => (
                <details key={i} className="faq-item" open={i === 0}>
                  <summary>{s}</summary>
                  <div className="faq-a">{body}</div>
                </details>
              ))}
            </div>
          </>
        )}

        {tab === "contact" && (
          <>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 56, letterSpacing: "-.025em", margin: "0 0 12px", lineHeight: 1 }}>
              Conversemos.
            </h1>
            <p style={{ color: "var(--ink-2)", marginBottom: 36, fontSize: 17, maxWidth: "50ch", lineHeight: 1.55 }}>
              ¿Tienes una propuesta, consulta o quieres reportar algo? Escríbenos. Respondemos en menos de 48 horas hábiles.
            </p>
            <ContactForm />
          </>
        )}
      </div>
    </main>
  );
}

export default function AyudaPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--ink-3)" }}>Cargando…</div>}>
      <AyudaContent />
    </Suspense>
  );
}
