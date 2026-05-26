"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  eventCount: number;
  pricePerDay: number | null;
  minDays: number | null;
  maxDays: number | null;
};

type CatForm = {
  name: string;
  slug: string;
  icon: string;
  color: string;
  pricePerDay: number | "";
  minDays: number | "";
  maxDays: number | "";
};

const emptyForm: CatForm = {
  name: "",
  slug: "",
  icon: "",
  color: "#6366f1",
  pricePerDay: "",
  minDays: "",
  maxDays: "",
};

const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: "Anime",         slug: "anime",        icon: "🎌", color: "#f43f5e", eventCount: 38, pricePerDay: 8000,  minDays: 10, maxDays: 30 },
  { id: 2, name: "Conciertos",    slug: "conciertos",   icon: "🎵", color: "#a855f7", eventCount: 28, pricePerDay: 10000, minDays: 7,  maxDays: 30 },
  { id: 3, name: "Gaming",        slug: "gaming",       icon: "🎮", color: "#22c55e", eventCount: 16, pricePerDay: 8000,  minDays: 5,  maxDays: 14 },
  { id: 4, name: "Convenciones",  slug: "convenciones", icon: "🌟", color: "#f59e0b", eventCount: 12, pricePerDay: 12000, minDays: 14, maxDays: 60 },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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

function formatPrice(price: number | null | undefined): string {
  if (price == null) return "—";
  return `$${price.toLocaleString("es-CL")}/día`;
}

export default function CategoriesSection() {
  const { token } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CatForm>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/categories", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("API no disponible");
        const data = await r.json();
        setCategories(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch(() => {
        setCategories(MOCK_CATEGORIES);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [token]);

  const startEdit = (c: Category) => {
    setEditing(c.id);
    setSlugManual(true);
    setForm({
      name: c.name ?? "",
      slug: c.slug,
      icon: c.icon ?? "",
      color: c.color ?? "#6366f1",
      pricePerDay: c.pricePerDay ?? "",
      minDays: c.minDays ?? "",
      maxDays: c.maxDays ?? "",
    });
  };

  const startNew = () => {
    setEditing(0);
    setSlugManual(false);
    setForm(emptyForm);
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm);
    setSlugManual(false);
  };

  const setField = <K extends keyof CatForm>(key: K, val: CatForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleNameChange = (val: string) => {
    setForm((f) => ({
      ...f,
      name: val,
      slug: slugManual ? f.slug : slugify(val),
    }));
  };

  const saveCategory = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
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
        icon: form.icon.trim(),
        color: form.color,
        ...(form.pricePerDay !== "" ? { pricePerDay: Number(form.pricePerDay) } : {}),
        ...(form.minDays !== "" ? { minDays: Number(form.minDays) } : {}),
        ...(form.maxDays !== "" ? { maxDays: Number(form.maxDays) } : {}),
      };
      const r = await fetch(url, {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("Error al guardar");
      const saved: Category = await r.json();
      if (editing) {
        setCategories((list) => list.map((c) => (c.id === editing ? saved : c)));
        toast.success("Categoría actualizada");
      } else {
        setCategories((list) => [...list, saved]);
        toast.success("Categoría creada");
      }
      cancelEdit();
    } catch {
      // simulate local save for mock
      const id = editing && editing > 0 ? editing : Math.max(0, ...categories.map((c) => c.id)) + 1;
      const local: Category = {
        id,
        name: form.name.trim(),
        slug: form.slug.trim(),
        icon: form.icon.trim(),
        color: form.color,
        eventCount: editing ? (categories.find((c) => c.id === editing)?.eventCount ?? 0) : 0,
        pricePerDay: form.pricePerDay !== "" ? Number(form.pricePerDay) : null,
        minDays: form.minDays !== "" ? Number(form.minDays) : null,
        maxDays: form.maxDays !== "" ? Number(form.maxDays) : null,
      };
      if (editing && editing > 0) {
        setCategories((list) => list.map((c) => (c.id === editing ? local : c)));
        toast.success("Categoría actualizada (local)");
      } else {
        setCategories((list) => [...list, local]);
        toast.success("Categoría creada (local)");
      }
      cancelEdit();
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/categories/${deleteTarget.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error("Error al eliminar");
      setCategories((list) => list.filter((c) => c.id !== deleteTarget.id));
      toast.success("Categoría eliminada");
    } catch {
      setCategories((list) => list.filter((c) => c.id !== deleteTarget.id));
      toast.success("Categoría eliminada (local)");
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
          <button className="btn primary sm" onClick={startNew}>
            + Agregar categoría
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
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="ej. Anime"
              />
            </div>
            <div>
              <label style={labelStyle}>Slug</label>
              <input
                style={inputStyle}
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setField("slug", e.target.value);
                }}
                placeholder="ej. anime"
              />
            </div>
          </div>

          {/* Row 2: icon + color */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Ícono (emoji)</label>
              <input
                style={inputStyle}
                value={form.icon}
                onChange={(e) => setField("icon", e.target.value)}
                placeholder="ej. 🎌"
                maxLength={4}
              />
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setField("color", e.target.value)}
                  style={{ width: 40, height: 38, padding: 2, borderRadius: 6, border: "1px solid var(--line)", cursor: "pointer", background: "var(--surface-2)" }}
                />
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.color}
                  onChange={(e) => setField("color", e.target.value)}
                  placeholder="#6366f1"
                />
              </div>
            </div>
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
                <th>Nombre</th>
                <th>Slug</th>
                <th>Ícono / Color</th>
                <th>Eventos</th>
                <th>Precio/día</th>
                <th>Días mín</th>
                <th>Días máx</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong style={{ fontSize: 13.5 }}>{c.name ?? "—"}</strong>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)" }}>
                      {c.slug}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {c.icon && (
                        <span style={{ fontSize: 18 }}>{c.icon}</span>
                      )}
                      <span
                        style={{
                          display: "inline-block",
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: c.color ?? "#888",
                          border: "1px solid rgba(0,0,0,.1)",
                          flexShrink: 0,
                        }}
                        title={c.color}
                      />
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {c.eventCount ?? 0}
                    </span>
                  </td>
                  <td>
                    <span className="cell-price">{formatPrice(c.pricePerDay)}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {c.minDays ?? "—"}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {c.maxDays ?? "—"}
                    </span>
                  </td>
                  <td>
                    <div className="row-acts">
                      <button onClick={() => startEdit(c)}>Editar</button>
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

      {deleteTarget && (
        <div className="confirm-bg" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3>Eliminar categoría</h3>
            <p>
              ¿Eliminar la categoría <strong>{deleteTarget.name}</strong>? Los eventos asociados
              perderán su categoría. Esta acción no se puede deshacer.
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
