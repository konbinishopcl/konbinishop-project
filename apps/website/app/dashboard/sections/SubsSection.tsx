"use client";

type Subscriber = {
  id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
  status: "Activo" | "Cancelado" | "Expirado";
  renewDate: string;
};

const MOCK_SUBS: Subscriber[] = [
  {
    id: "SUB-001",
    name: "Cinépolis Chile",
    email: "admin@cinepolis.cl",
    plan: "Pro · 10 créditos/mes",
    credits: 7,
    status: "Activo",
    renewDate: "5 ABR 2025",
  },
  {
    id: "SUB-002",
    name: "AnimeShop CL",
    email: "tienda@animeshop.cl",
    plan: "Pro · 10 créditos/mes",
    credits: 2,
    status: "Activo",
    renewDate: "12 ABR 2025",
  },
  {
    id: "SUB-003",
    name: "Konbini Ediciones",
    email: "info@konbini-ed.cl",
    plan: "Pro · 10 créditos/mes",
    credits: 0,
    status: "Expirado",
    renewDate: "28 FEB 2025",
  },
  {
    id: "SUB-004",
    name: "Jorge Maturana",
    email: "jmaturana@email.cl",
    plan: "Pro · 10 créditos/mes",
    credits: 4,
    status: "Cancelado",
    renewDate: "—",
  },
];

export default function SubsSection() {
  const statusClass = (s: Subscriber["status"]) =>
    s === "Activo" ? "pub" : s === "Cancelado" ? "rej" : "arc";

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="kpi">
          <div className="l">SUSCRIPTORES ACTIVOS</div>
          <div className="v">87</div>
          <div className="d up">↑ 12 este mes</div>
        </div>
        <div className="kpi">
          <div className="l">MRR</div>
          <div className="v">$2.6M</div>
          <div className="d up">↑ 8%</div>
        </div>
        <div className="kpi">
          <div className="l">CANCELACIONES MES</div>
          <div className="v">3</div>
          <div className="d dn">↓ 1 vs ant.</div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="evt">
          <thead>
            <tr>
              <th>Suscriptor</th>
              <th>Plan</th>
              <th>Créditos</th>
              <th>Renovación</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SUBS.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="cell-prod">
                    <div className="nm">{s.name}</div>
                    <div className="em">{s.email}</div>
                  </div>
                </td>
                <td style={{ fontSize: 13 }}>{s.plan}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {s.credits}
                    </span>
                    <div
                      style={{
                        height: 4,
                        width: 60,
                        background: "var(--surface-2)",
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${(s.credits / 10) * 100}%`,
                          background: s.credits > 3 ? "var(--ok)" : "var(--warn)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{s.renewDate}</td>
                <td>
                  <div className={`stat ${statusClass(s.status)}`}>
                    <span className="dot" />
                    {s.status}
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
