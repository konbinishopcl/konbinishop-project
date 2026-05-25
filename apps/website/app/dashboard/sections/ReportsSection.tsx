"use client";

const MONTHLY_DATA = [
  { month: "ENE", revenue: 42, events: 38 },
  { month: "FEB", revenue: 51, events: 44 },
  { month: "MAR", revenue: 38, events: 31 },
  { month: "ABR", revenue: 60, events: 52 },
  { month: "MAY", revenue: 72, events: 61 },
  { month: "JUN", revenue: 65, events: 57 },
  { month: "JUL", revenue: 80, events: 70 },
  { month: "AGO", revenue: 90, events: 78 },
  { month: "SEP", revenue: 75, events: 64 },
  { month: "OCT", revenue: 88, events: 76 },
  { month: "NOV", revenue: 110, events: 96 },
  { month: "DIC", revenue: 142, events: 124 },
];

const CATEGORY_DATA = [
  { cat: "Anime", events: 38, pct: 84 },
  { cat: "Conciertos", events: 28, pct: 62 },
  { cat: "Cine", events: 22, pct: 48 },
  { cat: "Gaming", events: 16, pct: 36 },
  { cat: "Convenciones", events: 12, pct: 27 },
  { cat: "Cosplay", events: 8, pct: 18 },
];

export default function ReportsSection() {
  const maxRevenue = Math.max(...MONTHLY_DATA.map((d) => d.revenue));

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="l">INGRESOS AÑO</div>
          <div className="v">$42M</div>
          <div className="d up">↑ 38% vs 2024</div>
        </div>
        <div className="kpi">
          <div className="l">EVENTOS AÑO</div>
          <div className="v">691</div>
          <div className="d up">↑ 142 vs 2024</div>
        </div>
        <div className="kpi">
          <div className="l">USUARIOS NUEVOS</div>
          <div className="v">1.2K</div>
          <div className="d up">↑ 24%</div>
        </div>
        <div className="kpi">
          <div className="l">TASA APROBACIÓN</div>
          <div className="v">91%</div>
          <div className="d">promedio</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18, marginBottom: 18 }}>
        <div className="panel">
          <div className="ph">
            <h3>Ingresos mensuales (M CLP)</h3>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>2025</div>
          </div>
          <div className="chart" style={{ height: 160 }}>
            {MONTHLY_DATA.map((d, i) => (
              <div
                key={i}
                className="bar"
                style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                title={`${d.month}: $${d.revenue}M`}
              >
                <span className="lbl">{d.month.slice(0, 1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="ph">
            <h3>Por categoría</h3>
          </div>
          {CATEGORY_DATA.map((c) => (
            <div key={c.cat} className="cat-bar">
              <div className="name">{c.cat}</div>
              <div className="track">
                <div style={{ width: `${c.pct}%` }} />
              </div>
              <div className="v">{c.events} evt</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="panel">
          <div className="ph">
            <h3>Eventos por mes</h3>
          </div>
          <div className="chart" style={{ height: 120 }}>
            {MONTHLY_DATA.map((d, i) => (
              <div
                key={i}
                className="bar"
                style={{
                  height: `${(d.events / Math.max(...MONTHLY_DATA.map((m) => m.events))) * 100}%`,
                  background: "color-mix(in oklab, var(--accent-3) 60%, transparent)",
                }}
                title={`${d.month}: ${d.events} eventos`}
              >
                <span className="lbl">{d.month.slice(0, 1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="ph">
            <h3>Resumen anual</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
            {[
              { label: "Eventos aprobados", value: "629", pct: "+22%" },
              { label: "Eventos rechazados", value: "62", pct: "-8%" },
              { label: "Nuevos organizadores", value: "148", pct: "+31%" },
              { label: "Suscripciones activas", value: "87", pct: "+14%" },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span style={{ color: "var(--ink-2)" }}>{r.label}</span>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {r.value}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: r.pct.startsWith("+") ? "var(--ok)" : "var(--err)",
                    }}
                  >
                    {r.pct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
