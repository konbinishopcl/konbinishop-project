"use client";
import { useState } from "react";
import { toast } from "sonner";

type TransferTarget = { id: number; name: string; email: string };

interface AdminTransferModalProps {
  contentTitle?: string;
  onClose: () => void;
  onConfirm: (target: TransferTarget) => void;
  busy?: boolean;
}

// Mock list of organizations available for transfer
const MOCK_ORGS: TransferTarget[] = [
  { id: 1, name: "Cinépolis Chile", email: "admin@cinepolis.cl" },
  { id: 2, name: "AnimeShop CL", email: "tienda@animeshop.cl" },
  { id: 3, name: "Konbini Ediciones", email: "info@konbini-ed.cl" },
  { id: 4, name: "CineClub Santiago", email: "admin@cineclub.cl" },
];

export function AdminTransferModal({
  contentTitle,
  onClose,
  onConfirm,
  busy = false,
}: AdminTransferModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = MOCK_ORGS.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()),
  );

  const target = MOCK_ORGS.find((o) => o.id === selected) ?? null;

  const handleConfirm = () => {
    if (!target) {
      toast.error("Selecciona un destino");
      return;
    }
    onConfirm(target);
  };

  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>Transferir contenido</h3>
        {contentTitle && (
          <p style={{ marginBottom: 16 }}>
            Transferir <strong>{contentTitle}</strong> a otra cuenta/organización.
          </p>
        )}

        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Buscar organización o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          />
        </div>

        <div
          style={{
            maxHeight: 200,
            overflowY: "auto",
            border: "1px solid var(--line)",
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          {filtered.map((o, i) => (
            <div
              key={o.id}
              onClick={() => setSelected(o.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                cursor: "pointer",
                background: selected === o.id ? "color-mix(in oklab, var(--accent) 10%, var(--surface))" : "transparent",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--line)" : "none",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {o.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{o.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                  {o.email}
                </div>
              </div>
              {selected === o.id && (
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 13,
              }}
            >
              Sin resultados
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
            onClick={handleConfirm}
            disabled={!target || busy}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              background: "var(--accent)",
              color: "var(--accent-ink)",
              fontSize: 13,
              fontWeight: 600,
              cursor: target && !busy ? "pointer" : "not-allowed",
              opacity: target && !busy ? 1 : 0.5,
            }}
          >
            {busy ? "Transfiriendo…" : "Transferir"}
          </button>
        </div>
      </div>
    </div>
  );
}
