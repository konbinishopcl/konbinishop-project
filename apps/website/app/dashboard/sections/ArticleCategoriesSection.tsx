"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useUser } from "@/components/providers";
import { SITE_HOST } from "@/lib/site";
import { TablePagination, useClientPagination } from "@/components/TablePagination";

// ── Schema ─────────────────────────────────────────────────────────────────────

const Schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  slug: z.string().min(2, "Mínimo 2 caracteres"),
  icon: z.string().optional(),
});

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

// ── AdminFormModal ─────────────────────────────────────────────────────────────

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
  onSave: (data: Record<string, string>) => Promise<void>;
}) {
  const [data, setData] = useState<Record<string, string>>(initial);
  const [slugLocked, setSlugLocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const isValid = Schema.safeParse(data).success;

  function set(k: string, v: string) {
    setData((d) => {
      const next = { ...d, [k]: v };
      if (k === "name" && !slugLocked) next.slug = slugify(v);
      return next;
    });
  }

  async function handleSave() {
    setBusy(true);
    try {
      await onSave(data);
      onClose();
    } catch {
      // stay open
    } finally {
      setBusy(false);
    }
  }

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
                    onChange={(e) => { if (f.k === "slug") setSlugLocked(true); set(f.k, e.target.value); }}
                    placeholder={f.placeholder}
                    disabled={busy}
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={data[f.k] || ""}
                  onChange={(e) => { if (f.k === "slug") setSlugLocked(true); set(f.k, e.target.value); }}
                  placeholder={f.placeholder}
                  disabled={busy}
                />
              )}
            </div>
          ))}
        </div>
        <div className="row-act">
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="btn dark" onClick={handleSave} disabled={!isValid || busy}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // stay open
    } finally {
      setBusy(false);
    }
  }

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
            disabled={busy}
          />
        </div>
        <div className="row-act">
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button
            className="btn primary"
            style={{ background: "var(--err)" }}
            onClick={handleConfirm}
            disabled={typed !== "ELIMINAR" || busy}
          >
            {busy ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export default function ArticleCategoriesSection() {
  const { token } = useUser();
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

  function authedHeaders(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }

  const onCreate = async (d: Record<string, string>) => {
    const res = await fetch("/api/article-categories", {
      method: "POST",
      headers: authedHeaders(),
      body: JSON.stringify({ name: d.name.trim(), slug: d.slug.trim(), icon: d.icon?.trim() || undefined }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.message ?? "No se pudo crear la categoría");
      throw new Error("create failed");
    }
    toast.success("Categoría creada", { description: `"${d.name}" agregada al sistema` });
    load();
  };

  const onEdit = async (id: number, d: Record<string, string>) => {
    const res = await fetch(`/api/article-categories/${id}`, {
      method: "PATCH",
      headers: authedHeaders(),
      body: JSON.stringify({ name: d.name.trim(), slug: d.slug.trim(), icon: d.icon?.trim() || undefined }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.message ?? "No se pudo actualizar la categoría");
      throw new Error("edit failed");
    }
    toast.success("Categoría actualizada", { description: `Cambios guardados en "${d.name}"` });
    load();
  };

  const onDelete = async (id: number) => {
    const res = await fetch(`/api/article-categories/${id}`, {
      method: "DELETE",
      headers: authedHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.message ?? "No se pudo eliminar la categoría");
      throw new Error("delete failed");
    }
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
