"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, imageUrl } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type Category = { id: number; name: string; slug: string };
type Country  = { id: number; name: string; slug: string };
type State    = { id: number; name: string; slug: string };
type City     = { id: number; name: string };

type ImageSlot =
  | null
  | { kind: "pending";  file: File; preview: string }
  | { kind: "uploaded"; url: string };

type PriceTier = { name: string; amount: string };
type DateSlot  = { date: string; start: string; end: string };

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
  isFree:        boolean;
  prices:        PriceTier[];
  dates:         DateSlot[];
  socials:       string[];
  videos:        string[];
  banner:        ImageSlot;
  poster:        ImageSlot;
  gallery:       ImageSlot[];
  status:        "APPROVED" | "PENDING_MODERATION" | "DRAFT";
};

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
  categoryId:    number | null;
  cityId:        number | null;
  status:        string;
  prices:        { name: string; price: number }[];
  dates:         { date: string | null; startTime: string | null; endTime: string | null }[];
  socialLinks:   { link: string | null }[];
  videos:        { link: string | null }[];
  gallery?:      string[];
  city?: {
    id: number; name: string;
    state?: { id: number; slug: string; country?: { slug: string } };
  } | null;
};

interface Props {
  mode:     "create" | "edit";
  initial?: InitialEvent;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function uploadSlot(slot: ImageSlot, token: string): Promise<string | undefined> {
  if (!slot) return undefined;
  if (slot.kind === "uploaded") return slot.url;
  const { url } = await api.uploadImage(slot.file, token);
  return url;
}

// ── Section heading ───────────────────────────────────────────────────────────

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

// ── Image uploader ─────────────────────────────────────────────────────────────

function ImageUploader({
  label, value, onChange, tall,
}: {
  label: string; value: ImageSlot; onChange: (s: ImageSlot) => void; tall?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no debe superar 5 MB."); return; }
    if (value?.kind === "pending") URL.revokeObjectURL(value.preview);
    onChange({ kind: "pending", file, preview: URL.createObjectURL(file) });
  };

  const src =
    value?.kind === "pending"  ? value.preview :
    value?.kind === "uploaded" ? imageUrl(value.url) : null;

  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block" }}>{label}</label>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} onChange={onFile} />
      {src ? (
        <div className={`upload-box ${tall ? "tall" : ""}`} style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button
            type="button"
            onClick={() => { if (value?.kind === "pending") URL.revokeObjectURL(value.preview); onChange(null); }}
            style={{
              position: "absolute", top: 8, right: 8,
              background: "rgba(0,0,0,.65)", color: "#fff",
              border: "none", borderRadius: 6, width: 28, height: 28,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}
          >✕</button>
        </div>
      ) : (
        <div className={`upload-box ${tall ? "tall" : ""}`} onClick={() => ref.current?.click()}>
          <div style={{ fontSize: 22, marginBottom: 4, opacity: .45 }}>↑</div>
          <div style={{ fontWeight: 500, color: "var(--ink-2)", fontSize: 13 }}>Subir imagen</div>
          <small style={{ fontSize: 11, color: "var(--ink-3)" }}>JPG / PNG / WebP · máx 5 MB</small>
        </div>
      )}
    </div>
  );
}

// ── Remove button ─────────────────────────────────────────────────────────────

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0, width: 32, height: 32, borderRadius: 6,
        border: "1px solid var(--line)", background: "transparent",
        color: "var(--ink-3)", cursor: "pointer", fontSize: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >✕</button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function EventForm({ mode, initial }: Props) {
  const router    = useRouter();
  const { token } = useUser();
  const [busy, setBusy] = useState(false);

  // Catalog
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries,  setCountries]  = useState<Country[]>([]);
  const [states,     setStates]     = useState<State[]>([]);
  const [cities,     setCities]     = useState<City[]>([]);

  // ── Initial state derivation ───────────────────────────────────────────────
  const initialPrices: PriceTier[] =
    initial && initial.prices.length && initial.prices[0].price !== 0
      ? initial.prices.map((p) => ({ name: p.name, amount: String(p.price) }))
      : [{ name: "General", amount: "" }];

  const initialDates: DateSlot[] =
    initial && initial.dates.length
      ? initial.dates.map((d) => ({
          date:  d.date ? d.date.slice(0, 10) : "",
          start: d.startTime ?? "",
          end:   d.endTime   ?? "",
        }))
      : [{ date: "", start: "", end: "" }];

  const initialSocials: string[] =
    initial && initial.socialLinks.length
      ? initial.socialLinks.map((s) => s.link ?? "").filter(Boolean)
      : [""];

  const initialVideos: string[] =
    initial && initial.videos.length
      ? initial.videos.map((v) => v.link ?? "").filter(Boolean)
      : [""];

  const initialBanner: ImageSlot =
    initial?.banner ? { kind: "uploaded", url: initial.banner } : null;

  const initialPoster: ImageSlot =
    initial?.poster ? { kind: "uploaded", url: initial.poster } : null;

  const initialGallery: ImageSlot[] =
    initial?.gallery?.length
      ? initial.gallery.map((url) => ({ kind: "uploaded" as const, url }))
      : [];

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormData>({
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
    isFree:        initial
                     ? (initial.prices.length === 0 || initial.prices[0]?.price === 0)
                     : false,
    prices:        initialPrices,
    dates:         initialDates,
    socials:       initialSocials.length ? initialSocials : [""],
    videos:        initialVideos.length  ? initialVideos  : [""],
    banner:        initialBanner,
    poster:        initialPoster,
    gallery:       initialGallery,
    status:        initial?.status === "APPROVED"
                     ? "APPROVED"
                     : initial?.status === "PENDING_MODERATION"
                       ? "PENDING_MODERATION"
                       : "DRAFT",
  });

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Catalog cascade ────────────────────────────────────────────────────────

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
    })
      .then((r) => r.json())
      .then((d) => setStates(Array.isArray(d) ? d : []))
      .catch(() => setStates([]));
  }, [token, form.countrySlug]);

  useEffect(() => {
    if (!token || !form.stateSlug) { setCities([]); return; }
    fetch(`/api/cities?state=${encodeURIComponent(form.stateSlug)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCities(Array.isArray(d) ? d : []))
      .catch(() => setCities([]));
  }, [token, form.stateSlug]);

  // ── Price tiers ────────────────────────────────────────────────────────────

  const addPrice = () =>
    set("prices", [...form.prices, { name: "", amount: "" }]);

  const removePrice = (i: number) =>
    set("prices", form.prices.filter((_, j) => j !== i));

  const updatePrice = (i: number, key: keyof PriceTier, val: string) =>
    set("prices", form.prices.map((p, j) => j === i ? { ...p, [key]: val } : p));

  // ── Dates ──────────────────────────────────────────────────────────────────

  const addDate = () =>
    set("dates", [...form.dates, { date: "", start: "", end: "" }]);

  const removeDate = (i: number) =>
    set("dates", form.dates.filter((_, j) => j !== i));

  const updateDate = (i: number, key: keyof DateSlot, val: string) =>
    set("dates", form.dates.map((d, j) => j === i ? { ...d, [key]: val } : d));

  // ── Social links ───────────────────────────────────────────────────────────

  const addSocial = () => set("socials", [...form.socials, ""]);

  const removeSocial = (i: number) =>
    set("socials", form.socials.filter((_, j) => j !== i));

  const updateSocial = (i: number, val: string) =>
    set("socials", form.socials.map((s, j) => j === i ? val : s));

  // ── Videos ─────────────────────────────────────────────────────────────────

  const addVideo = () => set("videos", [...form.videos, ""]);

  const removeVideo = (i: number) =>
    set("videos", form.videos.filter((_, j) => j !== i));

  const updateVideo = (i: number, val: string) =>
    set("videos", form.videos.map((v, j) => j === i ? val : v));

  // ── Gallery ────────────────────────────────────────────────────────────────

  const galRef = useRef<HTMLInputElement>(null);

  const onGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("La imagen no debe superar 5 MB."); return; }
    set("gallery", [...form.gallery, { kind: "pending", file, preview: URL.createObjectURL(file) }]);
  };

  const removeGallery = (i: number) => {
    const slot = form.gallery[i];
    if (slot?.kind === "pending") URL.revokeObjectURL(slot.preview);
    set("gallery", form.gallery.filter((_, j) => j !== i));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(targetStatus: "APPROVED" | "PENDING_MODERATION" | "DRAFT") {
    if (!token) { toast.error("No autenticado"); return; }
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
    if (targetStatus !== "DRAFT") {
      if (form.description.trim().length < 10) {
        toast.error("La descripción debe tener al menos 10 caracteres"); return;
      }
      if (!form.address.trim()) { toast.error("La dirección es requerida"); return; }
    }

    setBusy(true);
    try {
      // Upload images in parallel
      const [bannerUrl, posterUrl, galleryUrls] = await Promise.all([
        uploadSlot(form.banner,  token),
        uploadSlot(form.poster,  token),
        Promise.all(form.gallery.map((g) => uploadSlot(g, token))),
      ]);

      const socialLinks = form.socials
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => ({ link: s }));

      const videos = form.videos
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => ({ link: v }));

      const prices = form.isFree
        ? [{ name: "Entrada", price: 0 }]
        : form.prices
            .filter((p) => p.name.trim())
            .map((p) => ({ name: p.name.trim(), price: Number(p.amount) || 0 }));

      const dates = form.dates
        .filter((d) => d.date)
        .map((d) => ({
          date:      d.date,
          startTime: d.start || undefined,
          endTime:   d.end   || undefined,
        }));

      const gallery = galleryUrls.filter((u): u is string => !!u);

      const payload = {
        title:         form.title.trim(),
        company:       form.company.trim()       || undefined,
        description:   form.description.trim(),
        about:         form.about.trim()         || undefined,
        address:       form.address.trim(),
        addressNumber: form.addressNumber.trim() || undefined,
        ticketUrl:     form.ticketUrl.trim()     || undefined,
        banner:        bannerUrl,
        poster:        posterUrl,
        gallery:       gallery.length ? gallery : undefined,
        categoryId:    form.categoryId ? Number(form.categoryId) : undefined,
        cityId:        form.cityId     ? Number(form.cityId)     : undefined,
        prices:        prices.length   ? prices : undefined,
        dates:         dates.length    ? dates  : undefined,
        socialLinks:   socialLinks.length ? socialLinks : undefined,
        videos:        videos.length      ? videos      : undefined,
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
        throw new Error((err as { message?: string }).message ?? "Error al guardar");
      }

      const saved = await r.json() as { id: number; status?: string };

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 120 }}>

      {/* Back */}
      <Link
        href="/dashboard/events"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13, marginBottom: 24 }}
      >
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

      {/* ── 1. Información básica ─────────────────────────────────────────── */}
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
            <div className="help">Nombre que aparece públicamente como organizador.</div>
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
            <div className="help">Link a plataforma externa de venta de entradas.</div>
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

      {/* ── 2. Precio ─────────────────────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="02" title="Precio" />

        <div style={{ marginBottom: 16 }}>
          <Checkbox
            checked={form.isFree}
            onChange={() => set("isFree", !form.isFree)}
            label="Evento gratuito"
          />
        </div>

        {!form.isFree && (
          <div>
            {form.prices.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updatePrice(i, "name", e.target.value)}
                  placeholder="General / VIP / Preventa…"
                  style={{ flex: 2, minWidth: 0 }}
                />
                <div className="input-prefix" style={{ flex: 1, minWidth: 0 }}>
                  <span>$</span>
                  <input
                    type="number"
                    value={p.amount}
                    onChange={(e) => updatePrice(i, "amount", e.target.value)}
                    placeholder="9990"
                    min="0"
                  />
                </div>
                {form.prices.length > 1 && (
                  <RemoveBtn onClick={() => removePrice(i)} />
                )}
              </div>
            ))}
            <button type="button" className="add-line" onClick={addPrice}>
              + Agregar tarifa
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Fechas y ubicación ─────────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="03" title="Fechas y ubicación" />

        {/* Dates */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: "var(--ink-2)" }}>
            Días del evento
          </div>
          {form.dates.map((d, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div className="grid-3">
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12 }}>Fecha {i > 0 ? `(día ${i + 1})` : ""}</label>
                  <input
                    type="date"
                    value={d.date}
                    onChange={(e) => updateDate(i, "date", e.target.value)}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12 }}>Hora inicio</label>
                  <input
                    type="time"
                    value={d.start}
                    onChange={(e) => updateDate(i, "start", e.target.value)}
                  />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12 }}>Hora término</label>
                  <input
                    type="time"
                    value={d.end}
                    onChange={(e) => updateDate(i, "end", e.target.value)}
                  />
                </div>
              </div>
              {form.dates.length > 1 && (
                <div style={{ marginTop: 6 }}>
                  <RemoveBtn onClick={() => removeDate(i)} />
                </div>
              )}
            </div>
          ))}
          <button type="button" className="add-line" onClick={addDate}>
            + Agregar otro día
          </button>
        </div>

        {/* Location */}
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

      {/* ── 4. Multimedia ─────────────────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="04" title="Multimedia" sub="Opcional" />

        {/* Banner + Poster */}
        <div className="upload-grid" style={{ marginBottom: 20 }}>
          <ImageUploader
            label="Banner (horizontal · 16:9)"
            value={form.banner}
            onChange={(s) => set("banner", s)}
          />
          <ImageUploader
            label="Poster (vertical · 2:3)"
            value={form.poster}
            onChange={(s) => set("poster", s)}
            tall
          />
        </div>

        {/* Gallery */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--ink-2)" }}>
            Galería
          </div>
          <input
            ref={galRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={onGalleryFile}
          />
          <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {form.gallery.map((slot, i) => {
              const src =
                slot?.kind === "pending"  ? slot.preview :
                slot?.kind === "uploaded" ? imageUrl(slot.url) : null;
              return src ? (
                <div
                  key={i}
                  className="upload-box"
                  style={{ aspectRatio: "1/1", padding: 0, overflow: "hidden", position: "relative" }}
                >
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => removeGallery(i)}
                    style={{
                      position: "absolute", top: 6, right: 6,
                      background: "rgba(0,0,0,.65)", color: "#fff",
                      border: "none", borderRadius: 4, width: 24, height: 24,
                      cursor: "pointer", fontSize: 12,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >✕</button>
                </div>
              ) : null;
            })}
            {form.gallery.length < 10 && (
              <div
                className="upload-box"
                style={{ aspectRatio: "1/1", padding: 14 }}
                onClick={() => galRef.current?.click()}
              >
                <div style={{ fontSize: 22, opacity: .45 }}>+</div>
                <small style={{ fontSize: 10 }}>Agregar</small>
              </div>
            )}
          </div>
          <div className="help" style={{ marginTop: 8 }}>
            Hasta 10 imágenes. Aparecen en la sección &ldquo;Galería&rdquo; del evento.
          </div>
        </div>

        {/* Videos */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: "var(--ink-2)" }}>
            Videos
          </div>
          {form.videos.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <div className="input-prefix" style={{ flex: 1 }}>
                <span>▶</span>
                <input
                  type="url"
                  value={v}
                  onChange={(e) => updateVideo(i, e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              {form.videos.length > 1 && (
                <RemoveBtn onClick={() => removeVideo(i)} />
              )}
            </div>
          ))}
          <button type="button" className="add-line" onClick={addVideo}>
            + Agregar otro video
          </button>
        </div>
      </div>

      {/* ── 5. Redes sociales ─────────────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="05" title="Redes sociales" sub="Opcional" />

        {form.socials.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <div className="input-prefix" style={{ flex: 1 }}>
              <span>@</span>
              <input
                type="url"
                value={s}
                onChange={(e) => updateSocial(i, e.target.value)}
                placeholder="https://instagram.com/tu-evento"
              />
            </div>
            {form.socials.length > 1 && (
              <RemoveBtn onClick={() => removeSocial(i)} />
            )}
          </div>
        ))}
        <button type="button" className="add-line" onClick={addSocial}>
          + Agregar otra red social
        </button>
      </div>

      {/* ── Sticky footer ─────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        padding: "16px 32px",
        borderTop: "1px solid var(--line)",
        background: "color-mix(in oklab, var(--bg) 92%, transparent)",
        backdropFilter: "blur(12px)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 20,
      }}>
        {/* Status selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Estado:</span>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as FormData["status"])}
            style={{
              padding: "8px 12px", borderRadius: 8, fontSize: 13,
              background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink)",
            }}
          >
            <option value="APPROVED">Publicado (directo)</option>
            <option value="PENDING_MODERATION">En revisión</option>
            <option value="DRAFT">Borrador</option>
          </select>
        </div>

        {/* Actions */}
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
                ? "Enviar a revisión →"
                : "Guardar borrador →"}
          </button>
        </div>
      </div>
    </div>
  );
}
