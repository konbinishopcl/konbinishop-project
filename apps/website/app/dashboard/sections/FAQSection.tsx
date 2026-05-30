"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useUser } from "@/components/providers";
import { api, type ApiFaqItem } from "@/lib/api";

// ── Schema ─────────────────────────────────────────────────────────────────────

const Schema = z.object({
  q: z.string().min(5, "Mínimo 5 caracteres"),
  a: z.string().min(10, "Mínimo 10 caracteres"),
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Field = {
  k: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
};

const FIELDS: Field[] = [
  { k: "q", label: "Pregunta",  required: true, placeholder: "¿Cómo publico un evento?" },
  { k: "a", label: "Respuesta", required: true, type: "textarea", placeholder: "Escribe la respuesta completa..." },
];

type ModalState =
  | { type: "create" }
  | { type: "edit"; item: ApiFaqItem }
  | { type: "delete"; item: ApiFaqItem }
  | null;

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
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }));

  const isValid = Schema.safeParse(data).success;

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
                  disabled={busy}
                  rows={4}
                  style={{ resize: "vertical" }}
                />
              ) : (
                <input
                  type={f.type || "text"}
                  value={data[f.k] || ""}
                  onChange={(e) => set(f.k, e.target.value)}
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
        <div className="row-act">
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button
            className="btn primary"
            style={{ background: "var(--err)" }}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? "Eliminando…" : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

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
    if (!token) { toast.error("Sin sesión activa"); throw new Error("no token"); }
    try {
      await api.faqCreate({ question: data.q, answer: data.a }, token);
      toast.success("Pregunta agregada");
      await loadFaqs();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo crear");
      throw ex;
    }
  }

  async function handleEdit(id: number, data: Record<string, string>) {
    if (!token) { toast.error("Sin sesión activa"); throw new Error("no token"); }
    try {
      await api.faqUpdate(id, { question: data.q, answer: data.a }, token);
      toast.success("Cambios guardados");
      await loadFaqs();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo actualizar");
      throw ex;
    }
  }

  async function handleDelete(id: number) {
    if (!token) { toast.error("Sin sesión activa"); throw new Error("no token"); }
    try {
      await api.faqRemove(id, token);
      toast.success("Pregunta eliminada");
      await loadFaqs();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo eliminar");
      throw ex;
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "var(--ink-3)", fontSize: 13 }}>
          {faqs.length} preguntas activas
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
          onConfirm={() => handleDelete(modal.item.id)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
