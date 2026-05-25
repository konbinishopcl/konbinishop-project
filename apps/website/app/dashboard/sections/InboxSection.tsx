"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type PipelineStage =
  | "Nuevo"
  | "Contactado"
  | "En negociación"
  | "Cerrado ganado"
  | "Cerrado perdido";

const PIPELINE_STAGES: PipelineStage[] = [
  "Nuevo",
  "Contactado",
  "En negociación",
  "Cerrado ganado",
  "Cerrado perdido",
];

const STAGE_STYLE: Record<PipelineStage, { color: string; bg: string }> = {
  Nuevo:             { color: "var(--ink-3)",   bg: "var(--surface-2)" },
  Contactado:        { color: "var(--warn)",     bg: "color-mix(in oklab, var(--warn) 12%, transparent)" },
  "En negociación":  { color: "var(--accent)",   bg: "color-mix(in oklab, var(--accent) 12%, transparent)" },
  "Cerrado ganado":  { color: "var(--ok)",       bg: "color-mix(in oklab, var(--ok) 12%, transparent)" },
  "Cerrado perdido": { color: "var(--err)",      bg: "color-mix(in oklab, var(--err) 12%, transparent)" },
};

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
  contact:  "Contacto",
  photo:    "Fotografía",
  creators: "Creadores de contenido",
};

const KIND_ENDPOINTS: Record<string, string> = {
  contact:  "/api/contact/admin",
  photo:    "/api/services/photography/admin",
  creators: "/api/services/content-creators/admin",
};

function StagePill({
  stage,
  messageId,
  onChange,
}: {
  stage: PipelineStage;
  messageId: number;
  onChange: (id: number, stage: PipelineStage) => void;
}) {
  const [open, setOpen] = useState(false);
  const style = STAGE_STYLE[stage];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          letterSpacing: ".05em",
          fontWeight: 600,
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.color}`,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: style.color,
            flexShrink: 0,
          }}
        />
        {stage}
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              zIndex: 20,
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              overflow: "hidden",
              minWidth: 180,
              boxShadow: "0 8px 24px rgba(0,0,0,.2)",
            }}
          >
            {PIPELINE_STAGES.map((s) => {
              const st = STAGE_STYLE[s];
              return (
                <button
                  key={s}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(messageId, s);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "9px 14px",
                    fontSize: 13,
                    textAlign: "left",
                    background: s === stage ? "var(--surface-2)" : "transparent",
                    color: st.color,
                    cursor: "pointer",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: st.color,
                      flexShrink: 0,
                    }}
                  />
                  {s}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function InboxSection({ kind = "contact" }: { kind?: string }) {
  const { token } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [pipelineStages, setPipelineStages] = useState<Record<number, PipelineStage>>({});

  const endpoint = KIND_ENDPOINTS[kind] ?? KIND_ENDPOINTS.contact;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setMessages([]);
    setSelected(null);
    fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Error al cargar ${KIND_LABELS[kind] ?? kind}`);
        const data = await r.json();
        const items: Message[] = Array.isArray(data) ? data : (data.items ?? []);
        setMessages(items);
        // Initialize all to "Nuevo"
        const initial: Record<number, PipelineStage> = {};
        items.forEach((m) => { initial[m.id] = "Nuevo"; });
        setPipelineStages(initial);
      })
      .catch((e) =>
        toast.error(
          e instanceof Error ? e.message : `Error al cargar ${KIND_LABELS[kind] ?? kind}`,
        ),
      )
      .finally(() => setLoading(false));
  }, [token, kind, endpoint]);

  function handleStageChange(id: number, stage: PipelineStage) {
    setPipelineStages((prev) => ({ ...prev, [id]: stage }));
    toast.success(`Movido a ${stage}`);
  }

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
          <p>No hay mensajes de {KIND_LABELS[kind]?.toLowerCase() ?? "contacto"} aún.</p>
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
            {messages.map((m) => {
              const stage = pipelineStages[m.id] ?? "Nuevo";
              return (
                <div
                  key={m.id}
                  className="inbox-row"
                  style={{
                    borderColor: selected?.id === m.id ? "var(--accent)" : undefined,
                    cursor: "pointer",
                    alignItems: "center",
                  }}
                  onClick={() => setSelected(selected?.id === m.id ? null : m)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="i-name">{m.name ?? m.email ?? `#${m.id}`}</div>
                    <div className="i-msg" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.subject ?? (m.message ? m.message.slice(0, 70) : "Sin mensaje")}
                      {m.message && !m.subject && m.message.length > 70 ? "…" : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <div className="i-time">{formatDate(m.createdAt)}</div>
                    <StagePill
                      stage={stage}
                      messageId={m.id}
                      onChange={handleStageChange}
                    />
                  </div>
                </div>
              );
            })}
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
                  x
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
                <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>DE</dt>
                <dd style={{ margin: 0 }}>{selected.name ?? "—"}</dd>
                <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>EMAIL</dt>
                <dd style={{ margin: 0 }}>{selected.email ?? "—"}</dd>
                {selected.type && (
                  <>
                    <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>TIPO</dt>
                    <dd style={{ margin: 0 }}>{selected.type}</dd>
                  </>
                )}
                <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>FECHA</dt>
                <dd style={{ margin: 0 }}>{formatDate(selected.createdAt)}</dd>
                <dt style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em" }}>PIPELINE</dt>
                <dd style={{ margin: 0 }}>
                  <StagePill
                    stage={pipelineStages[selected.id] ?? "Nuevo"}
                    messageId={selected.id}
                    onChange={handleStageChange}
                  />
                </dd>
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
