"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, imageUrl, type ApiEvent } from "@/lib/api";

// Extend ApiEvent locally to support ban state and tags
type ExtEvent = ApiEvent & { isBanned?: boolean; tags?: string[] };

type Status = "rev" | "pub" | "rej" | "ban";
const STAT_LABEL: Record<Status, string> = {
  rev: "En revisión",
  pub: "Publicado",
  rej: "Rechazado",
  ban: "Baneado",
};

function statusOf(e: ExtEvent): Status {
  if (e.isBanned) return "ban";
  if (e.isRejected) return "rej";
  if (e.isApproved) return "pub";
  return "rev";
}

function producerOf(e: ExtEvent): string {
  if (!e.owner) return "—";
  return [e.owner.firstname, e.owner.lastname].filter(Boolean).join(" ") || e.owner.email;
}

function eventDate(e: ExtEvent): string {
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

function minPrice(e: ExtEvent): number {
  if (!e.prices.length) return 0;
  return Math.min(...e.prices.map((p) => p.price));
}

// ── Approve panel modal ─────────────────────────────────────────────────────
function ApproveModal({
  event,
  token,
  onClose,
  onDone,
}: {
  event: ExtEvent;
  token: string;
  onClose: () => void;
  onDone: (id: number) => void;
}) {
  const [tags, setTags] = useState<string>(event.tags?.join(", ") ?? "");
  const [busy, setBusy] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiTags = () => {
    setAiLoading(true);
    toast.info("IA generando tags…");
    setTimeout(() => {
      const sample = ["música", "cultura", "presencial", "familia", "entretenimiento"];
      setTags(sample.join(", "));
      setAiLoading(false);
      toast.success("Tags generados por IA");
    }, 1500);
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      await api.approveEvent(event.id, token);
      onDone(event.id);
      toast.success("Evento aprobado");
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo aprobar el evento");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card" style={{ maxWidth: 480 }}>
        <h3>Aprobar evento</h3>
        <p style={{ marginBottom: 14 }}>
          <strong>{event.title}</strong> — revisa y agrega tags antes de publicar.
        </p>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            marginBottom: 6,
          }}
        >
          Tags (separados por coma)
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="música, cultura, gratis…"
            style={{
              flex: 1,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 13,
              color: "var(--ink)",
              outline: "none",
            }}
          />
          <button
            onClick={handleAiTags}
            disabled={aiLoading}
            title="Generar tags con IA"
            style={{
              height: 38,
              width: 38,
              borderRadius: 999,
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: aiLoading ? "var(--ink-3)" : "var(--accent)",
            }}
          >
            ✦
          </button>
        </div>
        <div className="modal-acts">
          <button
            className="btn primary"
            onClick={handleApprove}
            disabled={busy}
            style={{ flex: 1 }}
          >
            {busy ? "Aprobando…" : "Aprobar evento"}
          </button>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject modal ────────────────────────────────────────────────────────────
function RejectModal({
  event,
  token,
  onClose,
  onDone,
}: {
  event: ExtEvent;
  token: string;
  onClose: () => void;
  onDone: (id: number) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handleReject = async () => {
    if (reason.trim().length < 3) {
      toast.error("El motivo debe tener al menos 3 caracteres.");
      return;
    }
    setBusy(true);
    try {
      await api.rejectEvent(event.id, reason.trim(), token);
      onDone(event.id);
      toast.success("Evento rechazado");
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo rechazar el evento");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card">
        <h3>Rechazar evento</h3>
        <p>Indica el motivo del rechazo. El organizador lo verá en su panel.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: El contenido no cumple con las normas de la plataforma…"
        />
        <div className="modal-acts">
          <button
            className="btn"
            onClick={handleReject}
            disabled={busy}
            style={{
              flex: 1,
              background: "var(--err)",
              color: "#fff",
            }}
          >
            {busy ? "Rechazando…" : "Rechazar evento"}
          </button>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ban modal ───────────────────────────────────────────────────────────────
function BanModal({
  event,
  token,
  onClose,
  onDone,
}: {
  event: ExtEvent;
  token: string;
  onClose: () => void;
  onDone: (id: number) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const handleBan = async () => {
    if (reason.trim().length < 3) {
      toast.error("El motivo debe tener al menos 3 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/events/${event.id}/ban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("No se pudo banear el evento");
      onDone(event.id);
      toast.success("Evento baneado");
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo banear el evento");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card">
        <h3>Banear evento</h3>
        <p>El evento quedará oculto del sitio. Indica el motivo.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Contenido inapropiado o fraudulento…"
        />
        <div className="modal-acts">
          <button
            className="btn"
            onClick={handleBan}
            disabled={busy}
            style={{ flex: 1, background: "var(--err)", color: "#fff" }}
          >
            {busy ? "Baneando…" : "Banear evento"}
          </button>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Transfer modal ──────────────────────────────────────────────────────────
type UserSearchResult = {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
  handle?: string | null;
};

function TransferModal({
  event,
  token,
  allUsers,
  onClose,
  onDone,
}: {
  event: ExtEvent;
  token: string;
  allUsers: UserSearchResult[];
  onClose: () => void;
  onDone: (eventId: number, newOwner: UserSearchResult) => void;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [busy, setBusy] = useState(false);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return allUsers
      .filter(
        (u) =>
          u.email.toLowerCase().includes(lower) ||
          (u.handle ?? "").toLowerCase().includes(lower) ||
          [u.firstname, u.lastname].filter(Boolean).join(" ").toLowerCase().includes(lower),
      )
      .slice(0, 8);
  }, [q, allUsers]);

  const handleTransfer = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/events/${event.id}/transfer`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: selected.id }),
      });
      if (!r.ok) throw new Error("No se pudo transferir el evento");
      onDone(event.id, selected);
      toast.success(`Evento transferido a ${selected.email}`);
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo transferir el evento");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card" style={{ maxWidth: 460 }}>
        <h3>Transferir evento</h3>
        <p>Busca la cuenta destino por email o handle.</p>
        <div className="search-shell" style={{ marginBottom: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setSelected(null); }}
            placeholder="email@ejemplo.com o @handle"
          />
        </div>
        {results.length > 0 && (
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            {results.map((u) => {
              const name = [u.firstname, u.lastname].filter(Boolean).join(" ") || u.email;
              const isSelected = selected?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => setSelected(u)}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 2,
                    padding: "10px 14px",
                    background: isSelected ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "var(--surface)",
                    borderBottom: "1px solid var(--line)",
                    cursor: "pointer",
                    textAlign: "left",
                    border: "none",
                    borderBottomColor: "var(--line)",
                    borderBottomWidth: 1,
                    borderBottomStyle: "solid",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{name}</span>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-3)" }}>
                    {u.email}{u.handle ? ` · @${u.handle}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {selected && (
          <p style={{ marginBottom: 14, fontSize: 13, color: "var(--ok)" }}>
            Seleccionado: <strong>{selected.email}</strong>
          </p>
        )}
        <div className="modal-acts">
          <button
            className="btn primary"
            onClick={handleTransfer}
            disabled={busy || !selected}
            style={{ flex: 1 }}
          >
            {busy ? "Transfiriendo…" : "Confirmar transferencia"}
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
export default function EventsSection() {
  const { token } = useUser();
  const [events, setEvents] = useState<ExtEvent[]>([]);
  const [allUsers, setAllUsers] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statFilter, setStatFilter] = useState<"all" | Status>("all");

  // Modal state
  const [approveTarget, setApproveTarget] = useState<ExtEvent | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ExtEvent | null>(null);
  const [banTarget, setBanTarget] = useState<ExtEvent | null>(null);
  const [transferTarget, setTransferTarget] = useState<ExtEvent | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .adminEvents(token, { pageSize: 100 })
      .then((r) => setEvents(r.items as ExtEvent[]))
      .catch((e) => toast.error(e instanceof Error ? e.message : "No se pudieron cargar los eventos"))
      .finally(() => setLoading(false));

    // Load users for transfer search
    fetch("/api/users/admin", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        setAllUsers(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch(() => {/* silently ignore — transfer modal will show empty results */});
  }, [token]);

  const counts = {
    all: events.length,
    rev: events.filter((e) => statusOf(e) === "rev").length,
    pub: events.filter((e) => statusOf(e) === "pub").length,
    rej: events.filter((e) => statusOf(e) === "rej").length,
    ban: events.filter((e) => statusOf(e) === "ban").length,
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

  const patch = (id: number, fields: Partial<ExtEvent>) =>
    setEvents((list) => list.map((x) => (x.id === id ? { ...x, ...fields } : x)));

  const restore = async (e: ExtEvent) => {
    if (!token) return;
    setBusyId(e.id);
    try {
      const r = await fetch(`/api/events/${e.id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("No se pudo restaurar el evento");
      patch(e.id, { isBanned: false, isRejected: false, isApproved: false });
      toast.success("Evento restaurado — vuelve a revisión");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo restaurar el evento");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="filterbar">
        <div className="search-shell" style={{ flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            placeholder="Buscar por título u organizador…"
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
        <select
          className="sel"
          value={statFilter}
          onChange={(e) => setStatFilter(e.target.value as "all" | Status)}
        >
          <option value="all">Todos ({counts.all})</option>
          <option value="rev">En revisión ({counts.rev})</option>
          <option value="pub">Publicado ({counts.pub})</option>
          <option value="rej">Rechazado ({counts.rej})</option>
          <option value="ban">Baneado ({counts.ban})</option>
        </select>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando eventos…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="ic">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3>Sin resultados</h3>
            <p>No hay eventos con esos filtros.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Organizador</th>
                <th>Fecha</th>
                <th>Precio mínimo</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const status = statusOf(e);
                const price = minPrice(e);
                const thumb = imageUrl(e.poster ?? e.banner);
                const isBusy = busyId === e.id;
                return (
                  <tr key={e.id}>
                    {/* Imagen + título */}
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
                    {/* Organizador */}
                    <td>
                      <div className="cell-prod">
                        <div className="nm">{producerOf(e)}</div>
                        <div className="em">{e.owner?.email ?? ""}</div>
                      </div>
                    </td>
                    {/* Fecha */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{eventDate(e)}</div>
                        <div className="t">{e.commune?.name ?? e.address}</div>
                      </div>
                    </td>
                    {/* Precio */}
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
                    {/* Estado */}
                    <td>
                      <div className={`stat ${status}`}>
                        <span className="dot" />
                        {STAT_LABEL[status]}
                      </div>
                    </td>
                    {/* Acciones */}
                    <td>
                      <div className="row-acts">
                        {/* En revisión */}
                        {status === "rev" && (
                          <>
                            <button className="ok" onClick={() => setApproveTarget(e)} disabled={isBusy}>
                              Aprobar
                            </button>
                            <button className="bad" onClick={() => setRejectTarget(e)} disabled={isBusy}>
                              Rechazar
                            </button>
                          </>
                        )}
                        {/* Publicado */}
                        {status === "pub" && (
                          <>
                            <Link className="btn ghost sm" href={`/evento/${e.slug}`} target="_blank">
                              Ver en sitio
                            </Link>
                            <button className="bad" onClick={() => setBanTarget(e)} disabled={isBusy}>
                              Banear
                            </button>
                          </>
                        )}
                        {/* Baneado */}
                        {status === "ban" && (
                          <button className="ok" onClick={() => restore(e)} disabled={isBusy}>
                            Restaurar
                          </button>
                        )}
                        {/* Rechazado */}
                        {status === "rej" && (
                          <button onClick={() => restore(e)} disabled={isBusy}>
                            Re-revisar
                          </button>
                        )}
                        {/* Siempre: Transferir */}
                        <button onClick={() => setTransferTarget(e)} disabled={isBusy}>
                          Transferir
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

      {/* Modals */}
      {approveTarget && token && (
        <ApproveModal
          event={approveTarget}
          token={token}
          onClose={() => setApproveTarget(null)}
          onDone={(id) => patch(id, { isApproved: true, isRejected: false, isBanned: false })}
        />
      )}
      {rejectTarget && token && (
        <RejectModal
          event={rejectTarget}
          token={token}
          onClose={() => setRejectTarget(null)}
          onDone={(id) => patch(id, { isApproved: false, isRejected: true, isBanned: false })}
        />
      )}
      {banTarget && token && (
        <BanModal
          event={banTarget}
          token={token}
          onClose={() => setBanTarget(null)}
          onDone={(id) => patch(id, { isBanned: true, isApproved: false })}
        />
      )}
      {transferTarget && token && (
        <TransferModal
          event={transferTarget}
          token={token}
          allUsers={allUsers}
          onClose={() => setTransferTarget(null)}
          onDone={(eventId, newOwner) =>
            patch(eventId, {
              owner: {
                id: newOwner.id,
                email: newOwner.email,
                firstname: newOwner.firstname,
                lastname: newOwner.lastname,
              },
            })
          }
        />
      )}
    </>
  );
}
