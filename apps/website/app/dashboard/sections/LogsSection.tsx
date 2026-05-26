"use client";
import { useState } from "react";

type ActionType =
  | "Aprobar"
  | "Rechazar"
  | "Banear"
  | "Restaurar"
  | "Transferir"
  | "Crear"
  | "Editar"
  | "Eliminar";

const ACTION_TYPES: ActionType[] = [
  "Aprobar",
  "Rechazar",
  "Banear",
  "Restaurar",
  "Transferir",
  "Crear",
  "Editar",
  "Eliminar",
];

const ACTION_COLOR: Record<ActionType, string> = {
  Aprobar:    "var(--ok)",
  Rechazar:   "var(--err)",
  Banear:     "var(--err)",
  Restaurar:  "var(--ok)",
  Transferir: "var(--accent)",
  Crear:      "var(--accent)",
  Editar:     "#eab308",
  Eliminar:   "var(--err)",
};

type LogEntry = {
  id: number;
  admin: { name: string; email: string };
  action: ActionType;
  entity: string;
  when: string;
};

const MOCK_LOGS: LogEntry[] = [
  { id: 1,  admin: { name: "Carlos Vega",      email: "cvega@konbini.cl"    }, action: "Aprobar",    entity: "Evento #142 — AniCon Santiago 2025",       when: "25 MAY 2026 · 14:32" },
  { id: 2,  admin: { name: "María Torres",      email: "mtorres@konbini.cl"  }, action: "Rechazar",   entity: "Evento #141 — Festival Sin Licencia",       when: "25 MAY 2026 · 11:08" },
  { id: 3,  admin: { name: "Carlos Vega",      email: "cvega@konbini.cl"    }, action: "Banear",     entity: "Usuario #88 — spammer@email.com",           when: "24 MAY 2026 · 18:55" },
  { id: 4,  admin: { name: "Admin Root",        email: "admin@konbini.cl"    }, action: "Crear",      entity: "Categoría #12 — Cosplay",                   when: "24 MAY 2026 · 16:20" },
  { id: 5,  admin: { name: "María Torres",      email: "mtorres@konbini.cl"  }, action: "Editar",     entity: "Evento #138 — K-Pop Summer Fest",           when: "23 MAY 2026 · 10:44" },
  { id: 6,  admin: { name: "Jorge Salinas",     email: "jsalinas@konbini.cl" }, action: "Aprobar",    entity: "Spot #31 — Banner Anime Week",              when: "22 MAY 2026 · 17:30" },
  { id: 7,  admin: { name: "Admin Root",        email: "admin@konbini.cl"    }, action: "Transferir", entity: "Evento #130 — CineClub → nuevo org.",       when: "22 MAY 2026 · 09:15" },
  { id: 8,  admin: { name: "Carlos Vega",      email: "cvega@konbini.cl"    }, action: "Restaurar",  entity: "Usuario #72 — usuario_recuperado@gmail.com", when: "21 MAY 2026 · 15:00" },
  { id: 9,  admin: { name: "Jorge Salinas",     email: "jsalinas@konbini.cl" }, action: "Eliminar",   entity: "FAQ #3 — pregunta desactualizada",          when: "20 MAY 2026 · 12:45" },
  { id: 10, admin: { name: "María Torres",      email: "mtorres@konbini.cl"  }, action: "Rechazar",   entity: "Evento #125 — Contenido inapropiado",       when: "19 MAY 2026 · 08:30" },
];

const ADMINS = [...new Set(MOCK_LOGS.map((l) => l.admin.name))].sort();

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function LogsSection() {
  const [adminFilter, setAdminFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = MOCK_LOGS.filter((l) => {
    if (adminFilter && l.admin.name !== adminFilter) return false;
    if (actionFilter && l.action !== actionFilter) return false;
    return true;
  });

  return (
    <>
      <div className="section-head">
        <h2>Logs de actividad</h2>
      </div>

      <div className="filterbar">
        {/* Admin filter */}
        <select
          className="sel"
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value)}
        >
          <option value="">Todos los admins</option>
          {ADMINS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Action type filter */}
        <select
          className="sel"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">Todas las acciones</option>
          {ACTION_TYPES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          title="Desde"
          style={{
            padding: "7px 12px",
            borderRadius: 999,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            fontSize: 12,
            color: "var(--ink-2)",
            cursor: "pointer",
            outline: "none",
          }}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          title="Hasta"
          style={{
            padding: "7px 12px",
            borderRadius: 999,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            fontSize: 12,
            color: "var(--ink-2)",
            cursor: "pointer",
            outline: "none",
          }}
        />

        {(adminFilter || actionFilter || fromDate || toDate) && (
          <button
            className="sel"
            onClick={() => {
              setAdminFilter("");
              setActionFilter("");
              setFromDate("");
              setToDate("");
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="empty">
            <h3>Sin registros</h3>
            <p>No hay logs con esos filtros.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Acción</th>
                <th>Entidad afectada</th>
                <th>Cuándo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--surface-2)",
                          border: "1px solid var(--line)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--ink-2)",
                          flexShrink: 0,
                        }}
                      >
                        {initials(l.admin.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{l.admin.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                          {l.admin.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 4,
                        background: `color-mix(in oklab, ${ACTION_COLOR[l.action]} 12%, transparent)`,
                        color: ACTION_COLOR[l.action],
                        letterSpacing: ".04em",
                        fontWeight: 600,
                      }}
                    >
                      {l.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--ink-2)" }}>{l.entity}</td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                      {l.when}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
