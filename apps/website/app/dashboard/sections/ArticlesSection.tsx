"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

// ── Types ─────────────────────────────────────────────────────────────────────

type ApiStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PENDING_MODERATION"
  | "APPROVED"
  | "REJECTED"
  | "BANNED";

type DisplayStatus = "Borrador" | "En revisión" | "Publicado" | "Rechazado" | "Baneado";

type ApiArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  status: ApiStatus;
  statusReason: string | null;
  userId: number | null;
  createdAt: string;
  tags: { id: number; name: string; slug: string }[];
  _count: { likes: number };
  isSponsored: boolean;
};

type ModalState =
  | { type: "approve"; item: ApiArticle }
  | { type: "reject";  item: ApiArticle }
  | { type: "ban";     item: ApiArticle }
  | { type: "delete";  item: ApiArticle }
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

function fmtDate(d: string) {
  const dt = new Date(d);
  return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

function imageSrc(image: string | null) {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  return `/api/media${image}`;
}

// ── Pagination helpers ────────────────────────────────────────────────────────

function pageWindows(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [];
  const addPage = (p: number) => { if (!pages.includes(p)) pages.push(p); };
  addPage(1);
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) addPage(p);
  if (current < total - 2) pages.push("…");
  addPage(total);
  return pages;
}

// ── Chevron icons ─────────────────────────────────────────────────────────────

const ChevL = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

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

export default function ArticlesSection() {
  const { token } = useUser();

  // Pagination & filter state
  const [page,         setPage]        = useState(1);
  const [perPage,      setPerPage]     = useState(12);
  const [total,        setTotal]       = useState(0);
  const [totalPages,   setTotalPages]  = useState(1);
  const [activeFilter, setActiveFilter] = useState("Todos");

  // Data state
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Modal state
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchArticles = useCallback(async (p: number, ps: number, filter: string, signal?: AbortSignal) => {
    if (!token) return;
    setLoading(true);
    try {
      const statusParam = STATUS_API[filter];
      const params = new URLSearchParams({
        page:     String(p),
        pageSize: String(ps),
        ...(statusParam ? { status: statusParam } : {}),
      });
      const r = await fetch(`/api/articles?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (!r.ok) throw new Error("Error al cargar artículos");
      const data = await r.json();
      setArticles(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (ex) {
      if (ex instanceof Error && ex.name === "AbortError") return; // petición cancelada — ignorar
      toast.error(ex instanceof Error ? ex.message : "Error al cargar artículos");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // AbortController cancela la petición anterior cuando cambian las dependencias
  useEffect(() => {
    const controller = new AbortController();
    fetchArticles(page, perPage, activeFilter, controller.signal);
    return () => controller.abort();
  }, [fetchArticles, page, perPage, activeFilter]);

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

  async function doApprove(item: ApiArticle) {
    try {
      const r = await fetch(`/api/articles/${item.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al aprobar");
      toast.success("Artículo aprobado y publicado");
      fetchArticles(page, perPage, activeFilter);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al aprobar");
    }
  }

  async function doReject(item: ApiArticle, reason: string) {
    try {
      const r = await fetch(`/api/articles/${item.id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!r.ok) throw new Error("Error al rechazar");
      toast.success("Artículo rechazado");
      fetchArticles(page, perPage, activeFilter);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al rechazar");
    }
  }

  async function doBan(item: ApiArticle, reason: string) {
    try {
      const r = await fetch(`/api/articles/${item.id}/ban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!r.ok) throw new Error("Error al banear");
      toast.success("Artículo baneado");
      fetchArticles(page, perPage, activeFilter);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al banear");
    }
  }

  async function doDelete(item: ApiArticle) {
    try {
      const r = await fetch(`/api/articles/${item.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al eliminar");
      toast.success("Artículo eliminado");
      fetchArticles(page, perPage, activeFilter);
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
          href="/dashboard/articles/new"
          className="btn primary"
          style={{ marginLeft: "auto", padding: "9px 16px", fontSize: 13 }}
        >
          ＋ Crear artículo
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          Cargando artículos…
        </div>
      ) : articles.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          No hay artículos{activeFilter !== "Todos" ? ` con estado "${activeFilter}"` : ""}.
        </div>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <table className="a-table">
            <thead>
              <tr>
                <th>ARTÍCULO</th>
                <th>AUTOR</th>
                <th>CREADO</th>
                <th>ESTADO</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => {
                const status = toDisplay(a.status);
                const img    = imageSrc(a.image);

                return (
                  <tr key={a.id}>
                    {/* ARTÍCULO */}
                    <td>
                      <div className="cell-evt">
                        <div className="thumb-sm">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                          ) : (
                            <div className="pic" style={{ background: "linear-gradient(135deg, #a25cff, #5b39ff)" }} />
                          )}
                        </div>
                        <div>
                          <div className="ti">{a.title}</div>
                          <div className="su">{a.tags.slice(0, 3).map((t) => t.name).join(" · ") || "Sin tags"}</div>
                        </div>
                      </div>
                    </td>

                    {/* AUTOR */}
                    <td>
                      <div style={{ fontSize: 13 }}>
                        {a.userId === null
                          ? <span style={{ color: "var(--ink-3)" }}>Editorial</span>
                          : `Usuario #${a.userId}`}
                        <br />
                        <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                          {a.isSponsored ? "Patrocinado" : "Editorial"}
                        </span>
                      </div>
                    </td>

                    {/* CREADO */}
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(a.createdAt)}</td>

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
                            <Link href={`/dashboard/articles/${a.slug}/edit`}><button>Editar</button></Link>
                            <button className="ok"  onClick={() => setModal({ type: "approve", item: a })}>Publicar</button>
                            <button className="bad" onClick={() => setModal({ type: "delete",  item: a })}>Eliminar</button>
                          </>
                        )}
                        {status === "En revisión" && (
                          <>
                            <Link href={`/dashboard/articles/${a.slug}/edit`}><button>Editar</button></Link>
                            <button className="ok"  onClick={() => setModal({ type: "approve", item: a })}>✓ Aprobar</button>
                            <button className="bad" onClick={() => setModal({ type: "reject",  item: a })}>✕ Rechazar</button>
                          </>
                        )}
                        {status === "Publicado" && (
                          <>
                            <Link href={`/dashboard/articles/${a.slug}/edit`}><button>Editar</button></Link>
                            <button className="bad" onClick={() => setModal({ type: "ban",     item: a })}>Banear</button>
                          </>
                        )}
                        {status === "Rechazado" && (
                          <>
                            <Link href={`/dashboard/articles/${a.slug}/edit`}><button>Editar</button></Link>
                            <button                 onClick={() => setModal({ type: "approve", item: a })}>Re-revisar</button>
                            <button className="bad" onClick={() => setModal({ type: "delete",  item: a })}>Eliminar</button>
                          </>
                        )}
                        {status === "Baneado" && (
                          <>
                            <Link href={`/dashboard/articles/${a.slug}/edit`}><button>Editar</button></Link>
                            <button className="ok"  onClick={() => setModal({ type: "approve", item: a })}>Restaurar</button>
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

      {/* Pagination bar */}
      {!loading && total > 0 && (
        <div className="pag-bar">
          <div className="pag-info">
            <span>
              Mostrando{" "}
              <strong style={{ color: "var(--ink)" }}>{from}–{to}</strong>
              {" "}de{" "}
              <strong style={{ color: "var(--ink)" }}>{total}</strong>
              {" "}artículo{total !== 1 ? "s" : ""}
            </span>
            <span style={{ color: "var(--line)" }}>·</span>
            <span className="ips">
              <span>Mostrar</span>
              <select value={perPage} onChange={(e) => changePerPage(Number(e.target.value))}>
                {PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span>por página</span>
            </span>
          </div>
          <div className="pag-pages">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} title="Anterior">
              <ChevL />
            </button>
            {pageWindows(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`ell-${i}`} className="ell">…</span>
              ) : (
                <button key={p} className={page === p ? "on" : ""} onClick={() => setPage(p)}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} title="Siguiente">
              <ChevR />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal?.type === "approve" && (() => {
        const item = modal.item;
        return <AdminApproveModal kind="artículo" onClose={close} onApprove={() => { close(); doApprove(item); }} />;
      })()}
      {modal?.type === "reject" && (() => {
        const item = modal.item;
        return <AdminRejectModal kind="artículo" onClose={close} onReject={(reason) => { close(); doReject(item, reason); }} />;
      })()}
      {modal?.type === "ban" && (() => {
        const item = modal.item;
        return (
          <ConfirmDialog
            danger
            title="¿Banear artículo?"
            message="El artículo dejará de ser público inmediatamente. Puedes restaurarlo después si fue un error."
            typeToConfirm="BANEAR"
            confirmLabel="Sí, banear"
            onConfirm={() => { close(); doBan(item, "Baneado por administrador"); }}
            onClose={close}
          />
        );
      })()}
      {modal?.type === "delete" && (() => {
        const item = modal.item;
        return (
          <ConfirmDialog
            danger
            title="¿Eliminar artículo?"
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
