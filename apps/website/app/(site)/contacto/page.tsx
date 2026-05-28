"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HelpShell } from "@/components/HelpShell";
import { Ic } from "@/components/icons";
import { CONTACT_EMAIL, ABUSE_EMAIL, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/lib/site";

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
          <a href={`mailto:${CONTACT_EMAIL}`} style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: "-.01em", color: "var(--ink)", textDecoration: "none" }}>{CONTACT_EMAIL}</a>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>Respondemos en 48h hábiles</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 10 }}>RESPUESTA RÁPIDA</div>
          <a href={INSTAGRAM_URL} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-2)", fontWeight: 600, textDecoration: "none" }}>
            {Ic.insta} {INSTAGRAM_HANDLE}
          </a>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>DM en Instagram · 244K seguidores</div>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 10 }}>REPORTAR CONTENIDO</div>
          <a href={`mailto:${ABUSE_EMAIL}`} style={{ color: "var(--ink-2)", fontFamily: "var(--font-mono)", fontSize: 14, textDecoration: "none" }}>{ABUSE_EMAIL}</a>
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

export default function ContactoPage() {
  return (
    <HelpShell>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 56, letterSpacing: "-.025em", margin: "0 0 12px", lineHeight: 1 }}>
        Conversemos.
      </h1>
      <p style={{ color: "var(--ink-2)", marginBottom: 36, fontSize: 17, maxWidth: "50ch", lineHeight: 1.55 }}>
        ¿Tienes una propuesta, consulta o quieres reportar algo? Escríbenos. Respondemos en menos de 48 horas hábiles.
      </p>
      <ContactForm />
    </HelpShell>
  );
}
