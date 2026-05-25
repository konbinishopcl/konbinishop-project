"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiCategory } from "@/lib/api";

type CatForm = {
  name: string;
  slug: string;
  description: string;
  pricePerDay: number | "";
  minDays: number | "";
  maxDays: number | "";
};

const emptyForm: CatForm = {
  name: "",
  slug: "",
  description: "",
  pricePerDay: "",
  minDays: "",
  maxDays: "",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--surface-2)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontFamily: "var(--font-mono)",
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  marginBottom: 4,
};

function formatPrice(price: number | undefined | null): string {
  if (price == null) return "—";
  return `$${price.toLocaleString("es-CL")}/día`;
}

export default function CategoriesSection() {
  const { token } = useUser();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CatForm>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiCategory | null>(null);

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
      pricePerDay: (c as any).pricePerDay ?? "",
      minDays: (c as any).minDays ?? "",
      maxDays: (c as any).maxDays ?? "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const setField = <K extends keyof CatForm>(key: K, val: CatForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const saveCategory = async () => {
    if (!token || !form.name.trim() || !form.slug.trim()) {
      toast.error("Nombre y slug son requeridos");
      return;
    }
    setBusy(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing ? `/api/categories/${editing}` : "/api/categories";
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        ...(form.pricePerDay !== "" ? { pricePerDay: Number(form.pricePerDay) } : {}),
        ...(form.minDays !== "" ? { minDays: Number(form.minDays) } : {}),
        ...(form.maxDays !== "" ? { maxDays: Number(form.maxDays) } : {}),
      };
      const r = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
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

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/categories/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al eliminar");
      setCategories((list) => list.filter((c) => c.id !== deleteTarget.id));
      toast.success("Categoría eliminada");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al eliminar");
    } finally {
      setBusy(false);
      setDeleteTarget(null);
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

          {/* Row 1: name + slug */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="ej. Anime"
              />
            </div>
            <div>
              <label style={labelStyle}>Slug</label>
              <input
                style={inputStyle}
                value={form.slug}
                onChange={(e) => setField("slug", e.target.value)}
                placeholder="ej. anime"
              />
            </div>
          </div>

          {/* Row 2: description full-width */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Descripción</label>
            <input
              style={inputStyle}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Descripción breve"
            />
          </div>

          {/* Row 3: pricing fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Precio por día (CLP)</label>
              <input
                type="number"
                min={0}
                style={inputStyle}
                value={form.pricePerDay}
                onChange={(e) =>
                  setField("pricePerDay", e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="ej. 8000"
              />
            </div>
            <div>
              <label style={labelStyle}>Días mínimos</label>
              <input
                type="number"
                min={1}
                style={inputStyle}
                value={form.minDays}
                onChange={(e) =>
                  setField("minDays", e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="ej. 10"
              />
            </div>
            <div>
              <label style={labelStyle}>Días máximos</label>
              <input
                type="number"
                min={1}
                style={inputStyle}
                value={form.maxDays}
                onChange={(e) =>
                  setField("maxDays", e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="ej. 30"
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn ghost sm" onClick={cancelEdit}>
              Cancelar
            </button>
            <button className="btn primary sm" onClick={saveCategory} disabled={busy}>
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
                <th>Precio / día</th>
                <th>Eventos</th>
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
                    {c.description && (
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)" }}>
                      {c.slug}
                    </span>
                  </td>
                  <td>
                    <span className="cell-price">
                      {formatPrice((c as any).pricePerDay)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {(c as any).eventCount ?? 0}
                    </span>
                  </td>
                  <td>
                    <div className="row-acts">
                      <button onClick={() => startEdit(c)}>
                        Editar
                      </button>
                      <button
                        className="bad"
                        onClick={() => setDeleteTarget(c)}
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

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="confirm-bg" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar categoría</h3>
            <p>
              Esta accion eliminara la categoria <strong>{deleteTarget.name}</strong>. Los eventos asociados
              perderan su categoria. Esta accion no se puede deshacer.
            </p>
            <div className="modal-acts">
              <button className="btn ghost" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button
                className="btn primary"
                onClick={confirmDelete}
                disabled={busy}
                style={{ background: "var(--err)", color: "#fff" }}
              >
                {busy ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
