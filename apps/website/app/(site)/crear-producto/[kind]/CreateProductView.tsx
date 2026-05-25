"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type Kind = "spot" | "hero" | "articulo";

interface CreateProductViewProps {
  kind: Kind;
}

const TITLES: Record<Kind, [string, string]> = {
  spot: ["Crear aviso", "Aparición en home y al final de las categorías. Cupo: 9 / 12."],
  hero: ["Crear portada", "Aparición en el carrusel principal del home. Cupo: 3 / 5."],
  articulo: ["Solicitar artículo patrocinado", "Konbini escribirá y publicará el artículo según el contenido que entregues."],
};

const EYEBROW: Record<Kind, string> = {
  spot: "AVISO · 広告",
  hero: "PORTADA · 表紙",
  articulo: "ARTÍCULO · 記事",
};

const BACK_TAB: Record<Kind, string> = {
  spot: "avisos",
  hero: "portadas",
  articulo: "articulos",
};

export function CreateProductView({ kind }: CreateProductViewProps) {
  const router = useRouter();
  const { token } = useUser();
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(14);

  // Spot form state
  const [spotForm, setSpotForm] = useState({
    title: "",
    description: "",
    linkType: "URL" as "URL" | "PHONE" | "EMAIL",
    linkValue: "",
    buttonText: "",
  });

  // Hero form state
  const [heroForm, setHeroForm] = useState({
    title: "",
    titleAccent: "",
    lead: "",
    date: "",
    place: "",
    link: "",
  });

  // Article form state
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
  });

  const handleSpotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    if (!spotForm.title.trim()) { toast.error("El título es requerido"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/spots", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: spotForm.title.trim(),
          description: spotForm.description.trim() || undefined,
          linkType: spotForm.linkType,
          linkValue: spotForm.linkValue.trim() || undefined,
          buttonText: spotForm.buttonText.trim() || undefined,
          days,
        }),
      });
      if (!res.ok) throw new Error("Error al crear aviso");
      toast.success("Aviso creado y agregado al carrito");
      router.push("/carrito");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al crear");
    } finally {
      setBusy(false);
    }
  };

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    if (!heroForm.title.trim()) { toast.error("El título es requerido"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/heroes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: heroForm.title.trim(),
          titleAccent: heroForm.titleAccent.trim() || undefined,
          lead: heroForm.lead.trim() || undefined,
          date: heroForm.date || undefined,
          place: heroForm.place.trim() || undefined,
          link: heroForm.link.trim() || undefined,
          days,
        }),
      });
      if (!res.ok) throw new Error("Error al crear portada");
      toast.success("Portada creada y agregada al carrito");
      router.push("/carrito");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al crear");
    } finally {
      setBusy(false);
    }
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error("Debes iniciar sesión"); return; }
    if (!articleForm.title.trim() || !articleForm.content.trim()) {
      toast.error("Título y contenido son requeridos");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/articles/sponsored", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          title: articleForm.title.trim(),
          content: articleForm.content.trim(),
        }),
      });
      if (!res.ok) throw new Error("Error al crear artículo");
      toast.success("Artículo enviado para revisión");
      router.push("/cuenta?tab=articulos");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al crear");
    } finally {
      setBusy(false);
    }
  };

  const [title, sub] = TITLES[kind];

  return (
    <main className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
      <button
        className="art-back"
        onClick={() => router.push(`/cuenta?tab=${BACK_TAB[kind]}`)}
        style={{ cursor: "pointer" }}
      >
        ← Volver a mi cuenta
      </button>

      <div className="eyebrow" style={{ margin: "12px 0 4px" }}>
        {EYEBROW[kind]}
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(32px,4vw,48px)",
          letterSpacing: "-.025em",
          margin: "0 0 8px",
        }}
      >
        {title}
      </h1>
      <p style={{ color: "var(--ink-3)", marginBottom: 28 }}>{sub}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-xl)",
            padding: 28,
          }}
        >
          {kind === "spot" && (
            <form onSubmit={handleSpotSubmit}>
              <div className="field">
                <label>Título del aviso <span style={{ color: "var(--err)" }}>*</span></label>
                <input type="text" placeholder="Ej: Cosplay Premium Atelier — Descuento" value={spotForm.title} onChange={(e) => setSpotForm((f) => ({ ...f, title: e.target.value }))} required />
                <div className="help">Aparece en la card del aviso, máx 60 caracteres.</div>
              </div>
              <div className="field">
                <label>Descripción corta</label>
                <input type="text" placeholder="Texto breve que acompaña al título" value={spotForm.description} onChange={(e) => setSpotForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="field">
                <label>Tipo de enlace</label>
                <div className="pill-pick">
                  {(["URL", "PHONE", "EMAIL"] as const).map((t) => (
                    <button key={t} type="button" className={spotForm.linkType === t ? "on" : ""} onClick={() => setSpotForm((f) => ({ ...f, linkType: t }))}>
                      {t === "URL" ? "URL externa" : t === "PHONE" ? "Teléfono" : "Email"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>URL / Email / Teléfono</label>
                <input type="text" placeholder="https://tu-sitio.cl" value={spotForm.linkValue} onChange={(e) => setSpotForm((f) => ({ ...f, linkValue: e.target.value }))} />
              </div>
              <div className="field">
                <label>Días de publicación <span style={{ color: "var(--err)" }}>*</span></label>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <input type="range" min="10" max="30" value={days} onChange={(e) => setDays(+e.target.value)} style={{ flex: 1 }} />
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, minWidth: 80, textAlign: "right" }}>{days} días</div>
                </div>
                <div className="help">$8.000 CLP / día → <strong>${(days * 8000).toLocaleString("es-CL")} CLP total</strong></div>
              </div>
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? "Enviando…" : "Agregar al carrito →"}
              </button>
            </form>
          )}

          {kind === "hero" && (
            <form onSubmit={handleHeroSubmit}>
              <div className="field">
                <label>Título principal <span style={{ color: "var(--err)" }}>*</span></label>
                <input type="text" placeholder="Ej: Demon Slayer" value={heroForm.title} onChange={(e) => setHeroForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Subtítulo en color acento</label>
                <input type="text" placeholder="Ej: Infinity Castle" value={heroForm.titleAccent} onChange={(e) => setHeroForm((f) => ({ ...f, titleAccent: e.target.value }))} />
              </div>
              <div className="field">
                <label>Descripción corta</label>
                <textarea placeholder="2-3 líneas..." style={{ minHeight: 80 }} value={heroForm.lead} onChange={(e) => setHeroForm((f) => ({ ...f, lead: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Fecha a mostrar</label>
                  <input type="text" placeholder="9–12 MAY 2025" value={heroForm.date} onChange={(e) => setHeroForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Lugar a mostrar</label>
                  <input type="text" placeholder="Estación Mapocho" value={heroForm.place} onChange={(e) => setHeroForm((f) => ({ ...f, place: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>URL de destino</label>
                <input type="url" placeholder="https://..." value={heroForm.link} onChange={(e) => setHeroForm((f) => ({ ...f, link: e.target.value }))} />
              </div>
              <div className="field">
                <label>Días de publicación <span style={{ color: "var(--err)" }}>*</span></label>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <input type="range" min="10" max="30" value={days} onChange={(e) => setDays(+e.target.value)} style={{ flex: 1 }} />
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 18, minWidth: 80, textAlign: "right" }}>{days} días</div>
                </div>
                <div className="help">$15.000 CLP / día → <strong>${(days * 15000).toLocaleString("es-CL")} CLP total</strong></div>
              </div>
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? "Enviando…" : "Agregar al carrito →"}
              </button>
            </form>
          )}

          {kind === "articulo" && (
            <form onSubmit={handleArticleSubmit}>
              <div
                style={{
                  background: "color-mix(in oklab, var(--accent-3) 8%, var(--surface-2))",
                  border: "1px solid color-mix(in oklab, var(--accent-3) 30%, var(--line))",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 18,
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--accent-3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flex: "0 0 28px" }}>i</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--ink)" }}>Konbini revisará el contenido antes de publicarlo.</strong> El texto puede sufrir cambios de redacción para alinearse al estilo editorial de Konbini.
                </div>
              </div>
              <div className="field">
                <label>Título del artículo <span style={{ color: "var(--err)" }}>*</span></label>
                <input type="text" placeholder="Ej: Anime Crunchyroll Fest 2025 llega a Santiago" value={articleForm.title} onChange={(e) => setArticleForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="field">
                <label>Contenido <span style={{ color: "var(--err)" }}>*</span></label>
                <textarea
                  placeholder="Escribe el contenido. Puedes usar Markdown…"
                  style={{ minHeight: 240, fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.6 }}
                  value={articleForm.content}
                  onChange={(e) => setArticleForm((f) => ({ ...f, content: e.target.value }))}
                  required
                />
                <div className="help">El admin de Konbini puede editar el texto para alinearlo al estilo editorial.</div>
              </div>
              <button type="submit" className="btn primary" disabled={busy}>
                {busy ? "Enviando…" : "Enviar para revisión →"}
              </button>
            </form>
          )}
        </div>

        <aside className="cart-side">
          <h3>Resumen</h3>
          <div className="sum-row">
            <span>Producto</span>
            <span style={{ fontFamily: "var(--font-mono)", textTransform: "capitalize" }}>
              {kind === "spot" ? "Aviso" : kind === "hero" ? "Portada" : "Artículo"}
            </span>
          </div>
          {kind !== "articulo" && (
            <div className="sum-row">
              <span>Precio por día</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>
                ${kind === "spot" ? "8.000" : "15.000"}
              </span>
            </div>
          )}
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: 10,
              padding: 12,
              marginTop: 12,
              fontSize: 12,
              color: "var(--ink-3)",
              lineHeight: 1.5,
            }}
          >
            {kind === "articulo"
              ? "Sin cupo limitado · publicación fija."
              : "El precio total se calcula según los días que elijas en el formulario."}
          </div>
        </aside>
      </div>
    </main>
  );
}
