"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

/* ─── SpotForm ───────────────────────────────────────────────────────────── */
function SpotForm({ onAdd, onCancel }: { onAdd: () => void; onCancel: () => void }) {
  const { token } = useUser();
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(14);
  const [form, setForm] = useState({ title: "", description: "", linkValue: "", buttonText: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/spots", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          linkValue: form.linkValue.trim() || undefined,
          buttonText: form.buttonText.trim() || undefined,
          days,
        }),
      });
      if (!res.ok) throw new Error("Error al crear aviso");
      toast.success("Aviso agregado al carrito");
      onAdd();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="field">
        <label>Título del aviso</label>
        <input type="text" placeholder="Ej: Konbini Fest 2025" value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="field">
        <label>Descripción <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(opcional)</span></label>
        <textarea placeholder="Breve descripción del aviso" value={form.description} onChange={(e) => set("description", e.target.value)} style={{ minHeight: 80 }} />
      </div>
      <div className="grid-2">
        <div className="field" style={{ margin: 0 }}>
          <label>URL de destino</label>
          <input type="url" placeholder="https://tu-evento.cl" value={form.linkValue} onChange={(e) => set("linkValue", e.target.value)} />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Texto del botón</label>
          <input type="text" placeholder="Ver evento" value={form.buttonText} onChange={(e) => set("buttonText", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Días de publicación: <strong>{days}</strong> días · ${(8000 * days).toLocaleString("es-CL")} CLP</label>
        <input type="range" min={10} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: "100%" }} />
      </div>
      <div className="ups-cta-row" style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
        <button className="btn primary" onClick={handleAdd} disabled={busy}>{busy ? "Agregando…" : "Agregar aviso al carrito →"}</button>
        <button className="btn ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

/* ─── HeroForm ───────────────────────────────────────────────────────────── */
function HeroForm({ onAdd, onCancel }: { onAdd: () => void; onCancel: () => void }) {
  const { token } = useUser();
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(14);
  const [form, setForm] = useState({ title: "", subtitle: "", lead: "", date: "", place: "", link: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/heroes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || undefined,
          lead: form.lead.trim() || undefined,
          date: form.date.trim() || undefined,
          place: form.place.trim() || undefined,
          link: form.link.trim() || undefined,
          days,
        }),
      });
      if (!res.ok) throw new Error("Error al crear portada");
      toast.success("Portada agregada al carrito");
      onAdd();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="grid-2">
        <div className="field" style={{ margin: 0 }}>
          <label>Título</label>
          <input type="text" placeholder="Konbini Fest" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Subtítulo <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(accent)</span></label>
          <input type="text" placeholder="2025" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Lead / descripción corta</label>
        <input type="text" placeholder="El evento más grande del año" value={form.lead} onChange={(e) => set("lead", e.target.value)} />
      </div>
      <div className="grid-2">
        <div className="field" style={{ margin: 0 }}>
          <label>Fecha</label>
          <input type="text" placeholder="15 nov 2025" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label>Lugar</label>
          <input type="text" placeholder="Movistar Arena" value={form.place} onChange={(e) => set("place", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>URL del evento</label>
        <input type="url" placeholder="https://konbini.cl/evento/..." value={form.link} onChange={(e) => set("link", e.target.value)} />
      </div>
      <div className="field">
        <label>Días de publicación: <strong>{days}</strong> días · ${(15000 * days).toLocaleString("es-CL")} CLP</label>
        <input type="range" min={10} max={30} value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: "100%" }} />
      </div>
      <div className="ups-cta-row" style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
        <button className="btn primary" onClick={handleAdd} disabled={busy}>{busy ? "Agregando…" : "Agregar portada al carrito →"}</button>
        <button className="btn ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

/* ─── ArticleForm ────────────────────────────────────────────────────────── */
function ArticleForm({ onAdd, onCancel }: { onAdd: () => void; onCancel: () => void }) {
  const { token } = useUser();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", brief: "" });
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = async () => {
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title.trim(), content: form.brief.trim() || undefined, isSponsored: true }),
      });
      if (!res.ok) throw new Error("Error al crear artículo");
      toast.success("Artículo patrocinado agregado al carrito");
      onAdd();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="field">
        <label>Título del artículo</label>
        <input type="text" placeholder="Konbini Fest 2025: todo lo que necesitas saber" value={form.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="field">
        <label>Brief <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>(opcional)</span></label>
        <textarea placeholder="Cuéntanos el ángulo: artistas, actividades, público objetivo…" value={form.brief} onChange={(e) => set("brief", e.target.value)} style={{ minHeight: 120 }} />
      </div>
      <p style={{ color: "var(--ink-3)", fontSize: 12, lineHeight: 1.55 }}>
        Konbini revisa, edita y publica con su estilo editorial. El evento aparece destacado en el bloque de relacionados. Sin cupo limitado.
      </p>
      <div className="ups-cta-row" style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
        <button className="btn primary" onClick={handleAdd} disabled={busy}>{busy ? "Agregando…" : "Agregar artículo al carrito →"}</button>
        <button className="btn ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

/* ─── StepBody helper ────────────────────────────────────────────────────── */
function StepBody({
  priceInfo,
  formContent,
  onSkip,
  skipLabel = "No, gracias — siguiente",
}: {
  priceInfo?: string;
  formContent: (onCancel: () => void) => React.ReactNode;
  onSkip: () => void;
  skipLabel?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  return (
    <div className="body">
      {!showForm ? (
        <>
          {priceInfo && (
            <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 16, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>Precio</div>
                <div style={{ color: "var(--ink-3)", fontSize: 12 }}>10 días mínimo, 30 máximo</div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700 }}>{priceInfo}</div>
            </div>
          )}
          <div className="ups-cta-row">
            <button className="btn primary" onClick={() => setShowForm(true)}>Sí, quiero agregarlo</button>
            <button className="btn ghost" onClick={onSkip}>{skipLabel}</button>
          </div>
        </>
      ) : (
        formContent(() => setShowForm(false))
      )}
    </div>
  );
}

/* ─── UpsellView ─────────────────────────────────────────────────────────── */
export function UpsellView() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const advance = () => setStep((s) => s + 1);
  const goCart = () => router.push("/carrito");

  return (
    <main className="ups-shell">
      {/* Banner de éxito */}
      <div style={{ background: "color-mix(in oklab, var(--ok) 8%, var(--surface))", border: "1px solid color-mix(in oklab, var(--ok) 30%, var(--line))", borderRadius: "var(--r-xl)", padding: 28, marginBottom: 18, display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--ok)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 56px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>Tu evento está listo para publicar</div>
          <div style={{ color: "var(--ink-2)", fontSize: 14, marginTop: 2 }}>Antes de pagar, te ofrecemos 3 productos opcionales para amplificar tu evento.</div>
        </div>
      </div>

      {/* PASO 1: AVISO */}
      <div className={`ups-step ${step > 1 ? "done" : ""}`}>
        <div className="num">PASO 1 / 3 · OPCIONAL</div>
        <h2>¿Quieres agregar un aviso?</h2>
        <p className="av">Banner pagado en home y al final de todas las páginas de categoría. Cupo: 9 / 12 ocupados.</p>
        {step === 1 && (
          <StepBody
            priceInfo="$8.000 / día"
            formContent={(onCancel) => <SpotForm onAdd={advance} onCancel={onCancel} />}
            onSkip={advance}
          />
        )}
      </div>

      {/* PASO 2: PORTADA */}
      <div className={`ups-step ${step > 2 ? "done" : ""}`} style={step < 2 ? { opacity: 0.35, pointerEvents: "none" } : undefined}>
        <div className="num">PASO 2 / 3 · OPCIONAL</div>
        <h2>¿Quieres agregar una portada?</h2>
        <p className="av">Aparición en el carrusel principal del home. Cupo: 3 / 5 ocupados — escasez de verdad.</p>
        {step === 2 && (
          <StepBody
            priceInfo="$15.000 / día"
            formContent={(onCancel) => <HeroForm onAdd={advance} onCancel={onCancel} />}
            onSkip={advance}
          />
        )}
      </div>

      {/* PASO 3: ARTÍCULO */}
      <div className={`ups-step ${step > 3 ? "done" : ""}`} style={step < 3 ? { opacity: 0.35, pointerEvents: "none" } : undefined}>
        <div className="num">PASO 3 / 3 · OPCIONAL</div>
        <h2>¿Quieres un artículo patrocinado?</h2>
        <p className="av">Konbini revisa, edita y publica con su estilo editorial. El evento aparece destacado en el bloque de relacionados del artículo. Sin cupo limitado.</p>
        {step === 3 && (
          <StepBody
            formContent={(onCancel) => <ArticleForm onAdd={goCart} onCancel={onCancel} />}
            onSkip={goCart}
            skipLabel="No, gracias — ir al carrito"
          />
        )}
      </div>
    </main>
  );
}
