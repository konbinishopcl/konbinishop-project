"use client";
import { useCallback, useEffect, useState } from "react";
import { TablePagination, useClientPagination } from "@/components/TablePagination";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, type ApiAdminUser } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type UserFilter = "Todos" | "Persona" | "Organización" | "Baneado";

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onClose }: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => Promise<void>; onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // stay open on error
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: "0 0 10px" }}>{title}</h3>
        <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 18 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn ghost sm" onClick={onClose} disabled={busy}>Cancelar</button>
          <button
            className="btn sm"
            style={{ background: danger ? "var(--err)" : "var(--ink)", color: "#fff" }}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── UserDetailModal ───────────────────────────────────────────────────────────

function UserDetailModal({ item, onClose }: { item: ApiAdminUser; onClose: () => void }) {
  const name = [item.firstname, item.lastname].filter(Boolean).join(" ") || item.email;
  const tipo = item.type === "ORGANIZATION" ? "Organización" : "Persona";
  const rol =
    item.role === "SUPER_ADMIN" ? "Super Admin"
    : item.role === "ADMIN" ? "Admin"
    : "Usuario";
  const handle = item.handle ? `@${item.handle}` : "—";
  const registrado = new Date(item.createdAt).toLocaleDateString("es-CL");
  const estadoLabel = item.blocked ? "Baneado" : "Activo";

  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ minWidth: 320 }}>
        <h3 style={{ margin: "0 0 16px" }}>Detalle de usuario</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)", fontSize: 13 }}>Nombre</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{name}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)", fontSize: 13 }}>Email</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{item.email}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)", fontSize: 13 }}>Tipo</span>
            <span style={{ fontSize: 13 }}>{tipo}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)", fontSize: 13 }}>Rol</span>
            <span className="pill" style={{ fontSize: 12 }}>{rol}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)", fontSize: 13 }}>Handle</span>
            <span style={{ fontSize: 13 }}>{handle}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)", fontSize: 13 }}>Registrado</span>
            <span style={{ fontSize: 13 }}>{registrado}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--ink-2)", fontSize: 13 }}>Estado</span>
            <span className={`stat-pill ${item.blocked ? "rej" : "pub"}`}>
              <span className="dot" />{estadoLabel}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn ghost sm" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UsersSection() {
  const { token } = useUser();
  const [filter, setFilter] = useState<UserFilter>("Todos");
  const [users, setUsers] = useState<ApiAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [modal, setModal] = useState<{ type: "ban" | "restore" | "view"; item: ApiAdminUser } | null>(null);

  const FILTERS: UserFilter[] = ["Todos", "Persona", "Organización", "Baneado"];

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.adminUsers(token);
      setUsers(data);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Ban / Unban ────────────────────────────────────────────────────────────

  async function applyBan(u: ApiAdminUser, blocked: boolean) {
    if (!token) return;
    setBusyId(u.id);
    try {
      const updated = await api.banUser(u.id, blocked, token);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
      toast.success(blocked ? "Usuario baneado" : "Usuario restaurado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo actualizar");
    } finally {
      setBusyId(null);
    }
  }

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    if (filter === "Todos") return true;
    if (filter === "Baneado") return u.blocked === true;
    if (filter === "Persona") return u.type === "PERSON";
    if (filter === "Organización") return u.type === "ORGANIZATION";
    return true;
  });

  const { page, goPage, perPage, changePerPage, total, totalPages, from, to, paginated: paginatedUsers } = useClientPagination(filtered);

  // ── Display helpers ────────────────────────────────────────────────────────

  function userName(u: ApiAdminUser): string {
    return [u.firstname, u.lastname].filter(Boolean).join(" ") || u.email;
  }

  function userInitials(u: ApiAdminUser): string {
    const name = [u.firstname, u.lastname].filter(Boolean).join(" ");
    if (name) {
      return name.split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
    }
    return (u.email.split("@")[0] ?? u.email).slice(0, 2).toUpperCase() || "?";
  }

  function userTipo(u: ApiAdminUser): string {
    return u.type === "ORGANIZATION" ? "Organización" : "Persona";
  }

  function userRol(u: ApiAdminUser): string {
    return u.role === "SUPER_ADMIN" ? "Super Admin" : u.role === "ADMIN" ? "Admin" : "Usuario";
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
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--ink-2)" }}>
                  Cargando…
                </td>
              </tr>
            ) : paginatedUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="cell-evt">
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {userInitials(u)}
                    </div>
                    <div><div className="ti">{userName(u)}</div></div>
                  </div>
                </td>
                <td><span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{u.email}</span></td>
                <td>{userTipo(u)}</td>
                <td><span className="pill">{userRol(u)}</span></td>
                <td>
                  <span className={`stat-pill ${u.blocked ? "rej" : "pub"}`}>
                    <span className="dot" />{u.blocked ? "Baneado" : "Activo"}
                  </span>
                </td>
                <td>
                  <div className="row-act">
                    <button onClick={() => setModal({ type: "view", item: u })}>Ver</button>
                    <button
                      className={u.blocked ? "ok" : "bad"}
                      disabled={busyId === u.id}
                      onClick={() => setModal({ type: u.blocked ? "restore" : "ban", item: u })}
                    >
                      {u.blocked ? "Restaurar" : "Banear"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && (
        <TablePagination
          page={page} totalPages={totalPages} total={total} from={from} to={to}
          perPage={perPage} noun="usuario"
          onPageChange={goPage} onPerPageChange={changePerPage}
        />
      )}

      {modal?.type === "ban" && (
        <ConfirmDialog danger title="¿Banear usuario?"
          message={`${userName(modal.item)} perderá acceso inmediatamente. Puedes restaurarlo después.`}
          confirmLabel="Sí, banear"
          onConfirm={() => applyBan(modal.item, true)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "restore" && (
        <ConfirmDialog title="¿Restaurar usuario?"
          message={`${userName(modal.item)} recuperará acceso completo a la plataforma.`}
          confirmLabel="Sí, restaurar"
          onConfirm={() => applyBan(modal.item, false)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "view" && (
        <UserDetailModal item={modal.item} onClose={() => setModal(null)} />
      )}
    </>
  );
}
