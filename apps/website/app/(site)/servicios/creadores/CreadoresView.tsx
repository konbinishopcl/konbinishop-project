"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ServiceOption } from "../fotografia/page";

interface CreadoresViewProps {
  options: ServiceOption[];
}

const DEFAULT_SERVICES = [
  "Reels para Instagram / TikTok",
  "Aftermovie del evento",
  "Cobertura en vivo (stories)",
  "Video resumen 60s",
  "Edición y subtítulos",
];

const PILLARS = [
  {
    ic: "🎬",
    t: "Edición creativa",
    d: "Reels y aftermovies con dirección estética, no plantillas genéricas. Adaptados al público otaku.",
  },
  {
    ic: "📱",
    t: "Cobertura multiplataforma",
    d: "Stories en vivo, reels para Instagram y TikTok, video resumen 60s y aftermovie 2-3 min — listo para subir.",
  },
  {
    ic: "🔥",
    t: "Sabemos qué pega",
    d: "Llevamos años creando contenido geek. Lo que producimos para tu evento se viraliza solo.",
  },
];

const STEPS = [
  ["Cotización", "Envías el formulario y te respondemos en menos de 24h con cotización a medida."],
  ["Brief creativo", "Conversamos el estilo, la narrativa y el tono — tu marca, nuestro toque."],
  ["Cobertura", "Producción en el evento: stories en vivo + grabación de material para edición."],
  ["Entrega", "Reels listos a las 48h. Aftermovie editado en 7-10 días. Todo subible directo."],
];

const STATS = [["40+", "EVENTOS"], ["200+", "REELS PUBLICADOS"], ["5M+", "VIEWS GENERADOS"]];

export function CreadoresView({ options }: CreadoresViewProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    eventName: "",
    eventDate: "",
    eventPlace: "",
  });
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const services = options.length > 0 ? options.map((o) => o.name) : DEFAULT_SERVICES;

  const toggleService = (s: string) =>
    setSelected((p) => ({ ...p, [s]: !p[s] }));

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.eventName.trim()) {
      toast.error("Nombre, email y nombre del evento son requeridos");
      return;
    }
    setBusy(true);
    try {
      const optionIds = options
        .filter((o) => selected[o.name])
        .map((o) => o.id);
      const res = await fetch("/api/services/content-creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          eventName: form.eventName.trim(),
          eventDate: form.eventDate || undefined,
          eventPlace: form.eventPlace.trim() || undefined,
          optionIds: optionIds.length > 0 ? optionIds : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "Error al enviar");
      }
      toast.success("Solicitud enviada. Te contactamos pronto.");
      router.push("/gracias/creadores");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al enviar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container">
      <div className="svc-hero">
        <div className="svc-hero-pic">
          <div className="pic" style={{ backgroundImage: "url('/images/svc/creadores-hero.jpg')" }} />
          <div className="hb">
            <div className="e">CREADORES · 動画</div>
            <h1>Contenido{"\n"}que se viraliza.</h1>
            <p>Reels, aftermovie y cobertura en redes para amplificar tu evento. Equipo creativo dedicado.</p>
          </div>
        </div>

        <form className="svc-form" onSubmit={handleSubmit}>
          <h2>Cotiza tu contenido</h2>
          <div className="sub">Te respondemos en menos de 24 horas.</div>

          <div className="field">
            <label>Nombre del organizador</label>
            <input type="text" placeholder="Tu nombre o empresa" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="field">
            <label>Nombre del evento</label>
            <input type="text" placeholder="Anime Crunchyroll Fest 2025" value={form.eventName} onChange={(e) => set("eventName", e.target.value)} required />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Fecha del evento</label>
              <input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
            </div>
            <div className="field">
              <label>Lugar</label>
              <input type="text" placeholder="Espacio Riesco, Huechuraba" value={form.eventPlace} onChange={(e) => set("eventPlace", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Email de contacto</label>
            <input type="email" placeholder="tu@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>

          <div className="field">
            <label style={{ marginBottom: 12 }}>Servicios que te interesan</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {services.map((s) => (
                <div key={s} className="ck-row" onClick={() => toggleService(s)}>
                  <span className={`ck ${selected[s] ? "on" : ""}`}>
                    {selected[s] && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span style={{ fontSize: 14 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn primary block lg" disabled={busy}>
            {busy ? "Enviando…" : "Enviar cotización →"}
          </button>
        </form>
      </div>

      {/* Diferenciadores */}
      <section style={{ margin: "32px 0 56px" }}>
        <div className="section-head">
          <div className="sh-title">Lo que hacemos diferente</div>
          <div className="sh-ja">違い</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 14 }}>
          {PILLARS.map((p) => (
            <div key={p.t} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 28 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 14 }}>
                {p.ic}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", marginBottom: 6 }}>{p.t}</div>
              <div style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>{p.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-xl)", padding: 56, margin: "0 0 56px" }}>
        <div className="section-head">
          <div className="sh-title">Cómo funciona</div>
          <div className="sh-ja">しくみ</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 28, marginTop: 14 }}>
          {STEPS.map((s, i) => (
            <div key={s[0]} style={{ position: "relative" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 800, letterSpacing: "-.04em", color: "var(--accent)", lineHeight: 1, marginBottom: 12, opacity: 0.35 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, letterSpacing: "-.01em", marginBottom: 6 }}>{s[0]}</div>
              <div style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>{s[1]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", margin: "0 0 56px", border: "1px solid var(--line)", borderRadius: "var(--r-xl)", overflow: "hidden", background: "var(--surface-2)" }}>
        {STATS.map((s, i) => (
          <div key={s[1]} style={{ padding: "40px 32px", borderRight: i < STATS.length - 1 ? "1px solid var(--line)" : 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 64, fontWeight: 700, letterSpacing: "-.03em", lineHeight: 1, marginBottom: 8, color: "var(--ink)" }}>{s[0]}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".18em", color: "var(--ink-3)" }}>{s[1]}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
