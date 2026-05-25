"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type LogEntry = {
  id: number;
  entity: string;
  entityId?: number | string | null;
  action: string;
  performedBy?: { firstname?: string | null; lastname?: string | null; email: string } | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

export default function LogsSection() {
  const { token } = useUser();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams();
    if (entityFilter) params.set("entity", entityFilter);
    if (actionFilter) params.set("action", actionFilter);
    const qs = params.toString();
    fetch(`/api/logs/admin${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error al cargar logs");
        const data = await r.json();
        setLogs(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar logs"))
      .finally(() => setLoading(false));
  }, [token, entityFilter, actionFilter]);

  const performerName = (l: LogEntry) => {
    if (!l.performedBy) return "Sistema";
    return (
      [l.performedBy.firstname, l.performedBy.lastname].filter(Boolean).join(" ") ||
      l.performedBy.email
    );
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("es-CL", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const entities = [...new Set(logs.map((l) => l.entity))].sort();
  const actions = [...new Set(logs.map((l) => l.action))].sort();

  return (
    <>
      <div className="filterbar">
        <select
          className="sel"
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setLoading(true);
          }}
          style={{ padding: "8px 14px" }}
        >
          <option value="">Todas las entidades</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select
          className="sel"
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setLoading(true);
          }}
          style={{ padding: "8px 14px" }}
        >
          <option value="">Todas las acciones</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        {(entityFilter || actionFilter) && (
          <button
            className="sel"
            onClick={() => {
              setEntityFilter("");
              setActionFilter("");
              setLoading(true);
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando logs…</h3>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty">
            <h3>Sin registros</h3>
            <p>No hay logs con esos filtros.</p>
          </div>
        ) : (
          <table className="log-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Entidad</th>
                <th>Acción</th>
                <th>Realizado por</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)", fontSize: 11 }}>
                    {l.id}
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, whiteSpace: "nowrap" }}>
                    {formatDate(l.createdAt)}
                  </td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{l.entity}</span>
                    {l.entityId != null && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--ink-3)",
                        }}
                      >
                        #{l.entityId}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="log-action">{l.action}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{performerName(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
