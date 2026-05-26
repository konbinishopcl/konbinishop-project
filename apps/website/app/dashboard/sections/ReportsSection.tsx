"use client";
import { useState } from "react";
import { toast } from "sonner";

type Period = "Día" | "Semana" | "Mes" | "Año";

const PERIODS: Period[] = ["Día", "Semana", "Mes", "Año"];

// Mock data per period
const SALES_DATA: Record<Period, { label: string; value: number }[]> = {
  "Día": [
    { label: "00h", value: 2 },
    { label: "04h", value: 0 },
    { label: "08h", value: 8 },
    { label: "10h", value: 14 },
    { label: "12h", value: 22 },
    { label: "14h", value: 18 },
    { label: "16h", value: 25 },
    { label: "18h", value: 30 },
    { label: "20h", value: 20 },
    { label: "22h", value: 10 },
  ],
  "Semana": [
    { label: "Lun", value: 42 },
    { label: "Mar", value: 58 },
    { label: "Mié", value: 35 },
    { label: "Jue", value: 71 },
    { label: "Vie", value: 88 },
    { label: "Sáb", value: 94 },
    { label: "Dom", value: 66 },
  ],
  "Mes": [
    { label: "Sem 1", value: 180 },
    { label: "Sem 2", value: 210 },
    { label: "Sem 3", value: 165 },
    { label: "Sem 4", value: 250 },
  ],
  "Año": [
    { label: "ENE", value: 42 },
    { label: "FEB", value: 51 },
    { label: "MAR", value: 38 },
    { label: "ABR", value: 60 },
    { label: "MAY", value: 72 },
    { label: "JUN", value: 65 },
    { label: "JUL", value: 80 },
    { label: "AGO", value: 90 },
    { label: "SEP", value: 75 },
    { label: "OCT", value: 88 },
    { label: "NOV", value: 110 },
    { label: "DIC", value: 142 },
  ],
};

const CATEGORY_DATA = [
  { cat: "Anime",        amount: "$12.4M", pct: 100 },
  { cat: "Conciertos",   amount: "$9.1M",  pct: 73 },
  { cat: "Cine",         amount: "$7.2M",  pct: 58 },
  { cat: "Gaming",       amount: "$5.3M",  pct: 43 },
  { cat: "Convenciones", amount: "$3.9M",  pct: 31 },
  { cat: "Cosplay",      amount: "$2.6M",  pct: 21 },
];

const TOP_BY_REVENUE = [
  { name: "Anime Events CL",   email: "info@animeevents.cl",   value: "$4.2M" },
  { name: "K-Pop Fest Chile",  email: "admin@kpopfest.cl",     value: "$3.1M" },
  { name: "FanExpo Chile",     email: "hola@fanexpochile.cl",  value: "$2.8M" },
  { name: "CineClub Santiago", email: "admin@cineclub.cl",     value: "$2.0M" },
  { name: "Gaming League CL",  email: "contacto@gamingleague.cl", value: "$1.7M" },
];

const TOP_BY_EVENTS = [
  { name: "Anime Events CL",   email: "info@animeevents.cl",   value: "38 eventos" },
  { name: "CineClub Santiago", email: "admin@cineclub.cl",     value: "28 eventos" },
  { name: "FanExpo Chile",     email: "hola@fanexpochile.cl",  value: "22 eventos" },
  { name: "Gaming League CL",  email: "contacto@gamingleague.cl", value: "18 eventos" },
  { name: "K-Pop Fest Chile",  email: "admin@kpopfest.cl",     value: "14 eventos" },
];

type TopTab = "ingresos" | "eventos";

export default function ReportsSection() {
  const [period, setPeriod] = useState<Period>("Mes");
  const [topTab, setTopTab] = useState<TopTab>("ingresos");

  const salesData = SALES_DATA[period];
  const maxSales = Math.max(...salesData.map((d) => d.value));

  const topData = topTab === "ingresos" ? TOP_BY_REVENUE : TOP_BY_EVENTS;

  const exportCSV = (section: string) => {
    toast.success(`Exportando CSV de ${section}…`);
  };

  return (
    <>
      <div className="section-head">
        <h2>Reportes</h2>
      </div>

      {/* Panel 1: Ventas por período */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="ph">
          <h3>Ventas por período</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: period === p ? 700 : 400,
                  background: period === p ? "var(--accent)" : "var(--surface-2)",
                  color: period === p ? "var(--accent-ink)" : "var(--ink-3)",
                  border: `1px solid ${period === p ? "var(--accent)" : "var(--line)"}`,
                  cursor: "pointer",
                  transition: "all .15s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="chart" style={{ height: 160, marginBottom: 24 }}>
          {salesData.map((d, i) => (
            <div
              key={i}
              className="bar"
              style={{ height: `${(d.value / maxSales) * 100}%` }}
              title={`${d.label}: ${d.value}`}
            >
              <span className="lbl">{d.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn ghost sm"
            onClick={() => exportCSV("ventas")}
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Panel 2: Distribución por categoría */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="ph">
          <h3>Distribución por categoría</h3>
        </div>
        {CATEGORY_DATA.map((c) => (
          <div key={c.cat} className="cat-bar">
            <div className="name">{c.cat}</div>
            <div className="track">
              <div style={{ width: `${c.pct}%` }} />
            </div>
            <div className="v">{c.amount}</div>
          </div>
        ))}
      </div>

      {/* Panel 3: Top organizadores */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <div className="ph">
          <h3>Top organizadores</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {(["ingresos", "eventos"] as TopTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setTopTab(tab)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: topTab === tab ? 700 : 400,
                  background: topTab === tab ? "var(--accent)" : "var(--surface-2)",
                  color: topTab === tab ? "var(--accent-ink)" : "var(--ink-3)",
                  border: `1px solid ${topTab === tab ? "var(--accent)" : "var(--line)"}`,
                  cursor: "pointer",
                  transition: "all .15s",
                  textTransform: "capitalize",
                }}
              >
                Por {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 16 }}>
          {topData.map((item, i) => (
            <div
              key={item.email}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: i < topData.length - 1 ? "1px solid var(--line)" : "none",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--ink-3)",
                    minWidth: 20,
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                    {item.email}
                  </div>
                </div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="btn ghost sm"
            onClick={() => exportCSV("top organizadores")}
          >
            Exportar CSV
          </button>
        </div>
      </div>
    </>
  );
}
