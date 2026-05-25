"use client";
import { useState } from "react";

interface AdminRejectModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  busy?: boolean;
}

export function AdminRejectModal({
  title,
  description,
  onClose,
  onConfirm,
  busy = false,
}: AdminRejectModalProps) {
  const [reason, setReason] = useState("");
  const canSubmit = reason.trim().length >= 3;

  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>Rechazar</h3>
        <p>
          <strong>{title}</strong>
          {description && (
            <>
              <br />
              <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{description}</span>
            </>
          )}
        </p>
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--ink-3)",
              fontFamily: "var(--font-mono)",
              letterSpacing: ".1em",
              marginBottom: 6,
            }}
          >
            MOTIVO DEL RECHAZO (mínimo 3 caracteres)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe el motivo — se le mostrará al organizador."
            style={{
              width: "100%",
              minHeight: 100,
              resize: "vertical",
              background: "var(--surface-2)",
              border: `1px solid ${canSubmit ? "var(--line)" : reason.length > 0 ? "var(--warn)" : "var(--line)"}`,
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--ink)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {reason.length > 0 && !canSubmit && (
            <div
              style={{ fontSize: 12, color: "var(--warn)", marginTop: 4 }}
            >
              Mínimo 3 caracteres ({reason.length}/3)
            </div>
          )}
        </div>
        <div className="modal-acts">
          <button
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
            onClick={() => onConfirm(reason.trim())}
            disabled={!canSubmit || busy}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              background: "var(--err)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: canSubmit && !busy ? "pointer" : "not-allowed",
              opacity: canSubmit && !busy ? 1 : 0.5,
            }}
          >
            {busy ? "Rechazando…" : "✕ Rechazar"}
          </button>
        </div>
      </div>
    </div>
  );
}
