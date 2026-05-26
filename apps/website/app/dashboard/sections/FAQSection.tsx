"use client";
import { useState } from "react";
import { toast } from "sonner";

const FAQS: [string, string][] = [
  [
    "¿Cómo publico un evento?",
    "Crea una cuenta gratuita, pulsa '＋ Crear evento' y completa el formulario. Un admin lo revisa y aprueba en menos de 24 h.",
  ],
  [
    "¿Cuánto cuesta publicar?",
    "Depende de la categoría — desde $4.990 CLP / día. Revisa la tabla de precios en la sección Categorías.",
  ],
  [
    "¿Qué incluye la suscripción mensual?",
    "10 créditos de publicación al mes, sin comisión extra, acceso a estadísticas y soporte prioritario.",
  ],
  [
    "¿Cuándo se publica mi evento?",
    "Tras enviarlo entra a revisión. Un admin lo aprueba en menos de 24 h hábiles. Recibirás un email de confirmación.",
  ],
];

type Field = {
  k: string;
  label: string;
  required?: boolean;
  type?: string;
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
              {f.type === "textarea" ? (
                <textarea
                  value={data[f.k] || ""}
                  onChange={(e) => set(f.k, e.target.value)}
                  placeholder={f.placeholder}
                />
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
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="h">{title}</h3>
        <p className="p">{message}</p>
        <div className="row-act">
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            style={{ background: "var(--err)" }}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const FIELDS: Field[] = [
  { k: "q", label: "Pregunta",  required: true, placeholder: "¿Cómo publico un evento?" },
  { k: "a", label: "Respuesta", required: true, type: "textarea", placeholder: "Escribe la respuesta completa..." },
];

type ModalState =
  | { type: "create" }
  | { type: "edit";   item: { q: string; a: string } }
  | { type: "delete"; item: { q: string } };

export default function FAQSection() {
  const [modal, setModal] = useState<ModalState | null>(null);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {FAQS.length} preguntas activas · arrastra para reordenar
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>＋ Nueva pregunta</button>
      </div>

      {FAQS.map((f, i) => (
        <div key={i} className="panel" style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11, marginTop: 4 }}>
              ≡ {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{f[0]}</div>
              <div style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5 }}>{f[1]}</div>
            </div>
            <div className="row-act">
              <button onClick={() => setModal({ type: "edit", item: { q: f[0], a: f[1] } })}>Editar</button>
              <button className="bad" onClick={() => setModal({ type: "delete", item: { q: f[0] } })}>Eliminar</button>
            </div>
          </div>
        </div>
      ))}

      {modal?.type === "create" && (
        <AdminFormModal
          title="Nueva pregunta"
          fields={FIELDS}
          onClose={() => setModal(null)}
          onSave={(d) => toast.success("Pregunta agregada", { description: d.q })}
        />
      )}
      {modal?.type === "edit" && (
        <AdminFormModal
          title="Editar pregunta"
          fields={FIELDS}
          initial={modal.item as Record<string, string>}
          onClose={() => setModal(null)}
          onSave={() => toast.success("Cambios guardados")}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog
          title="¿Eliminar pregunta?"
          message={`Se quitará "${modal.item.q}" del FAQ público.`}
          confirmLabel="Sí, eliminar"
          onConfirm={() => toast.warning("Pregunta eliminada")}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
