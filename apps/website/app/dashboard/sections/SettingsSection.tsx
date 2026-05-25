"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

// ── numeric settings loaded from /api/settings ──────────────────────────────

type NumericField = {
  key: string;
  label: string;
  defaultValue: number;
  suffix?: string;
};

const AVISOS_FIELDS: NumericField[] = [
  { key: "aviso_price_per_day",   label: "Precio por día (CLP)",              defaultValue: 8000,  suffix: "CLP" },
  { key: "aviso_min_days",        label: "Días mínimos de publicación",        defaultValue: 10 },
  { key: "aviso_max_days",        label: "Días máximos de publicación",        defaultValue: 30 },
  { key: "aviso_max_slots",       label: "Cupo máximo de avisos simultáneos",  defaultValue: 12 },
];

const PORTADAS_FIELDS: NumericField[] = [
  { key: "portada_price_per_day", label: "Precio por día (CLP)",                defaultValue: 15000, suffix: "CLP" },
  { key: "portada_min_days",      label: "Días mínimos",                        defaultValue: 10 },
  { key: "portada_max_days",      label: "Días máximos",                        defaultValue: 30 },
  { key: "portada_max_slots",     label: "Cupo máximo de portadas simultáneas", defaultValue: 5 },
];

const SUBS_FIELDS: NumericField[] = [
  { key: "sub_monthly_price",     label: "Precio mensual (CLP)",                       defaultValue: 29990, suffix: "CLP" },
  { key: "sub_credits_per_month", label: "Créditos por mes",                           defaultValue: 10 },
  { key: "sub_aviso_discount",    label: "Descuento avisos para suscriptores (%)",     defaultValue: 20,    suffix: "%" },
  { key: "sub_portada_discount",  label: "Descuento portadas para suscriptores (%)",   defaultValue: 20,    suffix: "%" },
];

// ── service list items ───────────────────────────────────────────────────────

const DEFAULT_FOTO_SERVICES = [
  "Cobertura completa del evento",
  "Sesión previa al evento",
  "Entrega en 48 horas",
  "Edición básica incluida",
  "Galería digital privada",
];

const DEFAULT_CREATOR_SERVICES = [
  "Reels para Instagram/TikTok",
  "Aftermovie (1-3 min)",
  "Cobertura en vivo (stories)",
  "Video resumen",
  "Fotografía básica",
];

// ── helpers ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
  width: 220,
};

const inputFocusProps = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "var(--accent)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = "var(--line)"),
};

// ── sub-component: numeric settings block ────────────────────────────────────

function NumericBlock({
  title,
  fields,
  values,
  onChange,
  onSave,
  busy,
}: {
  title: string;
  fields: NumericField[];
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onSave: (keys: string[]) => void;
  busy: boolean;
}) {
  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="ph">
        <h3>{title}</h3>
        <button
          className="btn primary sm"
          onClick={() => onSave(fields.map((f) => f.key))}
          disabled={busy}
        >
          {busy ? "Guardando…" : "Guardar"}
        </button>
      </div>
      <div className="settings-form">
        {fields.map((f) => (
          <div className="settings-row" key={f.key}>
            <label htmlFor={f.key}>{f.label}</label>
            <input
              id={f.key}
              type="number"
              min={0}
              value={values[f.key] ?? String(f.defaultValue)}
              onChange={(e) => onChange(f.key, e.target.value)}
              style={inputStyle}
              {...inputFocusProps}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── sub-component: service CRUD list ─────────────────────────────────────────

function ServiceList({
  title,
  items,
  onUpdate,
}: {
  title: string;
  items: string[];
  onUpdate: (next: string[]) => void;
}) {
  const [newItem, setNewItem] = useState("");

  const add = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    if (items.includes(trimmed)) {
      toast.error("Ya existe ese servicio");
      return;
    }
    onUpdate([...items, trimmed]);
    setNewItem("");
    toast.success("Guardado localmente");
  };

  const remove = (i: number) => {
    onUpdate(items.filter((_, idx) => idx !== i));
    toast.success("Guardado localmente");
  };

  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="ph">
        <h3>{title}</h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {items.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: 0 }}>Sin servicios aún.</p>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 14px",
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: 8,
            }}
          >
            <span style={{ fontSize: 13.5 }}>{item}</span>
            <button
              onClick={() => remove(i)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                background: "transparent",
                border: "1px solid var(--line)",
                color: "var(--err)",
                fontSize: 12,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Nuevo servicio…"
          style={{ ...inputStyle, flex: 1, width: "auto" }}
          {...inputFocusProps}
        />
        <button
          className="btn primary sm"
          onClick={add}
          disabled={!newItem.trim()}
        >
          Agregar servicio
        </button>
      </div>
    </div>
  );
}

// ── sub-component: legal texts ───────────────────────────────────────────────

const LEGAL_TEXTS = [
  { key: "legal_terms",   label: "Términos y condiciones" },
  { key: "legal_privacy", label: "Política de privacidad" },
  { key: "legal_cookies", label: "Política de cookies" },
];

function LegalBlock({
  values,
  onChange,
  onSave,
  busy,
}: {
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onSave: (key: string) => void;
  busy: boolean;
}) {
  return (
    <div className="panel" style={{ marginBottom: 20 }}>
      <div className="ph">
        <h3>Textos legales</h3>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
        }}
      >
        {LEGAL_TEXTS.map((t) => (
          <div key={t.key}>
            <label
              htmlFor={t.key}
              style={{
                display: "block",
                fontSize: 12,
                color: "var(--ink-3)",
                fontFamily: "var(--font-mono)",
                letterSpacing: ".1em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {t.label}
            </label>
            <textarea
              id={t.key}
              rows={8}
              value={values[t.key] ?? ""}
              onChange={(e) => onChange(t.key, e.target.value)}
              placeholder={`Contenido de ${t.label.toLowerCase()}…`}
              style={{
                width: "100%",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                color: "var(--ink)",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.6,
              }}
              {...inputFocusProps}
            />
            <button
              className="btn ghost sm"
              onClick={() => onSave(t.key)}
              disabled={busy}
              style={{ marginTop: 8 }}
            >
              {busy ? "Guardando…" : "Guardar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function SettingsSection() {
  const { token } = useUser();

  // numeric settings: flat key→value map
  const defaultNumeric: Record<string, string> = {};
  [...AVISOS_FIELDS, ...PORTADAS_FIELDS, ...SUBS_FIELDS].forEach(
    (f) => (defaultNumeric[f.key] = String(f.defaultValue))
  );

  const [numeric, setNumeric] = useState<Record<string, string>>(defaultNumeric);
  const [busy, setBusy] = useState(false);

  // service lists
  const [fotoServices, setFotoServices] = useState<string[]>(DEFAULT_FOTO_SERVICES);
  const [creatorServices, setCreatorServices] = useState<string[]>(DEFAULT_CREATOR_SERVICES);

  // legal texts
  const [legalValues, setLegalValues] = useState<Record<string, string>>({});
  const [legalBusy, setLegalBusy] = useState(false);

  // load settings on mount
  useEffect(() => {
    if (!token) return;
    fetch("/api/settings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) return;
        const data: Array<{ key: string; value: string }> = await r.json();
        if (!Array.isArray(data)) return;
        const patch: Record<string, string> = {};
        const legalPatch: Record<string, string> = {};
        data.forEach(({ key, value }) => {
          if (key in defaultNumeric) patch[key] = value;
          if (LEGAL_TEXTS.some((t) => t.key === key)) legalPatch[key] = value;
        });
        if (Object.keys(patch).length > 0)
          setNumeric((prev) => ({ ...prev, ...patch }));
        if (Object.keys(legalPatch).length > 0)
          setLegalValues((prev) => ({ ...prev, ...legalPatch }));
      })
      .catch(() => {/* use defaults */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleNumericChange = (key: string, val: string) =>
    setNumeric((prev) => ({ ...prev, [key]: val }));

  const saveNumeric = async (keys: string[]) => {
    if (!token) return;
    setBusy(true);
    try {
      const body: Record<string, string> = {};
      keys.forEach((k) => (body[k] = numeric[k]));
      const r = await fetch("/api/settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Error al guardar");
      toast.success("Configuración guardada");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  };

  const saveLegal = async (key: string) => {
    if (!token) return;
    setLegalBusy(true);
    try {
      const r = await fetch("/api/settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [key]: legalValues[key] ?? "" }),
      });
      if (!r.ok) throw new Error("Error al guardar");
      toast.success("Texto legal guardado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setLegalBusy(false);
    }
  };

  return (
    <>
      <div className="section-head">
        <h2>Configuración</h2>
      </div>

      {/* 1. Avisos — Precios y límites */}
      <div className="section-head" style={{ marginBottom: 12, marginTop: 8 }}>
        <h2 style={{ fontSize: 15, color: "var(--ink-2)" }}>Avisos — Precios y límites</h2>
      </div>
      <NumericBlock
        title="Avisos"
        fields={AVISOS_FIELDS}
        values={numeric}
        onChange={handleNumericChange}
        onSave={saveNumeric}
        busy={busy}
      />

      {/* 2. Portadas — Precios y límites */}
      <div className="section-head" style={{ marginBottom: 12, marginTop: 4 }}>
        <h2 style={{ fontSize: 15, color: "var(--ink-2)" }}>Portadas — Precios y límites</h2>
      </div>
      <NumericBlock
        title="Portadas"
        fields={PORTADAS_FIELDS}
        values={numeric}
        onChange={handleNumericChange}
        onSave={saveNumeric}
        busy={busy}
      />

      {/* 3. Suscripción — Configuración */}
      <div className="section-head" style={{ marginBottom: 12, marginTop: 4 }}>
        <h2 style={{ fontSize: 15, color: "var(--ink-2)" }}>Suscripción — Configuración</h2>
      </div>
      <NumericBlock
        title="Suscripción"
        fields={SUBS_FIELDS}
        values={numeric}
        onChange={handleNumericChange}
        onSave={saveNumeric}
        busy={busy}
      />

      {/* 4. Servicios de fotografía */}
      <div className="section-head" style={{ marginBottom: 12, marginTop: 4 }}>
        <h2 style={{ fontSize: 15, color: "var(--ink-2)" }}>Servicios de fotografía</h2>
      </div>
      <ServiceList
        title="Fotografía"
        items={fotoServices}
        onUpdate={setFotoServices}
      />

      {/* 5. Servicios de creadores de contenido */}
      <div className="section-head" style={{ marginBottom: 12, marginTop: 4 }}>
        <h2 style={{ fontSize: 15, color: "var(--ink-2)" }}>Servicios de creadores de contenido</h2>
      </div>
      <ServiceList
        title="Creadores de contenido"
        items={creatorServices}
        onUpdate={setCreatorServices}
      />

      {/* 6. Textos legales */}
      <div className="section-head" style={{ marginBottom: 12, marginTop: 4 }}>
        <h2 style={{ fontSize: 15, color: "var(--ink-2)" }}>Textos legales</h2>
      </div>
      <LegalBlock
        values={legalValues}
        onChange={(key, val) => setLegalValues((prev) => ({ ...prev, [key]: val }))}
        onSave={saveLegal}
        busy={legalBusy}
      />

      {/* 7. Integraciones */}
      <div className="section-head" style={{ marginBottom: 12, marginTop: 4 }}>
        <h2 style={{ fontSize: 15, color: "var(--ink-2)" }}>Integraciones</h2>
      </div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="ph">
          <h3>Integraciones</h3>
        </div>
        <div className="settings-form">
          <div className="settings-row">
            <label htmlFor="payment_gateway">Pasarela de pago activa</label>
            <select
              id="payment_gateway"
              defaultValue="webpay"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--ink)",
                outline: "none",
                width: 220,
                cursor: "pointer",
              }}
            >
              <option value="webpay">WebPay (Transbank)</option>
              <option value="mercadopago" disabled>
                MercadoPago — Próximamente
              </option>
              <option value="flow" disabled>
                Flow — Próximamente
              </option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
