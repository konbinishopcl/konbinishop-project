"use client";
import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserFilter = "Todos" | "Persona" | "Organización" | "Baneado";

type UserRow = {
  av: string;
  nm: string;
  em: string;
  tp: string;
  ro: string;
  st: "Activo" | "Baneado";
};

// ── Mock data (matches AdminTable kind="users" design) ────────────────────────

const USERS: UserRow[] = [
  { av: "ET", nm: "Edgardo Toro",    em: "edgardo.toro@gmail.com", tp: "Persona",      ro: "Admin",   st: "Activo"  },
  { av: "C",  nm: "Cinépolis Chile", em: "—",                      tp: "Organización", ro: "—",       st: "Activo"  },
  { av: "MP", nm: "María Pérez",     em: "maria.perez@email.cl",   tp: "Persona",      ro: "Usuario", st: "Activo"  },
  { av: "JR", nm: "José Ramírez",    em: "jr@email.cl",            tp: "Persona",      ro: "Usuario", st: "Baneado" },
];

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onClose }: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px" }}>{title}</h3>
        <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 18 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn ghost sm" onClick={onClose}>Cancelar</button>
          <button
            className="btn sm"
            style={{ background: danger ? "var(--err)" : "var(--ink)", color: "#fff" }}
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsersSection() {
  const [filter, setFilter] = useState<UserFilter>("Todos");
  const [users, setUsers] = useState<UserRow[]>(USERS);
  const [modal, setModal] = useState<{ type: "ban" | "restore"; item: UserRow } | null>(null);

  const FILTERS: UserFilter[] = ["Todos", "Persona", "Organización", "Baneado"];

  const filtered = users.filter((u) => {
    if (filter === "Todos") return true;
    if (filter === "Baneado") return u.st === "Baneado";
    return u.tp === filter;
  });

  function toggleBan(u: UserRow) {
    setUsers((prev) =>
      prev.map((x) => x.nm === u.nm ? { ...x, st: x.st === "Activo" ? "Baneado" : "Activo" } : x)
    );
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button key={f} className={`sel${filter === f ? " on" : ""}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="a-table">
          <thead>
            <tr>
              <th>USUARIO</th><th>EMAIL</th><th>TIPO</th><th>ROL</th><th>ESTADO</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <tr key={i}>
                <td>
                  <div className="cell-evt">
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {u.av}
                    </div>
                    <div><div className="ti">{u.nm}</div></div>
                  </div>
                </td>
                <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{u.em}</span></td>
                <td>{u.tp}</td>
                <td><span className="pill">{u.ro}</span></td>
                <td>
                  <span className={`stat-pill ${u.st === "Activo" ? "pub" : "rej"}`}>
                    <span className="dot" />{u.st}
                  </span>
                </td>
                <td>
                  <div className="row-act">
                    <button>Ver</button>
                    <button
                      className={u.st === "Activo" ? "bad" : "ok"}
                      onClick={() => setModal({ type: u.st === "Activo" ? "ban" : "restore", item: u })}
                    >
                      {u.st === "Activo" ? "Banear" : "Restaurar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal?.type === "ban" && (
        <ConfirmDialog danger title="¿Banear usuario?"
          message={`${modal.item.nm} perderá acceso inmediatamente. Puedes restaurarlo después.`}
          confirmLabel="Sí, banear"
          onConfirm={() => toggleBan(modal.item)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "restore" && (
        <ConfirmDialog title="¿Restaurar usuario?"
          message={`${modal.item.nm} recuperará acceso completo a la plataforma.`}
          confirmLabel="Sí, restaurar"
          onConfirm={() => toggleBan(modal.item)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
