"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useUser } from "@/components/providers";
import { api, imageUrl } from "@/lib/api";
import { Ic } from "@/components/icons";

type Kind = "spot" | "hero" | "articulo";

interface CreateProductViewProps {
  kind: Kind;
}

const TITLES: Record<Kind, [string, string]> = {
  spot:     ["Crear aviso",                  "Aparición en home y al final de las categorías. Cupo: 9 / 12."],
  hero:     ["Crear portada",                "Aparición en el carrusel principal del home. Cupo: 3 / 5."],
  articulo: ["Solicitar artículo patrocinado","Konbini escribirá y publicará el artículo según el contenido que entregues."],
};

const EYEBROW: Record<Kind, string> = {
  spot:     "AVISO · 広告",
  hero:     "PORTADA · 表紙",
  articulo: "ARTÍCULO · 記事",
};

const BACK_HREF: Record<Kind, string> = {
  spot:     "/cuenta/mis-avisos",
  hero:     "/cuenta/mis-portadas",
  articulo: "/cuenta/articulos",
};

const PRICE: Record<Kind, number | null> = {
  spot:     8000,
  hero:     15000,
  articulo: null,
};

/* ── Zod schemas (module scope) ─────────────────────────────────────────── */

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

const LINK_MAP = { url: "URL", email: "EMAIL", tel: "PHONE" } as const;

export function CreateProductView({ kind }: CreateProductViewProps) {
  const router = useRouter();
  const { token } = useUser();
  const [busy, setBusy]   = useState(false);
  const [days, setDays]   = useState(14);

  /* ── Shared upload/error state ──────────────────────────────────────────── */
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  /* ── Spot state ─────────────────────────────────────────────────────────── */
  const [spotTitle, setSpotTitle]         = useState("");
  const [spotLinkType, setSpotLinkType]   = useState<"url" | "email" | "tel">("url");
  const [spotLinkValue, setSpotLinkValue] = useState("");
  const [spotImage, setSpotImage]         = useState("");
  const spotFileRef                        = useRef<HTMLInputElement>(null);

  const spotLinkPrefix      = spotLinkType === "url" ? "https://" : spotLinkType === "email" ? "✉" : "☎";
  const spotLinkPlaceholder = spotLinkType === "url" ? "tu-sitio.cl/oferta" : spotLinkType === "email" ? "ventas@empresa.cl" : "+56 9 1234 5678";

  /* ── Hero state ─────────────────────────────────────────────────────────── */
  const [heroTitle, setHeroTitle]     = useState("");
  const [heroSubtitle, setHeroSub]    = useState("");
  const [heroLead, setHeroLead]       = useState("");
  const [heroDate, setHeroDate]       = useState("");
  const [heroPlace, setHeroPlace]     = useState("");
  const [heroLink, setHeroLink]       = useState("");
  const [heroImage, setHeroImage]     = useState("");
  const heroFileRef                    = useRef<HTMLInputElement>(null);

  /* ── Article state ──────────────────────────────────────────────────────── */
  const [artTitle, setArtTitle]     = useState("");
  const [artContent, setArtContent] = useState("");
  const [artVideo, setArtVideo]     = useState("");

  /* ── Image upload handler ───────────────────────────────────────────────── */
  const handlePickSpot = async (file: File) => {
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file, token);
      setSpotImage(url);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al subir imagen");
    } finally { setUploading(false); }
  };

  const handlePickHero = async (file: File) => {
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file, token);
      setHeroImage(url);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al subir imagen");
    } finally { setUploading(false); }
  };

  /* ── Handlers ───────────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    setBusy(true);
    try {
      if (kind === "spot") {
        const parsed = SpotSchema.safeParse({
          title: spotTitle,
          image: spotImage,
          linkType: LINK_MAP[spotLinkType],
          linkValue: spotLinkValue,
        });
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
          setErrors(fieldErrors);
          setBusy(false);
          return;
        }
        setErrors({});
        // 1) create spot in DRAFT — NO days here
        const created = await api.createSpot({
          title: parsed.data.title,
          image: parsed.data.image,
          linkType: parsed.data.linkType,
          linkValue: parsed.data.linkValue,
        }, token);
        // 2) get draft cart, 3) add item WITH days (PUT)
        const draft = await fetch("/api/orders/draft", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        const addRes = await fetch(`/api/orders/${draft.id}/items`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ type: "SPOT", spotId: created.id, days }),
        });
        if (!addRes.ok) {
          const e = await addRes.json().catch(() => ({}));
          throw new Error((e as { message?: string }).message ?? "Error al agregar al carrito");
        }
        toast.success("Aviso creado y agregado al carrito");
        router.push("/carrito");
      } else if (kind === "hero") {
        const parsed = HeroSchema.safeParse({
          title: heroTitle,
          titleAccent: heroSubtitle || undefined,
          lead: heroLead || undefined,
          image: heroImage,
          link: heroLink || undefined,
        });
        if (!parsed.success) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
          setErrors(fieldErrors);
          setBusy(false);
          return;
        }
        setErrors({});
        const created = await api.createHero({
          title: parsed.data.title,
          titleAccent: parsed.data.titleAccent,
          lead: parsed.data.lead,
          image: parsed.data.image,
          date: heroDate || undefined,
          place: heroPlace.trim() || undefined,
          link: parsed.data.link,
        }, token);
        const draft = await fetch("/api/orders/draft", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        const addRes = await fetch(`/api/orders/${draft.id}/items`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ type: "HERO", heroId: created.id, days }),
        });
        if (!addRes.ok) {
          const e = await addRes.json().catch(() => ({}));
          throw new Error((e as { message?: string }).message ?? "Error al agregar al carrito");
        }
        toast.success("Portada creada y agregada al carrito");
        router.push("/carrito");
      } else {
        if (!artTitle.trim() || !artContent.trim()) { toast.error("Título y contenido son requeridos"); setBusy(false); return; }
        const res = await fetch("/api/articles/sponsored", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ title: artTitle.trim(), content: artContent.trim(), videoUrl: artVideo.trim() || undefined }),
        });
        if (!res.ok) throw new Error("Error al crear artículo");
        toast.success("Artículo enviado para revisión");
        router.push("/cuenta/articulos");
      }
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al crear");
    } finally {
      setBusy(false);
    }
  };

  const [title, sub] = TITLES[kind];
  const pricePerDay  = PRICE[kind];
  const total        = pricePerDay ? pricePerDay * days : null;

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
      <button className="art-back" onClick={() => router.push(BACK_HREF[kind])} style={{ cursor: "pointer" }}>
        ← Volver a mi cuenta
      </button>

      <div className="eyebrow" style={{ margin: "12px 0 4px" }}>{EYEBROW[kind]}</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,48px)", letterSpacing: "-.025em", margin: "0 0 8px" }}>
        {title}
      </h1>
      <p style={{ color: "var(--ink-3)", marginBottom: 28 }}>{sub}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>

        {/* ── FORM PANEL ───────────────────────────────────────────────────── */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-xl)", padding: 28 }}>

          {/* ── SPOT ── */}
          {kind === "spot" && (
            <form id="product-form" onSubmit={handleSubmit}>
              <div className="field">
                <label>Título del aviso <span style={{ color: "var(--err)" }}>*</span></label>
                <input type="text" placeholder="Ej: Cosplay Premium Atelier — Descuento especial" value={spotTitle} onChange={e => setSpotTitle(e.target.value)} />
                {errors.title && <p className="field-error">{errors.title}</p>}
                <div className="help">Aparece en la card del aviso, máx 60 caracteres.</div>
              </div>
              <div className="field">
                <label>Imagen del aviso <span style={{ color: "var(--err)" }}>*</span></label>
                <div className="upload-box" onClick={() => spotFileRef.current?.click()} style={{ aspectRatio: "unset", minHeight: 160 }}>
                  {spotImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(spotImage)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>
                      <div className="ic">{Ic.upl}</div>
                      <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>{uploading ? "Subiendo…" : "Sube una imagen"}</div>
                      <small>JPG / PNG · máx 5MB</small>
                    </>
                  )}
                </div>
                <input ref={spotFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePickSpot(f); e.target.value = ""; }} />
                {errors.image && <p className="field-error">{errors.image}</p>}
              </div>
              <div className="field">
                <label>Tipo de enlace CTA</label>
                <div className="pill-pick">
                  {(["url", "email", "tel"] as const).map(t => (
                    <button key={t} type="button" className={spotLinkType === t ? "on" : ""} onClick={() => setSpotLinkType(t)}>
                      {t === "url" ? "URL externa" : t === "email" ? "Email" : "Teléfono"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Destino del CTA</label>
                <div className="input-prefix">
                  <span>{spotLinkPrefix}</span>
                  <input type={spotLinkType === "email" ? "email" : spotLinkType === "tel" ? "tel" : "text"} placeholder={spotLinkPlaceholder} value={spotLinkValue} onChange={e => setSpotLinkValue(e.target.value)} />
                </div>
                {errors.linkValue && <p className="field-error">{errors.linkValue}</p>}
              </div>
              <div className="field">
                <label>Días de publicación <span style={{ color: "var(--err)" }}>*</span></label>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <input type="range" min="10" max="30" value={days} onChange={e => setDays(+e.target.value)} style={{ flex: 1, "--fill": `${((days - 10) / 20) * 100}%` } as React.CSSProperties} />
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, minWidth: 80, textAlign: "right" }}>{days} días</div>
                </div>
                <div className="help">$8.000 CLP / día → <strong>${(days * 8000).toLocaleString("es-CL")} CLP total</strong></div>
              </div>
            </form>
          )}

          {/* ── HERO ── */}
          {kind === "hero" && (
            <form id="product-form" onSubmit={handleSubmit}>
              <div className="field">
                <label>Título principal <span style={{ color: "var(--err)" }}>*</span></label>
                <input type="text" placeholder="Ej: Demon Slayer" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} />
                {errors.title && <p className="field-error">{errors.title}</p>}
                <div className="help">La parte grande del título en el carrusel.</div>
              </div>
              <div className="field">
                <label>Subtítulo en color de acento</label>
                <input type="text" placeholder="Ej: Infinity Castle" value={heroSubtitle} onChange={e => setHeroSub(e.target.value)} />
                <div className="help">Se muestra en rojo bajo el título principal. Opcional.</div>
              </div>
              <div className="field">
                <label>Descripción corta</label>
                <textarea placeholder="2-3 líneas que acompañan al título" style={{ minHeight: 80 }} value={heroLead} onChange={e => setHeroLead(e.target.value)} />
              </div>
              <div className="field">
                <label>Imagen de fondo (pantalla completa) <span style={{ color: "var(--err)" }}>*</span></label>
                <div className="upload-box" onClick={() => heroFileRef.current?.click()} style={{ aspectRatio: "21/9" }}>
                  {heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(heroImage)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>
                      <div className="ic">{Ic.upl}</div>
                      <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>{uploading ? "Subiendo…" : "Sube imagen de fondo"}</div>
                      <small>JPG / PNG · 2400×1000 mín · máx 8MB</small>
                    </>
                  )}
                </div>
                <input ref={heroFileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePickHero(f); e.target.value = ""; }} />
                {errors.image && <p className="field-error">{errors.image}</p>}
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Fecha a mostrar</label>
                  <input type="text" placeholder="9–12 MAY 2025" value={heroDate} onChange={e => setHeroDate(e.target.value)} />
                </div>
                <div className="field">
                  <label>Lugar a mostrar</label>
                  <input type="text" placeholder="Estación Mapocho" value={heroPlace} onChange={e => setHeroPlace(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>URL de destino</label>
                <div className="input-prefix">
                  <span>https://</span>
                  <input type="text" placeholder="tu-sitio.cl" value={heroLink} onChange={e => setHeroLink(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Días de publicación <span style={{ color: "var(--err)" }}>*</span></label>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <input type="range" min="10" max="30" value={days} onChange={e => setDays(+e.target.value)} style={{ flex: 1, "--fill": `${((days - 10) / 20) * 100}%` } as React.CSSProperties} />
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, minWidth: 80, textAlign: "right" }}>{days} días</div>
                </div>
                <div className="help">$15.000 CLP / día → <strong>${(days * 15000).toLocaleString("es-CL")} CLP total</strong></div>
              </div>
            </form>
          )}

          {/* ── ARTÍCULO ── */}
          {kind === "articulo" && (
            <form id="product-form" onSubmit={handleSubmit}>
              <div style={{ background: "color-mix(in oklab, var(--accent-3) 8%, var(--surface-2))", border: "1px solid color-mix(in oklab, var(--accent-3) 30%, var(--line))", borderRadius: 12, padding: 14, marginBottom: 18, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--accent-3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>i</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--ink)" }}>Konbini revisará el contenido antes de publicarlo.</strong> El texto puede sufrir cambios de redacción para alinearse al estilo editorial de Konbini.
                </div>
              </div>
              <div className="field">
                <label>Título del artículo <span style={{ color: "var(--err)" }}>*</span></label>
                <input type="text" placeholder="Ej: Anime Crunchyroll Fest 2025 llega a Santiago con artistas internacionales" value={artTitle} onChange={e => setArtTitle(e.target.value)} />
              </div>
              <div className="field">
                <label>Contenido <span style={{ color: "var(--err)" }}>*</span></label>
                <div style={{ display: "flex", gap: 4, padding: 8, background: "var(--surface-2)", border: "1px solid var(--line)", borderBottom: 0, borderRadius: "10px 10px 0 0", flexWrap: "wrap" }}>
                  {[{ label: "B", style: { fontWeight: 700 } }, { label: "I", style: { fontStyle: "italic" } }, { label: "H1" }, { label: "H2" }, { label: "≡" }, { label: '"' }, { label: "🔗" }].map(btn => (
                    <button key={btn.label} type="button" className="sel" style={{ padding: "5px 10px", fontSize: 12, ...btn.style }}>{btn.label}</button>
                  ))}
                  <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", padding: "5px 10px", letterSpacing: ".1em", alignSelf: "center" }}>MARKDOWN</div>
                </div>
                <textarea placeholder={"Escribe el contenido. Puedes usar Markdown: **negrita**, *cursiva*, # títulos, > citas, etc."} style={{ minHeight: 240, borderRadius: "0 0 10px 10px", borderTop: 0 }} value={artContent} onChange={e => setArtContent(e.target.value)} />
                <div className="help">El admin de Konbini puede editar el texto para alinearlo al estilo editorial.</div>
              </div>
              <div className="field">
                <label>Imagen principal <span style={{ color: "var(--err)" }}>*</span></label>
                <div className="upload-box" style={{ aspectRatio: "16/9" }}>
                  <div className="ic">{Ic.upl}</div>
                  <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>Imagen destacada</div>
                  <small>JPG / PNG · 1600×900 mín · máx 5MB</small>
                </div>
              </div>
              <div className="field">
                <label>Video (YouTube)</label>
                <div className="input-prefix">
                  <span>▶</span>
                  <input type="text" placeholder="https://youtube.com/watch?v=..." value={artVideo} onChange={e => setArtVideo(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label>Galería adicional</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="upload-box" style={{ aspectRatio: "1/1", padding: 12 }}>
                      <div className="ic" style={{ width: 28, height: 28 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                      </div>
                      <small style={{ fontSize: 10 }}>{i + 1}</small>
                    </div>
                  ))}
                </div>
                <div className="help">Hasta 4 imágenes adicionales · opcional.</div>
              </div>
            </form>
          )}
        </div>

        {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
        <aside style={{ position: "sticky", top: 90 }}>
          <div style={{ background: "var(--surface)", borderRadius: "var(--r-xl)", padding: 24 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: "0 0 16px", letterSpacing: "-.01em" }}>Resumen</h3>
            <div className="ck-summary">
              <div className="sum-row">
                <span>Producto</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {kind === "spot" ? "Aviso" : kind === "hero" ? "Portada" : "Artículo"}
                </span>
              </div>
              {pricePerDay && (
                <div className="sum-row">
                  <span>Precio por día</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>${pricePerDay.toLocaleString("es-CL")}</span>
                </div>
              )}
              {total && (
                <>
                  <div className="sum-row">
                    <span>Días</span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{days}</span>
                  </div>
                  <div className="sum-row tot">
                    <span>Total</span>
                    <span style={{ color: "var(--accent)" }}>
                      ${total.toLocaleString("es-CL")}
                    </span>
                  </div>
                </>
              )}
            </div>
            {!pricePerDay && (
              <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: 12, marginTop: 12, fontSize: 12, color: "var(--ink-3)", lineHeight: 1.5 }}>
                Sin cupo limitado · precio a convenir con el equipo de Konbini.
              </div>
            )}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="submit"
                form="product-form"
                className="btn primary block"
                disabled={busy || uploading}
              >
                {busy ? "Enviando…" : <>Agregar al carrito {Ic.arrow}</>}
              </button>
              <button
                type="button"
                className="btn ghost block"
                onClick={() => toast.success("Borrador guardado ✓")}
              >
                Guardar borrador
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
