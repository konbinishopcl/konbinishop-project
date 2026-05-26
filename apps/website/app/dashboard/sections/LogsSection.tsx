"use client";
import { useState } from "react";

type LogRow = [string, string, string, string];

const LOGS: LogRow[] = [
  ["Camila T.",  "approve_event",     "Anime Crunchyroll Fest #142", "12 mar 14:32"],
  ["Diego S.",   "ban_spot",          "Cosplay Atelier Fake #28",    "12 mar 13:18"],
  ["Camila T.",  "verify_user",       "@cinepolis #u-091",           "12 mar 11:05"],
  ["Sistema",    "renew_subscription","Cinépolis Chile #s-12",       "12 mar 09:00"],
  ["Edgardo T.", "update_settings",   "ad_price = $8000",            "11 mar 18:44"],
  ["Camila T.",  "reject_event",      "Concierto Trap #137",         "11 mar 16:20"],
  ["Edgardo T.", "ban_user",          "spam_user_x #u-073",          "11 mar 14:01"],
];

function actionColor(action: string): string {
  if (action.startsWith("ban") || action.startsWith("reject")) return "var(--err)";
  if (action.startsWith("approve") || action.startsWith("verify")) return "var(--ok)";
  return "var(--ink-2)";
}

export default function LogsSection() {
  const [filter, setFilter] = useState<"acciones" | "7dias" | "admins">("acciones");

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <button
          className={`sel${filter === "acciones" ? " on" : ""}`}
          onClick={() => setFilter("acciones")}
        >
          Todas las acciones
        </button>
        <button
          className={`sel${filter === "7dias" ? " on" : ""}`}
          onClick={() => setFilter("7dias")}
        >
          📅 Últimos 7 días
        </button>
        <button
          className={`sel${filter === "admins" ? " on" : ""}`}
          onClick={() => setFilter("admins")}
        >
          Todos los admins
        </button>
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
            {LOGS.map((l, i) => (
              <tr key={i}>
                <td>
                  <strong style={{ fontSize: 13 }}>{l[0]}</strong>
                </td>
                <td>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: actionColor(l[1]),
                    }}
                  >
                    {l[1]}
                  </span>
                </td>
                <td>{l[2]}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-3)" }}>
                  {l[3]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
