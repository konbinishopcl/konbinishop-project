"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiAuditLog, type ApiAdminUser } from "@/lib/api";
import { TablePagination, useClientPagination } from "@/components/TablePagination";

function actionColor(action: string): string {
  if (action === "BAN" || action === "REJECT" || action === "DELETE") return "var(--err)";
  if (action === "APPROVE" || action === "UNBAN") return "var(--ok)";
  return "var(--ink-2)";
}

export default function LogsSection() {
  const { token } = useUser();
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const { page, goPage, perPage, changePerPage, total, totalPages, from, to, paginated: paginatedLogs } = useClientPagination(logs);
  const [admins, setAdmins] = useState<ApiAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"all" | "7d">("all");
  const [adminId, setAdminId] = useState<number | "">("");

  // Load admins once on mount (for dropdown AND name resolution)
  useEffect(() => {
    if (!token) return;
    api.adminUsers(token)
      .then((all) => setAdmins(all.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN")))
      .catch(() => { /* dropdown stays empty; names fall back */ });
  }, [token]);

  // Fetch logs, re-running when range or adminId change
  const fetchLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const query: Parameters<typeof api.auditLogs>[0] = { pageSize: 50 };
      if (range === "7d") {
        const now = new Date();
        const from = new Date(now);
        from.setDate(now.getDate() - 7);
        query.dateFrom = from.toISOString().slice(0, 10);
        query.dateTo = now.toISOString().slice(0, 10);
      }
      if (adminId !== "") query.userId = adminId;
      const data = await api.auditLogs(query, token);
      setLogs(data.items);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al cargar logs");
    } finally {
      setLoading(false);
    }
  }, [token, range, adminId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Build a userId→name map for fast lookup
  const nameById = useMemo(() => {
    const m = new Map<number, string>();
    admins.forEach((u) => m.set(u.id, [u.firstname, u.lastname].filter(Boolean).join(" ") || u.email));
    return m;
  }, [admins]);

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          className={`sel${range === "all" && adminId === "" ? " on" : ""}`}
          onClick={() => { setRange("all"); setAdminId(""); }}
        >
          Todas las acciones
        </button>
        <button
          className={`sel${range === "7d" ? " on" : ""}`}
          onClick={() => setRange((r) => (r === "7d" ? "all" : "7d"))}
        >
          📅 Últimos 7 días
        </button>
        <select
          className="sel"
          value={adminId === "" ? "" : String(adminId)}
          onChange={(e) => setAdminId(e.target.value === "" ? "" : Number(e.target.value))}
        >
          <option value="">Todos los admins</option>
          {admins.map((u) => (
            <option key={u.id} value={u.id}>
              {[u.firstname, u.lastname].filter(Boolean).join(" ") || u.email}
            </option>
          ))}
        </select>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>ADMIN</th>
              <th>ACCIÓN</th>
              <th>ENTIDAD</th>
              <th>FECHA</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: "16px 0" }}>
                  Cargando…
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", color: "var(--ink-3)", padding: "16px 0" }}>
                  Sin registros
                </td>
              </tr>
            ) : paginatedLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <strong style={{ fontSize: 13 }}>
                    {log.userId == null ? "Sistema" : (nameById.get(log.userId) ?? `Usuario #${log.userId}`)}
                  </strong>
                </td>
                <td>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: actionColor(log.action),
                    }}
                  >
                    {log.action}
                  </span>
                </td>
                <td>{`${log.entity} #${log.entityId}`}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)" }}>
                  {new Date(log.createdAt).toLocaleString("es-CL", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && (
        <TablePagination
          page={page} totalPages={totalPages} total={total} from={from} to={to}
          perPage={perPage} noun="registro"
          onPageChange={goPage} onPerPageChange={changePerPage}
        />
      )}
    </>
  );
}
