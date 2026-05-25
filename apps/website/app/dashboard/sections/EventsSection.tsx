"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, imageUrl, type ApiEvent } from "@/lib/api";

type Status = "rev" | "pub" | "rej";
const STAT_LABEL: Record<Status, string> = {
  rev: "En revisión",
  pub: "Publicado",
  rej: "Rechazado",
};

function statusOf(e: ApiEvent): Status {
  if (e.isRejected) return "rej";
  if (e.isApproved) return "pub";
  return "rev";
}

function producerOf(e: ApiEvent): string {
  if (!e.owner) return "—";
  return [e.owner.firstname, e.owner.lastname].filter(Boolean).join(" ") || e.owner.email;
}

function eventDate(e: ApiEvent): string {
  const raw = e.dates.find((d) => d.date)?.date;
  if (!raw) return "Fecha por confirmar";
  const d = new Date(raw);
  return d.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function minPrice(e: ApiEvent): number {
  if (!e.prices.length) return 0;
  return Math.min(...e.prices.map((p) => p.price));
}

export default function EventsSection() {
  const { token } = useUser();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statFilter, setStatFilter] = useState<"all" | Status>("all");
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    api.adminEvents(token, { pageSize: 100 })
      .then((r) => setEvents(r.items))
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudieron cargar los eventos"))
      .finally(() => setLoading(false));
  }, [token]);

  const counts = {
    all: events.length,
    rev: events.filter((e) => statusOf(e) === "rev").length,
    pub: events.filter((e) => statusOf(e) === "pub").length,
    rej: events.filter((e) => statusOf(e) === "rej").length,
  };

  const filtered = useMemo(() => {
    let res = events;
    if (statFilter !== "all") res = res.filter((e) => statusOf(e) === statFilter);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.company ?? "").toLowerCase().includes(q) ||
          producerOf(e).toLowerCase().includes(q),
      );
    }
    return res;
  }, [events, statFilter, search]);

  const patch = (id: number, fields: Partial<ApiEvent>) =>
    setEvents((list) => list.map((x) => (x.id === id ? { ...x, ...fields } : x)));

  const approve = async (e: ApiEvent) => {
    if (!token) return;
    setBusy(e.id);
    try {
      await api.approveEvent(e.id, token);
      patch(e.id, { isApproved: true, isRejected: false, rejectedReason: null });
      toast.success("Evento aprobado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo aprobar el evento");
    } finally {
      setBusy(null);
    }
  };

  const reject = async (e: ApiEvent) => {
    if (!token) return;
    const reason = window.prompt("Motivo del rechazo (se le mostrará al organizador):");
    if (reason === null) return;
    if (reason.trim().length < 3) {
      toast.error("El motivo debe tener al menos 3 caracteres.");
      return;
    }
    setBusy(e.id);
    try {
      await api.rejectEvent(e.id, reason.trim(), token);
      patch(e.id, { isApproved: false, isRejected: true, rejectedReason: reason.trim() });
      toast.success("Evento rechazado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo rechazar el evento");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="filterbar">
        <div className="search-shell">
          <span style={{ color: "var(--ink-3)" }}>⌕</span>
          <input
            placeholder="Buscar por título u organizador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              style={{
                background: "none",
                border: "none",
                color: "var(--ink-3)",
                cursor: "pointer",
                fontSize: 16,
                lineHeight: 1,
              }}
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>
        <select
          className="sel"
          value={statFilter}
          onChange={(e) => setStatFilter(e.target.value as "all" | Status)}
          style={{ padding: "8px 14px" }}
        >
          <option value="all">Todos ({counts.all})</option>
          <option value="rev">En revisión ({counts.rev})</option>
          <option value="pub">Publicados ({counts.pub})</option>
          <option value="rej">Rechazados ({counts.rej})</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando eventos…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="ic">⌕</div>
            <h3>Sin resultados</h3>
            <p>No hay eventos con esos filtros.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Organizador</th>
                <th>Fecha &amp; lugar</th>
                <th>Precio</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const status = statusOf(e);
                const price = minPrice(e);
                const thumb = imageUrl(e.poster ?? e.banner);
                return (
                  <tr key={e.id}>
                    <td>
                      <div className="cell-evt">
                        <div className="thumb">
                          {thumb && (
                            <img
                              src={thumb}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          )}
                        </div>
                        <div>
                          <div className="ti">{e.title}</div>
                          <div className="mt">
                            #{e.id} · {e.category?.name ?? "Sin categoría"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-prod">
                        <div className="nm">{producerOf(e)}</div>
                        <div className="em">{e.owner?.email ?? ""}</div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-date">
                        <div className="d">{eventDate(e)}</div>
                        <div className="t">{e.commune?.name ?? e.address}</div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-price">
                        {price === 0 ? (
                          <span className="free">Liberado</span>
                        ) : (
                          <>
                            ${price.toLocaleString("es-CL")}
                            <span style={{ color: "var(--ink-3)" }}> CLP</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={`stat ${status}`}>
                        <span className="dot" />
                        {STAT_LABEL[status]}
                      </div>
                    </td>
                    <td>
                      <div className="row-acts">
                        {status === "pub" && (
                          <Link
                            className="btn ghost sm"
                            href={`/evento/${e.slug}`}
                            target="_blank"
                          >
                            Ver
                          </Link>
                        )}
                        {status !== "pub" && (
                          <button
                            style={{ color: "var(--ok)" }}
                            disabled={busy === e.id}
                            onClick={() => approve(e)}
                          >
                            ✓ Aprobar
                          </button>
                        )}
                        {status !== "rej" && (
                          <button
                            style={{ color: "var(--err)" }}
                            disabled={busy === e.id}
                            onClick={() => reject(e)}
                          >
                            ✕ Rechazar
                          </button>
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
    </>
  );
}
