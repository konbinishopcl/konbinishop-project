"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

type Article = {
  id: number;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "REJECTED";
  category?: { name: string } | null;
  author?: { firstname?: string | null; lastname?: string | null; email: string } | null;
  createdAt?: string;
  rejectedReason?: string | null;
};

type Status = "all" | "DRAFT" | "PUBLISHED" | "REJECTED";

export default function ArticlesSection() {
  const { token } = useUser();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statFilter, setStatFilter] = useState<Status>("all");
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/articles/admin", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error al cargar artículos");
        const data = await r.json();
        setArticles(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar artículos"))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = useMemo(() => {
    let res = articles;
    if (statFilter !== "all") res = res.filter((a) => a.status === statFilter);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter((a) => a.title.toLowerCase().includes(q));
    }
    return res;
  }, [articles, statFilter, search]);

  const authorName = (a: Article) => {
    if (!a.author) return "—";
    return (
      [a.author.firstname, a.author.lastname].filter(Boolean).join(" ") || a.author.email
    );
  };

  const approve = async (a: Article) => {
    if (!token) return;
    setBusy(a.id);
    try {
      const r = await fetch(`/api/articles/${a.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al aprobar");
      setArticles((list) => list.map((x) => (x.id === a.id ? { ...x, status: "PUBLISHED" } : x)));
      toast.success("Artículo aprobado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo aprobar");
    } finally {
      setBusy(null);
    }
  };

  const reject = async (a: Article) => {
    if (!token) return;
    const reason = window.prompt("Motivo del rechazo:");
    if (reason === null) return;
    if (reason.trim().length < 3) {
      toast.error("Motivo mínimo 3 caracteres");
      return;
    }
    setBusy(a.id);
    try {
      const r = await fetch(`/api/articles/${a.id}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("Error al rechazar");
      setArticles((list) =>
        list.map((x) =>
          x.id === a.id ? { ...x, status: "REJECTED", rejectedReason: reason.trim() } : x,
        ),
      );
      toast.success("Artículo rechazado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo rechazar");
    } finally {
      setBusy(null);
    }
  };

  const statusClass = (s: Article["status"]) =>
    s === "PUBLISHED" ? "pub" : s === "REJECTED" ? "rej" : "rev";
  const statusLabel = (s: Article["status"]) =>
    s === "PUBLISHED" ? "Publicado" : s === "REJECTED" ? "Rechazado" : "En revisión";

  return (
    <>
      <div className="filterbar">
        <div className="search-shell">
          <span style={{ color: "var(--ink-3)" }}>⌕</span>
          <input
            placeholder="Buscar artículo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="sel"
          value={statFilter}
          onChange={(e) => setStatFilter(e.target.value as Status)}
          style={{ padding: "8px 14px" }}
        >
          <option value="all">Todos ({articles.length})</option>
          <option value="DRAFT">En revisión</option>
          <option value="PUBLISHED">Publicados</option>
          <option value="REJECTED">Rechazados</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando artículos…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <h3>Sin resultados</h3>
            <p>No hay artículos con esos filtros.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Autor</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                        #{a.id}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cell-prod">
                      <div className="nm">{authorName(a)}</div>
                      <div className="em">{a.author?.email ?? ""}</div>
                    </div>
                  </td>
                  <td>{a.category?.name ?? "—"}</td>
                  <td>
                    <div className={`stat ${statusClass(a.status)}`}>
                      <span className="dot" />
                      {statusLabel(a.status)}
                    </div>
                  </td>
                  <td>
                    <div className="row-acts">
                      {a.status !== "PUBLISHED" && (
                        <button
                          style={{ color: "var(--ok)" }}
                          disabled={busy === a.id}
                          onClick={() => approve(a)}
                        >
                          ✓ Aprobar
                        </button>
                      )}
                      {a.status !== "REJECTED" && (
                        <button
                          style={{ color: "var(--err)" }}
                          disabled={busy === a.id}
                          onClick={() => reject(a)}
                        >
                          ✕ Rechazar
                        </button>
                      )}
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
