"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type FAQItem = { id: number; question: string; answer: string; order: number };

const MOCK_FAQS: FAQItem[] = [
  { id: 1, question: "¿Cómo publico un evento?",           answer: "Para publicar un evento, debes crear una cuenta de organizador, completar el formulario de creación y esperar la aprobación del equipo Konbini.",    order: 1 },
  { id: 2, question: "¿Cuánto cuesta publicar un evento?", answer: "Cada publicación consume 1 crédito. Los créditos se obtienen con el plan de suscripción mensual.",                                                     order: 2 },
  { id: 3, question: "¿Cuánto demora la aprobación?",      answer: "Revisamos todas las publicaciones en un plazo máximo de 24 horas hábiles.",                                                                           order: 3 },
  { id: 4, question: "¿Qué es un aviso (spot)?",           answer: "Un aviso es un banner publicitario que aparece en la sección de inicio y en páginas de categoría.",                                                   order: 4 },
];

export default function FAQSection() {
  const { token } = useUser();
  const [faqs, setFaqs] = useState<FAQItem[]>(MOCK_FAQS);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ question: "", answer: "" });
  const [busy, setBusy] = useState(false);

  // Load from API, fall back to mock
  useEffect(() => {
    fetch("/api/faq")
      .then(async (r) => {
        if (!r.ok) throw new Error("sin API");
        const data = await r.json();
        const items: FAQItem[] = Array.isArray(data) ? data : (data.items ?? []);
        if (items.length > 0) setFaqs(items);
      })
      .catch(() => {/* use mock */});
  }, []);

  const startEdit = (f: FAQItem) => {
    setEditing(f.id);
    setForm({ question: f.question, answer: f.answer });
  };

  const startNew = () => {
    setEditing(0);
    setForm({ question: "", answer: "" });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ question: "", answer: "" });
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Pregunta y respuesta son requeridas");
      return;
    }
    setBusy(true);
    try {
      if (editing === 0) {
        const body = { question: form.question.trim(), answer: form.answer.trim(), order: faqs.length + 1 };
        const r = await fetch("/api/faq", {
          method: "POST",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error("API error");
        const saved: FAQItem = await r.json();
        setFaqs((list) => [...list, saved]);
      } else {
        const body = { question: form.question.trim(), answer: form.answer.trim() };
        const r = await fetch(`/api/faq/${editing}`, {
          method: "PATCH",
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error("API error");
        const saved: FAQItem = await r.json();
        setFaqs((list) => list.map((f) => (f.id === editing ? saved : f)));
      }
      toast.success(editing === 0 ? "FAQ creada" : "FAQ actualizada");
      cancelEdit();
    } catch {
      // local fallback
      if (editing === 0) {
        const newId = Math.max(0, ...faqs.map((f) => f.id)) + 1;
        setFaqs((list) => [
          ...list,
          { id: newId, question: form.question.trim(), answer: form.answer.trim(), order: list.length + 1 },
        ]);
        toast.success("FAQ creada");
      } else {
        setFaqs((list) =>
          list.map((f) =>
            f.id === editing ? { ...f, question: form.question.trim(), answer: form.answer.trim() } : f,
          ),
        );
        toast.success("FAQ actualizada");
      }
      cancelEdit();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("¿Eliminar esta FAQ?")) return;
    try {
      const r = await fetch(`/api/faq/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error("API error");
    } catch {
      // local fallback — proceed anyway
    }
    setFaqs((list) => list.filter((f) => f.id !== id));
    toast.success("FAQ eliminada");
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    setFaqs((list) => {
      const next = [...list];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next.map((f, idx) => ({ ...f, order: idx + 1 }));
    });
  };

  const moveDown = (i: number) => {
    setFaqs((list) => {
      if (i === list.length - 1) return list;
      const next = [...list];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next.map((f, idx) => ({ ...f, order: idx + 1 }));
    });
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

  return (
    <>
      <div className="section-head">
        <h2>FAQ</h2>
        {editing === null && (
          <button className="btn primary sm" onClick={startNew}>
            + Nueva FAQ
          </button>
        )}
      </div>

      {editing !== null && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="ph">
            <h3>{editing === 0 ? "Nueva pregunta" : "Editar pregunta"}</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
                PREGUNTA
              </label>
              <input
                style={inputStyle}
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder="¿Cómo puedo…?"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
                RESPUESTA
              </label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                placeholder="La respuesta es…"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn ghost sm" onClick={cancelEdit}>
              Cancelar
            </button>
            <button className="btn primary sm" onClick={save} disabled={busy}>
              {busy ? "Guardando…" : editing === 0 ? "Crear" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      <div className="faq-list">
        {faqs.map((f, i) => (
          <div key={f.id} className="faq-item">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="faq-q">{f.question}</div>
                <div className="faq-a">{f.answer}</div>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0, alignItems: "center" }}>
                {/* Reorder */}
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  title="Subir"
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    color: i === 0 ? "var(--ink-3)" : "var(--ink-2)",
                    fontSize: 13,
                    cursor: i === 0 ? "default" : "pointer",
                    opacity: i === 0 ? 0.4 : 1,
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === faqs.length - 1}
                  title="Bajar"
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    color: i === faqs.length - 1 ? "var(--ink-3)" : "var(--ink-2)",
                    fontSize: 13,
                    cursor: i === faqs.length - 1 ? "default" : "pointer",
                    opacity: i === faqs.length - 1 ? 0.4 : 1,
                  }}
                >
                  ↓
                </button>
                <button
                  onClick={() => startEdit(f)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    color: "var(--ink-2)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Editar
                </button>
                <button
                  onClick={() => remove(f.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    color: "var(--err)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
