"use client";
import { useState } from "react";
import { toast } from "sonner";
import { AdminApproveModal } from "@/app/dashboard/modals/AdminApproveModal";
import { AdminRejectModal }  from "@/app/dashboard/modals/AdminRejectModal";

// ── Types ─────────────────────────────────────────────────────────────────────

type QueueItem = {
  id:    string;
  title: string;
  meta:  string;
  art:   string;
};

type ModalState =
  | { type: "approve"; item: QueueItem }
  | { type: "reject";  item: QueueItem }
  | null;

// ── Mock data ─────────────────────────────────────────────────────────────────

const QUEUE: QueueItem[] = [
  { id: "q1", title: "Anime Crunchyroll Fest", meta: "9 cupos · Streamings",   art: "pa-3" },
  { id: "q2", title: "BLACKPINK Tributo Live", meta: "K-Pop · Caupolicán",     art: "pa-4" },
  { id: "q3", title: "ComicCon Chile 2024",    meta: "3 días · Espacio Riesco", art: "pa-5" },
];

const ACTIVITY = [
  { name: "Camila T.", verb: "aprobó",              entity: "Anime Crunchyroll Fest", time: "hace 5 min" },
  { name: "Diego S.",  verb: "baneó",               entity: "RetroGaming Fake",       time: "hace 22 min" },
  { name: "Camila T.", verb: "verificó organizador", entity: "@cinepolis",             time: "hace 1 h" },
  { name: "Sistema",   verb: "renovó suscripción",  entity: "Cinépolis Chile",        time: "hace 2 h" },
  { name: "Camila T.", verb: "respondió contacto",  entity: "María Pérez",            time: "hace 4 h" },
];

const CATEGORIES = [
  ["Anime",        38, 84],
  ["Conciertos",   28, 62],
  ["Cine",         22, 48],
  ["Gaming",       16, 36],
  ["Convenciones", 12, 27],
  ["Cosplay",       8, 18],
] as const;

const CHART_VALUES = [42, 51, 38, 60, 72, 65, 80, 90, 75, 88, 110, 142];
const CHART_LABELS = ["E","F","M","A","M","J","J","A","S","O","N","D"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeSection() {
  const [queue,  setQueue]  = useState<QueueItem[]>(QUEUE);
  const [modal,  setModal]  = useState<ModalState>(null);

  const closeModal = () => setModal(null);

  function handleApprove() {
    if (!modal || modal.type !== "approve") return;
    const id = modal.item.id;
    toast.success("Evento aprobado");
    setQueue((q) => q.filter((r) => r.id !== id));
    closeModal();
  }

  function handleReject(reason: string) {
    if (!modal || modal.type !== "reject") return;
    const id = modal.item.id;
    toast.error(`Evento rechazado — "${reason.slice(0, 40)}"`);
    setQueue((q) => q.filter((r) => r.id !== id));
    closeModal();
  }

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="l">INGRESOS MES</div>
          <div className="v">$3.8M</div>
          <div className="d up">↑ 24%</div>
        </div>
        <div className="kpi">
          <div className="l">EVENTOS PUBLICADOS</div>
          <div className="v">142</div>
          <div className="d up">↑ 18%</div>
        </div>
        <div className="kpi">
          <div className="l">EN REVISIÓN</div>
          <div className="v">9</div>
          <div className="d up">↑ 3</div>
        </div>
        <div className="kpi">
          <div className="l">SUSCRIPTORES</div>
          <div className="v">87</div>
          <div className="d up">↑ 12</div>
        </div>
      </div>

      {/* Charts row: 1.5fr / 1fr */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
        {/* Revenue chart */}
        <div className="panel">
          <div className="ph">
            <h3>Ingresos mensuales</h3>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>ÚLTIMOS 12 MESES</div>
          </div>
          <div className="chart" role="img" aria-label="Gráfico de ingresos mensuales">
            {CHART_VALUES.map((v, i) => (
              <div key={i} className="bar" style={{ height: v + "%" }}>
                <span className="lbl">{CHART_LABELS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="panel">
          <div className="ph">
            <h3>Por categoría</h3>
          </div>
          {CATEGORIES.map(([name, count, pct]) => (
            <div key={name} className="cat-bar">
              <div className="name">{name}</div>
              <div className="track">
                <div style={{ width: pct + "%" }} />
              </div>
              <div className="v">{count} evt</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row: 1fr / 1fr */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
        {/* Review queue */}
        <div className="panel">
          <div className="ph">
            <h3>Cola de revisión</h3>
            <div className="right-act">
              <button className="sel" style={{ padding: "6px 12px", fontSize: 12 }}>
                Ver toda →
              </button>
            </div>
          </div>
          {queue.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: i < queue.length - 1 ? "1px solid var(--line)" : 0,
              }}
            >
              <div className="thumb-sm" style={{ width: 40, height: 40 }}>
                <div className={`pic poster-art ${r.art}`} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.title}</div>
                <div style={{ color: "var(--ink-3)", fontSize: 11.5 }}>{r.meta}</div>
              </div>
              <div className="row-act" style={{ display: "flex", gap: 6 }}>
                <button
                  className="sel"
                  style={{ color: "var(--ok)", padding: "6px 10px", fontSize: 12 }}
                  onClick={() => setModal({ type: "approve", item: r })}
                >
                  ✓ Aprobar
                </button>
                <button
                  className="sel"
                  style={{ color: "var(--err)", padding: "6px 10px", fontSize: 12 }}
                  onClick={() => setModal({ type: "reject", item: r })}
                >
                  ✕ Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Activity feed */}
        <div className="panel">
          <div className="ph">
            <h3>Actividad reciente</h3>
          </div>
          {ACTIVITY.map((a, i) => {
            const initials = a.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("");
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--line)" : 0,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    fontSize: 11,
                    flex: "0 0 28px",
                    borderRadius: 999,
                    background:
                      a.name === "Sistema"
                        ? "var(--ink-3)"
                        : "linear-gradient(135deg, var(--accent), var(--accent-2))",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div>
                    <strong>{a.name}</strong> {a.verb}{" "}
                    <span style={{ color: "var(--accent)" }}>{a.entity}</span>
                  </div>
                  <div
                    style={{
                      color: "var(--ink-3)",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {a.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "approve" && (
        <AdminApproveModal
          title={modal.item.title}
          description={modal.item.meta}
          onClose={closeModal}
          onConfirm={handleApprove}
        />
      )}
      {modal?.type === "reject" && (
        <AdminRejectModal
          title={modal.item.title}
          description={modal.item.meta}
          onClose={closeModal}
          onConfirm={handleReject}
        />
      )}
    </>
  );
}
