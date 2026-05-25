"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type ArticleEditorMode = "create" | "edit";

interface ArticleEditorInitial {
  title?: string;
  category?: string;
  content?: string;
  excerpt?: string;
}

interface AdminArticleEditorProps {
  mode: ArticleEditorMode;
  initial?: ArticleEditorInitial;
  onClose?: () => void;
  onSaved?: () => void;
}

export function AdminArticleEditor({
  mode,
  initial,
  onClose,
  onSaved,
}: AdminArticleEditorProps) {
  const { token } = useUser();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    category: initial?.category ?? "",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("No autenticado");
      return;
    }
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Título y contenido son requeridos");
      return;
    }
    setBusy(true);
    try {
      const method = mode === "create" ? "POST" : "PATCH";
      const url = mode === "create" ? "/api/articles" : `/api/articles/edit`;
      const r = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category.trim() || undefined,
          excerpt: form.excerpt.trim() || undefined,
          content: form.content.trim(),
        }),
      });
      if (!r.ok) throw new Error("Error al guardar");
      toast.success(mode === "create" ? "Artículo creado" : "Artículo actualizado");
      onSaved?.();
      onClose?.();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface-2)",
    border: "1px solid var(--line)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    color: "var(--ink)",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    color: "var(--ink-3)",
    fontFamily: "var(--font-mono)",
    letterSpacing: ".1em",
    marginBottom: 6,
  };

  return (
    <div className="confirm-bg" onClick={onClose}>
      <div
        className="confirm-card"
        style={{ maxWidth: 680 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 20 }}>
          {mode === "create" ? "Crear artículo" : "Editar artículo"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>TÍTULO</label>
              <input
                style={inputStyle}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Título del artículo"
                required
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>CATEGORÍA</label>
                <input
                  style={inputStyle}
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="Anime, Gaming, Cine…"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>EXTRACTO</label>
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="Resumen breve (máx. 200 caracteres)…"
                maxLength={200}
              />
            </div>
            <div>
              <label style={labelStyle}>
                CONTENIDO (MARKDOWN)
              </label>
              <textarea
                style={{ ...inputStyle, minHeight: 200, resize: "vertical", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6 }}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder="# Título&#10;&#10;Escribe el artículo en Markdown…"
                required
              />
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  marginTop: 4,
                  fontFamily: "var(--font-mono)",
                }}
              >
                Soporta Markdown: **negrita**, *cursiva*, `código`, ## h2, - lista
              </div>
            </div>
          </div>
          <div className="modal-acts" style={{ marginTop: 24 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px",
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
              type="submit"
              disabled={busy}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                background: "var(--accent)",
                color: "var(--accent-ink)",
                fontSize: 13,
                fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Guardando…" : mode === "create" ? "Publicar artículo" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
