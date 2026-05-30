"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, imageUrl, type ApiSpot, type ApiQuota } from "@/lib/api";
import { TablePagination, useClientPagination } from "@/components/TablePagination";

// ── Status maps ───────────────────────────────────────────────────────────────

const STATUS_API: Record<string, string | undefined> = {
  "Todos":       undefined,
  "En revisión": "PENDING_MODERATION",
  "Publicado":   "APPROVED",
  "Rechazado":   "REJECTED",
  "Baneado":     "BANNED",
};

const FILTER_STATUSES = ["Todos", "En revisión", "Publicado", "Rechazado", "Baneado"];

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

function fmtDate(d: string) {
  const dt = new Date(d);
  return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

type DisplayStatus = "Borrador" | "En revisión" | "Publicado" | "Rechazado" | "Baneado";

function toDisplay(s: ApiSpot["status"]): DisplayStatus {
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

// ── Modal types ───────────────────────────────────────────────────────────────

type ModalState =
  | { type: "reject"; item: ApiSpot }
  | { type: "ban";    item: ApiSpot }
  | null;

// ── Shared modals ─────────────────────────────────────────────────────────────

function AdminRejectModal({ kind, onClose, onReject }: { kind: string; onClose: () => void; onReject: (reason: string) => void }) {
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
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explica al organizador por qué se rechaza..."
            style={{ minHeight: 100 }}
          />
        </div>
        <div className="row-act" style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn primary"
            style={{ background: "var(--err)" }}
            onClick={() => { onReject(reason); onClose(); }}
            disabled={!reason.trim()}
          >
            ✕ Rechazar y notificar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function SpotsSection() {
  const { token } = useUser();

  const [activeFilter, setActiveFilter] = useState("Todos");
  const [spots, setSpots]               = useState<ApiSpot[]>([]);
  const [loading, setLoading]           = useState(true);
  const [quota, setQuota]               = useState<ApiQuota | null>(null);
  const [modal, setModal]               = useState<ModalState>(null);
  const close = () => setModal(null);

  const { page, goPage, perPage, changePerPage, total, totalPages, from, to, paginated: paginatedSpots } = useClientPagination(spots);

  // ── Fetch spots ───────────────────────────────────────────────────────────

  const fetchSpots = useCallback(async (filter: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const statusParam = STATUS_API[filter];
      const data = await api.adminSpots(token, statusParam ? { status: statusParam, pageSize: 100 } : { pageSize: 100 });
      setSpots(data.items ?? []);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al cargar avisos");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let stale = false;
    if (!stale) fetchSpots(activeFilter);
    return () => { stale = true; };
  }, [fetchSpots, activeFilter]);

  // ── Fetch quota on mount ──────────────────────────────────────────────────

  useEffect(() => {
    api.spotsQuota().then(setQuota).catch(() => {});
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function doApprove(item: ApiSpot) {
    try {
      await api.approveSpot(item.id, token!);
      toast.success("Aviso aprobado");
      fetchSpots(activeFilter);
      api.spotsQuota().then(setQuota).catch(() => {});
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al aprobar");
    }
  }

  async function doReject(item: ApiSpot, reason: string) {
    try {
      await api.rejectSpot(item.id, reason, token!);
      toast.success("Aviso rechazado");
      fetchSpots(activeFilter);
      api.spotsQuota().then(setQuota).catch(() => {});
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al rechazar");
    }
  }

  async function doBan(item: ApiSpot, reason: string) {
    try {
      await api.banSpot(item.id, reason, token!);
      toast.success("Aviso baneado");
      fetchSpots(activeFilter);
      api.spotsQuota().then(setQuota).catch(() => {});
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al banear");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Filter chips + occupancy badge */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        {FILTER_STATUSES.map((s) => (
          <button key={s} className={`sel${activeFilter === s ? " on" : ""}`} onClick={() => setActiveFilter(s)}>
            {s}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "9px 14px", borderRadius: 999, background: "color-mix(in oklab, var(--accent) 12%, transparent)", color: "var(--accent)", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)", letterSpacing: ".08em" }}>
          OCUPACIÓN · {quota ? `${quota.active} / ${quota.max}` : "…"}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          Cargando avisos…
        </div>
      ) : spots.length === 0 ? (
        <div className="panel" style={{ padding: 32, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          No hay avisos{activeFilter !== "Todos" ? ` con estado "${activeFilter}"` : ""}.
        </div>
      ) : (
        <div className="panel" style={{ padding: 0 }}>
          <table className="a-table">
            <thead>
              <tr>
                <th>AVISO</th>
                <th>ORGANIZADOR</th>
                <th>CREADO</th>
                <th>PRECIO</th>
                <th>ESTADO</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedSpots.map((spot) => {
                const status = toDisplay(spot.status);
                const img    = imageUrl(spot.image);
                const ownerName = spot.owner
                  ? `${spot.owner.firstname ?? ""} ${spot.owner.lastname ?? ""}`.trim() || spot.owner.email
                  : `Usuario #${spot.userId}`;
                const ownerHandle = spot.owner?.handle;

                return (
                  <tr key={spot.id}>
                    {/* AVISO: thumb + title + linkValue */}
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
                          <div className="ti">{spot.title}</div>
                          <div className="su">{spot.linkValue}</div>
                        </div>
                      </div>
                    </td>

                    {/* ORGANIZADOR */}
                    <td>
                      <div style={{ fontSize: 13 }}>
                        {ownerName}
                        {ownerHandle && (
                          <>
                            <br />
                            <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>@{ownerHandle}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* CREADO */}
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtDate(spot.createdAt)}</td>

                    {/* PRECIO */}
                    <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                      {spot.amount != null ? `$${spot.amount.toLocaleString("es-CL")}` : "—"}
                    </td>

                    {/* ESTADO */}
                    <td>
                      <span className={`stat-pill ${statusCls(status)}`}>
                        <span className="dot" />{status}
                      </span>
                    </td>

                    {/* ACCIONES */}
                    <td>
                      <div className="row-act">
                        {status === "En revisión" && (
                          <>
                            <button className="ok" onClick={() => doApprove(spot)}>✓ Aprobar</button>
                            <button className="bad" onClick={() => setModal({ type: "reject", item: spot })}>✕ Rechazar</button>
                          </>
                        )}
                        {status === "Publicado" && (
                          <button className="bad" onClick={() => setModal({ type: "ban", item: spot })}>Banear</button>
                        )}
                        {status === "Rechazado" && (
                          <>
                            <button onClick={() => doApprove(spot)}>Re-revisar</button>
                            <button className="bad" onClick={() => setModal({ type: "ban", item: spot })}>Banear</button>
                          </>
                        )}
                        {status === "Baneado" && (
                          <button className="ok" onClick={() => doApprove(spot)}>Restaurar</button>
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
          perPage={perPage} noun="aviso"
          onPageChange={goPage} onPerPageChange={changePerPage}
        />
      )}

      {/* Modals */}
      {modal?.type === "reject" && (() => {
        const item = modal.item;
        return (
          <AdminRejectModal kind="aviso" onClose={close} onReject={(reason) => { close(); doReject(item, reason); }} />
        );
      })()}
      {modal?.type === "ban" && (() => {
        const item = modal.item;
        return (
          <AdminRejectModal kind="aviso (ban)" onClose={close} onReject={(reason) => { close(); doBan(item, reason); }} />
        );
      })()}
    </>
  );
}
