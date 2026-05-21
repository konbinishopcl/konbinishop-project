"use client";

import { KpiCard } from "@/components/admin/KpiCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { Ic } from "@/components/admin/icons";
import { ALL_EVENTS, CATS } from "@/lib/admin-data";

export default function DashboardPage() {
  const inRev = ALL_EVENTS.filter((e) => e.status === "rev").slice(0, 4);

  const catRows = CATS.map((c) => ({ nm: c, n: ALL_EVENTS.filter((e) => e.cat === c).length }));
  const maxCat = Math.max(...catRows.map((c) => c.n));

  const activity = [
    { who: "ET", color: "#ff5b49", txt: <>Edgardo Toro envió <strong>&quot;Anime Symphonic Orchestra&quot;</strong> a revisión.</>, time: "hace 4 min" },
    { who: "CC", color: "#6c5cff", txt: <><strong>Cinépolis Chile</strong> publicó 3 funciones de <strong>Demon Slayer</strong>.</>, time: "hace 22 min" },
    { who: "—", color: "#4ec38a", txt: <>Pago confirmado: <strong>$45.000 CLP</strong> · K-Pop Chile · ticket KB-9F2A-71X.</>, time: "hace 38 min" },
    { who: "GB", color: "#f3c053", txt: <>Tú <strong>rechazaste</strong> &quot;Cosplay Battle Royale&quot; — motivo: imagen con texto.</>, time: "hace 1 h" },
    { who: "JM", color: "#ff5b49", txt: <>Nuevo organizador registrado: <strong>Jorge Maturana</strong> (anime-club.cl).</>, time: "hace 2 h" },
    { who: "—", color: "#4ec38a", txt: <>Sistema · respaldo automático completado (32.4 GB).</>, time: "hace 3 h" },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">PANEL · ダッシュボード</div>
          <h1>
            Dashboard <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <div className="sub">Vista general del marketplace — últimas 24 hrs.</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="pill">Hoy · 20 MAY 2026</span>
          <button className="btn ghost sm">{Ic.dl} Exportar reporte</button>
          <button className="btn primary sm">{Ic.plus} Nuevo evento</button>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Ingresos del mes" value="$ 64.2" ccy="M CLP" trend="+18.4%" from="abril" icon={Ic.pay} color="var(--accent)" />
        <KpiCard label="Tickets vendidos" value="12,847" trend="+24.1%" from="abril" icon={Ic.evt} color="var(--accent-3)" />
        <KpiCard label="Eventos activos" value="284" trend="+12" from="semana pasada" icon={Ic.globe} color="var(--accent-2)" />
        <KpiCard label="Pendientes revisión" value="12" trend="-3" from="ayer" icon={Ic.eye} color="var(--warn)" />
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
            <span className="more">Ver todo {Ic.arr}</span>
          </div>
          {inRev.map((e) => (
            <div key={e.id} className="review-row">
              <div className="thumb"><div className={`poster-art ${e.art}`} /></div>
              <div className="info">
                <div className="ttl">{e.title}</div>
                <div className="meta">{e.producer.nm.toUpperCase()} · {e.cat.toUpperCase()}</div>
                <div className="meta" style={{ marginTop: 2 }}>{e.created}</div>
              </div>
              <div className="acts">
                <button className="ok" title="Aprobar">{Ic.check}</button>
                <button className="no" title="Rechazar">{Ic.x}</button>
                <button title="Ver">{Ic.eye}</button>
              </div>
            </div>
          ))}
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
              {ALL_EVENTS.length} EVENTOS
            </span>
          </div>
          {catRows.map((c) => (
            <div key={c.nm} className="cat-row">
              <div className="nm">{c.nm}</div>
              <div className="bar"><div className="fill" style={{ width: `${(c.n / maxCat) * 100}%` }} /></div>
              <div className="num">{c.n}</div>
            </div>
          ))}
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid var(--line)",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div>
              <div className="eyebrow">VENUE TOP</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>Movistar Arena</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>42 eventos · ↑ 18%</div>
            </div>
            <div>
              <div className="eyebrow">CONVERSIÓN</div>
              <div style={{ fontWeight: 600, marginTop: 4, fontFamily: "var(--font-mono)" }}>6.4 %</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ok)" }}>↑ 0.8 vs mes ant.</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
