"use client";
import { useState } from "react";
import { toast } from "sonner";

type ProductType = "Evento" | "Aviso" | "Portada" | "Artículo" | "Suscripción";
type PaymentStatus = "Aprobado" | "Pendiente" | "Fallido" | "Reembolsado";

type Payment = {
  id: string;
  org: string;
  orgHandle: string;
  product: ProductType;
  amount: string;
  date: string;
  time: string;
  status: PaymentStatus;
  method: string;
};

const MOCK_PAYMENTS: Payment[] = [
  {
    id: "TX-9F2A-71X",
    org: "Cinépolis Chile",
    orgHandle: "@cinepolis",
    product: "Evento",
    amount: "$54.980",
    date: "12 MAR 2025",
    time: "14:32",
    status: "Aprobado",
    method: "WebPay Plus",
  },
  {
    id: "TX-9A1B-44C",
    org: "Cinépolis Chile",
    orgHandle: "@cinepolis",
    product: "Suscripción",
    amount: "$29.990",
    date: "5 MAR 2025",
    time: "09:00",
    status: "Aprobado",
    method: "WebPay Plus",
  },
  {
    id: "TX-8D7E-93Z",
    org: "AnimeShop CL",
    orgHandle: "@animeshop",
    product: "Portada",
    amount: "$150.000",
    date: "1 MAR 2025",
    time: "18:22",
    status: "Aprobado",
    method: "WebPay Plus",
  },
  {
    id: "TX-8C2A-12K",
    org: "María Pérez",
    orgHandle: "@mariaperez",
    product: "Evento",
    amount: "$24.950",
    date: "20 FEB 2025",
    time: "11:08",
    status: "Fallido",
    method: "WebPay Plus",
  },
  {
    id: "TX-7B91-09X",
    org: "Konbini Ediciones",
    orgHandle: "@konbini-ed",
    product: "Aviso",
    amount: "$112.000",
    date: "18 FEB 2025",
    time: "13:45",
    status: "Aprobado",
    method: "WebPay Plus",
  },
  {
    id: "TX-7C44-88R",
    org: "K-Pop Fest",
    orgHandle: "@kpopfest",
    product: "Portada",
    amount: "$200.000",
    date: "14 FEB 2025",
    time: "10:00",
    status: "Reembolsado",
    method: "WebPay Plus",
  },
  {
    id: "TX-6E12-55Q",
    org: "CineClub Santiago",
    orgHandle: "@cineclub",
    product: "Artículo",
    amount: "$19.990",
    date: "10 FEB 2025",
    time: "16:55",
    status: "Pendiente",
    method: "WebPay Plus",
  },
  {
    id: "TX-5D99-31M",
    org: "Cosplay Atelier",
    orgHandle: "@cosplayatelier",
    product: "Aviso",
    amount: "$89.000",
    date: "5 FEB 2025",
    time: "08:30",
    status: "Pendiente",
    method: "WebPay Plus",
  },
  {
    id: "TX-4B77-20N",
    org: "Anime Events CL",
    orgHandle: "@animeevents",
    product: "Evento",
    amount: "$34.950",
    date: "28 ENE 2025",
    time: "12:00",
    status: "Aprobado",
    method: "WebPay Plus",
  },
  {
    id: "TX-3A55-10P",
    org: "Jorge Maturana",
    orgHandle: "@jmaturana",
    product: "Suscripción",
    amount: "$29.990",
    date: "20 ENE 2025",
    time: "09:45",
    status: "Pendiente",
    method: "WebPay Plus",
  },
];

const STATUS_CLASS: Record<PaymentStatus, string> = {
  Aprobado: "pub",
  Pendiente: "rev",
  Fallido: "rej",
  Reembolsado: "arc",
};

const PRODUCT_TYPES: Array<ProductType | "Todos"> = [
  "Todos",
  "Evento",
  "Aviso",
  "Portada",
  "Artículo",
  "Suscripción",
];

const STATUS_FILTERS: Array<PaymentStatus | "Todos"> = [
  "Todos",
  "Pendiente",
  "Aprobado",
  "Reembolsado",
];

function buildCSV(rows: Payment[]): string {
  const header = ["ID", "Organizador", "Handle", "Producto", "Monto", "Fecha", "Hora", "Estado", "Método"];
  const lines = rows.map((p) =>
    [p.id, p.org, p.orgHandle, p.product, p.amount, p.date, p.time, p.status, p.method].join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

export default function PaymentsSection() {
  const [productFilter, setProductFilter] = useState<ProductType | "Todos">("Todos");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "Todos">("Todos");
  const [search, setSearch] = useState("");

  const filtered = MOCK_PAYMENTS.filter((p) => {
    if (productFilter !== "Todos" && p.product !== productFilter) return false;
    if (statusFilter !== "Todos" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.org.toLowerCase().includes(q) && !p.orgHandle.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function exportCSV() {
    const csv = buildCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pagos-konbini.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  }

  return (
    <>
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="kpi">
          <div className="l">Ingresos del mes</div>
          <div className="v">$1.240.000</div>
        </div>
        <div className="kpi">
          <div className="l">Total histórico</div>
          <div className="v">$8.450.000</div>
        </div>
        <div className="kpi">
          <div className="l">Transacciones pendientes</div>
          <div className="v">3</div>
        </div>
      </div>

      <div className="section-head">
        <h2>Pagos</h2>
        <button className="btn ghost sm" onClick={exportCSV}>
          Exportar CSV
        </button>
      </div>

      <div className="filterbar">
        <div className="search-shell" style={{ flex: 1, minWidth: 200 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            placeholder="Buscar por organizador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-3)", letterSpacing: ".1em" }}>PRODUCTO</span>
          {PRODUCT_TYPES.map((p) => (
            <button
              key={p}
              className={`sel${productFilter === p ? " on" : ""}`}
              onClick={() => setProductFilter(p as typeof productFilter)}
            >
              {p}
            </button>
          ))}
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
              <th>ID</th>
              <th>Organizador</th>
              <th>Tipo producto</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Método pago</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-3)", padding: "40px 16px" }}>
                  Sin resultados para los filtros aplicados.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
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
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>
                      {p.amount}
                    </span>
                  </td>
                  <td>
                    <div className="cell-date">
                      <div className="d">{p.date}</div>
                      <div className="t">{p.time}</div>
                    </div>
                  </td>
                  <td>
                    <div className={`stat ${STATUS_CLASS[p.status]}`}>
                      <span className="dot" />
                      {p.status}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--ink-2)" }}>{p.method}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="pag">
            <span className="info">{filtered.length} transacciones</span>
          </div>
        )}
      </div>
    </>
  );
}
