"use client";
import { useEffect, useState } from "react";
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

// ── Helpers para las secciones con API real ─────────────────────────────────

async function authedFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(path, { ...init, headers });
}

// ── Sección de Tags real (kind === "tags") ──────────────────────────────────

const TAG_FIELDS = [
  { k: "name", label: "Nombre del tag", required: true, placeholder: "shonen" },
  { k: "slug", label: "Slug",           required: true, placeholder: "shonen" },
] as const;

type RealTagItem = { id: number; name: string; slug: string };

type TagModalState =
  | { type: "create" }
  | { type: "edit";   item: RealTagItem }
  | { type: "delete"; item: RealTagItem }
  | null;

function RealTagsSection() {
  const [items, setItems] = useState<RealTagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TagModalState>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/article-tags");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se pudieron cargar los tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const onCreate = async (d: Record<string, string>) => {
    const res = await authedFetch("/api/article-tags", {
      method: "POST",
      body: JSON.stringify({ name: d.name.trim(), slug: d.slug.trim() }),
    });
    if (!res.ok) { toast.error("No se pudo crear el tag"); return; }
    toast.success("Tag creado", { description: `"${d.name}" agregado al sistema` });
    load();
  };

  const onEdit = async (id: number, d: Record<string, string>) => {
    const res = await authedFetch(`/api/article-tags/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: d.name.trim(), slug: d.slug.trim() }),
    });
    if (!res.ok) { toast.error("No se pudo actualizar el tag"); return; }
    toast.success("Tag actualizado");
    load();
  };

  const onDelete = async (id: number) => {
    const res = await authedFetch(`/api/article-tags/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("No se pudo eliminar el tag"); return; }
    toast.warning("Tag eliminado");
    load();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {loading ? "Cargando…" : `${items.length} tags en el sistema`}
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>＋ Nuevo tag</button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>SLUG</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td><strong>{it.name}</strong></td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>#{it.slug}</td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setModal({ type: "edit", item: it })}>Editar</button>
                    <button className="bad" onClick={() => setModal({ type: "delete", item: it })}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", color: "var(--ink-3)", padding: "24px 0" }}>
                  No hay tags. Crea el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal?.type === "create" && (
        <TagsFormModal
          title="Nuevo tag"
          initial={{}}
          onClose={() => setModal(null)}
          onSave={onCreate}
        />
      )}
      {modal?.type === "edit" && (
        <TagsFormModal
          title={`Editar ${modal.item.name}`}
          initial={{ name: modal.item.name, slug: modal.item.slug }}
          onClose={() => setModal(null)}
          onSave={(d) => onEdit(modal.item.id, d)}
        />
      )}
      {modal?.type === "delete" && (
        <TagsConfirmDialog
          title={`¿Eliminar tag "${modal.item.name}"?`}
          message="Esta acción es permanente."
          onConfirm={() => onDelete(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function TagsFormModal({
  title,
  initial = {},
  onClose,
  onSave,
}: {
  title: string;
  initial?: Record<string, string>;
  onClose: () => void;
  onSave: (data: Record<string, string>) => void;
}) {
  const [data, setData] = useState<Record<string, string>>(initial);
  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h3 className="h">{title}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 18 }}>
          {TAG_FIELDS.map((f) => (
            <div key={f.k} className="field" style={{ margin: 0 }}>
              <label>
                {f.label}
                {f.required && <span style={{ color: "var(--err)" }}> *</span>}
              </label>
              <input
                type="text"
                value={data[f.k] || ""}
                onChange={(e) => set(f.k, e.target.value)}
                placeholder={f.placeholder}
              />
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

function TagsConfirmDialog({
  title,
  message,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
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
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

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
  // Rama real: kind === "tags" → CRUD contra /api/article-tags
  if (kind === "tags") return <RealTagsSection />;

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
