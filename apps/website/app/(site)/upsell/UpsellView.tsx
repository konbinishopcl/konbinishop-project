"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Ic } from "@/components/icons";
import { api, imageUrl } from "@/lib/api";
import { useUser } from "@/components/providers";

/* ─── Zod Schemas ───────────────────────────────────────────────────────────── */
const SpotSchema = z.object({
  title:     z.string().trim().min(2, "Mínimo 2 caracteres").max(120, "Máximo 120 caracteres"),
  image:     z.string().min(1, "La imagen es requerida"),
  linkType:  z.enum(["URL", "EMAIL", "PHONE"]),
  linkValue: z.string().trim().min(3, "El enlace es requerido"),
});

const HeroSchema = z.object({
  title:       z.string().trim().min(2, "Mínimo 2 caracteres").max(120, "Máximo 120 caracteres"),
  titleAccent: z.string().trim().max(120, "Máximo 120 caracteres").optional(),
  lead:        z.string().trim().max(240, "Máximo 240 caracteres").optional(),
  image:       z.string().min(3, "La imagen es requerida"),
  link:        z.string().trim().optional(),
});

/* ─── SpotForm ───────────────────────────────────────────────────────────── */
function SpotForm({ onAdd, onCancel }: { onAdd: () => void; onCancel: () => void }) {
  const { token } = useUser();
  const [busy, setBusy] = useState(false);
  const [linkType, setLinkType] = useState<"url" | "email" | "tel">("url");
  const [days, setDays] = useState(14);
  const [title, setTitle] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const linkPlaceholder = linkType === "url" ? "tu-sitio.cl/oferta" : linkType === "email" ? "ventas@tu-sitio.cl" : "+56 9 1234 5678";
  const linkPrefix = linkType === "url" ? "https://" : linkType === "email" ? "✉" : "☎";

  const handlePick = async (file: File) => {
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    setUploading(true);
    try { const { url } = await api.uploadImage(file, token); setImage(url); }
    catch (ex) { toast.error(ex instanceof Error ? ex.message : "Error al subir imagen"); }
    finally { setUploading(false); }
  };

  const handleAdd = async () => {
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    const LINK_MAP = { url: "URL", email: "EMAIL", tel: "PHONE" } as const;
    const parsed = SpotSchema.safeParse({ title, image, linkType: LINK_MAP[linkType], linkValue });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const created = await api.createSpot({
        title: parsed.data.title, image: parsed.data.image,
        linkType: parsed.data.linkType, linkValue: parsed.data.linkValue,
      }, token);
      const draft = await fetch("/api/orders/draft", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      const addRes = await fetch(`/api/orders/${draft.id}/items`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SPOT", spotId: created.id, days }),
      });
      if (!addRes.ok) { const e = await addRes.json().catch(() => ({})); throw new Error((e as { message?: string }).message ?? "Error al agregar al carrito"); }
      toast.success("Aviso agregado al carrito");
      onAdd();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error");
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="field">
        <label>Título del aviso <span style={{ color: "var(--err)" }}>*</span></label>
        <input type="text" placeholder="Ej: Cosplay Premium Atelier — Descuento" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="help">Aparece en la card del aviso, máx 60 caracteres.</div>
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>
      <div className="field">
        <label>Imagen del aviso <span style={{ color: "var(--err)" }}>*</span></label>
        <div className="upload-box" onClick={() => fileRef.current?.click()} style={{ aspectRatio: "4/5" }}>
          {image ? (<img src={imageUrl(image)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />)
                 : (<><div className="ic">{Ic.upl}</div><div style={{ fontWeight: 500, color: "var(--ink-2)" }}>{uploading ? "Subiendo…" : "Sube una imagen"}</div><small>JPG / PNG · máx 5MB</small></>)}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePick(f); e.target.value = ""; }} />
        {errors.image && <p className="field-error">{errors.image}</p>}
      </div>
      <div className="field">
        <label>Tipo de enlace del CTA <span style={{ color: "var(--err)" }}>*</span></label>
        <div className="pill-pick">
          <button type="button" className={linkType === "url" ? "on" : ""} onClick={() => setLinkType("url")}>URL externa</button>
          <button type="button" className={linkType === "email" ? "on" : ""} onClick={() => setLinkType("email")}>Email</button>
          <button type="button" className={linkType === "tel" ? "on" : ""} onClick={() => setLinkType("tel")}>Teléfono</button>
        </div>
      </div>
      <div className="field">
        <label>
          {linkType === "url" ? "URL externa" : linkType === "email" ? "Email" : "Teléfono"}
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
        {errors.linkValue && <p className="field-error">{errors.linkValue}</p>}
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
        <button className="btn primary" onClick={handleAdd} disabled={busy || uploading}>{busy ? "Agregando…" : <>Agregar aviso al carrito {Ic.arrow}</>}</button>
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
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePick = async (file: File) => {
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    setUploading(true);
    try { const { url } = await api.uploadImage(file, token); setImage(url); }
    catch (ex) { toast.error(ex instanceof Error ? ex.message : "Error al subir imagen"); }
    finally { setUploading(false); }
  };

  const handleAdd = async () => {
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    const parsed = HeroSchema.safeParse({
      title, titleAccent: subtitle || undefined, lead: lead || undefined, image, link: link || undefined,
    });
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const i of parsed.error.issues) fe[String(i.path[0])] = i.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const created = await api.createHero({
        title: parsed.data.title,
        titleAccent: parsed.data.titleAccent,
        lead: parsed.data.lead,
        image: parsed.data.image,
        date: date.trim() || undefined,
        place: place.trim() || undefined,
        link: parsed.data.link,
      }, token);
      const draft = await fetch("/api/orders/draft", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      const addRes = await fetch(`/api/orders/${draft.id}/items`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "HERO", heroId: created.id, days }),
      });
      if (!addRes.ok) { const e = await addRes.json().catch(() => ({})); throw new Error((e as { message?: string }).message ?? "Error al agregar al carrito"); }
      toast.success("Portada agregada al carrito");
      onAdd();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error");
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="field">
        <label>Título principal <span style={{ color: "var(--err)" }}>*</span></label>
        <input type="text" placeholder="Ej: Demon Slayer" value={title} onChange={e => setTitle(e.target.value)} />
        <div className="help">La parte grande del título en el carrusel.</div>
        {errors.title && <p className="field-error">{errors.title}</p>}
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
        <div className="upload-box" onClick={() => fileRef.current?.click()} style={{ aspectRatio: "21/9" }}>
          {image ? (<img src={imageUrl(image)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />)
                 : (<><div className="ic">{Ic.upl}</div><div style={{ fontWeight: 500, color: "var(--ink-2)" }}>{uploading ? "Subiendo…" : "Sube imagen horizontal"}</div><small>JPG · 2400×1080 mín · máx 8MB · sin texto</small></>)}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePick(f); e.target.value = ""; }} />
        {errors.image && <p className="field-error">{errors.image}</p>}
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
        <button className="btn primary" onClick={handleAdd} disabled={busy || uploading}>{busy ? "Agregando…" : <>Agregar portada al carrito {Ic.arrow}</>}</button>
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
