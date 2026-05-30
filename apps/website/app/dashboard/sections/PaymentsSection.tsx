"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiPayment } from "@/lib/api";
import { TablePagination, useClientPagination } from "@/components/TablePagination";

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatCLP = (n: number) => "$" + n.toLocaleString("es-CL");

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function buildCSV(rows: ApiPayment[]): string {
  const header = ["ID", "Comprador", "Productos", "Monto", "Fecha", "Estado"];
  const lines = rows.map((r) =>
    [
      "TX-" + r.id,
      r.buyer.name,
      r.items.map((i) => i.title).join(" + "),
      String(r.total),
      formatDate(r.createdAt),
      r.status === "PAID" ? "Aprobado" : "Fallido",
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PaymentsSection() {
  const { token } = useUser();

  const [rows, setRows] = useState<ApiPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ApiPayment | null>(null);

  const { page, goPage, perPage, changePerPage, total, totalPages, from, to, paginated: paginatedRows } = useClientPagination(rows);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setRows(await api.adminPayments(token));
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Pagos no disponibles — intenta de nuevo");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function exportCSV() {
    const csv = buildCSV(rows);
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
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-3)", padding: "16px 0" }}>
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--ink-3)", padding: "16px 0" }}>
                  Sin pagos registrados
                </td>
              </tr>
            ) : (
              paginatedRows.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>TX-{r.id}</td>
                  <td>{r.buyer.name}</td>
                  <td>{r.items.map((i) => i.title).join(" + ") || "—"}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{formatCLP(r.total)}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{formatDate(r.createdAt)}</td>
                  <td>
                    <span className={`stat-pill ${r.status === "PAID" ? "pub" : "rej"}`}>
                      <span className="dot" />
                      {r.status === "PAID" ? "Aprobado" : "Fallido"}
                    </span>
                  </td>
                  <td>
                    <div className="row-act">
                      <button onClick={() => setDetail(r)}>Detalle</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <TablePagination
          page={page} totalPages={totalPages} total={total} from={from} to={to}
          perPage={perPage} noun="pago"
          onPageChange={goPage} onPerPageChange={changePerPage}
        />
      )}

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
                  TX-{detail.id}
                </div>
                <h3 style={{ margin: "4px 0 0" }}>
                  {detail.items.map((i) => i.title).join(" + ") || "Orden"}
                </h3>
                <span
                  className={`stat-pill ${detail.status === "PAID" ? "pub" : "rej"}`}
                  style={{ marginTop: 6, display: "inline-flex" }}
                >
                  <span className="dot" />
                  {detail.status === "PAID" ? "Aprobado" : "Fallido"}
                </span>
              </div>
              <button className="icon-btn" onClick={() => setDetail(null)}>✕</button>
            </div>

            <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              {(
                [
                  ["Comprador", detail.buyer.handle ? `${detail.buyer.name} ${detail.buyer.handle}` : detail.buyer.name],
                  ["Email",     detail.buyer.email],
                  ["Fecha",     formatDate(detail.createdAt)],
                  ["Pasarela",  detail.gateway ?? "—"],
                ] as [string, string][]
              ).map(([k, v], i, arr) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    borderBottom: i < arr.length - 1 ? "1px dashed var(--line)" : "none",
                  }}
                >
                  <span style={{ color: "var(--ink-3)", fontSize: 13 }}>{k}</span>
                  <span
                    style={{
                      fontWeight: k === "Comprador" ? 600 : 400,
                      fontFamily: k === "Fecha" ? "var(--font-mono)" : "inherit",
                      fontSize: k === "Fecha" ? 12 : 13,
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", marginBottom: 8 }}>
                ÍTEMS
              </div>
              {detail.items.map((item) => (
                <div
                  key={item.title}
                  style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)" }}
                >
                  <span style={{ fontSize: 13 }}>{item.title}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatCLP(item.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
                <strong>Total</strong>
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: 16 }}>{formatCLP(detail.total)}</strong>
              </div>
            </div>

            <div className="row-act" style={{ justifyContent: "flex-end" }}>
              <button onClick={() => { setDetail(null); toast.info("Descargando comprobante PDF…"); }}>
                Descargar comprobante
              </button>
              {detail.status === "PAID" && (
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
