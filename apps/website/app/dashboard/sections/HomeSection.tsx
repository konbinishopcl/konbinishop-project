"use client";
import { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────

type ActivityItem = {
  initials: string;
  txt: string;
  time: string;
};

type ReviewRow = {
  id: number;
  title: string;
};

type CatRow = {
  name: string;
  count: number;
};

// ── Mock data ──────────────────────────────────────────────────────

const MESES_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const REVENUE_12 = [42, 51, 38, 60, 72, 65, 80, 90, 75, 88, 110, 142];

const MOCK_EVENTS_PENDING: ReviewRow[] = [
  { id: 1, title: "Anime Crunchyroll Fest 2025" },
  { id: 2, title: "RetroGaming Santiago" },
  { id: 3, title: "Feria del Libro Providencia" },
];

const MOCK_SPOTS_PENDING: ReviewRow[] = [
  { id: 1, title: "Banner Cinépolis Verano" },
  { id: 2, title: "Promo Catan Chile" },
];

const MOCK_HEROES_PENDING: ReviewRow[] = [];

const MOCK_ACTIVITY: ActivityItem[] = [
  { initials: "CT", txt: "Camila T. aprobó Anime Crunchyroll Fest", time: "hace 5 min" },
  { initials: "DS", txt: "Diego S. rechazó RetroGaming Fake", time: "hace 22 min" },
  { initials: "CT", txt: "Camila T. verificó organizador @cinepolis", time: "hace 1 h" },
  { initials: "SI", txt: "Sistema renovó suscripción de Cinépolis Chile", time: "hace 2 h" },
  { initials: "CT", txt: "Camila T. respondió contacto de María Pérez", time: "hace 4 h" },
];

const MOCK_CATEGORIES: CatRow[] = [
  { name: "Música", count: 34 },
  { name: "Tecnología", count: 28 },
  { name: "Gastronomía", count: 22 },
  { name: "Arte", count: 19 },
  { name: "Deportes", count: 15 },
  { name: "Entretenimiento", count: 12 },
  { name: "Cultura", count: 9 },
];

// ── Period options ─────────────────────────────────────────────────

type Period = "12" | "6" | "3";

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: "Este año", value: "12" },
  { label: "Últimos 6 meses", value: "6" },
  { label: "Últimos 3 meses", value: "3" },
];

// ── Helpers ────────────────────────────────────────────────────────

function buildChartData(period: Period): { values: number[]; labels: string[] } {
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const count = parseInt(period, 10);

  // Build ordered arrays ending at current month
  const orderedValues: number[] = [];
  const orderedLabels: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const idx = (currentMonthIdx - i + 12) % 12;
    orderedValues.push(REVENUE_12[idx]);
    orderedLabels.push(MESES_SHORT[idx]);
  }
  return { values: orderedValues, labels: orderedLabels };
}

// ── Sub-components ─────────────────────────────────────────────────

function ReviewPanel({
  title,
  items,
}: {
  title: string;
  items: ReviewRow[];
}) {
  const [list, setList] = useState<ReviewRow[]>(items);

  const approve = (id: number) => setList((prev) => prev.filter((r) => r.id !== id));
  const reject = (id: number) => setList((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="panel">
      <div className="ph">
        <h3>{title}</h3>
        <span
          className={`stat ${list.length > 0 ? "rev" : "pub"}`}
          style={{ fontSize: 11 }}
        >
          <span className="dot" />
          {list.length} pendientes
        </span>
      </div>

      {list.length === 0 ? (
        <div
          style={{
            padding: "28px 0",
            textAlign: "center",
            color: "var(--ink-3)",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
          }}
        >
          Sin pendientes
        </div>
      ) : (
        list.slice(0, 5).map((row) => (
          <div
            key={row.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "11px 0",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.title}
            </div>
            <div className="row-acts">
              <button
                className="ok"
                onClick={() => approve(row.id)}
                style={{ color: "var(--ok)", fontSize: 12, padding: "0 10px", height: 28 }}
              >
                Aprobar
              </button>
              <button
                className="bad"
                onClick={() => reject(row.id)}
                style={{ color: "var(--err)", fontSize: 12, padding: "0 10px", height: 28 }}
              >
                Rechazar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function HomeSection() {
  const [eventsPublished, setEventsPublished] = useState<number | null>(null);
  const [period, setPeriod] = useState<Period>("12");

  // Optional: try to load real published events count
  useEffect(() => {
    fetch("/api/events?pageSize=1")
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        if (typeof data.total === "number") setEventsPublished(data.total);
      })
      .catch(() => {
        // fall back to mock
      });
  }, []);

  const { values: chartValues, labels: chartLabels } = buildChartData(period);
  const chartMax = Math.max(...chartValues);

  const maxCat = Math.max(1, ...MOCK_CATEGORIES.map((c) => c.count));

  return (
    <>
      {/* ── KPI Grid ── */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="l">Ingresos del mes</div>
          <div className="v">$3.8M</div>
          <div className="d up">+24% vs mes anterior</div>
        </div>
        <div className="kpi">
          <div className="l">Eventos publicados</div>
          <div className="v">{eventsPublished ?? 142}</div>
          <div className="d up">activos en plataforma</div>
        </div>
        <div className="kpi">
          <div className="l">Eventos en revisión</div>
          <div className="v">{MOCK_EVENTS_PENDING.length}</div>
          <div className="d">pendientes de revisión</div>
        </div>
        <div className="kpi">
          <div className="l">Avisos activos</div>
          <div className="v">38</div>
          <div className="d up">+5 este mes</div>
        </div>
        <div className="kpi">
          <div className="l">Portadas activas</div>
          <div className="v">12</div>
          <div className="d up">en rotación</div>
        </div>
        <div className="kpi">
          <div className="l">Usuarios registrados</div>
          <div className="v">1.2K</div>
          <div className="d up">+48 este mes</div>
        </div>
        <div className="kpi">
          <div className="l">Suscriptores activos</div>
          <div className="v">87</div>
          <div className="d up">+12 este mes</div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {/* Revenue chart */}
        <div className="panel">
          <div className="ph">
            <h3>Ingresos mensuales</h3>
            <div style={{ display: "flex", gap: 6 }}>
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`sel${period === opt.value ? " on" : ""}`}
                  onClick={() => setPeriod(opt.value)}
                  style={{ fontSize: 11, padding: "5px 11px" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div
            className="chart"
            role="img"
            aria-label="Gráfico de ingresos mensuales"
          >
            {chartValues.map((v, i) => (
              <div
                key={i}
                className="bar"
                style={{ height: `${Math.round((v / chartMax) * 100)}%` }}
              >
                <span className="lbl">{chartLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category distribution */}
        <div className="panel">
          <div className="ph">
            <h3>Por categoría</h3>
          </div>
          {MOCK_CATEGORIES.map((c) => (
            <div key={c.name} className="cat-bar">
              <div className="name">{c.name}</div>
              <div className="track">
                <div style={{ width: `${Math.round((c.count / maxCat) * 100)}%` }} />
              </div>
              <div className="v">{c.count} evt</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Review queue: 3 panels side by side ── */}
      <div className="section-head" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: 0, letterSpacing: "-.01em" }}>
          Cola de revisión
        </h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 18,
          marginBottom: 24,
        }}
      >
        <ReviewPanel title="Eventos" items={MOCK_EVENTS_PENDING} />
        <ReviewPanel title="Avisos" items={MOCK_SPOTS_PENDING} />
        <ReviewPanel title="Portadas" items={MOCK_HEROES_PENDING} />
      </div>

      {/* ── Activity feed ── */}
      <div className="section-head" style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, margin: 0, letterSpacing: "-.01em" }}>
          Actividad reciente
        </h2>
      </div>
      <div className="panel">
        {MOCK_ACTIVITY.map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 0",
              borderBottom: i < MOCK_ACTIVITY.length - 1 ? "1px solid var(--line)" : "none",
              fontSize: 13,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: "linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent)))",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 10,
                flexShrink: 0,
                letterSpacing: ".04em",
              }}
            >
              {a.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--ink-2)", lineHeight: 1.4 }}>{a.txt}</div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink-3)",
                  marginTop: 3,
                }}
              >
                {a.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
