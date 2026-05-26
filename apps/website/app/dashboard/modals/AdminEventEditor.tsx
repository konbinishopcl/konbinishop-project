"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

// ── Types ─────────────────────────────────────────────────────────────────────

type Category = { id: number; name: string; slug: string };
type Country  = { id: number; name: string; slug: string };
type State    = { id: number; name: string; slug: string };
type City     = { id: number; name: string };

type FormData = {
  title:         string;
  company:       string;
  description:   string;
  about:         string;
  address:       string;
  addressNumber: string;
  ticketUrl:     string;
  banner:        string;
  poster:        string;
  categoryId:    string;
  countrySlug:   string;   // slug para query ?country=<slug>
  stateSlug:     string;   // slug para query ?state=<slug>
  cityId:        string;
  priceName:     string;
  priceAmount:   string;
  isFree:        boolean;
  dateStr:       string;
  startTime:     string;
  endTime:       string;
  instagram:     string;
  tiktok:        string;
  facebook:      string;
  twitter:       string;
  videoUrl:      string;
  status:        "APPROVED" | "PENDING_MODERATION" | "DRAFT";
};

type InitialEvent = {
  id:           number;
  title:        string;
  company:      string | null;
  description:  string;
  about:        string | null;
  address:      string;
  addressNumber: string | null;
  ticketUrl:    string | null;
  banner:       string | null;
  poster:       string | null;
  categoryId:   number | null;
  cityId:       number | null;
  status:       string;
  prices:       { name: string; price: number }[];
  dates:        { date: string | null; startTime: string | null; endTime: string | null }[];
  socialLinks:  { link: string | null }[];
  videos:       { link: string | null }[];
  city?:        { id: number; name: string; state?: { id: number; slug: string; country?: { slug: string } } } | null;
};

interface Props {
  mode:     "create" | "edit";
  initial?: InitialEvent;
}

// ── Accordion item ────────────────────────────────────────────────────────────

function AccItem({ n, title, meta, open, onToggle, children }: {
  n: string; title: string; meta?: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`form-acc-item${open ? " open" : ""}`}>
      <div className="form-acc-head" onClick={onToggle}>
        <span className="num">{n}</span>
        <span className="ti">{title}</span>
        {meta && <span className="meta">{meta}</span>}
        <span className="chev">▶</span>
      </div>
      {open && <div className="form-acc-body">{children}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminEventEditor({ mode, initial }: Props) {
  const router  = useRouter();
  const { token } = useUser();
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  // Catalog data
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries,  setCountries]  = useState<Country[]>([]);
  const [states,     setStates]     = useState<State[]>([]);
  const [cities,     setCities]     = useState<City[]>([]);

  // Accordion open state
  const [open, setOpen] = useState<Record<string, boolean>>({ "1": true, "2": false, "3": false, "4": false });
  const toggle = (n: string) => setOpen((o) => ({ ...o, [n]: !o[n] }));

  // Form state
  const [form, setForm] = useState<FormData>({
    title:         initial?.title         ?? "",
    company:       initial?.company       ?? "",
    description:   initial?.description   ?? "",
    about:         initial?.about         ?? "",
    address:       initial?.address       ?? "",
    addressNumber: initial?.addressNumber ?? "",
    ticketUrl:     initial?.ticketUrl     ?? "",
    banner:        initial?.banner        ?? "",
    poster:        initial?.poster        ?? "",
    categoryId:    initial?.categoryId != null ? String(initial.categoryId) : "",
    countrySlug:   initial?.city?.state?.country?.slug ?? "",
    stateSlug:     initial?.city?.state?.slug ?? "",
    cityId:        initial?.cityId != null ? String(initial.cityId) : "",
    priceName:     initial?.prices[0]?.name   ?? "General",
    priceAmount:   initial?.prices[0]?.price != null ? String(initial.prices[0].price) : "",
    isFree:        initial ? (initial.prices[0]?.price === 0 || initial.prices.length === 0) : false,
    dateStr:       initial?.dates[0]?.date ? initial.dates[0].date.slice(0, 10) : "",
    startTime:     initial?.dates[0]?.startTime ?? "",
    endTime:       initial?.dates[0]?.endTime   ?? "",
    instagram:     initial?.socialLinks.find((l) => l.link?.includes("instagram"))?.link ?? "",
    tiktok:        initial?.socialLinks.find((l) => l.link?.includes("tiktok"))?.link    ?? "",
    facebook:      initial?.socialLinks.find((l) => l.link?.includes("facebook"))?.link  ?? "",
    twitter:       initial?.socialLinks.find((l) => l.link?.includes("twitter") || l.link?.includes("x.com"))?.link ?? "",
    videoUrl:      initial?.videos[0]?.link ?? "",
    status:        initial?.status === "APPROVED"
                     ? "APPROVED"
                     : initial?.status === "PENDING_MODERATION"
                       ? "PENDING_MODERATION"
                       : "DRAFT",
  });

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Fetch catalog (cascada: países → regiones → ciudades) ──────────────────

  // 1. Al montar: categorías + países
  const fetchCatalog = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    const [cats, ctrs] = await Promise.all([
      fetch("/api/categories", { headers: h }).then((r) => r.json()).catch(() => []),
      fetch("/api/countries",  { headers: h }).then((r) => r.json()).catch(() => []),
    ]);
    setCategories(Array.isArray(cats)  ? cats  : []);
    setCountries( Array.isArray(ctrs)  ? ctrs  : []);
  }, [token]);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  // 2. Cuando cambia countrySlug → carga regiones
  useEffect(() => {
    if (!token || !form.countrySlug) { setStates([]); return; }
    fetch(`/api/states?country=${encodeURIComponent(form.countrySlug)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setStates(Array.isArray(data) ? data : []))
      .catch(() => setStates([]));
  }, [token, form.countrySlug]);

  // 3. Cuando cambia stateSlug → carga ciudades
  useEffect(() => {
    if (!token || !form.stateSlug) { setCities([]); return; }
    fetch(`/api/cities?state=${encodeURIComponent(form.stateSlug)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setCities(Array.isArray(data) ? data : []))
      .catch(() => setCities([]));
  }, [token, form.stateSlug]);

  // ── AI tag suggestion ──────────────────────────────────────────────────────

  const [tags, setTags] = useState("");

  function aiSuggestTags() {
    setAiBusy(true);
    setTimeout(() => {
      const cat = categories.find((c) => String(c.id) === form.categoryId)?.name?.toLowerCase() ?? "evento";
      setTags(`${cat}, chile, 2025, ${form.title.toLowerCase().split(" ").slice(0, 2).join(", ")}`);
      setAiBusy(false);
      toast.success("Tags sugeridos por IA");
    }, 700);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(targetStatus: "APPROVED" | "PENDING_MODERATION" | "DRAFT") {
    if (!token) { toast.error("No autenticado"); return; }
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    // Los borradores solo requieren título; el resto se valida al publicar
    if (targetStatus !== "DRAFT") {
      if (form.description.trim().length < 10) { toast.error("La descripción debe tener al menos 10 caracteres"); return; }
      if (!form.address.trim()) { toast.error("La dirección es requerida"); return; }
    }

    setBusy(true);
    try {
      const socialLinks = [
        form.instagram ? { link: form.instagram } : null,
        form.tiktok    ? { link: form.tiktok }    : null,
        form.facebook  ? { link: form.facebook }  : null,
        form.twitter   ? { link: form.twitter }   : null,
      ].filter(Boolean) as { link: string }[];

      const payload = {
        title:         form.title.trim(),
        company:       form.company.trim()       || undefined,
        description:   form.description.trim(),
        about:         form.about.trim()         || undefined,
        address:       form.address.trim(),
        addressNumber: form.addressNumber.trim() || undefined,
        ticketUrl:     form.ticketUrl.trim()     || undefined,
        banner:        form.banner.trim()        || undefined,
        poster:        form.poster.trim()        || undefined,
        categoryId:    form.categoryId ? Number(form.categoryId) : undefined,
        cityId:        form.cityId     ? Number(form.cityId)     : undefined,
        prices:        form.isFree
                         ? [{ name: "Entrada", price: 0 }]
                         : form.priceAmount
                           ? [{ name: form.priceName || "General", price: Number(form.priceAmount) }]
                           : undefined,
        dates:         form.dateStr
                         ? [{ date: form.dateStr, startTime: form.startTime || undefined, endTime: form.endTime || undefined }]
                         : undefined,
        socialLinks:   socialLinks.length ? socialLinks : undefined,
        videos:        form.videoUrl ? [{ link: form.videoUrl }] : undefined,
      };

      const url    = mode === "create" ? "/api/events" : `/api/events/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const r = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message ?? "Error al guardar");
      }
      const saved = await r.json();

      // If admin wants to publish directly, approve right after create/update
      if (targetStatus === "APPROVED" && saved.status !== "APPROVED") {
        await fetch(`/api/events/${saved.id}/approve`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success(mode === "create" ? "Evento creado" : "Evento actualizado",
        { description: targetStatus === "APPROVED" ? "Publicado directamente" : targetStatus === "PENDING_MODERATION" ? "En revisión" : "Guardado como borrador" });
      router.push("/dashboard/events");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>

      {/* Back link */}
      <Link
        href="/dashboard/events"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13, marginBottom: 18 }}
      >
        ◀ Volver a eventos
      </Link>

      {/* Top panel: organizer + status */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="grid-2">
          <div className="field" style={{ margin: 0 }}>
            <label>Estado al guardar</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value as FormData["status"])}>
              <option value="APPROVED">Publicado (directo)</option>
              <option value="PENDING_MODERATION">En revisión</option>
              <option value="DRAFT">Borrador</option>
            </select>
            <div className="help">Como admin puedes publicar de inmediato sin pasar por revisión.</div>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Empresa organizadora (pública)</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Ej: Productora 8U, Cinépolis Chile"
            />
            <div className="help">Nombre que aparece públicamente como organizador del evento.</div>
          </div>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="form-acc">

        {/* 1. Información básica */}
        <AccItem
          n="1" title="Información básica"
          meta={form.title ? `· "${form.title.slice(0, 30)}"` : "Título, categoría, descripción"}
          open={open["1"]} onToggle={() => toggle("1")}
        >
          <div className="field">
            <label>Título del evento <span style={{ color: "var(--err)" }}>*</span></label>
            <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ej: Anime Crunchyroll Fest 2025" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Categoría</label>
              <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>URL de entradas (externa)</label>
              <input type="url" value={form.ticketUrl} onChange={(e) => set("ticketUrl", e.target.value)} placeholder="https://ticketmaster.com/..." />
            </div>
          </div>
          <div className="field">
            <label>Descripción corta <span style={{ color: "var(--err)" }}>*</span></label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Aparece en la card del evento. Mínimo 10 caracteres."
              style={{ resize: "vertical" }}
            />
          </div>
          <div className="field">
            <label>Sobre el evento (texto completo)</label>
            <textarea
              rows={6}
              value={form.about}
              onChange={(e) => set("about", e.target.value)}
              placeholder="Descripción larga que aparece en el detalle del evento."
              style={{ resize: "vertical" }}
            />
          </div>
          {/* Price */}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Precio</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}
              onClick={() => set("isFree", !form.isFree)}>
              <span style={{
                width: 20, height: 20, borderRadius: 4, border: "2px solid var(--line)",
                background: form.isFree ? "var(--accent)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {form.isFree && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              </span>
              <span style={{ fontSize: 14 }}>Evento gratuito</span>
            </div>
            {!form.isFree && (
              <div className="grid-2">
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11 }}>Tipo de tarifa</label>
                  <input type="text" value={form.priceName} onChange={(e) => set("priceName", e.target.value)} placeholder="General / VIP / etc." />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: 11 }}>Precio (CLP)</label>
                  <input type="number" value={form.priceAmount} onChange={(e) => set("priceAmount", e.target.value)} placeholder="9990" min="0" />
                </div>
              </div>
            )}
          </div>
        </AccItem>

        {/* 2. Fechas, horarios y ubicación */}
        <AccItem
          n="2" title="Fechas, horarios y ubicación"
          meta={form.address ? `· ${form.address}` : "Cuándo y dónde"}
          open={open["2"]} onToggle={() => toggle("2")}
        >
          <div className="grid-3">
            <div className="field">
              <label>Fecha</label>
              <input type="date" value={form.dateStr} onChange={(e) => set("dateStr", e.target.value)} />
            </div>
            <div className="field">
              <label>Hora inicio</label>
              <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
            </div>
            <div className="field">
              <label>Hora término</label>
              <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
            </div>
          </div>
          <div className="grid-3">
            <div className="field">
              <label>País</label>
              <select
                value={form.countrySlug}
                onChange={(e) => {
                  set("countrySlug", e.target.value);
                  set("stateSlug", "");
                  set("cityId", "");
                }}
              >
                <option value="">Selecciona país…</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Región</label>
              <select
                value={form.stateSlug}
                onChange={(e) => { set("stateSlug", e.target.value); set("cityId", ""); }}
                disabled={!form.countrySlug || states.length === 0}
              >
                <option value="">Selecciona región…</option>
                {states.map((s) => (
                  <option key={s.id} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Ciudad</label>
              <select
                value={form.cityId}
                onChange={(e) => set("cityId", e.target.value)}
                disabled={!form.stateSlug || cities.length === 0}
              >
                <option value="">Selecciona ciudad…</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Dirección completa <span style={{ color: "var(--err)" }}>*</span></label>
            <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Av. Providencia 1234, Providencia, Santiago" />
          </div>
          {form.addressNumber && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Número</label>
              <input type="text" value={form.addressNumber} onChange={(e) => set("addressNumber", e.target.value)} placeholder="1234" />
            </div>
          )}
        </AccItem>

        {/* 3. Multimedia */}
        <AccItem n="3" title="Multimedia" meta="Imágenes y videos" open={open["3"]} onToggle={() => toggle("3")}>
          <div className="grid-2">
            <div className="field">
              <label>Banner (URL · 16:9)</label>
              <input type="url" value={form.banner} onChange={(e) => set("banner", e.target.value)} placeholder="https://..." />
              <div className="help">Imagen horizontal. 2400×1350 recomendado.</div>
            </div>
            <div className="field">
              <label>Poster (URL · 2:3)</label>
              <input type="url" value={form.poster} onChange={(e) => set("poster", e.target.value)} placeholder="https://..." />
              <div className="help">Imagen vertical. 1200×1800 recomendado.</div>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Video (URL de YouTube)</label>
            <input type="url" value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          </div>
        </AccItem>

        {/* 4. Redes sociales y tags */}
        <AccItem n="4" title="Redes sociales y tags" meta="Opcional" open={open["4"]} onToggle={() => toggle("4")}>
          <div className="grid-2">
            <div className="field">
              <label>Instagram</label>
              <input type="text" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div className="field">
              <label>TikTok</label>
              <input type="text" value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="https://tiktok.com/@..." />
            </div>
            <div className="field">
              <label>Facebook</label>
              <input type="text" value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div className="field">
              <label>X / Twitter</label>
              <input type="text" value={form.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="https://x.com/..." />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Tags (separados por coma)</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="anime, cosplay, santiago, 2025"
                style={{ paddingRight: 44 }}
              />
              <button
                className="icon-btn"
                type="button"
                onClick={aiSuggestTags}
                title="Sugerir tags con IA"
                style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
              >
                <span style={{ animation: aiBusy ? "spin 1s linear infinite" : "none" }}>✦</span>
              </button>
            </div>
            <div className="help">La IA puede sugerir tags analizando el título y descripción.</div>
          </div>
        </AccItem>

      </div>

      {/* Sticky footer */}
      <div style={{
        position: "sticky", bottom: 0, marginTop: 24,
        padding: "18px 0", borderTop: "1px solid var(--line)",
        background: "color-mix(in oklab, var(--bg) 92%, transparent)",
        backdropFilter: "blur(8px)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 10,
      }}>
        <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
          {mode === "create"
            ? "Creando como admin · sin checkout ni upsell."
            : "Editando como admin · no se notifica al organizador."}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/dashboard/events" className="btn ghost">Cancelar</Link>
          <button
            className="btn dark"
            disabled={busy}
            onClick={() => handleSubmit("DRAFT")}
          >
            Guardar borrador
          </button>
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => handleSubmit(form.status)}
          >
            {busy ? "Guardando…" : form.status === "APPROVED"
              ? (mode === "create" ? "Crear y publicar →" : "Guardar y publicar →")
              : form.status === "PENDING_MODERATION"
                ? (mode === "create" ? "Crear en revisión →" : "Guardar en revisión →")
                : (mode === "create" ? "Crear borrador →" : "Guardar borrador →")}
          </button>
        </div>
      </div>
    </div>
  );
}
