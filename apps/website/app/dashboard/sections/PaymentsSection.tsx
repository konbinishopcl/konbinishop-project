"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type ProductType = "Evento" | "Aviso" | "Portada" | "Artículo";
type PaymentStatus = "Pendiente" | "Completado" | "Reembolsado";

type Payment = {
  id: string;
  org: string;
  product: ProductType;
  amount: string;
  date: string;
  status: PaymentStatus;
};

const MOCK_PAYMENTS: Payment[] = [
  {
    id: "TX-9F2A-71X",
    org: "Cinépolis Chile",
    product: "Evento",
    amount: "$54.980",
    date: "2025-03-12",
    status: "Completado",
  },
  {
    id: "TX-8D7E-93Z",
    org: "AnimeShop CL",
    product: "Portada",
    amount: "$150.000",
    date: "2025-03-01",
    status: "Completado",
  },
  {
    id: "TX-7B91-09X",
    org: "Konbini Ediciones",
    product: "Aviso",
    amount: "$112.000",
    date: "2025-02-18",
    status: "Completado",
  },
  {
    id: "TX-7C44-88R",
    org: "K-Pop Fest",
    product: "Portada",
    amount: "$200.000",
    date: "2025-02-14",
    status: "Reembolsado",
  },
  {
    id: "TX-6E12-55Q",
    org: "CineClub Santiago",
    product: "Artículo",
    amount: "$19.990",
    date: "2025-02-10",
    status: "Pendiente",
  },
  {
    id: "TX-5D99-31M",
    org: "Cosplay Atelier",
    product: "Aviso",
    amount: "$89.000",
    date: "2025-02-05",
    status: "Pendiente",
  },
  {
    id: "TX-4B77-20N",
    org: "Anime Events CL",
    product: "Evento",
    amount: "$34.950",
    date: "2025-01-28",
    status: "Completado",
  },
  {
    id: "TX-3A55-10P",
    org: "Manga Club",
    product: "Artículo",
    amount: "$9.990",
    date: "2025-01-20",
    status: "Pendiente",
  },
];

const STATUS_CLASS: Record<PaymentStatus, string> = {
  Pendiente: "rev",
  Completado: "pub",
  Reembolsado: "arc",
};

function buildCSV(rows: Payment[]): string {
  const header = ["ID Transacción", "Organizador", "Tipo de producto", "Monto", "Fecha", "Estado"];
  const lines = rows.map((p) =>
    [p.id, p.org, p.product, p.amount, p.date, p.status].join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

export default function PaymentsSection() {
  useUser();

  const [productFilter, setProductFilter] = useState<ProductType | "Todos">("Todos");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "Todos">("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const filtered = MOCK_PAYMENTS.filter((p) => {
    if (productFilter !== "Todos" && p.product !== productFilter) return false;
    if (statusFilter !== "Todos" && p.status !== statusFilter) return false;
    if (dateFrom && p.date < dateFrom) return false;
    if (dateTo && p.date > dateTo) return false;
    if (search && !p.org.toLowerCase().includes(search.toLowerCase())) return false;
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
          <div className="v">$18.750.000</div>
        </div>
        <div className="kpi">
          <div className="l">Transacciones pendientes</div>
          <div className="v">3</div>
        </div>
      </div>

      <div className="panel">
        <div className="ph">
          <h2>Pagos</h2>
          <button className="btn ghost sm" onClick={exportCSV}>
            Exportar CSV
          </button>
        </div>

        <div className="filterbar">
          <select
            className="sel"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value as typeof productFilter)}
          >
            <option value="Todos">Tipo de producto: Todos</option>
            <option value="Evento">Evento</option>
            <option value="Aviso">Aviso</option>
            <option value="Portada">Portada</option>
            <option value="Artículo">Artículo</option>
          </select>

          <select
            className="sel"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Completado">Completado</option>
            <option value="Reembolsado">Reembolsado</option>
          </select>

          <input
            type="date"
            className="sel"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="Fecha inicio"
          />
          <input
            type="date"
            className="sel"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="Fecha fin"
          />

          <input
            className="sel"
            placeholder="Buscar por organizador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="evt">
            <thead>
              <tr>
                <th>ID transacción</th>
                <th>Organizador</th>
                <th>Tipo de producto</th>
                <th>Monto</th>
                <th>Fecha</th>
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
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.id}</span>
                    </td>
                    <td>{p.org}</td>
                    <td>
                      <span className="stat arc">{p.product}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 13 }}>
                        {p.amount}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{p.date}</td>
                    <td>
                      <div className={`stat ${STATUS_CLASS[p.status]}`}>
                        <span className="dot" />
                        {p.status}
                      </div>
                    </td>
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
      </div>
    </>
  );
}
