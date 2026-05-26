"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
type UserType = "persona" | "org";

type MockUser = {
  id: number;
  firstname: string;
  lastname: string;
  handle: string;
  email: string;
  type: UserType;
  role: UserRole;
  createdAt: string;
  blocked: boolean;
  verified: boolean;
};

const ROLE_LABEL: Record<UserRole, string> = {
  USER: "Usuario",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

const ROLE_CLASS: Record<UserRole, string> = {
  USER: "arc",
  ADMIN: "rev",
  SUPER_ADMIN: "pub",
};

const MOCK_USERS: MockUser[] = [
  {
    id: 1,
    firstname: "María",
    lastname: "González",
    handle: "mariagonzalez",
    email: "maria@konbini.cl",
    type: "persona",
    role: "SUPER_ADMIN",
    createdAt: "2024-01-15T10:00:00Z",
    blocked: false,
    verified: true,
  },
  {
    id: 2,
    firstname: "Festival",
    lastname: "Stgo",
    handle: "festivalsantiago",
    email: "hola@festivalsantiago.cl",
    type: "org",
    role: "ADMIN",
    createdAt: "2024-03-22T14:30:00Z",
    blocked: false,
    verified: true,
  },
  {
    id: 3,
    firstname: "Carlos",
    lastname: "Muñoz",
    handle: "cmuñoz",
    email: "carlos@gmail.com",
    type: "persona",
    role: "USER",
    createdAt: "2024-06-10T09:15:00Z",
    blocked: false,
    verified: false,
  },
  {
    id: 4,
    firstname: "Cultura",
    lastname: "Independiente",
    handle: "culturaindependiente",
    email: "info@culturaind.cl",
    type: "org",
    role: "USER",
    createdAt: "2024-08-05T16:00:00Z",
    blocked: true,
    verified: false,
  },
  {
    id: 5,
    firstname: "Javiera",
    lastname: "Lagos",
    handle: "javieralagos",
    email: "jlagos@ejemplo.cl",
    type: "persona",
    role: "USER",
    createdAt: "2025-01-20T11:45:00Z",
    blocked: false,
    verified: false,
  },
];

type TypeFilter = "all" | UserType;
type RoleFilter = "all" | UserRole;
type StateFilter = "all" | "active" | "banned";

function initials(u: MockUser): string {
  return [u.firstname[0], u.lastname[0]].join("").toUpperCase();
}

function fullName(u: MockUser): string {
  return `${u.firstname} ${u.lastname}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function avatarColor(u: MockUser): string {
  const palette = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
    "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
  ];
  return palette[(u.email.charCodeAt(0) + u.id) % palette.length];
}

// ── Role confirm modal ──────────────────────────────────────────────────────
function RoleConfirmModal({
  user,
  newRole,
  token,
  onClose,
  onDone,
}: {
  user: MockUser;
  newRole: UserRole;
  token: string;
  onClose: () => void;
  onDone: (id: number, role: UserRole) => void;
}) {
  const [busy, setBusy] = useState(false);

  const handleChange = async () => {
    setBusy(true);
    try {
      const r = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!r.ok) throw new Error("No se pudo cambiar el rol");
      onDone(user.id, newRole);
      toast.success(`Rol actualizado a ${ROLE_LABEL[newRole]}`);
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
          Estás a punto de cambiar el rol de <strong>{fullName(user)}</strong> a{" "}
          <strong>{ROLE_LABEL[newRole]}</strong>. ¿Confirmas?
        </p>
        <div className="modal-acts">
          <button
            className="btn primary"
            onClick={handleChange}
            disabled={busy}
            style={{ flex: 1 }}
          >
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

  // Solo SUPER_ADMIN
  if (me && me.role !== "SUPER_ADMIN") {
    return (
      <div className="empty">
        <div className="ic">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h3>Acceso restringido</h3>
        <p>Esta sección es solo para Super Admins.</p>
      </div>
    );
  }

  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [roleTarget, setRoleTarget] = useState<{ user: MockUser; role: UserRole } | null>(null);

  const filtered = useMemo(() => {
    let res = users;
    if (typeFilter !== "all") res = res.filter((u) => u.type === typeFilter);
    if (roleFilter !== "all") res = res.filter((u) => u.role === roleFilter);
    if (stateFilter === "active") res = res.filter((u) => !u.blocked);
    else if (stateFilter === "banned") res = res.filter((u) => u.blocked);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (u) =>
          fullName(u).toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.handle.toLowerCase().includes(q),
      );
    }
    return res;
  }, [users, typeFilter, roleFilter, stateFilter, search]);

  const patch = (id: number, fields: Partial<MockUser>) =>
    setUsers((list) => list.map((x) => (x.id === id ? { ...x, ...fields } : x)));

  const handleRoleSelect = (u: MockUser, newRole: UserRole) => {
    if (!token || newRole === u.role) return;
    setRoleTarget({ user: u, role: newRole });
  };

  const handleToggleBan = async (u: MockUser) => {
    if (!token) return;
    setBusyId(u.id);
    const newBlocked = !u.blocked;
    try {
      const r = await fetch(`/api/users/${u.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: newBlocked }),
      });
      if (!r.ok) throw new Error("No se pudo actualizar el estado");
      patch(u.id, { blocked: newBlocked });
      toast.success(newBlocked ? `${fullName(u)} baneado` : `${fullName(u)} desbaneado`);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo actualizar el estado");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleVerified = async (u: MockUser) => {
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

  return (
    <>
      <div className="filterbar">
        {/* Search */}
        <div className="search-shell" style={{ flex: 1 }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--ink-3)", flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Buscar por nombre, email o handle…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "none",
                border: "none",
                color: "var(--ink-3)",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
        {/* Tipo */}
        <select
          className="sel"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="all">Todos</option>
          <option value="persona">Persona</option>
          <option value="org">Organización</option>
        </select>
        {/* Rol */}
        <select
          className="sel"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
        >
          <option value="all">Todos los roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">Usuario</option>
        </select>
        {/* Estado */}
        <select
          className="sel"
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as StateFilter)}
        >
          <option value="all">Todos</option>
          <option value="active">Activo</option>
          <option value="banned">Baneado</option>
        </select>
      </div>

      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="ic">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="9" cy="7" r="4" />
                <path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" />
              </svg>
            </div>
            <h3>Sin resultados</h3>
            <p>No hay usuarios con esos filtros.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Nombre completo</th>
                <th>@Handle</th>
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
                return (
                  <tr key={u.id}>
                    {/* Avatar + nombre completo */}
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
                        <div className="ti">{fullName(u)}</div>
                      </div>
                    </td>
                    {/* @Handle */}
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--ink-2)",
                        }}
                      >
                        @{u.handle}
                      </span>
                    </td>
                    {/* Email */}
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        {u.email}
                      </span>
                    </td>
                    {/* Tipo chip */}
                    <td>
                      <div className={`stat ${u.type === "org" ? "rev" : "arc"}`}>
                        <span className="dot" />
                        {u.type === "org" ? "Organización" : "Persona"}
                      </div>
                    </td>
                    {/* Rol — inline select (Usuario / Admin only) con confirm modal */}
                    <td>
                      <select
                        value={u.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : u.role}
                        disabled={isBusy || u.role === "SUPER_ADMIN"}
                        onChange={(e) => handleRoleSelect(u, e.target.value as UserRole)}
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--line)",
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          color: "var(--ink-2)",
                          cursor: u.role === "SUPER_ADMIN" ? "default" : "pointer",
                          outline: "none",
                        }}
                      >
                        <option value="USER">Usuario</option>
                        <option value="ADMIN">Admin</option>
                        {u.role === "SUPER_ADMIN" && (
                          <option value="SUPER_ADMIN">Super Admin</option>
                        )}
                      </select>
                    </td>
                    {/* Fecha de registro */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{formatDate(u.createdAt)}</div>
                      </div>
                    </td>
                    {/* Estado chip */}
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
                        <a
                          href={`/@${u.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn ghost sm"
                        >
                          Ver perfil
                        </a>
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
                        {/* Banear / Desbanear */}
                        <button
                          className={u.blocked ? "ok" : "bad"}
                          onClick={() => handleToggleBan(u)}
                          disabled={isBusy}
                        >
                          {u.blocked ? "Desbanear" : "Banear"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Role confirm modal */}
      {roleTarget && token && (
        <RoleConfirmModal
          user={roleTarget.user}
          newRole={roleTarget.role}
          token={token}
          onClose={() => setRoleTarget(null)}
          onDone={(id, role) => patch(id, { role })}
        />
      )}
    </>
  );
}
