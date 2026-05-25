"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { type ApiUser } from "@/lib/api";

type UserFilter = "all" | "Persona" | "Organización" | "Baneado";

export default function UsersSection() {
  const { token, user: me } = useUser();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [busy, setBusy] = useState<number | null>(null);

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

  const filtered = useMemo(() => {
    let res = users;
    if (filter === "Persona") res = res.filter((u) => !u.isCompany);
    else if (filter === "Organización") res = res.filter((u) => u.isCompany);
    else if (filter === "Baneado") res = res.filter((u) => u.blocked);
    if (search) {
      const q = search.toLowerCase();
      const fullName = (u: ApiUser) =>
        [u.firstname, u.lastname].filter(Boolean).join(" ").toLowerCase();
      res = res.filter((u) => fullName(u).includes(q) || u.email.toLowerCase().includes(q));
    }
    return res;
  }, [users, filter, search]);

  const toggleBan = async (u: ApiUser) => {
    if (!token) return;
    if (me?.role !== "SUPER_ADMIN") {
      toast.error("Solo SUPER_ADMIN puede banear usuarios");
      return;
    }
    setBusy(u.id);
    const action = u.blocked ? "unban" : "ban";
    try {
      const r = await fetch(`/api/users/${u.id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al modificar usuario");
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, blocked: !x.blocked } : x)));
      toast.success(u.blocked ? "Usuario restaurado" : "Usuario baneado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const initials = (u: ApiUser) => {
    const name = [u.firstname, u.lastname].filter(Boolean).join(" ");
    return name
      ? name
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : u.email[0].toUpperCase();
  };

  return (
    <>
      <div className="filterbar">
        <div className="search-shell">
          <span style={{ color: "var(--ink-3)" }}>⌕</span>
          <input
            placeholder="Buscar usuario por nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="sel"
          value={filter}
          onChange={(e) => setFilter(e.target.value as UserFilter)}
          style={{ padding: "8px 14px" }}
        >
          <option value="all">Todos ({users.length})</option>
          <option value="Persona">Personas</option>
          <option value="Organización">Organizaciones</option>
          <option value="Baneado">Baneados</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando usuarios…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
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
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-evt">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 999,
                          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
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
                        <div className="ti">
                          {[u.firstname, u.lastname].filter(Boolean).join(" ") || "—"}
                        </div>
                        <div className="mt">#{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{u.email}</span>
                  </td>
                  <td>{u.isCompany ? "Organización" : "Persona"}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "var(--surface-2)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <div className={`stat ${u.blocked ? "rej" : "pub"}`}>
                      <span className="dot" />
                      {u.blocked ? "Baneado" : "Activo"}
                    </div>
                  </td>
                  <td>
                    <div className="row-acts">
                      <button
                        style={{ color: u.blocked ? "var(--ok)" : "var(--err)" }}
                        disabled={busy === u.id}
                        onClick={() => toggleBan(u)}
                      >
                        {u.blocked ? "Restaurar" : "Banear"}
                      </button>
                    </div>
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
