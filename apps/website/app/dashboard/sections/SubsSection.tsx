"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

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
    startDate: "2025-01-05",
    renewDate: "2025-04-05",
    creditsUsed: 7,
    creditsTotal: 10,
    status: "Activo",
  },
  {
    id: "SUB-002",
    name: "AnimeShop CL",
    email: "tienda@animeshop.cl",
    startDate: "2025-01-12",
    renewDate: "2025-04-12",
    creditsUsed: 2,
    creditsTotal: 10,
    status: "Activo",
  },
  {
    id: "SUB-003",
    name: "K-Pop Fest",
    email: "admin@kpopfest.cl",
    startDate: "2025-01-20",
    renewDate: "2025-04-20",
    creditsUsed: 9,
    creditsTotal: 10,
    status: "Activo",
  },
  {
    id: "SUB-004",
    name: "Konbini Ediciones",
    email: "info@konbini-ed.cl",
    startDate: "2025-01-01",
    renewDate: "—",
    creditsUsed: 10,
    creditsTotal: 10,
    status: "Vencido",
  },
  {
    id: "SUB-005",
    name: "Jorge Maturana",
    email: "jmaturana@email.cl",
    startDate: "2024-12-10",
    renewDate: "—",
    creditsUsed: 4,
    creditsTotal: 10,
    status: "Cancelado",
  },
];

const STATUS_CLASS: Record<SubStatus, string> = {
  Activo: "pub",
  Cancelado: "rej",
  Vencido: "arc",
};

type PlanSettings = {
  precioCLP: number;
  creditosMes: number;
  descuentoAvisos: number;
  descuentoPortadas: number;
};

export default function SubsSection() {
  const { token } = useUser();

  const [statusFilter, setStatusFilter] = useState<SubStatus | "Todos">("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState<PlanSettings>({
    precioCLP: 9990,
    creditosMes: 10,
    descuentoAvisos: 20,
    descuentoPortadas: 20,
  });
  const [saving, setSaving] = useState(false);

  const filtered = MOCK_SUBS.filter((s) => {
    if (statusFilter !== "Todos" && s.status !== statusFilter) return false;
    if (dateFrom && s.startDate < dateFrom) return false;
    if (dateTo && s.startDate > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  async function savePlan() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sub_monthly_price: plan.precioCLP,
          sub_credits_per_month: plan.creditosMes,
          sub_aviso_discount: plan.descuentoAvisos,
          sub_portada_discount: plan.descuentoPortadas,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Configuración guardada");
    } catch {
      toast.error("No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
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
          <div className="v">12</div>
        </div>
        <div className="kpi">
          <div className="l">Cancelaciones del mes</div>
          <div className="v">3</div>
        </div>
        <div className="kpi">
          <div className="l">MRR — ingresos recurrentes</div>
          <div className="v">$469.530</div>
        </div>
      </div>

      <div className="panel">
        <div className="ph">
          <h2>Suscriptores</h2>
        </div>

        <div className="filterbar">
          <select
            className="sel"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Activo">Activo</option>
            <option value="Cancelado">Cancelado</option>
            <option value="Vencido">Vencido</option>
          </select>

          <input
            type="date"
            className="sel"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="sel"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />

          <input
            className="sel"
            placeholder="Buscar por usuario…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="evt">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Fecha de inicio</th>
                <th>Fecha de renovación</th>
                <th>Créditos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--ink-3)", padding: "40px 16px" }}>
                    Sin resultados para los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.email}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.startDate}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.renewDate}</td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
                        {s.creditsUsed} / {s.creditsTotal}
                      </span>
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
      </div>

      <div className="panel">
        <div className="ph">
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
          <button className="btn primary sm" onClick={savePlan} disabled={saving}>
            {saving ? "Guardando…" : "Guardar configuración"}
          </button>
        </div>
      </div>
    </>
  );
}
