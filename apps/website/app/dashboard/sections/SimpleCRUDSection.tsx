"use client";
import { useState } from "react";
import { toast } from "sonner";

type SelectField = {
  k: string;
  label: string;
  required?: boolean;
  type: "select";
  options: string[];
};

type TextField = {
  k: string;
  label: string;
  required?: boolean;
  type?: "text";
  placeholder?: string;
};

type Field = TextField | SelectField;

const KINDS = {
  tags: {
    name: "Tag",
    items: [
      { nm: "shonen",  slug: "#shonen",  usos: 48 },
      { nm: "seinen",  slug: "#seinen",  usos: 31 },
      { nm: "isekai",  slug: "#isekai",  usos: 27 },
      { nm: "kpop",    slug: "#kpop",    usos: 19 },
      { nm: "cosplay", slug: "#cosplay", usos: 14 },
    ],
    cols: ["NOMBRE", "SLUG", "USOS"],
    fields: [
      { k: "nm", label: "Nombre del tag", required: true, placeholder: "shonen" },
    ] as Field[],
  },
  countries: {
    name: "País",
    items: [
      { nm: "Chile",     iso: "CL", flag: "🇨🇱" },
      { nm: "Argentina", iso: "AR", flag: "🇦🇷" },
      { nm: "México",    iso: "MX", flag: "🇲🇽" },
      { nm: "España",    iso: "ES", flag: "🇪🇸" },
    ],
    cols: ["NOMBRE", "ISO", "BANDERA"],
    fields: [
      { k: "nm",   label: "Nombre del país", required: true },
      { k: "iso",  label: "Código ISO (2 letras)", required: true, placeholder: "CL" },
      { k: "flag", label: "Bandera (emoji)", placeholder: "🇨🇱" },
    ] as Field[],
  },
  states: {
    name: "División",
    items: [
      { nm: "Metropolitana de Santiago", tp: "Región",   co: "Chile" },
      { nm: "Valparaíso",                tp: "Región",   co: "Chile" },
      { nm: "Bío-Bío",                   tp: "Región",   co: "Chile" },
      { nm: "Antofagasta",               tp: "Región",   co: "Chile" },
    ],
    cols: ["NOMBRE", "TIPO", "PAÍS"],
    fields: [
      { k: "nm", label: "Nombre", required: true },
      { k: "tp", label: "Tipo", type: "select" as const, options: ["Región", "Provincia", "Estado", "Departamento"], required: true },
      { k: "co", label: "País",  type: "select" as const, options: ["Chile", "Argentina", "México"], required: true },
    ] as Field[],
  },
  cities: {
    name: "Ciudad",
    items: [
      { nm: "Santiago",    div: "Metropolitana", co: "Chile" },
      { nm: "Valparaíso",  div: "Valparaíso",    co: "Chile" },
      { nm: "Concepción",  div: "Bío-Bío",       co: "Chile" },
      { nm: "Antofagasta", div: "Antofagasta",   co: "Chile" },
    ],
    cols: ["NOMBRE", "DIVISIÓN", "PAÍS"],
    fields: [
      { k: "nm",  label: "Nombre", required: true },
      { k: "div", label: "División administrativa", type: "select" as const, options: ["Metropolitana", "Valparaíso", "Bío-Bío", "Antofagasta"], required: true },
      { k: "co",  label: "País", type: "select" as const, options: ["Chile", "Argentina", "México"], required: true },
    ] as Field[],
  },
} as const;

type KindKey = keyof typeof KINDS;

function AdminFormModal({
  title,
  fields,
  initial = {} as Record<string, string>,
  onClose,
  onSave,
}: {
  title: string;
  fields: Field[];
  initial?: Record<string, string>;
  onClose: () => void;
  onSave: (data: Record<string, string>) => void;
}) {
  const [data, setData] = useState<Record<string, string>>(initial);
  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <h3 className="h">{title}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          {fields.map((f) => (
            <div key={f.k} className="field" style={{ margin: 0 }}>
              <label>
                {f.label}
                {f.required && <span style={{ color: "var(--err)" }}> *</span>}
              </label>
              {f.type === "select" ? (
                <select value={data[f.k] || ""} onChange={(e) => set(f.k, e.target.value)}>
                  <option value="">Selecciona…</option>
                  {(f as SelectField).options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={data[f.k] || ""}
                  onChange={(e) => set(f.k, e.target.value)}
                  placeholder={(f as TextField).placeholder}
                />
              )}
            </div>
          ))}
        </div>
        <div className="row-act">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn dark" onClick={() => { onSave(data); onClose(); }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="h">{title}</h3>
        <p className="p">{message}</p>
        <div className="field" style={{ margin: "0 0 14px" }}>
          <label>Escribe <strong>ELIMINAR</strong> para confirmar</label>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="ELIMINAR"
          />
        </div>
        <div className="row-act">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            style={{ background: "var(--err)" }}
            onClick={() => { onConfirm(); onClose(); }}
            disabled={typed !== "ELIMINAR"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type ModalState =
  | { type: "create" }
  | { type: "edit";   item: Record<string, string> }
  | { type: "delete"; item: Record<string, string> };

function renderCol2(kind: KindKey, item: Record<string, string>): string {
  if (kind === "tags")      return item.slug;
  if (kind === "countries") return item.iso;
  if (kind === "states")    return item.tp;
  if (kind === "cities")    return item.div;
  return "";
}

function renderCol3(kind: KindKey, item: Record<string, string>): string {
  if (kind === "tags")      return String(item.usos ?? "");
  if (kind === "countries") return item.flag;
  if (kind === "states")    return item.co;
  if (kind === "cities")    return item.co;
  return "";
}

export default function SimpleCRUDSection({ kind }: { kind: KindKey }) {
  const cfg = KINDS[kind];
  const [modal, setModal] = useState<ModalState | null>(null);

  const nameLabel = cfg.name.toLowerCase();
  const count = cfg.items.length;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {count} {nameLabel}{(count as number) !== 1 ? "s" : ""} en el sistema
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>
          ＋ Nuevo {nameLabel}
        </button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              {cfg.cols.map((c) => <th key={c}>{c}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(cfg.items as unknown as Record<string, string>[]).map((it, idx) => (
              <tr key={idx}>
                <td><strong>{it.nm}</strong></td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{renderCol2(kind, it)}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)" }}>{renderCol3(kind, it)}</td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setModal({ type: "edit", item: it })}>Editar</button>
                    <button className="bad" onClick={() => setModal({ type: "delete", item: it })}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.type === "create" && (
        <AdminFormModal
          title={`Nuevo ${nameLabel}`}
          fields={cfg.fields as Field[]}
          onClose={() => setModal(null)}
          onSave={(d) => toast.success(`${cfg.name} creado`, { description: `"${d.nm}" agregado al sistema` })}
        />
      )}
      {modal?.type === "edit" && (
        <AdminFormModal
          title={`Editar ${nameLabel}`}
          fields={cfg.fields as Field[]}
          initial={modal.item}
          onClose={() => setModal(null)}
          onSave={() => toast.success(`${cfg.name} actualizado`)}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog
          title={`¿Eliminar "${modal.item.nm}"?`}
          message={`Esta acción es permanente. Si "${modal.item.nm}" tiene contenido asociado, no se podrá eliminar.`}
          confirmLabel="Sí, eliminar"
          onConfirm={() => toast.warning(`${cfg.name} eliminado`)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
