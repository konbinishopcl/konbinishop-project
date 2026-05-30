"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { TablePagination, pageWindows } from "@/components/TablePagination";

// ── Types ─────────────────────────────────────────────────────────────────────

type ApiStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PENDING_MODERATION"
  | "APPROVED"
  | "REJECTED"
  | "BANNED";

type DisplayStatus = "Borrador" | "En revisión" | "Publicado" | "Rechazado" | "Baneado";

type ApiEvent = {
  id: number;
  title: string;
  slug: string;
  status: ApiStatus;
  poster: string | null;
  banner: string | null;
  category: { name: string; slug: string } | null;
  prices: { id: number; name: string; price: number }[];
  dates: { id: number; date: string | null }[];
  owner: {
    id: number;
    firstname: string | null;
    lastname: string | null;
    email: string;
    handle: string | null;
    profile: { displayName: string | null } | null;
  } | null;
};

type ModalState =
  | { type: "approve"; item: ApiEvent }
  | { type: "reject";   item: ApiEvent }
  | { type: "transfer"; item: ApiEvent }
  | { type: "ban";      item: ApiEvent }
  | { type: "delete";   item: ApiEvent }
  | null;

// status → API param map ("Todos" = undefined)
const STATUS_API: Record<string, string | undefined> = {
  "Todos":       undefined,
  "Borrador":    "DRAFT",
  "En revisión": "PENDING_MODERATION",
  "Publicado":   "APPROVED",
  "Rechazado":   "REJECTED",
  "Baneado":     "BANNED",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

function toDisplay(s: ApiStatus): DisplayStatus {
  if (s === "DRAFT")              return "Borrador";
  if (s === "PENDING_MODERATION") return "En revisión";
  if (s === "APPROVED")           return "Publicado";
  if (s === "REJECTED")           return "Rechazado";
  return "Baneado";
}

function statusCls(s: DisplayStatus) {
  if (s === "Borrador")    return "dft";
  if (s === "En revisión") return "rev";
  if (s === "Publicado")   return "pub";
  return "rej";
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

function fmtPrice(p: number) {
  return "$" + p.toLocaleString("es-CL");
}

function ownerName(o: ApiEvent["owner"]) {
  if (!o) return "—";
  return (
    o.profile?.displayName ??
    ([o.firstname, o.lastname].filter(Boolean).join(" ") || o.email)
  );
}

function ownerHandle(o: ApiEvent["owner"]) {
  if (!o) return "";
  return o.handle ? `@${o.handle}` : o.email;
}

function posterSrc(poster: string | null) {
  if (!poster) return null;
  if (poster.startsWith("http")) return poster;
  return `/api/media${poster}`;
}


// ── Modal components ──────────────────────────────────────────────────────────

function AdminApproveModal({ kind, onClose, onApprove }: {
  kind: string; onClose: () => void; onApprove: (tags: string) => void;
}) {
  const [tags, setTags] = useState("anime, cosplay, santiago, evento");
  const [aiBusy, setAiBusy] = useState(false);
  const regenAI = () => {
    setAiBusy(true);
    setTimeout(() => {
      setTags("anime, japón, otaku, santiago, evento, " + (Math.random() > 0.5 ? "convención" : "concierto"));
      setAiBusy(false);
    }, 700);
  };
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3 className="h">Aprobar {kind}</h3>
        <p className="p">Al aprobar, el contenido pasa a ser público en Konbini. La IA sugirió los siguientes tags — puedes editarlos antes de confirmar.</p>
        <div className="field" style={{ margin: 0 }}>
          <label>Tags (separados por coma)</label>
          <div style={{ position: "relative" }}>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} style={{ paddingRight: 44 }} />
            <button
              className="icon-btn"
              onClick={regenAI}
              title="Regenerar con IA"
              style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
            >
              <span style={{ animation: aiBusy ? "spin 1s linear infinite" : "none" }}>✦</span>
            </button>
          </div>
          <div className="help">Los tags ayudan a categorizar el contenido. Se generan automáticamente con IA.</div>
        </div>
        <div className="row-act" style={{ marginTop: 22 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" style={{ background: "var(--ok)" }} onClick={() => { onApprove(tags); onClose(); }}>
            ✓ Aprobar y publicar
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminRejectModal({ kind, onClose, onReject }: {
  kind: string; onClose: () => void; onReject: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const presets = [
    "Imagen no cumple con las dimensiones mínimas",
    "Contenido duplicado o spam",
    "Información incompleta o engañosa",
    "Categoría incorrecta",
    "Otro motivo",
  ];
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="danger-ic">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <h3 className="h">Rechazar {kind}</h3>
        <p className="p">El organizador recibirá un mensaje con el motivo. Sé claro para que pueda corregir y reenviar.</p>
        <div className="field" style={{ margin: 0 }}>
          <label>Motivo común</label>
          <select onChange={(e) => setReason(e.target.value)} value={reason}>
            <option value="">Selecciona un motivo o escribe abajo</option>
            {presets.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Mensaje al organizador</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explica al organizador por qué se rechaza..." style={{ minHeight: 100 }} />
        </div>
        <div className="row-act" style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn primary" style={{ background: "var(--err)" }} onClick={() => { onReject(reason); onClose(); }} disabled={!reason.trim()}>
            ✕ Rechazar y notificar
          </button>
        </div>
      </div>
    </div>
  );
}

type ApiUser = {
  id: number; email: string; firstname: string | null; lastname: string | null;
  handle: string | null; type: string;
};

function AdminTransferModal({ item, token, onClose, onDone }: {
  item: ApiEvent; token: string; onClose: () => void; onDone: () => void;
}) {
  const [q,       setQ]      = useState("");
  const [users,   setUsers]  = useState<ApiUser[]>([]);
  const [picked,  setPicked] = useState<ApiUser | null>(null);
  const [busy,    setBusy]   = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [token]);

  const matches = users.filter((u) => {
    if (!q) return true;
    const nm = [u.firstname, u.lastname].filter(Boolean).join(" ").toLowerCase();
    return nm.includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()) || (u.handle ?? "").toLowerCase().includes(q.toLowerCase());
  });

  function initials(u: ApiUser) {
    return ([u.firstname?.[0], u.lastname?.[0]].filter(Boolean).join("") || u.email[0]).toUpperCase();
  }
  function displayName(u: ApiUser) {
    return [u.firstname, u.lastname].filter(Boolean).join(" ") || u.email;
  }

  const PALETTES = ["#a25cff,#5b39ff","#ff5b8a,#ff2a59","#3bbf8a,#1e8a5b","#3b9eff,#2a5bff","#ff9900,#e65c00"];

  async function doTransfer() {
    if (!picked) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/transfers", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType:   "EVENT",
          itemId:     item.id,
          fromUserId: item.owner?.id,
          toOrgId:    picked.id,
          reason:     "Transferencia administrativa",
        }),
      });
      if (!r.ok) throw new Error("Error al transferir");
      toast.success(`Evento transferido a ${displayName(picked)}`);
      onClose();
      onDone();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al transferir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h3 className="h">Transferir a otra cuenta</h3>
        <p className="p">Busca al destinatario por nombre, handle o email. La transferencia se aplica inmediatamente.</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input autoFocus placeholder="Buscar por nombre, handle o email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ background: "none", border: "none", outline: "none", flex: 1, fontSize: 13, color: "var(--ink)" }} />
        </div>
        <div style={{ maxHeight: 280, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10, padding: 4 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>Cargando usuarios…</div>
          ) : matches.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>Sin resultados</div>
          ) : matches.map((u, i) => {
            const [c1, c2] = PALETTES[i % PALETTES.length].split(",");
            return (
              <div key={u.id} onClick={() => setPicked(u)} style={{ display: "flex", gap: 12, alignItems: "center", padding: 10, borderRadius: 8, cursor: "pointer", background: picked?.id === u.id ? "var(--surface-2)" : "transparent" }}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: `linear-gradient(135deg, ${c1}, ${c2})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {initials(u)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{displayName(u)}</div>
                  <div style={{ color: "var(--ink-3)", fontSize: 11, fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.handle ? `@${u.handle}` : u.email}
                  </div>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".1em", color: "var(--ink-3)", padding: "3px 7px", borderRadius: 4, background: "var(--surface-2)", flexShrink: 0 }}>
                  {u.type === "ORGANIZATION" ? "ORG" : "USR"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="row-act" style={{ marginTop: 18 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button className="btn dark" onClick={doTransfer} disabled={!picked || busy}>
            {busy ? "Transfiriendo…" : `Transferir a ${picked ? displayName(picked) : "..."}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title, message, danger = false, confirmLabel = "Confirmar",
  cancelLabel = "Cancelar", typeToConfirm, onConfirm, onClose,
}: {
  title: string; message: string; danger?: boolean;
  confirmLabel?: string; cancelLabel?: string; typeToConfirm?: string;
  onConfirm: () => void; onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const ok = !typeToConfirm || typed.trim().toUpperCase() === typeToConfirm.toUpperCase();
  return (
    <div className="confirm-bg" onClick={onClose}>
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        {danger && (
          <div className="danger-ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </div>
        )}
        <h3 className="h">{title}</h3>
        <p className="p">{message}</p>
        {typeToConfirm && (
          <>
            <p className="p" style={{ marginBottom: 8, fontSize: 12, color: "var(--ink-3)" }}>
              Para confirmar, escribe <strong style={{ color: "var(--err)" }}>{typeToConfirm}</strong> abajo:
            </p>
            <input className="danger-input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          </>
        )}
        <div className="row-act">
          <button className="btn ghost" onClick={onClose}>{cancelLabel}</button>
          <button
            className={`btn ${danger ? "primary" : "dark"}`}
            style={danger ? { background: "var(--err)", color: "#fff" } : undefined}
            onClick={ok ? onConfirm : undefined}
            disabled={!ok}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

const FILTER_STATUSES = ["Todos", "Borrador", "En revisión", "Publicado", "Rechazado", "Baneado"];
const PER_PAGE_OPTIONS = [12, 24, 48];

export default function EventsSection() {
  const { token } = useUser();

  // Pagination & filter state
  const [page,         setPage]        = useState(1);
  const [perPage,      setPerPage]     = useState(12);
  const [total,        setTotal]       = useState(0);
  const [totalPages,   setTotalPages]  = useState(1);
  const [activeFilter, setActiveFilter] = useState("Todos");

  // Data state
  const [events,  setEvents]  = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async (p: number, ps: number, filter: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const statusParam = STATUS_API[filter];
      const params = new URLSearchParams({
        page:     String(p),
        pageSize: String(ps),
        ...(statusParam ? { status: statusParam } : {}),
      });
      const r = await fetch(`/api/events?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al cargar eventos");
      const data = await r.json();
      setEvents(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents(page, perPage, activeFilter);
  }, [fetchEvents, page, perPage, activeFilter]);

  // ── Filter & pagination handlers ─────────────────────────────────────────

  function changeFilter(f: string) {
    setActiveFilter(f);
    setPage(1);
  }

  function changePerPage(ps: number) {
    setPerPage(ps);
    setPage(1);
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  async function doApprove(item: ApiEvent) {
    try {
      const r = await fetch(`/api/events/${item.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al aprobar");
      toast.success("Evento aprobado y publicado");
      fetchEvents(page, perPage, activeFilter);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al aprobar");
    }
  }

  async function doReject(item: ApiEvent, reason: string) {
    try {
      const r = await fetch(`/api/events/${item.id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!r.ok) throw new Error("Error al rechazar");
      toast.success("Evento rechazado");
      fetchEvents(page, perPage, activeFilter);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al rechazar");
    }
  }

  async function doBan(item: ApiEvent) {
    try {
      const r = await fetch(`/api/events/${item.id}/ban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Baneado por administrador" }),
      });
      if (!r.ok) throw new Error("Error al banear");
      toast.success("Evento baneado");
      fetchEvents(page, perPage, activeFilter);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al banear");
    }
  }

  async function doDelete(item: ApiEvent) {
    try {
      const r = await fetch(`/api/events/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al eliminar");
      toast.success("Evento eliminado");
      fetchEvents(page, perPage, activeFilter);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al eliminar");
    }
  }

  // ── Computed ─────────────────────────────────────────────────────────────

  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Filter chips + create button */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {FILTER_STATUSES.map((s) => (
          <button key={s} className={`sel${activeFilter === s ? " on" : ""}`} onClick={() => changeFilter(s)}>
            {s}
          </button>
        ))}
        <Link
          href="/dashboard/events/new"
          className="btn primary"
          style={{ marginLeft: "auto", padding: "9px 16px", fontSize: 13 }}
        >
          ＋ Crear evento
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          Cargando eventos…
        </div>
      ) : events.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          No hay eventos{activeFilter !== "Todos" ? ` con estado "${activeFilter}"` : ""}.
        </div>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <table className="a-table">
            <thead>
              <tr>
                <th>EVENTO</th>
                <th>ORGANIZADOR</th>
                <th>FECHA</th>
                <th>PRECIO</th>
                <th>ESTADO</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const status  = toDisplay(e.status);
                const date    = fmtDate(e.dates[0]?.date);
                const price   = e.prices[0]?.price != null ? fmtPrice(e.prices[0].price) : "Gratis";
                const imgSrc  = posterSrc(e.poster);

                return (
                  <tr key={e.id}>
                    {/* EVENTO */}
                    <td>
                      <div className="cell-evt">
                        <div className="thumb-sm">
                          {imgSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                          ) : (
                            <div className="pic" style={{ background: "linear-gradient(135deg, #a25cff, #5b39ff)" }} />
                          )}
                        </div>
                        <div>
                          <div className="ti">{e.title}</div>
                          <div className="su">{e.category?.name ?? "—"}</div>
                        </div>
                      </div>
                    </td>

                    {/* ORGANIZADOR */}
                    <td>
                      <div style={{ fontSize: 13 }}>
                        {ownerName(e.owner)}
                        <br />
                        <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                          {ownerHandle(e.owner)}
                        </span>
                      </div>
                    </td>

                    {/* FECHA */}
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{date}</td>

                    {/* PRECIO */}
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>{price}</td>

                    {/* ESTADO */}
                    <td>
                      <span className={`stat-pill ${statusCls(status)}`}>
                        <span className="dot" />{status}
                      </span>
                    </td>

                    {/* ACCIONES */}
                    <td>
                      <div className="row-act">
                        {status === "Borrador" && (
                          <>
                            <Link href={`/dashboard/events/${e.id}/edit`}><button>Editar</button></Link>
                            <button className="ok"  onClick={() => setModal({ type: "approve", item: e })}>Publicar</button>
                            <button className="bad" onClick={() => setModal({ type: "delete",  item: e })}>Eliminar</button>
                          </>
                        )}
                        {status === "En revisión" && (
                          <>
                            <Link href={`/dashboard/events/${e.id}/edit`}><button>Editar</button></Link>
                            <button className="ok"  onClick={() => setModal({ type: "approve", item: e })}>✓ Aprobar</button>
                            <button className="bad" onClick={() => setModal({ type: "reject",  item: e })}>✕ Rechazar</button>
                          </>
                        )}
                        {status === "Publicado" && (
                          <>
                            <Link href={`/dashboard/events/${e.id}/edit`}><button>Editar</button></Link>
                            <button className="bad" onClick={() => setModal({ type: "ban",      item: e })}>Banear</button>
                            <button                 onClick={() => setModal({ type: "transfer", item: e })}>Transferir</button>
                          </>
                        )}
                        {status === "Rechazado" && (
                          <>
                            <Link href={`/dashboard/events/${e.id}/edit`}><button>Editar</button></Link>
                            <button                 onClick={() => setModal({ type: "approve",  item: e })}>Re-revisar</button>
                            <button className="bad" onClick={() => setModal({ type: "delete",   item: e })}>Eliminar</button>
                          </>
                        )}
                        {status === "Baneado" && (
                          <>
                            <Link href={`/dashboard/events/${e.id}/edit`}><button>Editar</button></Link>
                            <button className="ok"  onClick={() => setModal({ type: "approve",  item: e })}>Restaurar</button>
                            <button                 onClick={() => setModal({ type: "transfer", item: e })}>Transferir</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (
        <TablePagination
          page={page} totalPages={totalPages} total={total} from={from} to={to}
          perPage={perPage} perPageOptions={PER_PAGE_OPTIONS} noun="evento"
          onPageChange={setPage} onPerPageChange={changePerPage}
        />
      )}

      {/* Modals */}
      {modal?.type === "approve" && (() => {
        const item = modal.item;
        return <AdminApproveModal kind="evento" onClose={close} onApprove={() => { close(); doApprove(item); }} />;
      })()}
      {modal?.type === "reject" && (() => {
        const item = modal.item;
        return <AdminRejectModal kind="evento" onClose={close} onReject={(reason) => { close(); doReject(item, reason); }} />;
      })()}
      {modal?.type === "transfer" && (() => {
        const item = modal.item;
        return (
          <AdminTransferModal
            item={item}
            token={token ?? ""}
            onClose={close}
            onDone={() => fetchEvents(page, perPage, activeFilter)}
          />
        );
      })()}
      {modal?.type === "ban" && (() => {
        const item = modal.item;
        return (
          <ConfirmDialog
            danger
            title="¿Banear evento?"
            message="El evento dejará de ser público inmediatamente. El organizador será notificado. Puedes restaurarlo después si fue un error."
            typeToConfirm="BANEAR"
            confirmLabel="Sí, banear"
            onConfirm={() => { close(); doBan(item); }}
            onClose={close}
          />
        );
      })()}
      {modal?.type === "delete" && (() => {
        const item = modal.item;
        return (
          <ConfirmDialog
            danger
            title="¿Eliminar evento?"
            message={`"${item.title}" se eliminará permanentemente. Esta acción no se puede deshacer.`}
            typeToConfirm="ELIMINAR"
            confirmLabel="Sí, eliminar"
            onConfirm={() => { close(); doDelete(item); }}
            onClose={close}
          />
        );
      })()}
    </>
  );
}
