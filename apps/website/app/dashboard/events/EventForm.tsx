"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, imageUrl } from "@/lib/api";

// ── Auxiliary types ────────────────────────────────────────────────────────────

type Category = { id: number; name: string; slug: string };
type Country  = { id: number; name: string; slug: string };
type State    = { id: number; name: string; slug: string };
type City     = { id: number; name: string };

type PriceRow  = { name: string; amount: string };
type DateRow   = { date: string; startTime: string; endTime: string };
type LinkRow   = { link: string };
type ImageSlot = { file: File | null; url: string };

// ── FormData ───────────────────────────────────────────────────────────────────

type FormData = {
  title:         string;
  company:       string;
  description:   string;
  about:         string;
  address:       string;
  addressNumber: string;
  ticketUrl:     string;
  categoryId:    string;
  countrySlug:   string;
  stateSlug:     string;
  cityId:        string;

  isFree:  boolean;
  prices:  PriceRow[];
  dates:   DateRow[];
  socials: LinkRow[];
  videos:  LinkRow[];

  banner:  ImageSlot;
  poster:  ImageSlot;
  gallery: ImageSlot[];   // always 8 elements

  status: "APPROVED" | "PENDING_MODERATION" | "DRAFT";
};

// ── InitialEvent exported type ─────────────────────────────────────────────────

export type InitialEvent = {
  id:            number;
  title:         string;
  company:       string | null;
  description:   string;
  about:         string | null;
  address:       string;
  addressNumber: string | null;
  ticketUrl:     string | null;
  banner:        string | null;
  poster:        string | null;
  gallery?: string[];
  categoryId:    number | null;
  cityId:        number | null;
  status:        string;
  prices:        { name: string; price: number }[];
  dates:         { date: string | null; startTime: string | null; endTime: string | null }[];
  socialLinks:   { link: string | null }[];
  videos:        { link: string | null }[];
  city?: { id: number; name: string; state?: { id: number; slug: string; country?: { slug: string } } } | null;
};

interface Props {
  mode:     "create" | "edit";
  initial?: InitialEvent;
}

// ── SectionHead ────────────────────────────────────────────────────────────────

function SectionHead({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 12,
      paddingBottom: 14, marginBottom: 20,
      borderBottom: "1px solid var(--line)",
    }}>
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em",
        color: "var(--accent)", background: "color-mix(in oklab, var(--accent) 14%, transparent)",
        padding: "4px 8px", borderRadius: 4, fontWeight: 700, flexShrink: 0,
      }}>{n}</span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{title}</span>
      {sub && <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{sub}</span>}
    </div>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────────────────

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}
      onClick={onChange}
    >
      <span style={{
        width: 20, height: 20, borderRadius: 4, flexShrink: 0,
        border: "2px solid var(--line)",
        background: checked ? "var(--accent)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {checked && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </span>
      <span style={{ fontSize: 14 }}>{label}</span>
    </div>
  );
}

// ── ImageUploadBox ─────────────────────────────────────────────────────────────

function ImageUploadBox({
  variant,
  slot,
  onPick,
  onRemove,
  label,
  hint,
}: {
  variant: "banner" | "poster" | "gallery";
  slot: ImageSlot;
  onPick: (file: File) => void;
  onRemove: () => void;
  label: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Preview: if there's a file, use URL.createObjectURL; if there's a url (from server), use imageUrl()
  const previewSrc = slot.file
    ? URL.createObjectURL(slot.file)
    : slot.url ? imageUrl(slot.url) : "";

  // Clean up object URL on unmount
  useEffect(() => {
    if (!slot.file) return;
    const u = URL.createObjectURL(slot.file);
    return () => URL.revokeObjectURL(u);
  }, [slot.file]);

  if (previewSrc) {
    const aspect = variant === "poster" ? "3/4" : variant === "gallery" ? "1/1" : "16/9";
    return (
      <div style={{ position: "relative", aspectRatio: aspect, borderRadius: "var(--r)", overflow: "hidden", background: "var(--surface-2)" }}>
        <img src={previewSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Eliminar imagen"
          className="icon-btn"
          style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, background: "rgba(15,12,10,.75)", color: "#fff", borderColor: "rgba(255,255,255,.15)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    );
  }

  const boxClass = variant === "poster" ? "upload-box tall" : "upload-box";
  const extraStyle = variant === "gallery" ? { aspectRatio: "1/1" as const, padding: 14 } : undefined;

  return (
    <>
      <div className={boxClass} style={extraStyle} onClick={() => inputRef.current?.click()}>
        <div className="ic" style={variant === "gallery" ? { width: 28, height: 28 } : undefined}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
          </svg>
        </div>
        <div style={{ fontWeight: 500, color: "var(--ink-2)", fontSize: variant === "gallery" ? 12 : 14 }}>{label}</div>
        {hint && <small style={{ fontSize: variant === "gallery" ? 10 : 11 }}>{hint}</small>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";   // allow re-pick of same file
        }}
      />
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function EventForm({ mode, initial }: Props) {
  const router = useRouter();
  const { token, user } = useUser();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const [busy, setBusy] = useState(false);

  // Catalog data
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries,  setCountries]  = useState<Country[]>([]);
  const [states,     setStates]     = useState<State[]>([]);
  const [cities,     setCities]     = useState<City[]>([]);

  // ── Form initialization ────────────────────────────────────────────────────
  const [form, setForm] = useState<FormData>(() => {
    const initialGallery: ImageSlot[] = Array(8).fill(null).map((_, i) => ({
      file: null,
      url:  initial?.gallery?.[i] ?? "",
    }));

    // Default status: admin can choose, non-admin stays in PENDING_MODERATION
    let initStatus: FormData["status"] = "PENDING_MODERATION";
    if (initial?.status === "APPROVED") initStatus = "APPROVED";
    else if (initial?.status === "DRAFT") initStatus = "DRAFT";
    else if (initial?.status === "PENDING_MODERATION") initStatus = "PENDING_MODERATION";

    return {
      title:         initial?.title         ?? "",
      company:       initial?.company       ?? "",
      description:   initial?.description   ?? "",
      about:         initial?.about         ?? "",
      address:       initial?.address       ?? "",
      addressNumber: initial?.addressNumber ?? "",
      ticketUrl:     initial?.ticketUrl     ?? "",
      categoryId:    initial?.categoryId != null ? String(initial.categoryId) : "",
      countrySlug:   initial?.city?.state?.country?.slug ?? "",
      stateSlug:     initial?.city?.state?.slug          ?? "",
      cityId:        initial?.cityId != null ? String(initial.cityId) : "",

      isFree: initial ? (initial.prices.length === 0 || initial.prices[0]?.price === 0) : false,

      prices: initial?.prices.length
        ? initial.prices.map((p) => ({ name: p.name, amount: String(p.price) }))
        : [{ name: "General", amount: "" }],

      dates: initial?.dates.length
        ? initial.dates.map((d) => ({
            date:      d.date ? d.date.slice(0, 10) : "",
            startTime: d.startTime ?? "",
            endTime:   d.endTime   ?? "",
          }))
        : [{ date: "", startTime: "", endTime: "" }],

      socials: initial?.socialLinks.length
        ? initial.socialLinks.map((l) => ({ link: l.link ?? "" }))
        : [{ link: "" }],

      videos: initial?.videos.length
        ? initial.videos.map((v) => ({ link: v.link ?? "" }))
        : [{ link: "" }],

      banner:  { file: null, url: initial?.banner ?? "" },
      poster:  { file: null, url: initial?.poster ?? "" },
      gallery: initialGallery,

      status: initStatus,
    };
  });

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Dynamic array helpers ──────────────────────────────────────────────────
  const updatePrice  = (i: number, k: keyof PriceRow, v: string) =>
    set("prices", form.prices.map((p, j) => j === i ? { ...p, [k]: v } : p));
  const addPrice     = () => set("prices", [...form.prices, { name: "", amount: "" }]);
  const removePrice  = (i: number) => set("prices", form.prices.filter((_, j) => j !== i));

  const updateDate   = (i: number, k: keyof DateRow, v: string) =>
    set("dates", form.dates.map((d, j) => j === i ? { ...d, [k]: v } : d));
  const addDate      = () => set("dates", [...form.dates, { date: "", startTime: "", endTime: "" }]);
  const removeDate   = (i: number) => set("dates", form.dates.filter((_, j) => j !== i));

  const updateSocial = (i: number, v: string) =>
    set("socials", form.socials.map((s, j) => j === i ? { link: v } : s));
  const addSocial    = () => set("socials", [...form.socials, { link: "" }]);
  const removeSocial = (i: number) => set("socials", form.socials.filter((_, j) => j !== i));

  const updateVideo  = (i: number, v: string) =>
    set("videos", form.videos.map((vv, j) => j === i ? { link: v } : vv));
  const addVideo     = () => set("videos", [...form.videos, { link: "" }]);
  const removeVideo  = (i: number) => set("videos", form.videos.filter((_, j) => j !== i));

  const updateGallery = (i: number, slot: ImageSlot) =>
    set("gallery", form.gallery.map((g, j) => j === i ? slot : g));

  // ── Catalog cascade (preserved from original — do not modify) ─────────────
  const fetchCatalog = useCallback(async () => {
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    const [cats, ctrs] = await Promise.all([
      fetch("/api/categories", { headers: h }).then((r) => r.json()).catch(() => []),
      fetch("/api/countries",  { headers: h }).then((r) => r.json()).catch(() => []),
    ]);
    setCategories(Array.isArray(cats) ? cats : []);
    setCountries( Array.isArray(ctrs) ? ctrs : []);
  }, [token]);
  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);

  useEffect(() => {
    if (!token || !form.countrySlug) { setStates([]); return; }
    fetch(`/api/states?country=${encodeURIComponent(form.countrySlug)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((d) => setStates(Array.isArray(d) ? d : [])).catch(() => setStates([]));
  }, [token, form.countrySlug]);

  useEffect(() => {
    if (!token || !form.stateSlug) { setCities([]); return; }
    fetch(`/api/cities?state=${encodeURIComponent(form.stateSlug)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()).then((d) => setCities(Array.isArray(d) ? d : [])).catch(() => setCities([]));
  }, [token, form.stateSlug]);

  // ── handleSubmit (with pending image uploads) ──────────────────────────────
  async function handleSubmit(targetStatus: "APPROVED" | "PENDING_MODERATION" | "DRAFT") {
    if (!token) { toast.error("No autenticado"); return; }
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    if (targetStatus !== "DRAFT") {
      if (form.description.trim().length < 10) { toast.error("La descripción debe tener al menos 10 caracteres"); return; }
      if (!form.address.trim())                 { toast.error("La dirección es requerida"); return; }
    }

    setBusy(true);
    try {
      // 1) Upload pending images (banner / poster / gallery) — only those with .file
      let bannerUrl = form.banner.url;
      if (form.banner.file) {
        const r = await api.uploadImage(form.banner.file, token);
        bannerUrl = r.url;
        // clear file to avoid re-upload on next handleSubmit (Pitfall #4)
        set("banner", { file: null, url: r.url });
      }

      let posterUrl = form.poster.url;
      if (form.poster.file) {
        const r = await api.uploadImage(form.poster.file, token);
        posterUrl = r.url;
        set("poster", { file: null, url: r.url });
      }

      const galleryUrls: string[] = [];
      const newGallery: ImageSlot[] = [...form.gallery];
      for (let i = 0; i < form.gallery.length; i++) {
        const g = form.gallery[i];
        if (g.file) {
          const r = await api.uploadImage(g.file, token);
          newGallery[i] = { file: null, url: r.url };
          galleryUrls.push(r.url);
        } else if (g.url) {
          galleryUrls.push(g.url);
        }
      }
      set("gallery", newGallery);

      // 2) Build payload
      const payload = {
        title:         form.title.trim(),
        company:       form.company.trim()       || undefined,
        description:   form.description.trim(),
        about:         form.about.trim()         || undefined,
        address:       form.address.trim(),
        addressNumber: form.addressNumber.trim() || undefined,
        ticketUrl:     form.ticketUrl.trim()     || undefined,
        banner:        bannerUrl                 || undefined,
        poster:        posterUrl                 || undefined,
        gallery:       galleryUrls.length ? galleryUrls : undefined,
        categoryId:    form.categoryId ? Number(form.categoryId) : undefined,
        cityId:        form.cityId     ? Number(form.cityId)     : undefined,

        prices: form.isFree
          ? [{ name: "Entrada", price: 0 }]
          : form.prices
              .filter((p) => p.amount)
              .map((p) => ({ name: p.name || "General", price: Number(p.amount) })),

        dates: form.dates
          .filter((d) => d.date)
          .map((d) => ({
            date:      d.date,
            startTime: d.startTime || undefined,
            endTime:   d.endTime   || undefined,
          })),

        socialLinks: form.socials.filter((s) => s.link.trim()).map((s) => ({ link: s.link.trim() })),
        videos:      form.videos .filter((v) => v.link.trim()).map((v) => ({ link: v.link.trim() })),
      };

      // 3) Submit
      const url    = mode === "create" ? "/api/events" : `/api/events/${initial!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const r = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Error al guardar");
      }

      const saved = await r.json() as { id: number; status?: string };

      // 4) If admin requested APPROVED but backend left it PENDING_MODERATION, approve explicitly
      if (targetStatus === "APPROVED" && saved.status !== "APPROVED") {
        await fetch(`/api/events/${saved.id}/approve`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      toast.success(mode === "create" ? "Evento creado" : "Evento actualizado", {
        description: targetStatus === "APPROVED"
          ? "Publicado directamente"
          : targetStatus === "PENDING_MODERATION"
            ? "En revisión"
            : "Guardado como borrador",
      });
      router.push("/dashboard/events");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  // Compute CTA label from mode × form.status — locked table per UI-SPEC
  const ctaLabel = busy
    ? "Guardando…"
    : mode === "create"
      ? form.status === "APPROVED"             ? "Crear y publicar →"
        : form.status === "PENDING_MODERATION" ? "Crear en revisión →"
        :                                        "Crear borrador →"
      : form.status === "APPROVED"             ? "Guardar y publicar →"
        : form.status === "PENDING_MODERATION" ? "Guardar en revisión →"
        :                                        "Guardar borrador →";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 100 }}>

      {/* Back link */}
      <Link href="/dashboard/events" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13, marginBottom: 24 }}>
        ◀ Volver a eventos
      </Link>

      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, margin: 0 }}>
          {mode === "create" ? "Crear evento" : "Editar evento"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "6px 0 0" }}>
          {mode === "create"
            ? "Creando como admin · sin checkout ni upsell."
            : `Editando evento #${initial?.id} · no se notifica al organizador.`}
        </p>
      </div>

      {/* ── Panel 01 — Información básica ─────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="01" title="Información básica" />

        <div className="grid-2">
          <div className="field">
            <label>Título del evento <span style={{ color: "var(--err)" }}>*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ej: Anime Crunchyroll Fest 2025"
            />
          </div>
          <div className="field">
            <label>Empresa organizadora (pública)</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Ej: Productora 8U, Cinépolis Chile"
            />
          </div>
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
            <input
              type="url"
              value={form.ticketUrl}
              onChange={(e) => set("ticketUrl", e.target.value)}
              placeholder="https://ticketmaster.com/..."
            />
          </div>
        </div>

        <div className="field">
          <label>Descripción corta <span style={{ color: "var(--err)" }}>*</span></label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Aparece en la card del evento. Mínimo 10 caracteres al publicar."
          />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Sobre el evento (texto completo)</label>
          <textarea
            rows={6}
            value={form.about}
            onChange={(e) => set("about", e.target.value)}
            placeholder="Descripción larga que aparece en el detalle del evento."
          />
        </div>
      </div>

      {/* ── Panel 02 — Precio ──────────────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="02" title="Precio" />

        <div style={{ marginBottom: form.isFree ? 0 : 14 }}>
          <Checkbox
            checked={form.isFree}
            onChange={() => set("isFree", !form.isFree)}
            label="Evento gratuito"
          />
        </div>

        {!form.isFree && (
          <div style={{ marginTop: 16 }}>
            {form.prices.map((p, i) => (
              <div className="price-row" key={i}>
                <div className="field" style={{ margin: 0 }}>
                  <label>Nombre de tarifa</label>
                  <input type="text" placeholder="Ej: General, VIP, Estudiante" value={p.name}
                         onChange={(e) => updatePrice(i, "name", e.target.value)} />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label>Precio</label>
                  <div className="input-prefix">
                    <span>$</span>
                    <input type="number" min="0" placeholder="0" value={p.amount}
                           onChange={(e) => updatePrice(i, "amount", e.target.value)} />
                    <span className="suffix">CLP</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "end" }}>
                  {form.prices.length > 1 && (
                    <button type="button" className="icon-btn" aria-label="Eliminar" onClick={() => removePrice(i)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="add-line" onClick={addPrice}>+ Agregar otra tarifa</button>
          </div>
        )}
      </div>

      {/* ── Panel 03 — Fechas, horario y ubicación ────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="03" title="Fechas, horario y ubicación" />

        {form.dates.map((d, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div className="grid-3">
              <div className="field" style={{ margin: 0 }}>
                <label>Fecha {i > 0 ? `(día ${i + 1})` : ""}</label>
                <input type="date" value={d.date} onChange={(e) => updateDate(i, "date", e.target.value)} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Hora inicio</label>
                <input type="time" value={d.startTime} onChange={(e) => updateDate(i, "startTime", e.target.value)} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Hora término</label>
                <input type="time" value={d.endTime} onChange={(e) => updateDate(i, "endTime", e.target.value)} />
              </div>
            </div>
            {form.dates.length > 1 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                <button type="button" className="icon-btn" aria-label="Eliminar" onClick={() => removeDate(i)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            )}
          </div>
        ))}
        <button type="button" className="add-line" onClick={addDate} style={{ marginBottom: 16 }}>+ Agregar otro día</button>

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

        <div className="grid-2" style={{ marginBottom: 0 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Dirección <span style={{ color: "var(--err)" }}>*</span></label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Av. Providencia 1234, Providencia, Santiago"
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Número / Piso</label>
            <input
              type="text"
              value={form.addressNumber}
              onChange={(e) => set("addressNumber", e.target.value)}
              placeholder="Of. 201, piso 3…"
            />
          </div>
        </div>
      </div>

      {/* ── Panel 04 — Multimedia ─────────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="04" title="Multimedia" sub="Opcional" />

        <div className="upload-grid">
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Banner (horizontal · 16:9)</label>
            <ImageUploadBox
              variant="banner"
              slot={form.banner}
              onPick={(f) => set("banner", { file: f, url: form.banner.url })}
              onRemove={() => set("banner", { file: null, url: "" })}
              label="Sube una imagen horizontal"
              hint="JPG / PNG · máx 5MB · sin texto sobreimpreso"
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>Poster (vertical · 2:3)</label>
            <ImageUploadBox
              variant="poster"
              slot={form.poster}
              onPick={(f) => set("poster", { file: f, url: form.poster.url })}
              onRemove={() => set("poster", { file: null, url: "" })}
              label="Poster oficial"
              hint="JPG / PNG · 1200×1800"
            />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)", marginBottom: 8 }}>Galería</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {form.gallery.map((g, i) => (
              <ImageUploadBox
                key={i}
                variant="gallery"
                slot={g}
                onPick={(f) => updateGallery(i, { file: f, url: g.url })}
                onRemove={() => updateGallery(i, { file: null, url: "" })}
                label={`Imagen ${i + 1}`}
              />
            ))}
          </div>
          <div className="help" style={{ marginTop: 10 }}>Hasta 8 imágenes. Aparecerán en la sección "Galería" del evento.</div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-2)", marginBottom: 8 }}>Videos</div>
          {form.videos.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div className="input-prefix" style={{ flex: 1 }}>
                <span>▶</span>
                <input type="url" placeholder="https://youtube.com/watch?v=..." value={v.link}
                       onChange={(e) => updateVideo(i, e.target.value)} />
              </div>
              {form.videos.length > 1 && (
                <button type="button" className="icon-btn" aria-label="Eliminar" onClick={() => removeVideo(i)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          ))}
          <button type="button" className="add-line" onClick={addVideo}>+ Agregar otro video</button>
        </div>
      </div>

      {/* ── Panel 05 — Redes sociales ─────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="05" title="Redes sociales" sub="Opcional" />

        {form.socials.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div className="input-prefix" style={{ flex: 1 }}>
              <span>@</span>
              <input type="url" placeholder="instagram.com/tu-evento" value={s.link}
                     onChange={(e) => updateSocial(i, e.target.value)} />
            </div>
            {form.socials.length > 1 && (
              <button type="button" className="icon-btn" aria-label="Eliminar" onClick={() => removeSocial(i)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        ))}
        <button type="button" className="add-line" onClick={addSocial}>+ Agregar otra red social</button>
      </div>

      {/* ── Panel 06 — Administración (admin-only) ────────────────────────── */}
      {isAdmin && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <SectionHead n="06" title="Administración" sub="Solo admin" />
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Estado de publicación</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value as FormData["status"])}>
              <option value="APPROVED">Publicado (directo)</option>
              <option value="PENDING_MODERATION">En revisión</option>
              <option value="DRAFT">Borrador</option>
            </select>
            <div className="help">Define en qué estado queda el evento al guardarlo.</div>
          </div>
        </div>
      )}

      {/* ── Sticky footer ─────────────────────────────────────────────────── */}
      <div className="form-foot">
        <div className="container">
          {/* LEFT: informational text only (NEVER a select) */}
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {mode === "create"
              ? "Creando como admin · sin checkout ni upsell."
              : `Editando evento #${initial?.id} · no se notifica al organizador.`}
          </span>

          {/* RIGHT: 3 buttons in fixed order */}
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/dashboard/events" className="btn ghost">Cancelar</Link>
            <button
              type="button"
              className="btn dark"
              disabled={busy}
              onClick={() => handleSubmit("DRAFT")}
            >
              Guardar borrador
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={() => handleSubmit(form.status)}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
