"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { SITE_HOST } from "@/lib/site";
import { TablePagination, useClientPagination } from "@/components/TablePagination";

type ArticleCategory = { id: number; name: string | null; slug: string; icon?: string | null };

type Field = {
  k: string;
  label: string;
  required?: boolean;
  prefix?: string;
  placeholder?: string;
};

const FIELDS: Field[] = [
  { k: "name", label: "Nombre",    required: true, placeholder: "Anime" },
  { k: "slug", label: "Slug (URL)", required: true, prefix: `${SITE_HOST}/noticias/`, placeholder: "anime" },
  { k: "icon", label: "Icono/Emoji", placeholder: "🎌" },
];

type ModalState =
  | { type: "create" }
  | { type: "edit";   item: ArticleCategory }
  | { type: "delete"; item: ArticleCategory }
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
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
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
                    type="text"
                    value={data[f.k] || ""}
                    onChange={(e) => set(f.k, e.target.value)}
                    placeholder={f.placeholder}
                  />
                </div>
              ) : (
                <input
                  type="text"
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

export default function ArticleCategoriesSection() {
  const [items, setItems] = useState<ArticleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);

  const { page, goPage, perPage, changePerPage, total, totalPages, from, to, paginated } = useClientPagination(items);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/article-categories");
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
    const res = await authedFetch("/api/article-categories", {
      method: "POST",
      body: JSON.stringify({ name: d.name.trim(), slug: d.slug.trim(), icon: d.icon?.trim() || undefined }),
    });
    if (!res.ok) { toast.error("No se pudo crear la categoría"); return; }
    toast.success("Categoría creada", { description: `"${d.name}" agregada al sistema` });
    load();
  };

  const onEdit = async (id: number, d: Record<string, string>) => {
    const res = await authedFetch(`/api/article-categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: d.name.trim(), slug: d.slug.trim(), icon: d.icon?.trim() || undefined }),
    });
    if (!res.ok) { toast.error("No se pudo actualizar la categoría"); return; }
    toast.success("Categoría actualizada", { description: `Cambios guardados en "${d.name}"` });
    load();
  };

  const onDelete = async (id: number) => {
    const res = await authedFetch(`/api/article-categories/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("No se pudo eliminar la categoría"); return; }
    toast.warning("Categoría eliminada");
    load();
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          Categorías de <strong style={{ color: "var(--ink)" }}>Noticias</strong> · solo editorial, sin precio
          {!loading && ` · ${items.length} en el sistema`}
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>＋ Nueva categoría</button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>CATEGORÍA</th>
              <th>SLUG</th>
              <th>ARTÍCULOS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="cell-evt">
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--surface-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {c.icon ?? "—"}
                    </div>
                    <div className="ti">{c.name ?? "—"}</div>
                  </div>
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>/{c.slug}</td>
                <td style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)" }}>
                  {(c as ArticleCategory & { _count?: { articles?: number } })._count?.articles ?? "—"}
                </td>
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
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: "24px 0" }}>
                  No hay categorías. Crea la primera.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: "24px 0" }}>
                  Cargando…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <TablePagination
          page={page} totalPages={totalPages} total={total} from={from} to={to}
          perPage={perPage} noun="categoría"
          onPageChange={goPage} onPerPageChange={changePerPage}
        />
      )}

      {modal?.type === "create" && (
        <AdminFormModal
          title="Nueva categoría de noticia"
          fields={FIELDS}
          onClose={() => setModal(null)}
          onSave={onCreate}
        />
      )}
      {modal?.type === "edit" && (
        <AdminFormModal
          title={`Editar ${modal.item.name ?? "categoría"}`}
          fields={FIELDS}
          initial={{ name: modal.item.name ?? "", slug: modal.item.slug, icon: modal.item.icon ?? "" }}
          onClose={() => setModal(null)}
          onSave={(d) => onEdit(modal.item.id, d)}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog
          title={`¿Eliminar categoría "${modal.item.name}"?`}
          message="Esta acción es permanente. Si la categoría tiene artículos asociados, no se podrá eliminar."
          onConfirm={() => onDelete(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
