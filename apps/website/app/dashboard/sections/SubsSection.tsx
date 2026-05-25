"use client";
import { useState } from "react";
import { toast } from "sonner";

type SubStatus = "Activo" | "Cancelado" | "Vencido";

type Subscriber = {
  id: string;
  name: string;
  email: string;
  startDate: string;
  renewDate: string;
  creditsUsed: number;
  creditsTotal: number;
  status: SubStatus;
};

const MOCK_SUBS: Subscriber[] = [
  {
    id: "SUB-001",
    name: "Cinépolis Chile",
    email: "admin@cinepolis.cl",
    startDate: "5 ENE 2025",
    renewDate: "5 ABR 2025",
    creditsUsed: 7,
    creditsTotal: 10,
    status: "Activo",
  },
  {
    id: "SUB-002",
    name: "AnimeShop CL",
    email: "tienda@animeshop.cl",
    startDate: "12 ENE 2025",
    renewDate: "12 ABR 2025",
    creditsUsed: 2,
    creditsTotal: 10,
    status: "Activo",
  },
  {
    id: "SUB-003",
    name: "K-Pop Fest",
    email: "admin@kpopfest.cl",
    startDate: "20 ENE 2025",
    renewDate: "20 ABR 2025",
    creditsUsed: 9,
    creditsTotal: 10,
    status: "Activo",
  },
  {
    id: "SUB-004",
    name: "CineClub Santiago",
    email: "admin@cineclub.cl",
    startDate: "1 FEB 2025",
    renewDate: "1 MAY 2025",
    creditsUsed: 4,
    creditsTotal: 10,
    status: "Activo",
  },
  {
    id: "SUB-005",
    name: "Anime Events CL",
    email: "info@animeevents.cl",
    startDate: "15 FEB 2025",
    renewDate: "15 MAY 2025",
    creditsUsed: 1,
    creditsTotal: 10,
    status: "Activo",
  },
  {
    id: "SUB-006",
    name: "Konbini Ediciones",
    email: "info@konbini-ed.cl",
    startDate: "1 ENE 2025",
    renewDate: "28 FEB 2025",
    creditsUsed: 10,
    creditsTotal: 10,
    status: "Vencido",
  },
  {
    id: "SUB-007",
    name: "Jorge Maturana",
    email: "jmaturana@email.cl",
    startDate: "10 DIC 2024",
    renewDate: "—",
    creditsUsed: 4,
    creditsTotal: 10,
    status: "Cancelado",
  },
  {
    id: "SUB-008",
    name: "Cosplay Atelier",
    email: "info@cosplay.cl",
    startDate: "5 ENE 2025",
    renewDate: "—",
    creditsUsed: 0,
    creditsTotal: 10,
    status: "Cancelado",
  },
];

const STATUS_CLASS: Record<SubStatus, string> = {
  Activo: "pub",
  Cancelado: "rej",
  Vencido: "arc",
};

const STATUS_FILTERS: Array<SubStatus | "Todos"> = ["Todos", "Activo", "Cancelado", "Vencido"];

type PlanSettings = {
  precioCLP: number;
  creditosMes: number;
  descuentoAvisos: number;
  descuentoPortadas: number;
};

export default function SubsSection() {
  const [statusFilter, setStatusFilter] = useState<SubStatus | "Todos">("Todos");
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<PlanSettings>({
    precioCLP: 29990,
    creditosMes: 10,
    descuentoAvisos: 20,
    descuentoPortadas: 20,
  });

  const filtered = MOCK_SUBS.filter((s) => {
    if (statusFilter !== "Todos" && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function savePlan() {
    toast.success("Configuración guardada");
  }

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="l">Suscriptores activos</div>
          <div className="v">47</div>
        </div>
        <div className="kpi">
          <div className="l">Nuevas suscripciones del mes</div>
          <div className="v">8</div>
        </div>
        <div className="kpi">
          <div className="l">Cancelaciones del mes</div>
          <div className="v">2</div>
        </div>
        <div className="kpi">
          <div className="l">MRR</div>
          <div className="v">$1.409.530</div>
        </div>
      </div>

      {/* Plan settings block */}
      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="section-head" style={{ marginBottom: 16 }}>
          <h2>Configuración del plan</h2>
        </div>
        <div className="settings-form">
          <div className="settings-row">
            <label htmlFor="precio-clp">Precio mensual (CLP)</label>
            <input
              id="precio-clp"
              type="number"
              value={plan.precioCLP}
              onChange={(e) => setPlan((p) => ({ ...p, precioCLP: Number(e.target.value) }))}
            />
          </div>
          <div className="settings-row">
            <label htmlFor="creditos-mes">Créditos por mes</label>
            <input
              id="creditos-mes"
              type="number"
              value={plan.creditosMes}
              onChange={(e) => setPlan((p) => ({ ...p, creditosMes: Number(e.target.value) }))}
            />
          </div>
          <div className="settings-row">
            <label htmlFor="descuento-avisos">Descuento avisos (%)</label>
            <input
              id="descuento-avisos"
              type="number"
              value={plan.descuentoAvisos}
              onChange={(e) => setPlan((p) => ({ ...p, descuentoAvisos: Number(e.target.value) }))}
            />
          </div>
          <div className="settings-row">
            <label htmlFor="descuento-portadas">Descuento portadas (%)</label>
            <input
              id="descuento-portadas"
              type="number"
              value={plan.descuentoPortadas}
              onChange={(e) => setPlan((p) => ({ ...p, descuentoPortadas: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn primary sm" onClick={savePlan}>
            Guardar configuración
          </button>
        </div>
      </div>

      <div className="section-head">
        <h2>Suscriptores</h2>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
          {filtered.length} REGISTROS
        </span>
      </div>

      <div className="filterbar">
        <div className="search-shell" style={{ flex: 1, minWidth: 200 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Buscar por usuario o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-3)", letterSpacing: ".1em" }}>ESTADO</span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`sel${statusFilter === s ? " on" : ""}`}
              onClick={() => setStatusFilter(s as typeof statusFilter)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="evt">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Fecha inicio</th>
              <th>Fecha renovación</th>
              <th>Créditos usados / disponibles</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "var(--ink-3)", padding: "40px 16px" }}>
                  Sin resultados para los filtros aplicados.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="cell-prod">
                      <div className="nm">{s.name}</div>
                      <div className="em">{s.email}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.startDate}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.renewDate}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12, minWidth: 36 }}>
                        {s.creditsUsed} / {s.creditsTotal}
                      </span>
                      <div
                        style={{
                          height: 4,
                          width: 64,
                          background: "var(--surface-2)",
                          borderRadius: 999,
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${(s.creditsUsed / s.creditsTotal) * 100}%`,
                            background:
                              s.creditsUsed / s.creditsTotal >= 0.8
                                ? "var(--err)"
                                : s.creditsUsed / s.creditsTotal >= 0.5
                                ? "var(--warn)"
                                : "var(--ok)",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={`stat ${STATUS_CLASS[s.status]}`}>
                      <span className="dot" />
                      {s.status}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="pag">
            <span className="info">{filtered.length} suscriptores</span>
          </div>
        )}
      </div>
    </>
  );
}
