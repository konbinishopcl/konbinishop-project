"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

// ── Types ──────────────────────────────────────────────────────────────────

type Status = "rev" | "pub" | "rej" | "ban";

type MockEvent = {
  id: number;
  title: string;
  category: string;
  thumbnail: string | null;
  organizador: string;
  email: string;
  fecha: string;
  precioMin: number;
  slug: string;
  status: Status;
};

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_CATEGORIES = ["Música", "Teatro", "Arte", "Gastronomía", "Deporte"];

const MOCK_EVENTS: MockEvent[] = [
  {
    id: 101,
    title: "Festival de Jazz Santiago",
    category: "Música",
    thumbnail: null,
    organizador: "Productora Sur",
    email: "contacto@productosur.cl",
    fecha: "2026-07-12",
    precioMin: 15000,
    slug: "festival-jazz-santiago",
    status: "rev",
  },
  {
    id: 102,
    title: "Feria del Libro 2026",
    category: "Arte",
    thumbnail: null,
    organizador: "Editorial Norte",
    email: "info@editorialnorte.cl",
    fecha: "2026-08-20",
    precioMin: 0,
    slug: "feria-libro-2026",
    status: "pub",
  },
  {
    id: 103,
    title: "Obra de Teatro: La Tempestad",
    category: "Teatro",
    thumbnail: null,
    organizador: "Compañía Errante",
    email: "hola@errante.cl",
    fecha: "2026-06-05",
    precioMin: 8000,
    slug: "obra-teatro-la-tempestad",
    status: "rej",
  },
  {
    id: 104,
    title: "Maratón Santiago 2026",
    category: "Deporte",
    thumbnail: null,
    organizador: "Atletas Chile",
    email: "admin@atletaschile.cl",
    fecha: "2026-09-15",
    precioMin: 25000,
    slug: "maraton-santiago-2026",
    status: "ban",
  },
  {
    id: 105,
    title: "Festival Gastronómico del Sur",
    category: "Gastronomía",
    thumbnail: null,
    organizador: "Sabores Patagonia",
    email: "hola@saborespatagonia.cl",
    fecha: "2026-10-01",
    precioMin: 5000,
    slug: "festival-gastronomico-sur",
    status: "rev",
  },
];

const STAT_LABEL: Record<Status, string> = {
  rev: "En revisión",
  pub: "Publicado",
  rej: "Rechazado",
  ban: "Baneado",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtPrice(price: number): string {
  if (price === 0) return "Liberado";
  return `$${price.toLocaleString("es-CL")}`;
}

// ── Mock users for transfer ────────────────────────────────────────────────

type UserResult = { id: number; email: string; name: string; handle?: string };
const MOCK_USERS: UserResult[] = [
  { id: 10, email: "ana@ejemplo.com", name: "Ana Torres", handle: "anatorres" },
  { id: 11, email: "pedro@ejemplo.com", name: "Pedro Muñoz", handle: "pedrom" },
  { id: 12, email: "carla@ejemplo.com", name: "Carla Soto" },
  { id: 13, email: "juan@konbini.cl", name: "Juan Pérez", handle: "juanp" },
];

// ── ApproveModal ─────────────────────────────────────────────────────────────

function ApproveModal({
  event,
  token,
  onClose,
  onDone,
}: {
  event: MockEvent;
  token: string;
  onClose: () => void;
  onDone: (id: number) => void;
}) {
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiTags = () => {
    setAiLoading(true);
    setTimeout(() => {
      const sample = ["música", "cultura", "presencial", "familia", "entretenimiento"];
      setTags(sample.join(", "));
      setAiLoading(false);
    }, 1000);
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const r = await fetch(`/api/events/${event.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tags: tagList }),
      });
      if (!r.ok) throw new Error("No se pudo aprobar el evento");
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

// ── RejectModal ───────────────────────────────────────────────────────────────

function RejectModal({
  event,
  token,
  onClose,
  onDone,
}: {
  event: MockEvent;
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
      const r = await fetch(`/api/events/${event.id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("No se pudo rechazar el evento");
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
          autoFocus
        />
        <div className="modal-acts">
          <button
            className="btn"
            onClick={handleReject}
            disabled={busy}
            style={{ flex: 1, background: "var(--err)", color: "#fff" }}
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

// ── BanModal ──────────────────────────────────────────────────────────────────

function BanModal({
  event,
  token,
  onClose,
  onDone,
}: {
  event: MockEvent;
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
          autoFocus
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

// ── TransferModal ─────────────────────────────────────────────────────────────

function TransferModal({
  event,
  token,
  onClose,
  onDone,
}: {
  event: MockEvent;
  token: string;
  onClose: () => void;
  onDone: (id: number) => void;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [busy, setBusy] = useState(false);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        u.email.toLowerCase().includes(lower) ||
        u.name.toLowerCase().includes(lower) ||
        (u.handle ?? "").toLowerCase().includes(lower),
    ).slice(0, 8);
  }, [q]);

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
      onDone(event.id);
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
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
            {results.map((u) => {
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
                    background: isSelected
                      ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                      : "var(--surface)",
                    cursor: "pointer",
                    textAlign: "left",
                    border: "none",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{u.name}</span>
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

// ── Main section ───────────────────────────────────────────────────────────────

export default function EventsSection() {
  const { token } = useUser();
  const [events, setEvents] = useState<MockEvent[]>(MOCK_EVENTS);
  const [search, setSearch] = useState("");
  const [statFilter, setStatFilter] = useState<"all" | Status>("all");
  const [catFilter, setCatFilter] = useState("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  // Modal state
  const [approveTarget, setApproveTarget] = useState<MockEvent | null>(null);
  const [rejectTarget, setRejectTarget] = useState<MockEvent | null>(null);
  const [banTarget, setBanTarget] = useState<MockEvent | null>(null);
  const [transferTarget, setTransferTarget] = useState<MockEvent | null>(null);

  const patch = (id: number, fields: Partial<MockEvent>) =>
    setEvents((list) => list.map((e) => (e.id === id ? { ...e, ...fields } : e)));

  const restore = async (e: MockEvent) => {
    if (!token) return;
    setBusyId(e.id);
    try {
      const r = await fetch(`/api/events/${e.id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("No se pudo restaurar el evento");
      patch(e.id, { status: "rev" });
      toast.success("Evento restaurado — vuelve a revisión");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo restaurar el evento");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    let res = events;
    if (statFilter !== "all") res = res.filter((e) => e.status === statFilter);
    if (catFilter !== "all") res = res.filter((e) => e.category === catFilter);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.organizador.toLowerCase().includes(q),
      );
    }
    return res;
  }, [events, statFilter, catFilter, search]);

  const counts = useMemo(() => ({
    all: events.length,
    rev: events.filter((e) => e.status === "rev").length,
    pub: events.filter((e) => e.status === "pub").length,
    rej: events.filter((e) => e.status === "rej").length,
    ban: events.filter((e) => e.status === "ban").length,
  }), [events]);

  return (
    <>
      {/* Filters */}
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
        <select
          className="sel"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {MOCK_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {filtered.length === 0 ? (
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
                const isBusy = busyId === e.id;
                return (
                  <tr key={e.id}>
                    {/* Thumbnail + título + categoría */}
                    <td>
                      <div className="cell-evt">
                        <div
                          className="thumb"
                          style={{ width: 48, height: 48, flexShrink: 0 }}
                        >
                          {e.thumbnail ? (
                            <img
                              src={e.thumbnail}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : null}
                        </div>
                        <div>
                          <div className="ti">{e.title}</div>
                          <div className="mt">{e.category}</div>
                        </div>
                      </div>
                    </td>

                    {/* Organizador + email */}
                    <td>
                      <div className="cell-prod">
                        <div className="nm">{e.organizador}</div>
                        <div className="em">{e.email}</div>
                      </div>
                    </td>

                    {/* Fecha */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{fmtDate(e.fecha)}</div>
                      </div>
                    </td>

                    {/* Precio mínimo */}
                    <td>
                      <div className="cell-price">
                        {e.precioMin === 0 ? (
                          <span className="free">Liberado</span>
                        ) : (
                          `$${e.precioMin.toLocaleString("es-CL")}`
                        )}
                      </div>
                    </td>

                    {/* Estado chip */}
                    <td>
                      <div className={`stat ${e.status}`}>
                        <span className="dot" />
                        {STAT_LABEL[e.status]}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td>
                      <div className="row-acts">
                        {/* En revisión */}
                        {e.status === "rev" && (
                          <>
                            <button
                              className="ok"
                              onClick={() => setApproveTarget(e)}
                              disabled={isBusy}
                            >
                              Aprobar
                            </button>
                            <button
                              className="bad"
                              onClick={() => setRejectTarget(e)}
                              disabled={isBusy}
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {/* Publicado */}
                        {e.status === "pub" && (
                          <>
                            <Link
                              className="btn ghost sm"
                              href={`/evento/${e.slug}`}
                              target="_blank"
                            >
                              Ver
                            </Link>
                            <button
                              className="bad"
                              onClick={() => setBanTarget(e)}
                              disabled={isBusy}
                            >
                              Banear
                            </button>
                          </>
                        )}
                        {/* Rechazado */}
                        {e.status === "rej" && (
                          <button onClick={() => restore(e)} disabled={isBusy}>
                            Re-revisar
                          </button>
                        )}
                        {/* Baneado */}
                        {e.status === "ban" && (
                          <button className="ok" onClick={() => restore(e)} disabled={isBusy}>
                            Restaurar
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
          onDone={(id) => patch(id, { status: "pub" })}
        />
      )}
      {rejectTarget && token && (
        <RejectModal
          event={rejectTarget}
          token={token}
          onClose={() => setRejectTarget(null)}
          onDone={(id) => patch(id, { status: "rej" })}
        />
      )}
      {banTarget && token && (
        <BanModal
          event={banTarget}
          token={token}
          onClose={() => setBanTarget(null)}
          onDone={(id) => patch(id, { status: "ban" })}
        />
      )}
      {transferTarget && token && (
        <TransferModal
          event={transferTarget}
          token={token}
          onClose={() => setTransferTarget(null)}
          onDone={() => {/* owner display not tracked in mock */}}
        />
      )}
    </>
  );
}
