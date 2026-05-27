"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ic } from "@/components/icons";
import { useUser } from "@/components/providers";

/* ─── SpotForm ───────────────────────────────────────────────────────────── */
function SpotForm({ onAdd, onCancel }: { onAdd: () => void; onCancel: () => void }) {
  const { token } = useUser();
  const [busy, setBusy] = useState(false);
  const [linkType, setLinkType] = useState<"url" | "internal" | "email" | "tel">("url");
  const [days, setDays] = useState(14);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [buttonText, setButtonText] = useState("");

  const linkPlaceholder = linkType === "url" ? "tu-sitio.cl/oferta" : linkType === "internal" ? "@cinepolis" : linkType === "email" ? "ventas@tu-sitio.cl" : "+56 9 1234 5678";
  const linkPrefix = linkType === "url" ? "https://" : linkType === "internal" ? "konbini.cl/" : linkType === "email" ? "✉" : "☎";
  const btnPlaceholder = linkType === "url" ? "Ver oferta" : linkType === "email" ? "Escribir" : linkType === "tel" ? "Llamar" : "Ver";

  const handleAdd = async () => {
    if (!title.trim()) { toast.error("El título es requerido"); return; }
    if (!linkValue.trim()) { toast.error("El enlace del CTA es requerido"); return; }
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/spots", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined, linkType, linkValue: linkValue.trim(), buttonText: buttonText.trim() || undefined, days }),
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
        <label>Título del aviso <span style={{ color: "var(--err)" }}>*</span></label>
        <input type="text" placeholder="Ej: Cosplay Premium Atelier — Descuento" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="help">Aparece en la card del aviso, máx 60 caracteres.</div>
      </div>
      <div className="field">
        <label>Descripción corta</label>
        <input type="text" placeholder="Texto breve que acompaña al título" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="field">
        <label>Imagen del aviso <span style={{ color: "var(--err)" }}>*</span></label>
        <div className="upload-box" style={{ aspectRatio: "4/5" }}>
          <div className="ic">{Ic.upl}</div>
          <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>Sube una imagen</div>
          <small>JPG / PNG · 1200×1500 mín · máx 5MB</small>
        </div>
      </div>
      <div className="field">
        <label>Tipo de enlace del CTA <span style={{ color: "var(--err)" }}>*</span></label>
        <div className="pill-pick">
          <button type="button" className={linkType === "url" ? "on" : ""} onClick={() => setLinkType("url")}>URL externa</button>
          <button type="button" className={linkType === "internal" ? "on" : ""} onClick={() => setLinkType("internal")}>URL interna</button>
          <button type="button" className={linkType === "email" ? "on" : ""} onClick={() => setLinkType("email")}>Email</button>
          <button type="button" className={linkType === "tel" ? "on" : ""} onClick={() => setLinkType("tel")}>Teléfono</button>
        </div>
      </div>
      <div className="field">
        <label>
          {linkType === "url" ? "URL externa" : linkType === "internal" ? "Ruta interna" : linkType === "email" ? "Email" : "Teléfono"}
          {" "}<span style={{ color: "var(--err)" }}>*</span>
        </label>
        <div className="input-prefix">
          <span>{linkPrefix}</span>
          <input
            type={linkType === "email" ? "email" : linkType === "tel" ? "tel" : "text"}
            placeholder={linkPlaceholder}
            value={linkValue}
            onChange={e => setLinkValue(e.target.value)}
          />
        </div>
        <div className="help">El botón del aviso cambia su ícono y texto según el tipo de enlace.</div>
      </div>
      <div className="field">
        <label>Texto del botón</label>
        <input type="text" placeholder={btnPlaceholder} value={buttonText} onChange={e => setButtonText(e.target.value)} />
      </div>
      <div className="field">
        <label>Días de publicación <span style={{ color: "var(--err)" }}>*</span></label>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <input type="range" min={10} max={30} value={days} onChange={e => setDays(Number(e.target.value))} style={{ flex: 1 }} />
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, minWidth: 80, textAlign: "right" }}>{days} días</div>
        </div>
        <div className="help">Mínimo 10, máximo 30 · $8.000 CLP / día → <strong>${(days * 8000).toLocaleString("es-CL")} CLP total</strong></div>
      </div>
      <div className="ups-cta-row" style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
        <button className="btn primary" onClick={handleAdd} disabled={busy}>{busy ? "Agregando…" : <>Agregar aviso al carrito {Ic.arrow}</>}</button>
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
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [lead, setLead] = useState("");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [link, setLink] = useState("");

  const handleAdd = async () => {
    if (!title.trim()) { toast.error("El título es requerido"); return; }
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/heroes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), subtitle: subtitle.trim() || undefined, lead: lead.trim() || undefined, date: date.trim() || undefined, place: place.trim() || undefined, link: link.trim() || undefined, days }),
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
      <div className="field">
        <label>Título principal <span style={{ color: "var(--err)" }}>*</span></label>
        <input type="text" placeholder="Ej: Demon Slayer" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="help">La parte grande del título en el carrusel.</div>
      </div>
      <div className="field">
        <label>Subtítulo en color de acento</label>
        <input type="text" placeholder="Ej: Infinity Castle" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
        <div className="help">Se muestra en rojo bajo el título principal. Opcional.</div>
      </div>
      <div className="field">
        <label>Descripción corta</label>
        <textarea placeholder="2-3 líneas que acompañan al título" style={{ minHeight: 80 }} value={lead} onChange={e => setLead(e.target.value)} />
      </div>
      <div className="field">
        <label>Imagen de fondo (pantalla completa) <span style={{ color: "var(--err)" }}>*</span></label>
        <div className="upload-box" style={{ aspectRatio: "21/9" }}>
          <div className="ic">{Ic.upl}</div>
          <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>Sube imagen horizontal</div>
          <small>JPG · 2400×1080 mín · máx 8MB · sin texto</small>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>Fecha a mostrar</label>
          <input type="text" placeholder="9–12 MAY 2025" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Lugar a mostrar</label>
          <input type="text" placeholder="Estación Mapocho" value={place} onChange={e => setPlace(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>URL de destino al hacer clic</label>
        <div className="input-prefix">
          <span>https://</span>
          <input type="text" placeholder="konbini.cl/evento/mi-evento" value={link} onChange={e => setLink(e.target.value)} />
        </div>
        <div className="help">Si no la pones, el carrusel solo muestra el banner sin link.</div>
      </div>
      <div className="field">
        <label>Días de publicación <span style={{ color: "var(--err)" }}>*</span></label>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <input type="range" min={10} max={30} value={days} onChange={e => setDays(Number(e.target.value))} style={{ flex: 1 }} />
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, minWidth: 80, textAlign: "right" }}>{days} días</div>
        </div>
        <div className="help">Mínimo 10, máximo 30 · $15.000 CLP / día → <strong>${(days * 15000).toLocaleString("es-CL")} CLP total</strong></div>
      </div>
      <div className="ups-cta-row" style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
        <button className="btn primary" onClick={handleAdd} disabled={busy}>{busy ? "Agregando…" : <>Agregar portada al carrito {Ic.arrow}</>}</button>
        <button className="btn ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}

/* ─── UpsellView ─────────────────────────────────────────────────────────── */
export function UpsellView() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState<{ spot?: boolean; hero?: boolean }>({});

  const advance = (n: number) => setStep(n + 1);
  const goCart = () => router.push("/carrito");

  return (
    <main className="ups-shell">
      {/* Banner éxito */}
      <div style={{ background: "color-mix(in oklab, var(--ok) 8%, var(--surface))", border: "1px solid color-mix(in oklab, var(--ok) 30%, var(--line))", borderRadius: "var(--r-xl)", padding: 28, marginBottom: 18, display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, background: "var(--ok)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
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
          <div className="body">
            {!open.spot ? (
              <>
                <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 16, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontWeight: 600 }}>Precio</div><div style={{ color: "var(--ink-3)", fontSize: 12 }}>10 días mínimo, 30 máximo</div></div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700 }}>$8.000 / día</div>
                </div>
                <div className="ups-cta-row">
                  <button className="btn primary" onClick={() => setOpen({ ...open, spot: true })}>Sí, agregar aviso</button>
                  <button className="btn ghost" onClick={() => advance(1)}>No, gracias — siguiente</button>
                </div>
              </>
            ) : (
              <SpotForm onAdd={() => advance(1)} onCancel={() => setOpen({ ...open, spot: false })} />
            )}
          </div>
        )}
      </div>

      {/* PASO 2: PORTADA */}
      <div className={`ups-step ${step > 2 ? "done" : ""}`} style={step < 2 ? { opacity: 0.35, pointerEvents: "none" } : undefined}>
        <div className="num">PASO 2 / 3 · OPCIONAL</div>
        <h2>¿Quieres agregar una portada?</h2>
        <p className="av">Aparición en el carrusel principal del home. Cupo: 3 / 5 ocupados — escasez de verdad.</p>
        {step === 2 && (
          <div className="body">
            {!open.hero ? (
              <>
                <div style={{ background: "var(--surface-2)", borderRadius: 12, padding: 16, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontWeight: 600 }}>Precio</div><div style={{ color: "var(--ink-3)", fontSize: 12 }}>10 días mínimo, 30 máximo</div></div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700 }}>$15.000 / día</div>
                </div>
                <div className="ups-cta-row">
                  <button className="btn primary" onClick={() => setOpen({ ...open, hero: true })}>Sí, agregar portada</button>
                  <button className="btn ghost" onClick={() => advance(2)}>No, gracias — siguiente</button>
                </div>
              </>
            ) : (
              <HeroForm onAdd={() => advance(2)} onCancel={() => setOpen({ ...open, hero: false })} />
            )}
          </div>
        )}
      </div>

      {/* PASO 3: ARTÍCULO */}
      <div className={`ups-step ${step > 3 ? "done" : ""}`} style={step < 3 ? { opacity: 0.35, pointerEvents: "none" } : undefined}>
        <div className="num">PASO 3 / 3 · OPCIONAL</div>
        <h2>¿Quieres un artículo patrocinado?</h2>
        <p className="av">Konbini revisa, edita y publica con su estilo editorial. El evento aparece destacado en el bloque de relacionados del artículo. Sin cupo limitado.</p>
        {step === 3 && (
          <div className="body">
            <div className="ups-cta-row">
              <button className="btn primary" onClick={() => router.push("/crear-articulo")}>Sí, agregar artículo</button>
              <button className="btn ghost" onClick={goCart}>No, gracias — ir al carrito</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
