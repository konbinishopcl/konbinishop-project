"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiFaqItem } from "@/lib/api";

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
  | { type: "edit"; item: ApiFaqItem }
  | { type: "delete"; item: ApiFaqItem }
  | null;

export default function FAQSection() {
  const { token } = useUser();
  const [faqs, setFaqs] = useState<ApiFaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      setFaqs(await api.faqAll());
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al cargar el FAQ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  async function handleCreate(data: Record<string, string>) {
    if (!token) return;
    try {
      await api.faqCreate({ question: data.q, answer: data.a }, token);
      toast.success("Pregunta agregada");
      await loadFaqs();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo crear");
    }
  }

  async function handleEdit(id: number, data: Record<string, string>) {
    if (!token) return;
    try {
      await api.faqUpdate(id, { question: data.q, answer: data.a }, token);
      toast.success("Cambios guardados");
      await loadFaqs();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo actualizar");
    }
  }

  async function handleDelete(id: number) {
    if (!token) return;
    try {
      await api.faqRemove(id, token);
      toast.success("Pregunta eliminada");
      await loadFaqs();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo eliminar");
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {faqs.length} preguntas activas · arrastra para reordenar
        </div>
        <button className="btn primary" onClick={() => setModal({ type: "create" })}>＋ Nueva pregunta</button>
      </div>

      {loading ? (
        <div style={{ color: "var(--ink-3)", fontSize: 13, padding: "12px 0" }}>Cargando…</div>
      ) : (
        faqs.map((f, i) => (
          <div key={f.id} className="panel" style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11, marginTop: 4 }}>
                ≡ {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{f.question}</div>
                <div style={{ color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5 }}>{f.answer}</div>
              </div>
              <div className="row-act">
                <button onClick={() => setModal({ type: "edit", item: f })}>Editar</button>
                <button className="bad" onClick={() => setModal({ type: "delete", item: f })}>Eliminar</button>
              </div>
            </div>
          </div>
        ))
      )}

      {modal?.type === "create" && (
        <AdminFormModal
          title="Nueva pregunta"
          fields={FIELDS}
          onClose={() => setModal(null)}
          onSave={handleCreate}
        />
      )}
      {modal?.type === "edit" && (
        <AdminFormModal
          title="Editar pregunta"
          fields={FIELDS}
          initial={{ q: modal.item.question, a: modal.item.answer }}
          onClose={() => setModal(null)}
          onSave={(d) => handleEdit(modal.item.id, d)}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmDialog
          title="¿Eliminar pregunta?"
          message={`Se quitará "${modal.item.question}" del FAQ público.`}
          confirmLabel="Sí, eliminar"
          onConfirm={() => handleDelete(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
