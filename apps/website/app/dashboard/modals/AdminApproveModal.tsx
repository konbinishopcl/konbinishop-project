"use client";

interface AdminApproveModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => void;
  busy?: boolean;
}

export function AdminApproveModal({
  title,
  description,
  onClose,
  onConfirm,
  busy = false,
}: AdminApproveModalProps) {
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>¿Aprobar?</h3>
        <p>
          <strong>{title}</strong>
          {description && (
            <>
              <br />
              <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{description}</span>
            </>
          )}
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-3)" }}>
          El contenido se publicará inmediatamente y el organizador recibirá una notificación.
        </p>
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
            onClick={onConfirm}
            disabled={busy}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              background: "var(--ok)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Aprobando…" : "✓ Aprobar"}
          </button>
        </div>
      </div>
    </div>
  );
}
