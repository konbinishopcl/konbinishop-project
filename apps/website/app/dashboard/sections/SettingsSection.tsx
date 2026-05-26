"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

// ── numeric settings ─────────────────────────────────────────────────────────

type NumericField = {
  key: string;
  label: string;
  defaultValue: number;
};

const AVISOS_FIELDS: NumericField[] = [
  { key: "aviso_price_per_day", label: "Precio por día (CLP)", defaultValue: 8000 },
  { key: "aviso_min_days",      label: "Días mínimos",          defaultValue: 10 },
  { key: "aviso_max_days",      label: "Días máximos",          defaultValue: 30 },
  { key: "aviso_max_slots",     label: "Cupo máximo activos simultáneos", defaultValue: 12 },
];

const PORTADAS_FIELDS: NumericField[] = [
  { key: "portada_price_per_day", label: "Precio por día (CLP)", defaultValue: 15000 },
  { key: "portada_min_days",      label: "Días mínimos",          defaultValue: 10 },
  { key: "portada_max_days",      label: "Días máximos",          defaultValue: 30 },
  { key: "portada_max_slots",     label: "Cupo máximo activos simultáneos", defaultValue: 5 },
];

const SUBS_FIELDS: NumericField[] = [
  { key: "sub_monthly_price",     label: "Precio mensual (CLP)",         defaultValue: 9990 },
  { key: "sub_credits_per_month", label: "Créditos por mes",             defaultValue: 10 },
  { key: "sub_aviso_discount",    label: "Descuento avisos (%)",         defaultValue: 20 },
  { key: "sub_portada_discount",  label: "Descuento portadas (%)",       defaultValue: 20 },
];

// ── default services ─────────────────────────────────────────────────────────

const DEFAULT_FOTO_SERVICES = [
  { label: "Cobertura completa del evento", enabled: true },
  { label: "Sesión previa al evento",       enabled: true },
  { label: "Entrega en 48 horas",           enabled: false },
  { label: "Edición básica incluida",       enabled: true },
  { label: "Galería digital privada",       enabled: false },
];

const DEFAULT_CREATOR_SERVICES = [
  { label: "Reels para Instagram/TikTok",   enabled: true },
  { label: "Aftermovie (1-3 min)",          enabled: true },
  { label: "Cobertura en vivo (stories)",   enabled: false },
  { label: "Video resumen",                 enabled: true },
  { label: "Fotografía básica",             enabled: false },
];

// ── shared styles ─────────────────────────────────────────────────────────────

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

// ── NumericBlock ─────────────────────────────────────────────────────────────

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
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ServiceList ───────────────────────────────────────────────────────────────

type ServiceItem = { label: string; enabled: boolean };

function ServiceList({
  title,
  items,
  onUpdate,
}: {
  title: string;
  items: ServiceItem[];
  onUpdate: (next: ServiceItem[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");

  const toggle = (i: number) => {
    const next = items.map((item, idx) =>
      idx === i ? { ...item, enabled: !item.enabled } : item,
    );
    onUpdate(next);
  };

  const add = () => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    if (items.some((s) => s.label === trimmed)) {
      toast.error("Ya existe ese servicio");
      return;
    }
    onUpdate([...items, { label: trimmed, enabled: true }]);
    setNewLabel("");
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
          <label
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={item.enabled}
              onChange={() => toggle(i)}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }}
            />
            <span style={{ fontSize: 13.5, flex: 1 }}>{item.label}</span>
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Nuevo servicio…"
          style={{ ...inputStyle, flex: 1, width: "auto" }}
        />
        <button className="btn primary sm" onClick={add} disabled={!newLabel.trim()}>
          Agregar servicio
        </button>
      </div>
    </div>
  );
}

// ── LegalBlock ────────────────────────────────────────────────────────────────

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

  const defaultNumeric: Record<string, string> = {};
  [...AVISOS_FIELDS, ...PORTADAS_FIELDS, ...SUBS_FIELDS].forEach(
    (f) => (defaultNumeric[f.key] = String(f.defaultValue)),
  );

  const [numeric, setNumeric] = useState<Record<string, string>>(defaultNumeric);
  const [busy, setBusy] = useState(false);

  const [fotoServices, setFotoServices] = useState<ServiceItem[]>(DEFAULT_FOTO_SERVICES);
  const [creatorServices, setCreatorServices] = useState<ServiceItem[]>(DEFAULT_CREATOR_SERVICES);

  const [legalValues, setLegalValues] = useState<Record<string, string>>({});
  const [legalBusy, setLegalBusy] = useState(false);

  const [gateway, setGateway] = useState("transbank");
  const [apiKey, setApiKey] = useState("");
  const [integBusy, setIntegBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } })
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
        if (Object.keys(patch).length > 0) setNumeric((p) => ({ ...p, ...patch }));
        if (Object.keys(legalPatch).length > 0) setLegalValues((p) => ({ ...p, ...legalPatch }));
      })
      .catch(() => {/* use defaults */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const saveNumeric = async (keys: string[]) => {
    if (!token) return;
    setBusy(true);
    try {
      const body: Record<string, string> = {};
      keys.forEach((k) => (body[k] = numeric[k]));
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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

  const saveIntegration = async () => {
    if (!token) return;
    setIntegBusy(true);
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ payment_gateway: gateway, payment_api_key: apiKey }),
      });
      if (!r.ok) throw new Error("Error al guardar");
      toast.success("Integración guardada");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setIntegBusy(false);
    }
  };

  return (
    <>
      <div className="section-head">
        <h2>Configuración</h2>
      </div>

      {/* Block 1: Avisos */}
      <NumericBlock
        title="Avisos"
        fields={AVISOS_FIELDS}
        values={numeric}
        onChange={(k, v) => setNumeric((p) => ({ ...p, [k]: v }))}
        onSave={saveNumeric}
        busy={busy}
      />

      {/* Block 2: Portadas */}
      <NumericBlock
        title="Portadas"
        fields={PORTADAS_FIELDS}
        values={numeric}
        onChange={(k, v) => setNumeric((p) => ({ ...p, [k]: v }))}
        onSave={saveNumeric}
        busy={busy}
      />

      {/* Block 3: Suscripción */}
      <NumericBlock
        title="Suscripción"
        fields={SUBS_FIELDS}
        values={numeric}
        onChange={(k, v) => setNumeric((p) => ({ ...p, [k]: v }))}
        onSave={saveNumeric}
        busy={busy}
      />

      {/* Block 4: Servicios de fotografía */}
      <ServiceList
        title="Servicios de fotografía"
        items={fotoServices}
        onUpdate={setFotoServices}
      />

      {/* Block 5: Servicios de creadores */}
      <ServiceList
        title="Servicios de creadores de contenido"
        items={creatorServices}
        onUpdate={setCreatorServices}
      />

      {/* Block 6: Textos legales */}
      <LegalBlock
        values={legalValues}
        onChange={(key, val) => setLegalValues((p) => ({ ...p, [key]: val }))}
        onSave={saveLegal}
        busy={legalBusy}
      />

      {/* Block 7: Integraciones */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="ph">
          <h3>Integraciones</h3>
          <button
            className="btn primary sm"
            onClick={saveIntegration}
            disabled={integBusy}
          >
            {integBusy ? "Guardando…" : "Guardar"}
          </button>
        </div>
        <div className="settings-form">
          <div className="settings-row">
            <label htmlFor="payment_gateway">Pasarela de pago</label>
            <select
              id="payment_gateway"
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
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
              <option value="transbank">Transbank</option>
              <option value="mercadopago">Mercado Pago</option>
              <option value="flow">Flow</option>
            </select>
          </div>
          <div className="settings-row">
            <label htmlFor="payment_api_key">API Key</label>
            <input
              id="payment_api_key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk_live_…"
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    </>
  );
}
