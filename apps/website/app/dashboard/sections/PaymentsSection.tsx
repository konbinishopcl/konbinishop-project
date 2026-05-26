"use client";
import { useState } from "react";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaySt = "Aprobado" | "Fallido";

type Payment = {
  id: string;
  org: string;
  orgHd: string;
  prod: string;
  amount: string;
  date: string;
  st: PaySt;
  method: string;
  card: string;
  items: [string, string][];
  err?: string;
};

// ── Mock data (matches AdminPayments design) ──────────────────────────────────

const ROWS: Payment[] = [
  {
    id: "TX-9F2A-71X", org: "Cinépolis Chile", orgHd: "@cinepolis",
    prod: "Evento + Aviso", amount: "$54.980", date: "12 MAR 2025", st: "Aprobado",
    method: "WebPay Plus", card: "**** 8842 (VISA)",
    items: [["Evento — Anime Crunchyroll Fest", "$24.980"], ["Aviso — 14 días", "$30.000"]],
  },
  {
    id: "TX-9A1B-44C", org: "Cinépolis Chile", orgHd: "@cinepolis",
    prod: "Suscripción", amount: "$29.990", date: "5 MAR 2025", st: "Aprobado",
    method: "WebPay Plus", card: "**** 8842 (VISA)",
    items: [["Plan mensual · 10 créditos", "$29.990"]],
  },
  {
    id: "TX-8D7E-93Z", org: "AnimeShop CL", orgHd: "@animeshop",
    prod: "Portada (10d)", amount: "$150.000", date: "1 MAR 2025", st: "Aprobado",
    method: "WebPay Plus", card: "**** 4419 (MASTERCARD)",
    items: [["Portada — 10 días", "$150.000"]],
  },
  {
    id: "TX-8C2A-12K", org: "María Pérez", orgHd: "maria.perez@email.cl",
    prod: "Evento", amount: "$24.950", date: "20 FEB 2025", st: "Fallido",
    method: "WebPay Plus", card: "**** 1004 (VISA)",
    items: [["Evento — Meetup Cosplay", "$24.950"]],
    err: "Tarjeta rechazada por el emisor",
  },
  {
    id: "TX-7B91-09X", org: "Konbini Ed.", orgHd: "@konbini-ed",
    prod: "Aviso (14d)", amount: "$112.000", date: "18 FEB 2025", st: "Aprobado",
    method: "WebPay Plus", card: "**** 7733 (VISA)",
    items: [["Aviso — 14 días", "$112.000"]],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildCSV(rows: Payment[]): string {
  const header = ["ID", "Organizador", "Producto", "Monto", "Fecha", "Estado"];
  const lines = rows.map((r) => [r.id, r.org, r.prod, r.amount, r.date, r.st].join(","));
  return [header.join(","), ...lines].join("\n");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaymentsSection() {
  const [detail, setDetail] = useState<Payment | null>(null);

  function exportCSV() {
    const csv = buildCSV(ROWS);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments-konbini.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV generado", { description: "Descarga iniciada" });
  }

  return (
    <>
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi"><div className="l">INGRESOS MES</div><div className="v">$3.8M</div></div>
        <div className="kpi"><div className="l">HISTÓRICO</div><div className="v">$42M</div></div>
        <div className="kpi"><div className="l">PENDIENTES</div><div className="v">3</div></div>
        <div className="kpi"><div className="l">REEMBOLSOS</div><div className="v">2</div></div>
      </div>

      {/* Table */}
      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ORGANIZADOR</th>
              <th>PRODUCTO</th>
              <th>MONTO</th>
              <th>FECHA</th>
              <th>ESTADO</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.id}>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.id}</td>
                <td>{r.org}</td>
                <td>{r.prod}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{r.amount}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.date}</td>
                <td>
                  <span className={`stat-pill ${r.st === "Aprobado" ? "pub" : "rej"}`}>
                    <span className="dot" />
                    {r.st}
                  </span>
                </td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setDetail(r)}>Detalle</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn ghost" style={{ marginTop: 14 }} onClick={exportCSV}>
        ↓ Exportar CSV
      </button>

      {/* Detail modal */}
      {detail && (
        <div className="confirm-bg" onClick={() => setDetail(null)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 18 }}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".14em", color: "var(--ink-3)" }}>
                  {detail.id}
                </div>
                <h3 style={{ margin: "4px 0 0" }}>{detail.prod}</h3>
                <span className={`stat-pill ${detail.st === "Aprobado" ? "pub" : "rej"}`} style={{ marginTop: 6, display: "inline-flex" }}>
                  <span className="dot" />{detail.st}
                </span>
              </div>
              <button className="icon-btn" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              {[
                ["Organizador", `${detail.org} ${detail.orgHd}`],
                ["Fecha",       detail.date],
                ["Pasarela",    detail.method],
                ["Tarjeta",     detail.card],
              ].map(([k, v], i, arr) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < arr.length - 1 ? "1px dashed var(--line)" : "none" }}>
                  <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{k}</span>
                  <span style={{ fontWeight: k === "Organizador" ? 600 : 400, fontFamily: k === "Fecha" || k === "Tarjeta" ? "var(--font-mono)" : "inherit", fontSize: k === "Fecha" || k === "Tarjeta" ? 12 : 13 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 8 }}>ÍTEMS</div>
              {detail.items.map(([name, price]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 13 }}>{name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{price}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                <strong>Total</strong>
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: 16 }}>{detail.amount}</strong>
              </div>
            </div>

            {detail.err && (
              <div style={{ background: "color-mix(in oklab, var(--err) 10%, transparent)", border: "1px solid color-mix(in oklab, var(--err) 30%, var(--line))", borderRadius: 10, padding: 12, marginBottom: 14, color: "var(--err)", fontSize: 13 }}>
                ⚠ {detail.err}
              </div>
            )}

            <div className="row-act" style={{ justifyContent: "flex-end" }}>
              <button onClick={() => { setDetail(null); toast.info("Descargando comprobante PDF…"); }}>
                Descargar comprobante
              </button>
              {detail.st === "Aprobado" && (
                <button className="bad" onClick={() => { setDetail(null); toast.warning("Iniciando reembolso…"); }}>
                  Reembolsar
                </button>
              )}
              <button className="btn dark" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => setDetail(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
