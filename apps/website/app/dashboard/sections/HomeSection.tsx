"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiEvent, type ApiAuditLog } from "@/lib/api";
import { AdminApproveModal } from "@/app/dashboard/modals/AdminApproveModal";
import { AdminRejectModal }  from "@/app/dashboard/modals/AdminRejectModal";
import { RevenueBarChart, type RevenueDatum } from "@/components/charts/RevenueBarChart";

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "approve"; item: ApiEvent }
  | { type: "reject";  item: ApiEvent }
  | null;

// ── Mock data (category stats + revenue values — no aggregate endpoint) ───────

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
  const { token } = useUser();
  const [queue,        setQueue]        = useState<ApiEvent[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [activity,     setActivity]     = useState<ApiAuditLog[]>([]);
  const [modal,        setModal]        = useState<ModalState>(null);

  const closeModal = () => setModal(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [evts, logs] = await Promise.all([
        api.adminEvents(token, { status: "PENDING_MODERATION", pageSize: 5 }),
        api.auditLogs({ pageSize: 5 }, token),
      ]);
      setQueue(evts.items);
      setPendingTotal(evts.total);
      setActivity(logs.items);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Inicio no disponible — intenta de nuevo");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleApprove() {
    if (!modal || modal.type !== "approve") return;
    const id = modal.item.id;
    try {
      if (!token) return;
      await api.approveEvent(id, token);
      toast.success("Evento aprobado");
      setQueue((q) => q.filter((r) => r.id !== id));
      setPendingTotal((n) => Math.max(0, n - 1));
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo aprobar el evento");
    } finally {
      setModal(null);
    }
  }

  async function handleReject(reason: string) {
    if (!modal || modal.type !== "reject") return;
    const id = modal.item.id;
    try {
      if (!token) return;
      await api.rejectEvent(id, reason, token);
      toast.error(`Evento rechazado — "${reason.slice(0, 40)}"`);
      setQueue((q) => q.filter((r) => r.id !== id));
      setPendingTotal((n) => Math.max(0, n - 1));
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo rechazar el evento");
    } finally {
      setModal(null);
    }
  }

  // Build chart data from mock values
  const chartData: RevenueDatum[] = CHART_VALUES.map((value, i) => ({ label: CHART_LABELS[i], value }));

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
          <div className="v">{pendingTotal}</div>
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
          <RevenueBarChart data={chartData} />
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
          {queue.length === 0 ? (
            <div className="empty">
              <div className="ic" />
              <h3>Sin eventos pendientes</h3>
              <p>No hay eventos esperando revisión.</p>
            </div>
          ) : (
            queue.map((r, i) => (
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
                  {r.poster ? (
                    <img
                      src={r.poster}
                      alt={r.title}
                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: "var(--r-sm)" }}
                    />
                  ) : (
                    <div className="pic poster-art" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.title}</div>
                  <div style={{ color: "var(--ink-3)", fontSize: 11.5 }}>
                    {[r.company, r.eventCategory?.name].filter(Boolean).join(" · ")}
                  </div>
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
            ))
          )}
        </div>

        {/* Activity feed */}
        <div className="panel">
          <div className="ph">
            <h3>Actividad reciente</h3>
          </div>
          {activity.length === 0 ? (
            <div className="empty">
              <div className="ic" />
              <h3>Sin actividad reciente</h3>
              <p>No hay registros de actividad disponibles.</p>
            </div>
          ) : (
            activity.map((a, i) => {
              const actor = a.userId == null ? "Sistema" : `Usuario #${a.userId}`;
              const initials = actor
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("");
              return (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: i < activity.length - 1 ? "1px solid var(--line)" : 0,
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
                        a.userId == null
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
                      <strong>{actor}</strong> {a.action}{" "}
                      <span style={{ color: "var(--accent)" }}>{a.entity} #{a.entityId}</span>
                    </div>
                    <div
                      style={{
                        color: "var(--ink-3)",
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {new Date(a.createdAt).toLocaleString("es-CL")}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "approve" && (
        <AdminApproveModal
          title={modal.item.title}
          description={[modal.item.company, modal.item.eventCategory?.name].filter(Boolean).join(" · ")}
          onClose={closeModal}
          onConfirm={handleApprove}
        />
      )}
      {modal?.type === "reject" && (
        <AdminRejectModal
          title={modal.item.title}
          description={[modal.item.company, modal.item.eventCategory?.name].filter(Boolean).join(" · ")}
          onClose={closeModal}
          onConfirm={handleReject}
        />
      )}
    </>
  );
}
