"use client";
import { useState } from "react";
import { toast } from "sonner";

const CATS = [
  { nm: "Anime",        slug: "anime",        ic: "🎌", price: 4990, min: 10, max: 60, count: 84 },
  { nm: "Conciertos",   slug: "conciertos",   ic: "🎤", price: 6990, min: 10, max: 60, count: 62 },
  { nm: "Cine",         slug: "cine",         ic: "🎬", price: 5990, min: 10, max: 45, count: 48 },
  { nm: "Gaming",       slug: "gaming",       ic: "🎮", price: 4990, min: 10, max: 60, count: 36 },
  { nm: "Convenciones", slug: "convenciones", ic: "📦", price: 9990, min: 10, max: 60, count: 27 },
  { nm: "Cosplay",      slug: "cosplay",      ic: "✨", price: 4990, min: 10, max: 60, count: 18 },
];

type Field = {
  k: string;
  label: string;
  required?: boolean;
  type?: string;
  prefix?: string;
  placeholder?: string;
};

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
              {f.prefix ? (
                <div className="input-prefix">
                  <span>{f.prefix}</span>
                  <input
                    type={f.type || "text"}
                    value={data[f.k] || ""}
                    onChange={(e) => set(f.k, e.target.value)}
                    placeholder={f.placeholder}
                  />
                </div>
              ) : (
                <input
                  type={f.type || "text"}
                  value={data[f.k] || ""}
                  onChange={(e) => set(f.k, e.target.value)}
                  placeholder={f.placeholder}
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
  typeToConfirm,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  typeToConfirm?: string | null;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ok = !typeToConfirm || typed === typeToConfirm;
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="h">{title}</h3>
        <p className="p">{message}</p>
        {typeToConfirm && (
          <div className="field" style={{ margin: "0 0 14px" }}>
            <label>Escribe <strong>{typeToConfirm}</strong> para confirmar</label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={typeToConfirm}
            />
          </div>
        )}
        <div className="row-act">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            style={{ background: "var(--err)" }}
            onClick={() => { onConfirm(); onClose(); }}
            disabled={!ok}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const FIELDS: Field[] = [
  { k: "nm",    label: "Nombre de la categoría", required: true, placeholder: "Anime" },
  { k: "slug",  label: "Slug (URL)",              required: true, prefix: "konbini.cl/", placeholder: "anime" },
  { k: "ic",    label: "Icono/Emoji",             placeholder: "🎌" },
  { k: "price", label: "Precio por día (CLP)",    type: "number", required: true, placeholder: "4990" },
  { k: "min",   label: "Días mínimos",            type: "number", required: true, placeholder: "10" },
  { k: "max",   label: "Días máximos",            type: "number", required: true, placeholder: "60" },
];

type ModalState =
  | { type: "create" }
  | { type: "edit";   item: typeof CATS[number] }
  | { type: "delete"; item: typeof CATS[number] };

export default function CategoriesSection() {
  const [modal, setModal] = useState<ModalState | null>(null);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          Reordenar arrastrando · CRUD completo · valores por defecto al instalar
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>＋ Nueva categoría</button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>CATEGORÍA</th>
              <th>SLUG</th>
              <th>$/DÍA</th>
              <th>MÍN</th>
              <th>MÁX</th>
              <th>EVENTOS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {CATS.map((c) => (
              <tr key={c.slug}>
                <td>
                  <div className="cell-evt">
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {c.ic}
                    </div>
                    <div className="ti">{c.nm}</div>
                  </div>
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>/{c.slug}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>${c.price.toLocaleString("es-CL")}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{c.min}d</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{c.max}d</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{c.count}</td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setModal({ type: "edit", item: c })}>Editar</button>
                    <button className="bad" onClick={() => setModal({ type: "delete", item: c })}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.type === "create" && (
        <AdminFormModal
          title="Nueva categoría"
          fields={FIELDS}
          onClose={() => setModal(null)}
          onSave={(d) => toast.success("Categoría creada", { description: `"${d.nm}" agregada al sistema` })}
        />
      )}
      {modal?.type === "edit" && (
        <AdminFormModal
          title={`Editar ${modal.item.nm}`}
          fields={FIELDS}
          initial={modal.item as unknown as Record<string, string>}
          onClose={() => setModal(null)}
          onSave={(d) => toast.success("Categoría actualizada", { description: `Cambios guardados en "${d.nm}"` })}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog
          title={`¿Eliminar categoría "${modal.item.nm}"?`}
          message={
            modal.item.count > 0
              ? `Esta categoría tiene ${modal.item.count} eventos asociados. No se puede eliminar mientras tenga contenido.`
              : "Esta acción es permanente."
          }
          typeToConfirm={modal.item.count === 0 ? "ELIMINAR" : null}
          confirmLabel={modal.item.count > 0 ? "Entendido" : "Sí, eliminar"}
          onConfirm={() => { if (modal.item.count === 0) toast.warning("Categoría eliminada"); }}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
