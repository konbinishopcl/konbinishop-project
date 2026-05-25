"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const FAQS = [
  { q: "¿Cómo publico un evento?", a: "Ve a Crear evento, rellena el formulario con los datos de tu evento y haz clic en Enviar. Un admin revisará tu evento en menos de 24 horas." },
  { q: "¿Cuánto cuesta publicar?", a: "Desde $4.990 CLP por día. Puedes elegir entre 10 y 60 días de visibilidad. También existe una suscripción mensual de $29.990 con 10 créditos de publicación." },
  { q: "¿Cómo me registro?", a: "Haz clic en Ingresar y completa el formulario de registro. Recibirás un email de confirmación." },
  { q: "¿Puedo editar mi evento después de publicarlo?", a: "Una vez aprobado, no se puede editar. Te recomendamos revisar bien antes de enviar. Para cambios urgentes, contáctanos." },
  { q: "¿Cómo recupero mi contraseña?", a: "En la pantalla de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?' y sigue las instrucciones." },
  { q: "¿Qué es un Aviso?", a: "Un Aviso es un banner pagado que aparece en el home y al final de las categorías. Máximo 12 simultáneos. Precio desde $8.000 CLP/día." },
  { q: "¿Qué es una Portada?", a: "Una Portada es una imagen de fondo del carrusel principal del home. Máximo 5 simultáneas. Precio desde $15.000 CLP/día." },
];

function ContactForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

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
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim() || undefined,
          message: form.message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "Error al enviar");
      }
      toast.success("Mensaje enviado. Te respondemos pronto.");
      router.push("/gracias/contacto");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al enviar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
      <div className="field">
        <label>Nombre</label>
        <input type="text" placeholder="Tu nombre" value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" placeholder="tu@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
      </div>
      <div className="field">
        <label>Asunto <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(opcional)</span></label>
        <input type="text" placeholder="¿En qué te podemos ayudar?" value={form.subject} onChange={(e) => set("subject", e.target.value)} />
      </div>
      <div className="field">
        <label>Mensaje</label>
        <textarea
          placeholder="Cuéntanos con detalle…"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          style={{ minHeight: 120 }}
          required
        />
      </div>
      <button type="submit" className="btn primary" disabled={busy}>
        {busy ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  );
}

function AyudaContent() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as "faq" | "contact") ?? "faq";
  const router = useRouter();

  return (
    <main className="container" style={{ paddingBottom: 80 }}>
      <div style={{ padding: "36px 0 24px" }}>
        <div className="eyebrow">AYUDA · ヘルプ</div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(36px,4vw,56px)",
            letterSpacing: "-.025em",
            margin: "12px 0 0",
          }}
        >
          Centro de ayuda
        </h1>
      </div>

      {/* Tabs */}
      <div className="org-tabs" style={{ marginBottom: 32 }}>
        <button
          className={tab === "faq" ? "on" : ""}
          onClick={() => router.push("/ayuda?tab=faq")}
        >
          Preguntas frecuentes
        </button>
        <button
          className={tab === "contact" ? "on" : ""}
          onClick={() => router.push("/ayuda?tab=contact")}
        >
          Contactar
        </button>
      </div>

      {tab === "faq" && (
        <div>
          {FAQS.map((item, i) => (
            <details key={i} className="faq-item" open={i === 0}>
              <summary>{item.q}</summary>
              <div className="faq-a">{item.a}</div>
            </details>
          ))}
        </div>
      )}

      {tab === "contact" && (
        <div>
          <p style={{ color: "var(--ink-2)", marginBottom: 28, maxWidth: "56ch", lineHeight: 1.6 }}>
            ¿No encontraste lo que buscabas? Escríbenos y te respondemos en menos de 24 horas hábiles.
          </p>
          <ContactForm />
        </div>
      )}
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
