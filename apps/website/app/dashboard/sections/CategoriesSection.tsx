"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiCategory } from "@/lib/api";

type CatForm = {
  name: string;
  slug: string;
  description: string;
};

const emptyForm: CatForm = { name: "", slug: "", description: "" };

export default function CategoriesSection() {
  const { token } = useUser();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CatForm>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .categories()
      .then(setCategories)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (c: ApiCategory) => {
    setEditing(c.id);
    setForm({
      name: c.name ?? "",
      slug: c.slug,
      description: c.description ?? "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const saveCategory = async () => {
    if (!token || !form.name.trim() || !form.slug.trim()) {
      toast.error("Nombre y slug son requeridos");
      return;
    }
    setBusy(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `/api/categories/${editing}` : "/api/categories";
      const r = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error("Error al guardar");
      const saved: ApiCategory = await r.json();
      if (editing) {
        setCategories((list) => list.map((c) => (c.id === editing ? saved : c)));
        toast.success("Categoría actualizada");
      } else {
        setCategories((list) => [...list, saved]);
        toast.success("Categoría creada");
      }
      cancelEdit();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!token) return;
    if (!window.confirm("¿Eliminar esta categoría?")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al eliminar");
      setCategories((list) => list.filter((c) => c.id !== id));
      toast.success("Categoría eliminada");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al eliminar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="section-head">
        <h2>Categorías</h2>
        {editing === null && (
          <button
            className="btn primary sm"
            onClick={() => setEditing(0)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "var(--accent)",
              color: "var(--accent-ink)",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Nueva categoría
          </button>
        )}
      </div>

      {editing !== null && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="ph">
            <h3>{editing === 0 ? "Nueva categoría" : "Editar categoría"}</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
                NOMBRE
              </label>
              <input
                style={{
                  width: "100%",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "var(--ink)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ej. Anime"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
                SLUG
              </label>
              <input
                style={{
                  width: "100%",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "var(--ink)",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="ej. anime"
              />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
              DESCRIPCIÓN
            </label>
            <input
              style={{
                width: "100%",
                background: "var(--surface-2)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                color: "var(--ink)",
                outline: "none",
                boxSizing: "border-box",
              }}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descripción breve"
            />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={cancelEdit}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                color: "var(--ink)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={saveCategory}
              disabled={busy}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: "var(--accent)",
                color: "var(--accent-ink)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {busy ? "Guardando…" : editing === 0 ? "Crear" : "Actualizar"}
            </button>
          </div>
        </div>
      )}

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando categorías…</h3>
          </div>
        ) : categories.length === 0 ? (
          <div className="empty">
            <h3>Sin categorías</h3>
            <p>Crea la primera categoría para comenzar.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Descripción</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)", fontSize: 12 }}>
                      {c.id}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: 13.5 }}>{c.name ?? "—"}</strong>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)" }}>
                      {c.slug}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--ink-2)" }}>{c.description ?? "—"}</td>
                  <td>
                    <div className="row-acts">
                      <button onClick={() => startEdit(c)} style={{ color: "var(--ink-2)" }}>
                        Editar
                      </button>
                      <button
                        onClick={() => deleteCategory(c.id)}
                        style={{ color: "var(--err)" }}
                        disabled={busy}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
