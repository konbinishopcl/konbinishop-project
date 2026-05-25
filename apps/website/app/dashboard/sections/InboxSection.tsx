"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type Message = {
  id: number;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  createdAt?: string;
  status?: string;
  type?: string;
};

const KIND_LABELS: Record<string, string> = {
  contact: "Contacto",
  photo: "Fotografía",
  creators: "Creadores de contenido",
};

const KIND_ENDPOINTS: Record<string, string> = {
  contact: "/api/contact/admin",
  photo: "/api/services/photography/admin",
  creators: "/api/services/content-creators/admin",
};

export default function InboxSection({ kind = "contact" }: { kind?: string }) {
  const { token } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);

  const endpoint = KIND_ENDPOINTS[kind] ?? KIND_ENDPOINTS.contact;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setMessages([]);
    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Error al cargar ${KIND_LABELS[kind] ?? kind}`);
        const data = await r.json();
        setMessages(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) =>
        toast.error(
          e instanceof Error ? e.message : `Error al cargar ${KIND_LABELS[kind] ?? kind}`,
        ),
      )
      .finally(() => setLoading(false));
  }, [token, kind, endpoint]);

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <div className="section-head">
        <h2>{KIND_LABELS[kind] ?? "Bandeja"}</h2>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-3)",
          }}
        >
          {messages.length} MENSAJES
        </span>
      </div>

      {loading ? (
        <div className="empty">
          <h3>Cargando mensajes…</h3>
        </div>
      ) : messages.length === 0 ? (
        <div className="empty">
          <h3>Bandeja vacía</h3>
          <p>
            No hay mensajes de {KIND_LABELS[kind]?.toLowerCase() ?? "contacto"} aún.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selected ? "1fr 1.2fr" : "1fr",
            gap: 16,
          }}
        >
          <div className="inbox-list">
            {messages.map((m) => (
              <div
                key={m.id}
                className="inbox-row"
                style={{
                  borderColor: selected?.id === m.id ? "var(--accent)" : undefined,
                  cursor: "pointer",
                }}
                onClick={() => setSelected(selected?.id === m.id ? null : m)}
              >
                <div>
                  <div className="i-name">{m.name ?? m.email ?? `#${m.id}`}</div>
                  <div className="i-msg">
                    {m.subject ?? (m.message ? m.message.slice(0, 60) : "Sin mensaje")}
                    {m.message && m.message.length > 60 ? "…" : ""}
                  </div>
                </div>
                <div className="i-time">{formatDate(m.createdAt)}</div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="panel" style={{ height: "fit-content" }}>
              <div className="ph">
                <h3>{selected.subject ?? "Detalle del mensaje"}</h3>
                <button
                  style={{
                    background: "none",
                    color: "var(--ink-3)",
                    cursor: "pointer",
                    fontSize: 20,
                    lineHeight: 1,
                  }}
                  onClick={() => setSelected(null)}
                >
                  ×
                </button>
              </div>
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "8px 16px",
                  fontSize: 13,
                  margin: 0,
                }}
              >
                <dt
                  style={{
                    color: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: ".1em",
                  }}
                >
                  DE
                </dt>
                <dd style={{ margin: 0 }}>{selected.name ?? "—"}</dd>
                <dt
                  style={{
                    color: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: ".1em",
                  }}
                >
                  EMAIL
                </dt>
                <dd style={{ margin: 0 }}>{selected.email ?? "—"}</dd>
                {selected.type && (
                  <>
                    <dt
                      style={{
                        color: "var(--ink-3)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        letterSpacing: ".1em",
                      }}
                    >
                      TIPO
                    </dt>
                    <dd style={{ margin: 0 }}>{selected.type}</dd>
                  </>
                )}
                <dt
                  style={{
                    color: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: ".1em",
                  }}
                >
                  FECHA
                </dt>
                <dd style={{ margin: 0 }}>{formatDate(selected.createdAt)}</dd>
              </dl>
              {selected.message && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "14px",
                    background: "var(--surface-2)",
                    borderRadius: 10,
                    fontSize: 13,
                    color: "var(--ink-2)",
                    lineHeight: 1.6,
                  }}
                >
                  {selected.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
