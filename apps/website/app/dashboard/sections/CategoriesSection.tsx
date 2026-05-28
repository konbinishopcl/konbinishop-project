"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ApiEventCategory } from "@/lib/api";
import { SITE_HOST } from "@/lib/site";

type Field = {
  k: string;
  label: string;
  required?: boolean;
  type?: string;
  prefix?: string;
  placeholder?: string;
};

const FIELDS: Field[] = [
  { k: "name",        label: "Nombre",             required: true, placeholder: "Anime" },
  { k: "slug",        label: "Slug (URL)",          required: true, prefix: `${SITE_HOST}/`, placeholder: "anime" },
  { k: "icon",        label: "Icono (Lucide)",      placeholder: "calendar" },
  { k: "color",       label: "Color (hex)",         placeholder: "#FF6B00" },
  { k: "pricePerDay", label: "Precio por día CLP",  type: "number", required: true, placeholder: "4990" },
  { k: "minDays",     label: "Días mínimos",        type: "number", required: true, placeholder: "1" },
  { k: "maxDays",     label: "Días máximos",        type: "number", required: true, placeholder: "30" },
  { k: "order",       label: "Orden",               type: "number", placeholder: "0" },
];

type ModalState =
  | { type: "create" }
  | { type: "edit";   item: ApiEventCategory }
  | { type: "delete"; item: ApiEventCategory }
  | null;

async function authedFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(path, { ...init, headers });
}

function toDto(d: Record<string, string>) {
  const trim = (s?: string) => (s ?? "").trim();
  return {
    name: trim(d.name),
    slug: trim(d.slug),
    icon: trim(d.icon) || undefined,
    color: trim(d.color) || undefined,
    pricePerDay: d.pricePerDay ? Number(d.pricePerDay) : undefined,
    minDays: d.minDays ? Number(d.minDays) : undefined,
    maxDays: d.maxDays ? Number(d.maxDays) : undefined,
    order: d.order !== "" && d.order !== undefined ? Number(d.order) : undefined,
  };
}

function itemToFormData(c: ApiEventCategory): Record<string, string> {
  return {
    name: c.name ?? "",
    slug: c.slug,
    icon: c.icon ?? "",
    color: c.color ?? "",
    pricePerDay: String(c.pricePerDay ?? ""),
    minDays: String(c.minDays ?? ""),
    maxDays: String(c.maxDays ?? ""),
    order: String(c.order ?? ""),
  };
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

export default function CategoriesSection() {
  const [items, setItems] = useState<ApiEventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/event-categories");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se pudieron cargar las categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCreate = async (d: Record<string, string>) => {
    const res = await authedFetch("/api/event-categories", {
      method: "POST",
      body: JSON.stringify(toDto(d)),
    });
    if (!res.ok) { toast.error("No se pudo crear la categoría"); return; }
    toast.success("Categoría creada", { description: `"${d.name}" agregada al sistema` });
    load();
  };

  const onEdit = async (id: number, d: Record<string, string>) => {
    const res = await authedFetch(`/api/event-categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toDto(d)),
    });
    if (!res.ok) { toast.error("No se pudo actualizar la categoría"); return; }
    toast.success("Categoría actualizada", { description: `Cambios guardados en "${d.name}"` });
    load();
  };

  const onDelete = async (id: number) => {
    const res = await authedFetch(`/api/event-categories/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("No se pudo eliminar la categoría"); return; }
    toast.warning("Categoría eliminada");
    load();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {loading ? "Cargando…" : `${items.length} categorías en el sistema`}
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
              <th>ORDEN</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="cell-evt">
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: c.color ?? "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontFamily: "var(--font-mono)", color: "var(--ink-1)" }}>
                      {c.icon ?? "—"}
                    </div>
                    <div className="ti">{c.name ?? "—"}</div>
                  </div>
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>/{c.slug}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>${(c.pricePerDay ?? 0).toLocaleString("es-CL")}</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{c.minDays}d</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{c.maxDays}d</td>
                <td style={{ fontFamily: "var(--font-mono)" }}>{c.order}</td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setModal({ type: "edit", item: c })}>Editar</button>
                    <button className="bad" onClick={() => setModal({ type: "delete", item: c })}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-3)", padding: "24px 0" }}>
                  No hay categorías. Crea la primera.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal?.type === "create" && (
        <AdminFormModal
          title="Nueva categoría"
          fields={FIELDS}
          onClose={() => setModal(null)}
          onSave={onCreate}
        />
      )}
      {modal?.type === "edit" && (
        <AdminFormModal
          title={`Editar ${modal.item.name ?? "categoría"}`}
          fields={FIELDS}
          initial={itemToFormData(modal.item)}
          onClose={() => setModal(null)}
          onSave={(d) => onEdit(modal.item.id, d)}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog
          title={`¿Eliminar categoría "${modal.item.name}"?`}
          message="Esta acción es permanente. Si la categoría tiene eventos asociados, la DB la rechazará."
          confirmLabel="Sí, eliminar"
          onConfirm={() => onDelete(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
