"use client";

type Payment = {
  id: string;
  org: string;
  orgHandle: string;
  product: string;
  amount: string;
  date: string;
  status: "Aprobado" | "Fallido" | "Pendiente";
  method: string;
};

const MOCK_PAYMENTS: Payment[] = [
  {
    id: "TX-9F2A-71X",
    org: "Cinépolis Chile",
    orgHandle: "@cinepolis",
    product: "Evento + Aviso",
    amount: "$54.980",
    date: "12 MAR 2025 · 14:32",
    status: "Aprobado",
    method: "WebPay Plus",
  },
  {
    id: "TX-9A1B-44C",
    org: "Cinépolis Chile",
    orgHandle: "@cinepolis",
    product: "Suscripción",
    amount: "$29.990",
    date: "5 MAR 2025 · 09:00",
    status: "Aprobado",
    method: "WebPay Plus",
  },
  {
    id: "TX-8D7E-93Z",
    org: "AnimeShop CL",
    orgHandle: "@animeshop",
    product: "Portada (10d)",
    amount: "$150.000",
    date: "1 MAR 2025 · 18:22",
    status: "Aprobado",
    method: "WebPay Plus",
  },
  {
    id: "TX-8C2A-12K",
    org: "María Pérez",
    orgHandle: "maria.perez@email.cl",
    product: "Evento",
    amount: "$24.950",
    date: "20 FEB 2025 · 11:08",
    status: "Fallido",
    method: "WebPay Plus",
  },
  {
    id: "TX-7B91-09X",
    org: "Konbini Ed.",
    orgHandle: "@konbini-ed",
    product: "Aviso (14d)",
    amount: "$112.000",
    date: "18 FEB 2025 · 13:45",
    status: "Aprobado",
    method: "WebPay Plus",
  },
];

export default function PaymentsSection() {
  const statusClass = (s: Payment["status"]) =>
    s === "Aprobado" ? "pub" : s === "Fallido" ? "rej" : "rev";

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="l">INGRESOS MES</div>
          <div className="v">$3.8M</div>
          <div className="d up">↑ 24%</div>
        </div>
        <div className="kpi">
          <div className="l">HISTÓRICO</div>
          <div className="v">$42M</div>
        </div>
        <div className="kpi">
          <div className="l">PENDIENTES</div>
          <div className="v">3</div>
        </div>
        <div className="kpi">
          <div className="l">FALLIDOS (MES)</div>
          <div className="v">1</div>
          <div className="d dn">↓ 2 vs ant.</div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="evt">
          <thead>
            <tr>
              <th>ID</th>
              <th>Organización</th>
              <th>Producto</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Método</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PAYMENTS.map((p) => (
              <tr key={p.id}>
                <td>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.id}</span>
                </td>
                <td>
                  <div className="cell-prod">
                    <div className="nm">{p.org}</div>
                    <div className="em">{p.orgHandle}</div>
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{p.product}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>
                  {p.amount}
                </td>
                <td>
                  <div className="cell-date">
                    <div className="d" style={{ fontSize: 12 }}>
                      {p.date.split(" · ")[0]}
                    </div>
                    <div className="t">{p.date.split(" · ")[1]}</div>
                  </div>
                </td>
                <td style={{ fontSize: 12, color: "var(--ink-2)" }}>{p.method}</td>
                <td>
                  <div className={`stat ${statusClass(p.status)}`}>
                    <span className="dot" />
                    {p.status}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
