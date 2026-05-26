"use client";
import { useState } from "react";
import { toast } from "sonner";

type Period = "Día" | "Semana" | "Mes" | "Año";

const BARS = [42, 51, 38, 60, 72, 65, 80, 90, 75, 88, 110, 142];
const BAR_LABELS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const TOP_INGRESOS: [string, string][] = [
  ["Cinépolis Chile", "$1.2M"],
  ["AnimeShop CL", "$680k"],
  ["Konbini Editorial", "$520k"],
  ["Producciones Tepuy", "$340k"],
];

const TOP_EVENTOS: [string, string][] = [
  ["AnimeShop CL", "23 evt"],
  ["Cinépolis Chile", "18 evt"],
  ["Konbini Ed.", "14 evt"],
  ["María Pérez", "9 evt"],
];

export default function ReportsSection() {
  const [period, setPeriod] = useState<Period>("Mes");

  return (
    <>
      {/* Period filter chips */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {(["Día", "Semana", "Mes", "Año"] as Period[]).map((p) => (
          <button
            key={p}
            className={`sel${period === p ? " on" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Sales chart panel */}
      <div className="panel">
        <div className="ph">
          <h3>Ventas por período</h3>
          <button
            className="btn ghost"
            style={{ padding: "8px 14px", fontSize: 12 }}
            onClick={() =>
              toast.success("CSV generado", {
                description: `reporte-${period.toLowerCase()}.csv descargado`,
              })
            }
          >
            ↓ Exportar CSV
          </button>
        </div>
        <div className="chart">
          {BARS.map((v, i) => (
            <div key={i} className="bar" style={{ height: v + "%" }}>
              <span className="lbl">{BAR_LABELS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
        {/* Top organizadores ingresos */}
        <div className="panel">
          <div className="ph">
            <h3>Top organizadores (ingresos)</h3>
          </div>
          {TOP_INGRESOS.map(([name, value], i) => (
            <div key={i} className="cat-bar">
              <div className="name">{i + 1}. {name}</div>
              <div className="track">
                <div style={{ width: (90 - i * 18) + "%" }} />
              </div>
              <div className="v">{value}</div>
            </div>
          ))}
        </div>

        {/* Top organizadores eventos */}
        <div className="panel">
          <div className="ph">
            <h3>Top organizadores (eventos)</h3>
          </div>
          {TOP_EVENTOS.map(([name, value], i) => (
            <div key={i} className="cat-bar">
              <div className="name">{i + 1}. {name}</div>
              <div className="track">
                <div style={{ width: (80 - i * 16) + "%" }} />
              </div>
              <div className="v">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
