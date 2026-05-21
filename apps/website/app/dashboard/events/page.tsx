"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ic } from "@/components/admin/icons";
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

export default function EventsPage() {
  const { token } = useUser();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statFilter, setStatFilter] = useState<"all" | Status>("all");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    api
      .adminEvents(token, { pageSize: 100 })
      .then((r) => setEvents(r.items))
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar los eventos"))
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
    setError("");
    try {
      await api.approveEvent(e.id, token);
      patch(e.id, { isApproved: true, isRejected: false, rejectedReason: null });
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "No se pudo aprobar el evento");
    } finally {
      setBusy(null);
    }
  };

  const reject = async (e: ApiEvent) => {
    if (!token) return;
    const reason = window.prompt("Motivo del rechazo (se le mostrará al organizador):");
    if (reason === null) return;
    if (reason.trim().length < 3) {
      setError("El motivo del rechazo debe tener al menos 3 caracteres.");
      return;
    }
    setBusy(e.id);
    setError("");
    try {
      await api.rejectEvent(e.id, reason.trim(), token);
      patch(e.id, { isApproved: false, isRejected: true, rejectedReason: reason.trim() });
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "No se pudo rechazar el evento");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">MODERACIÓN · イベント</div>
          <h1>
            Eventos <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <div className="sub">
            Revisa las publicaciones de los organizadores: aprueba o rechaza los eventos en
            revisión.
          </div>
        </div>
      </div>

      <div className="filterbar">
        <div className="search-shell">
          {Ic.search}
          <input
            placeholder="Buscar por título u organizador…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setSearch("")}>
              {Ic.close}
            </button>
          )}
        </div>
        <select
          className="select"
          value={statFilter}
          onChange={(e) => setStatFilter(e.target.value as "all" | Status)}
        >
          <option value="all">Todos ({counts.all})</option>
          <option value="rev">En revisión ({counts.rev})</option>
          <option value="pub">Publicados ({counts.pub})</option>
          <option value="rej">Rechazados ({counts.rej})</option>
        </select>
      </div>

      {error && (
        <div style={{ color: "var(--err)", fontSize: 13, margin: "8px 0" }}>{error}</div>
      )}

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando eventos…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="ic">{Ic.search}</div>
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
                            <span className="id">#{e.id}</span> ·{" "}
                            {e.categories[0]?.name ?? "Sin categoría"}
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
                            ${price.toLocaleString("es-CL")}{" "}
                            <span style={{ color: "var(--ink-3)" }}>CLP</span>
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
                      <div
                        className="row-acts"
                        style={{ justifyContent: "flex-end", gap: 6 }}
                      >
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
                            className="btn ghost sm"
                            style={{ color: "var(--ok)" }}
                            disabled={busy === e.id}
                            onClick={() => approve(e)}
                          >
                            {Ic.check} Aprobar
                          </button>
                        )}
                        {status !== "rej" && (
                          <button
                            className="btn ghost sm"
                            style={{ color: "var(--err)" }}
                            disabled={busy === e.id}
                            onClick={() => reject(e)}
                          >
                            {Ic.x} Rechazar
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
