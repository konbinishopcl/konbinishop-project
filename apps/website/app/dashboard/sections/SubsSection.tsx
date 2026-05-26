"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

// ── Types ─────────────────────────────────────────────────────────────────────

type SubStatus = "Activo" | "Cancelado";

type Subscriber = {
  id: string;
  name: string;
  start: string;
  renew: string;
  credits: string;
  status: SubStatus;
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_SUBS: Subscriber[] = [
  { id: "s1", name: "Cinépolis Chile", start: "5 ENE",  renew: "5 JUN",  credits: "7/10",  status: "Activo" },
  { id: "s2", name: "AnimeShop CL",   start: "12 ENE", renew: "12 JUN", credits: "4/10",  status: "Activo" },
  { id: "s3", name: "María Pérez",    start: "2 FEB",  renew: "2 JUN",  credits: "10/10", status: "Cancelado" },
];

// ── Plan config state ─────────────────────────────────────────────────────────

type PlanSettings = {
  sub_monthly_price:     string;
  sub_credits_per_month: string;
  sub_aviso_discount:    string;
  sub_portada_discount:  string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SubsSection() {
  const { token } = useUser();

  const [plan, setPlan] = useState<PlanSettings>({
    sub_monthly_price:     "29990",
    sub_credits_per_month: "10",
    sub_aviso_discount:    "20",
    sub_portada_discount:  "20",
  });
  const [saving, setSaving] = useState(false);

  async function savePlan() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(plan),
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Plan actualizado");
    } catch {
      toast.error("No se pudo guardar la configuración");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="l">ACTIVOS</div>
          <div className="v">87</div>
          <div className="d up">↑ 12</div>
        </div>
        <div className="kpi">
          <div className="l">NUEVOS MES</div>
          <div className="v">14</div>
        </div>
        <div className="kpi">
          <div className="l">CANCELACIONES</div>
          <div className="v">3</div>
        </div>
        <div className="kpi">
          <div className="l">MRR</div>
          <div className="v">$2.6M</div>
        </div>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0, marginBottom: 18 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>USUARIO</th>
              <th>INICIO</th>
              <th>RENUEVA</th>
              <th>CRÉDITOS</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SUBS.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.start}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.renew}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{s.credits}</td>
                <td>
                  <span className={`stat-pill ${s.status === "Activo" ? "pub" : "exp"}`}>
                    <span className="dot" />
                    {s.status}
                  </span>
                </td>
                <td>
                  <div className="row-act">
                    <button>Ver</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Plan config */}
      <div className="panel">
        <div className="ph">
          <h3>Configuración del plan</h3>
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Precio mensual (CLP)</label>
            <input
              type="number"
              value={plan.sub_monthly_price}
              onChange={(e) => setPlan((p) => ({ ...p, sub_monthly_price: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Créditos por mes</label>
            <input
              type="number"
              value={plan.sub_credits_per_month}
              onChange={(e) => setPlan((p) => ({ ...p, sub_credits_per_month: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>% descuento avisos para suscriptores</label>
            <input
              type="number"
              value={plan.sub_aviso_discount}
              onChange={(e) => setPlan((p) => ({ ...p, sub_aviso_discount: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>% descuento portadas para suscriptores</label>
            <input
              type="number"
              value={plan.sub_portada_discount}
              onChange={(e) => setPlan((p) => ({ ...p, sub_portada_discount: e.target.value }))}
            />
          </div>
        </div>
        <button className="btn dark" onClick={savePlan} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </>
  );
}
