"use client";
import { useState } from "react";
import { toast } from "sonner";

type FAQItem = { id: number; question: string; answer: string; order: number };

const MOCK_FAQS: FAQItem[] = [
  { id: 1, question: "¿Cómo publico un evento?", answer: "Para publicar un evento, debes crear una cuenta de organizador, completar el formulario de creación y esperar la aprobación del equipo Konbini.", order: 1 },
  { id: 2, question: "¿Cuánto cuesta publicar un evento?", answer: "Cada publicación consume 1 crédito. Los créditos se obtienen con el plan de suscripción mensual.", order: 2 },
  { id: 3, question: "¿Cuánto demora la aprobación?", answer: "Revisamos todas las publicaciones en un plazo máximo de 24 horas hábiles.", order: 3 },
  { id: 4, question: "¿Qué es un aviso (spot)?", answer: "Un aviso es un banner publicitario que aparece en la sección de inicio y en páginas de categoría.", order: 4 },
];

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>(MOCK_FAQS);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ question: "", answer: "" });

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

  const save = () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Pregunta y respuesta son requeridas");
      return;
    }
    if (editing === 0) {
      const newId = Math.max(0, ...faqs.map((f) => f.id)) + 1;
      setFaqs((list) => [
        ...list,
        { id: newId, question: form.question, answer: form.answer, order: list.length + 1 },
      ]);
      toast.success("FAQ creada");
    } else {
      setFaqs((list) =>
        list.map((f) =>
          f.id === editing ? { ...f, question: form.question, answer: form.answer } : f,
        ),
      );
      toast.success("FAQ actualizada");
    }
    cancelEdit();
  };

  const remove = (id: number) => {
    if (!window.confirm("¿Eliminar esta FAQ?")) return;
    setFaqs((list) => list.filter((f) => f.id !== id));
    toast.success("FAQ eliminada");
  };

  return (
    <>
      <div className="section-head">
        <h2>FAQ</h2>
        {editing === null && (
          <button
            onClick={startNew}
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
              <label
                style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}
              >
                PREGUNTA
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
                value={form.question}
                onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                placeholder="¿Cómo puedo…?"
              />
            </div>
            <div>
              <label
                style={{ display: "block", fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}
              >
                RESPUESTA
              </label>
              <textarea
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
                  minHeight: 80,
                  resize: "vertical",
                }}
                value={form.answer}
                onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                placeholder="La respuesta es…"
              />
            </div>
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
              onClick={save}
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
              {editing === 0 ? "Crear" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      <div className="faq-list">
        {faqs.map((f) => (
          <div key={f.id} className="faq-item">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <div className="faq-q">{f.question}</div>
                <div className="faq-a">{f.answer}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
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
