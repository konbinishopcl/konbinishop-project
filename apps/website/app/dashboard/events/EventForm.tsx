"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

// ── Types ──────────────────────────────────────────────────────────────────────

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
  countrySlug:   string;
  stateSlug:     string;
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
  city?: {
    id: number; name: string;
    state?: { id: number; slug: string; country?: { slug: string } };
  } | null;
};

interface Props {
  mode:     "create" | "edit";
  initial?: InitialEvent;
}

// ── Section heading ────────────────────────────────────────────────────────────

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

// ── Main component ─────────────────────────────────────────────────────────────

export function EventForm({ mode, initial }: Props) {
  const router     = useRouter();
  const { token }  = useUser();
  const [busy, setBusy] = useState(false);

  // Catalog data
  const [categories, setCategories] = useState<Category[]>([]);
  const [countries,  setCountries]  = useState<Country[]>([]);
  const [states,     setStates]     = useState<State[]>([]);
  const [cities,     setCities]     = useState<City[]>([]);

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
    stateSlug:     initial?.city?.state?.slug          ?? "",
    cityId:        initial?.cityId != null ? String(initial.cityId) : "",
    priceName:     initial?.prices[0]?.name   ?? "General",
    priceAmount:   initial?.prices[0]?.price != null ? String(initial.prices[0].price) : "",
    isFree:        initial
                     ? (initial.prices[0]?.price === 0 || initial.prices.length === 0)
                     : false,
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

  // ── Catalog cascade ──────────────────────────────────────────────────────────

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

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(targetStatus: "APPROVED" | "PENDING_MODERATION" | "DRAFT") {
    if (!token) { toast.error("No autenticado"); return; }
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }
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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", paddingBottom: 100 }}>

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

        <div style={{ marginBottom: form.isFree ? 0 : 14 }}>
          <Checkbox
            checked={form.isFree}
            onChange={() => set("isFree", !form.isFree)}
            label="Evento gratuito"
          />
        </div>

        {!form.isFree && (
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Tipo de tarifa</label>
              <input
                type="text"
                value={form.priceName}
                onChange={(e) => set("priceName", e.target.value)}
                placeholder="General / VIP / Preventa"
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Precio (CLP)</label>
              <input
                type="number"
                value={form.priceAmount}
                onChange={(e) => set("priceAmount", e.target.value)}
                placeholder="9990"
                min="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Fecha y ubicación ──────────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="03" title="Fecha, horario y ubicación" />

        <div className="grid-3">
          <div className="field">
            <label>Fecha del evento</label>
            <input type="date" value={form.dateStr} onChange={(e) => set("dateStr", e.target.value)} />
          </div>
          <div className="field">
            <label>Hora de inicio</label>
            <input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
          </div>
          <div className="field">
            <label>Hora de término</label>
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

        <div className="grid-2">
          <div className="field">
            <label>Banner (URL · 16:9)</label>
            <input
              type="url"
              value={form.banner}
              onChange={(e) => set("banner", e.target.value)}
              placeholder="https://..."
            />
            <div className="help">Imagen horizontal. 2400×1350 recomendado.</div>
          </div>
          <div className="field">
            <label>Poster (URL · 2:3)</label>
            <input
              type="url"
              value={form.poster}
              onChange={(e) => set("poster", e.target.value)}
              placeholder="https://..."
            />
            <div className="help">Imagen vertical. 1200×1800 recomendado.</div>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>Video (URL de YouTube)</label>
          <input
            type="url"
            value={form.videoUrl}
            onChange={(e) => set("videoUrl", e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      </div>

      {/* ── 5. Redes sociales ─────────────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <SectionHead n="05" title="Redes sociales" sub="Opcional" />

        <div className="grid-2" style={{ marginBottom: 0 }}>
          <div className="field">
            <label>Instagram</label>
            <input
              type="url"
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div className="field">
            <label>TikTok</label>
            <input
              type="url"
              value={form.tiktok}
              onChange={(e) => set("tiktok", e.target.value)}
              placeholder="https://tiktok.com/@..."
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Facebook</label>
            <input
              type="url"
              value={form.facebook}
              onChange={(e) => set("facebook", e.target.value)}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>X / Twitter</label>
            <input
              type="url"
              value={form.twitter}
              onChange={(e) => set("twitter", e.target.value)}
              placeholder="https://x.com/..."
            />
          </div>
        </div>
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
