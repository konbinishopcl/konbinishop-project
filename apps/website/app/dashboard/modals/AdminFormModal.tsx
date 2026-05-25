"use client";
import type { ReactNode } from "react";

interface AdminFormModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
  submitLabel?: string;
  busy?: boolean;
}

export function AdminFormModal({
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = "Guardar",
  busy = false,
}: AdminFormModalProps) {
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {children}
          <div className="modal-acts" style={{ marginTop: 18 }}>
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
              {busy ? "Guardando…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
