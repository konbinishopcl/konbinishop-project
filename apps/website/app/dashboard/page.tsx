"use client";

import { useEffect, useMemo, useState } from "react";
import { KpiCard } from "@/components/admin/KpiCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { Ic } from "@/components/admin/icons";
import { useUser } from "@/components/providers";
import { api, imageUrl, type ApiEvent } from "@/lib/api";

function producerOf(e: ApiEvent): string {
  if (!e.owner) return "—";
  return [e.owner.firstname, e.owner.lastname].filter(Boolean).join(" ") || e.owner.email;
}

export default function DashboardPage() {
  const { token } = useUser();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .adminEvents(token, { pageSize: 100 })
      .then((r) => setEvents(r.items))
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar los eventos"))
      .finally(() => setLoading(false));
  }, [token]);

  const aprobados = events.filter((e) => e.isApproved && !e.isRejected);
  const pendientes = events.filter((e) => !e.isApproved && !e.isRejected);

  const catRows = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      if (e.category) {
        const nm = e.category.name ?? e.category.slug;
        map.set(nm, (map.get(nm) ?? 0) + 1);
      }
    }
    return [...map.entries()]
      .map(([nm, n]) => ({ nm, n }))
      .sort((a, b) => b.n - a.n);
  }, [events]);
  const maxCat = Math.max(1, ...catRows.map((c) => c.n));

  // Feed de actividad — mock (no hay API de actividad/auditoría).
  const activity = [
    { who: "ET", color: "#ff5b49", txt: <>Edgardo Toro envió <strong>&quot;Anime Symphonic Orchestra&quot;</strong> a revisión.</>, time: "hace 4 min" },
    { who: "CC", color: "#6c5cff", txt: <><strong>Cinépolis Chile</strong> publicó 3 funciones de <strong>Demon Slayer</strong>.</>, time: "hace 22 min" },
    { who: "GB", color: "#f3c053", txt: <>Tú <strong>rechazaste</strong> &quot;Cosplay Battle Royale&quot; — motivo: imagen con texto.</>, time: "hace 1 h" },
    { who: "JM", color: "#ff5b49", txt: <>Nuevo organizador registrado: <strong>Jorge Maturana</strong> (anime-club.cl).</>, time: "hace 2 h" },
    { who: "—", color: "#4ec38a", txt: <>Sistema · respaldo automático completado (32.4 GB).</>, time: "hace 3 h" },
  ];

  const approve = async (e: ApiEvent) => {
    if (!token) return;
    setBusy(e.id);
    setError("");
    try {
      await api.approveEvent(e.id, token);
      setEvents((list) =>
        list.map((x) =>
          x.id === e.id ? { ...x, isApproved: true, isRejected: false, rejectedReason: null } : x,
        ),
      );
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "No se pudo aprobar el evento");
    } finally {
      setBusy(null);
    }
  };

  const reject = async (e: ApiEvent) => {
    if (!token) return;
    const reason = window.prompt("Motivo del rechazo (se le mostrará al organizador):");
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setError("El motivo del rechazo debe tener al menos 3 caracteres.");
      return;
    }
    setBusy(e.id);
    setError("");
    try {
      await api.rejectEvent(e.id, reason.trim(), token);
      setEvents((list) =>
        list.map((x) =>
          x.id === e.id ? { ...x, isApproved: false, isRejected: true, rejectedReason: reason.trim() } : x,
        ),
      );
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "No se pudo rechazar el evento");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">PANEL · ダッシュボード</div>
          <h1>
            Dashboard <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <div className="sub">Vista general del panel de Konbini.</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn ghost sm">{Ic.dl} Exportar reporte</button>
          <button className="btn primary sm">{Ic.plus} Nuevo evento</button>
        </div>
      </div>

      {error && <div style={{ color: "var(--err)", fontSize: 13, margin: "8px 0" }}>{error}</div>}

      <div className="kpi-grid">
        <KpiCard label="Ingresos del mes" value="$ 64.2" ccy="M CLP" trend="+18.4%" from="abril" icon={Ic.pay} color="var(--accent)" />
        <KpiCard label="Tickets vendidos" value="12,847" trend="+24.1%" from="abril" icon={Ic.evt} color="var(--accent-3)" />
        <KpiCard
          label="Eventos publicados"
          value={loading ? "—" : String(aprobados.length)}
          icon={Ic.globe}
          color="var(--accent-2)"
        />
        <KpiCard
          label="Pendientes revisión"
          value={loading ? "—" : String(pendientes.length)}
          icon={Ic.eye}
          color="var(--warn)"
        />
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <h3>Ingresos &amp; tickets</h3>
              <span className="ja">売上 · 月別</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div className="chart-legend">
                <span className="lg"><span className="sw" style={{ background: "var(--accent)" }} />Ingresos (M CLP)</span>
                <span className="lg"><span className="sw" style={{ background: "var(--accent-3)" }} />Tickets (miles)</span>
              </div>
              <select className="select" style={{ padding: "6px 12px" }}>
                <option>Este año</option>
                <option>Últimos 6 meses</option>
              </select>
            </div>
          </div>
          <RevenueChart />
        </div>

        <div className="panel">
          <div className="panel-head">
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <h3>Cola de revisión</h3>
              <span className="ja">審査待ち</span>
            </div>
            <span className="pill mono" style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
              {pendientes.length} PENDIENTES
            </span>
          </div>
          {loading ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13, padding: "12px 0" }}>Cargando…</div>
          ) : pendientes.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13, padding: "12px 0" }}>
              No hay eventos pendientes de revisión.
            </div>
          ) : (
            pendientes.slice(0, 5).map((e) => {
              const thumb = imageUrl(e.poster ?? e.banner);
              return (
                <div key={e.id} className="review-row">
                  <div className="thumb">
                    {thumb && (
                      <img
                        src={thumb}
                        alt=""
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </div>
                  <div className="info">
                    <div className="ttl">{e.title}</div>
                    <div className="meta">
                      {producerOf(e).toUpperCase()} ·{" "}
                      {(e.category?.name ?? "Sin categoría").toUpperCase()}
                    </div>
                  </div>
                  <div className="acts">
                    <button
                      className="ok"
                      title="Aprobar"
                      disabled={busy === e.id}
                      onClick={() => approve(e)}
                    >
                      {Ic.check}
                    </button>
                    <button
                      className="no"
                      title="Rechazar"
                      disabled={busy === e.id}
                      onClick={() => reject(e)}
                    >
                      {Ic.x}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="dash-grid-2">
        <div className="panel">
          <div className="panel-head">
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <h3>Actividad reciente</h3>
              <span className="ja">最近の活動</span>
            </div>
            <span className="more">Ver logs {Ic.arr}</span>
          </div>
          {activity.map((a, i) => (
            <div key={i} className="act-row">
              <div className="av" style={{ background: a.color }}>{a.who}</div>
              <div style={{ flex: 1 }}>
                <div className="txt">{a.txt}</div>
                <div className="time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <h3>Por categoría</h3>
              <span className="ja">カテゴリ別</span>
            </div>
            <span className="pill mono" style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
              {events.length} EVENTOS
            </span>
          </div>
          {catRows.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13, padding: "12px 0" }}>
              {loading ? "Cargando…" : "Sin datos de categorías."}
            </div>
          ) : (
            catRows.map((c) => (
              <div key={c.nm} className="cat-row">
                <div className="nm">{c.nm}</div>
                <div className="bar">
                  <div className="fill" style={{ width: `${(c.n / maxCat) * 100}%` }} />
                </div>
                <div className="num">{c.n}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
