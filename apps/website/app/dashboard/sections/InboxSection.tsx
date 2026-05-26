"use client";
import { useState } from "react";
import { toast } from "sonner";

type PipelineStage = "Nuevo" | "Contactado" | "En negociación" | "Cerrado ganado" | "Cerrado perdido";

type InboxItem = {
  nm: string;
  em: string;
  ev: string;
  date: string;
  st: PipelineStage;
  asunto: string;
  msg: string;
  services: string[] | null;
};

const DATA: InboxItem[] = [
  {
    nm: "María Pérez",
    em: "maria@email.cl",
    ev: "Aniversario AnimeShop",
    date: "12 MAR",
    st: "Nuevo",
    asunto: "Quiero publicar un evento",
    msg: "Hola, organizamos el aniversario de nuestra tienda en Santiago. Queremos publicar el evento, ¿cómo funciona?",
    services: ["Cobertura completa del evento", "Sesión previa al evento"],
  },
  {
    nm: "Pedro Sánchez",
    em: "pedro@cosplay.cl",
    ev: "Cosplay Meetup Junio",
    date: "10 MAR",
    st: "Contactado",
    asunto: "Servicio de fotos",
    msg: "Buenas, ¿qué tal? Vamos a hacer un meetup en julio en Santiago. Nos interesa contratar fotógrafos. Días disponibles: sáb 12 y dom 13.",
    services: ["Cobertura completa del evento"],
  },
  {
    nm: "Sofía L.",
    em: "sofi@productora.cl",
    ev: "Concierto J-Rock",
    date: "8 MAR",
    st: "En negociación",
    asunto: "Cobertura completa",
    msg: "Necesitamos cubrir un concierto de J-Rock en el Caupolicán el 15 abril.",
    services: ["Aftermovie del evento", "Cobertura en vivo (stories)", "Reels para Instagram / TikTok"],
  },
];

function pillClass(st: PipelineStage): string {
  if (st === "Nuevo") return "rev";
  if (st === "Contactado") return "pub";
  return "exp";
}

function initials(nm: string): string {
  return nm.split(" ").map((w) => w[0]).slice(0, 2).join("");
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
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-acts">
          <button onClick={onClose}>Cancelar</button>
          <button className="btn dark" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function InboxSection({ kind = "contact" }: { kind?: "contact" | "photo" | "creators" }) {
  const [filter, setFilter] = useState<"Todos" | "No leídos" | "Archivados">("Todos");
  const [openItem, setOpenItem] = useState<InboxItem | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<InboxItem | null>(null);

  const data = DATA.map((r) => ({
    ...r,
    services: kind !== "contact" ? r.services : null,
  }));

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {(["Todos", "No leídos", "Archivados"] as const).map((f) => (
          <button key={f} className={`sel${filter === f ? " on" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>CONTACTO</th>
              <th>{kind === "contact" ? "ASUNTO" : "EVENTO"}</th>
              <th>FECHA</th>
              <th>PIPELINE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr key={i}>
                <td>
                  <div className="cell-evt">
                    <div
                      style={{
                        width: 36,
                        height: 36,
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
                      {initials(r.nm)}
                    </div>
                    <div>
                      <div className="ti">{r.nm}</div>
                      <div className="su">{r.em}</div>
                    </div>
                  </div>
                </td>
                <td>{kind === "contact" ? r.asunto : r.ev}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.date}</td>
                <td>
                  <span className={`stat-pill ${pillClass(r.st)}`}>
                    <span className="dot" />
                    {r.st}
                  </span>
                </td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setOpenItem(r)}>Abrir</button>
                    <button onClick={() => setConfirmArchive(r)}>Archivar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Open item modal */}
      {openItem && (
        <div className="confirm-bg" onClick={() => setOpenItem(null)}>
          <div
            className="confirm-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 560 }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 999,
                    background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  {initials(openItem.nm)}
                </div>
                <div>
                  <h3 className="h" style={{ margin: 0 }}>{openItem.nm}</h3>
                  <a
                    href={`mailto:${openItem.em}`}
                    style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 12 }}
                  >
                    {openItem.em}
                  </a>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setOpenItem(null)}>✕</button>
            </div>

            {/* Content box */}
            <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              {kind === "contact" ? (
                <>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 4 }}>
                    ASUNTO
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>{openItem.asunto}</div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 4 }}>
                    EVENTO · FECHA
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 10 }}>{openItem.ev}</div>
                </>
              )}
              <div style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>{openItem.msg}</div>
            </div>

            {/* Services */}
            {openItem.services && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 8 }}>
                  SERVICIOS MARCADOS
                </div>
                {openItem.services.map((s) => (
                  <div key={s} style={{ padding: "6px 0", fontSize: 13, color: "var(--ink-2)" }}>✓ {s}</div>
                ))}
              </div>
            )}

            {/* Pipeline */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 8 }}>
                MOVER EN PIPELINE
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["Nuevo", "Contactado", "En negociación", "Cerrado ganado", "Cerrado perdido"] as PipelineStage[]).map((s) => (
                  <button
                    key={s}
                    className={`sel${openItem.st === s ? " on" : ""}`}
                    style={{ fontSize: 11, padding: "6px 10px" }}
                    onClick={() => {
                      toast.success(`Movido a "${s}"`);
                      setOpenItem(null);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="row-act" style={{ justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setOpenItem(null);
                  toast.info(`Abriendo email a ${openItem.nm}…`);
                  window.location.href = `mailto:${openItem.em}`;
                }}
              >
                ✉ Responder por email
              </button>
              <button
                className="btn dark"
                style={{ padding: "6px 14px", fontSize: 12 }}
                onClick={() => setOpenItem(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive confirm */}
      {confirmArchive && (
        <ConfirmDialog
          title="¿Archivar mensaje?"
          message={`"${confirmArchive.nm}" pasará a Archivados. Podrás restaurarlo después si es necesario.`}
          confirmLabel="Sí, archivar"
          onConfirm={() => {
            toast.success("Mensaje archivado");
            setConfirmArchive(null);
          }}
          onClose={() => setConfirmArchive(null)}
        />
      )}
    </>
  );
}
