"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { type ApiUser } from "@/lib/api";

// Extend ApiUser with optional fields the backend may return
type ExtUser = ApiUser & {
  handle?: string | null;
  username?: string | null;
  verified?: boolean;
  createdAt?: string | null;
};

type TypeFilter = "all" | "persona" | "org";
type RoleFilter = "all" | "USER" | "ADMIN" | "SUPER_ADMIN";
type StateFilter = "all" | "active" | "banned";

const ROLE_LABEL: Record<string, string> = {
  USER: "Usuario",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

function initials(u: ExtUser): string {
  const name = [u.firstname, u.lastname].filter(Boolean).join(" ");
  if (!name) return u.email[0].toUpperCase();
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fullName(u: ExtUser): string {
  return [u.firstname, u.lastname].filter(Boolean).join(" ") || "—";
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Ban confirm modal ───────────────────────────────────────────────────────
function BanModal({
  user,
  token,
  onClose,
  onDone,
}: {
  user: ExtUser;
  token: string;
  onClose: () => void;
  onDone: (id: number) => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleBan = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/users/${user.id}/ban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("No se pudo banear al usuario");
      onDone(user.id);
      toast.success(`${fullName(user)} baneado`);
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo banear al usuario");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card">
        <h3>Banear usuario</h3>
        <p>
          Esta acción bloqueará el acceso de <strong>{fullName(user)}</strong> ({user.email}).
          Podrás revertirlo en cualquier momento.
        </p>
        <div className="modal-acts">
          <button
            className="btn"
            onClick={handleBan}
            disabled={busy}
            style={{ flex: 1, background: "var(--err)", color: "#fff" }}
          >
            {busy ? "Baneando…" : "Confirmar ban"}
          </button>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Role change confirm modal ───────────────────────────────────────────────
function RoleModal({
  user,
  newRole,
  token,
  onClose,
  onDone,
}: {
  user: ExtUser;
  newRole: string;
  token: string;
  onClose: () => void;
  onDone: (id: number, role: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleChange = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/users/${user.id}/role`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!r.ok) throw new Error("No se pudo cambiar el rol");
      onDone(user.id, newRole);
      toast.success(`Rol actualizado a ${ROLE_LABEL[newRole] ?? newRole}`);
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo cambiar el rol");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card">
        <h3>Cambiar rol</h3>
        <p>
          Estás a punto de elevar a <strong>{fullName(user)}</strong> al rol de{" "}
          <strong>{ROLE_LABEL[newRole] ?? newRole}</strong>. Esta acción otorga permisos
          administrativos.
        </p>
        <div className="modal-acts">
          <button className="btn primary" onClick={handleChange} disabled={busy} style={{ flex: 1 }}>
            {busy ? "Guardando…" : "Confirmar cambio"}
          </button>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main section ────────────────────────────────────────────────────────────
export default function UsersSection() {
  const { token, user: me } = useUser();
  const [users, setUsers] = useState<ExtUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  // Modal state
  const [banTarget, setBanTarget] = useState<ExtUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ user: ExtUser; role: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/users/admin", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error al cargar usuarios");
        const data = await r.json();
        setUsers(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar usuarios"))
      .finally(() => setLoading(false));
  }, [token]);

  const counts = {
    all: users.length,
    active: users.filter((u) => !u.blocked).length,
    banned: users.filter((u) => u.blocked).length,
    persona: users.filter((u) => !u.isCompany).length,
    org: users.filter((u) => u.isCompany).length,
  };

  const filtered = useMemo(() => {
    let res = users;
    if (typeFilter === "persona") res = res.filter((u) => !u.isCompany);
    else if (typeFilter === "org") res = res.filter((u) => u.isCompany);
    if (roleFilter !== "all") res = res.filter((u) => u.role === roleFilter);
    if (stateFilter === "active") res = res.filter((u) => !u.blocked);
    else if (stateFilter === "banned") res = res.filter((u) => u.blocked);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (u) =>
          fullName(u).toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.handle ?? "").toLowerCase().includes(q) ||
          (u.username ?? "").toLowerCase().includes(q),
      );
    }
    return res;
  }, [users, typeFilter, roleFilter, stateFilter, search]);

  const patch = (id: number, fields: Partial<ExtUser>) =>
    setUsers((list) => list.map((x) => (x.id === id ? { ...x, ...fields } : x)));

  const handleRoleSelect = (u: ExtUser, newRole: string) => {
    if (!token) return;
    if (newRole === u.role) return;
    // Require confirmation when elevating to admin roles
    const isElevation = newRole === "ADMIN" || newRole === "SUPER_ADMIN";
    if (isElevation) {
      setRoleTarget({ user: u, role: newRole });
    } else {
      // Downgrade directly without confirm
      setBusyId(u.id);
      fetch(`/api/users/${u.id}/role`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
        .then(async (r) => {
          if (!r.ok) throw new Error("No se pudo cambiar el rol");
          patch(u.id, { role: newRole as ExtUser["role"] });
          toast.success(`Rol actualizado a ${ROLE_LABEL[newRole] ?? newRole}`);
        })
        .catch((ex) => toast.error(ex instanceof Error ? ex.message : "No se pudo cambiar el rol"))
        .finally(() => setBusyId(null));
    }
  };

  const handleRestore = async (u: ExtUser) => {
    if (!token) return;
    setBusyId(u.id);
    try {
      const r = await fetch(`/api/users/${u.id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("No se pudo restaurar al usuario");
      patch(u.id, { blocked: false });
      toast.success(`${fullName(u)} restaurado`);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo restaurar al usuario");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleVerified = async (u: ExtUser) => {
    if (!token) return;
    setBusyId(u.id);
    const newVerified = !u.verified;
    try {
      const r = await fetch(`/api/users/${u.id}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ verified: newVerified }),
      });
      if (!r.ok) throw new Error("No se pudo actualizar verificación");
      patch(u.id, { verified: newVerified });
      toast.success(newVerified ? "Usuario verificado" : "Verificación retirada");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo actualizar verificación");
    } finally {
      setBusyId(null);
    }
  };

  // Avatar color derived from initials deterministically
  function avatarColor(u: ExtUser): string {
    const palette = [
      "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
      "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
    ];
    const code = (u.email.charCodeAt(0) + (u.id ?? 0)) % palette.length;
    return palette[code];
  }

  return (
    <>
      <div className="filterbar">
        {/* Search */}
        <div className="search-shell" style={{ flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Buscar por nombre, email o handle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          )}
        </div>
        {/* Type filter */}
        <select
          className="sel"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="all">Todos ({counts.all})</option>
          <option value="persona">Persona ({counts.persona})</option>
          <option value="org">Organización ({counts.org})</option>
        </select>
        {/* Role filter */}
        <select
          className="sel"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
        >
          <option value="all">Todos los roles</option>
          <option value="USER">Usuario</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        {/* State filter */}
        <select
          className="sel"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as StateFilter)}
        >
          <option value="all">Activos y baneados</option>
          <option value="active">Activo ({counts.active})</option>
          <option value="banned">Baneado ({counts.banned})</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando usuarios…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="ic">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" />
              </svg>
            </div>
            <h3>Sin resultados</h3>
            <p>No hay usuarios con esos filtros.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Tipo</th>
                <th>Rol</th>
                <th>Registro</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isBusy = busyId === u.id;
                const handle = u.handle ?? u.username;
                const isSelf = me?.id === u.id;
                return (
                  <tr key={u.id}>
                    {/* Avatar + nombre */}
                    <td>
                      <div className="cell-evt">
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 999,
                            background: avatarColor(u),
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 12,
                            flexShrink: 0,
                          }}
                        >
                          {initials(u)}
                        </div>
                        <div>
                          <div className="ti" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {fullName(u)}
                            {u.verified && (
                              <span
                                title="Verificado"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 16,
                                  height: 16,
                                  borderRadius: 999,
                                  background: "var(--ok)",
                                  color: "#fff",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="mt">
                            {handle ? `@${handle}` : `#${u.id}`}
                            {isSelf && (
                              <span style={{ marginLeft: 6, color: "var(--accent)", fontWeight: 600 }}>
                                (tú)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{u.email}</span>
                    </td>
                    {/* Tipo */}
                    <td>{u.isCompany ? "Organización" : "Persona"}</td>
                    {/* Rol */}
                    <td>
                      <select
                        value={u.role}
                        disabled={isBusy || isSelf}
                        onChange={(e) => handleRoleSelect(u, e.target.value)}
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--line)",
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          color: "var(--ink-2)",
                          cursor: isSelf ? "not-allowed" : "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="USER">Usuario</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                      </select>
                    </td>
                    {/* Fecha registro */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{formatDate(u.createdAt)}</div>
                      </div>
                    </td>
                    {/* Estado */}
                    <td>
                      <div className={`stat ${u.blocked ? "rej" : "pub"}`}>
                        <span className="dot" />
                        {u.blocked ? "Baneado" : "Activo"}
                      </div>
                    </td>
                    {/* Acciones */}
                    <td>
                      <div className="row-acts">
                        {/* Ver perfil */}
                        {handle ? (
                          <a
                            href={`/@${handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn ghost sm"
                          >
                            Ver perfil
                          </a>
                        ) : (
                          <button disabled title="Sin handle" style={{ opacity: 0.4 }}>
                            Ver perfil
                          </button>
                        )}
                        {/* Verificado toggle */}
                        <button
                          onClick={() => handleToggleVerified(u)}
                          disabled={isBusy}
                          title={u.verified ? "Quitar verificación" : "Verificar usuario"}
                          style={{
                            color: u.verified ? "var(--ok)" : "var(--ink-3)",
                            fontWeight: u.verified ? 700 : 400,
                          }}
                        >
                          {u.verified ? "Verificado" : "Verificar"}
                        </button>
                        {/* Ban / Restaurar */}
                        {!isSelf && (
                          u.blocked ? (
                            <button
                              className="ok"
                              onClick={() => handleRestore(u)}
                              disabled={isBusy}
                            >
                              Restaurar
                            </button>
                          ) : (
                            <button
                              className="bad"
                              onClick={() => setBanTarget(u)}
                              disabled={isBusy}
                            >
                              Banear
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Ban modal */}
      {banTarget && token && (
        <BanModal
          user={banTarget}
          token={token}
          onClose={() => setBanTarget(null)}
          onDone={(id) => patch(id, { blocked: true })}
        />
      )}

      {/* Role elevation confirm */}
      {roleTarget && token && (
        <RoleModal
          user={roleTarget.user}
          newRole={roleTarget.role}
          token={token}
          onClose={() => setRoleTarget(null)}
          onDone={(id, role) => patch(id, { role: role as ExtUser["role"] })}
        />
      )}
    </>
  );
}
