"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiEvent, type ApiAuditLog, type ApiEventCategory } from "@/lib/api";
import { AdminApproveModal } from "@/app/dashboard/modals/AdminApproveModal";
import { AdminRejectModal }  from "@/app/dashboard/modals/AdminRejectModal";
import { RevenueBarChart, type RevenueDatum } from "@/components/charts/RevenueBarChart";

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalState =
  | { type: "approve"; item: ApiEvent }
  | { type: "reject";  item: ApiEvent }
  | null;

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeSection() {
  const { token } = useUser();
  const [queue,        setQueue]        = useState<ApiEvent[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [activity,     setActivity]     = useState<ApiAuditLog[]>([]);
  const [modal,        setModal]        = useState<ModalState>(null);
  const [monthRevenue,   setMonthRevenue]   = useState(0);
  const [publishedTotal, setPublishedTotal] = useState(0);
  const [subsTotal,      setSubsTotal]      = useState(0);
  const [categoryBars,   setCategoryBars]   = useState<{ name: string; count: number; pct: number }[]>([]);
  const [revenueData,    setRevenueData]    = useState<RevenueDatum[]>([]);

  const closeModal = () => setModal(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [evts, logs, payments, approved, subsRes, cats] = await Promise.all([
        api.adminEvents(token, { status: "PENDING_MODERATION", pageSize: 5 }),
        api.auditLogs({ pageSize: 5 }, token),
        api.adminPayments(token),
        api.adminEvents(token, { status: "APPROVED", pageSize: 1 }),
        api.subscriptions(token),
        api.eventCategories(),
      ]);
      setQueue(evts.items);
      setPendingTotal(evts.total);
      setActivity(logs.items);

      // INGRESOS MES: sum of current-month PAID payments
      const now = new Date();
      const monthSum = payments
        .filter((p) => {
          if (p.status !== "PAID") return false;
          const d = new Date(p.createdAt);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        })
        .reduce((s, p) => s + p.total, 0);
      setMonthRevenue(monthSum);
      setPublishedTotal(approved.total);
      setSubsTotal(subsRes.total);

      // Category bars from _count.events, top 6 by count, pct relative to max
      const withCounts = cats
        .map((c) => ({
          name: c.name ?? c.slug,
          count: (c as ApiEventCategory & { _count?: { events?: number } })._count?.events ?? 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      const maxCount = withCounts[0]?.count ?? 0;
      setCategoryBars(
        withCounts.map((c) => ({ ...c, pct: maxCount > 0 ? Math.round((c.count / maxCount) * 100) : 0 }))
      );

      // Revenue chart: bucket PAID payments by month (last 12 months, oldest→newest)
      const MONTH_LABELS = ["E","F","M","A","M","J","J","A","S","O","N","D"];
      const refMonths = Array.from({ length: 12 }, (_, idx) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
        return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
      });
      const monthly = refMonths.map((rm) => ({ label: rm.label, value: 0 }));
      payments.filter((p) => p.status === "PAID").forEach((p) => {
        const pd = new Date(p.createdAt);
        const idx = refMonths.findIndex((rm) => rm.year === pd.getFullYear() && rm.month === pd.getMonth());
        if (idx !== -1) monthly[idx].value += p.total;
      });
      setRevenueData(monthly.every((m) => m.value === 0) ? [] : monthly);
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

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="l">INGRESOS MES</div>
          <div className="v">${monthRevenue.toLocaleString("es-CL")}</div>
        </div>
        <div className="kpi">
          <div className="l">EVENTOS PUBLICADOS</div>
          <div className="v">{publishedTotal}</div>
        </div>
        <div className="kpi">
          <div className="l">EN REVISIÓN</div>
          <div className="v">{pendingTotal}</div>
        </div>
        <div className="kpi">
          <div className="l">SUSCRIPTORES</div>
          <div className="v">{subsTotal}</div>
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
          <RevenueBarChart data={revenueData} />
        </div>

        {/* Category breakdown */}
        <div className="panel">
          <div className="ph">
            <h3>Por categoría</h3>
          </div>
          {categoryBars.length === 0 ? (
            <div className="empty"><div className="ic" /><h3>Sin categorías</h3></div>
          ) : categoryBars.map((c) => (
            <div key={c.name} className="cat-bar">
              <div className="name">{c.name}</div>
              <div className="track"><div style={{ width: c.pct + "%" }} /></div>
              <div className="v">{c.count} evt</div>
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
              <Link href="/dashboard/events" className="sel" style={{ padding: "6px 12px", fontSize: 12 }}>
                Ver toda →
              </Link>
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
