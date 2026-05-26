"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";

// ── Types ──────────────────────────────────────────────────────────────────

type HeroStatus = "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED" | "EXPIRED";

type Hero = {
  id: number;
  image?: string | null;
  eventoAsociado: string;
  organizador: string;
  inicio: string;
  fin: string;
  status: HeroStatus;
};

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_HEROES: Hero[] = [
  {
    id: 1,
    image: null,
    eventoAsociado: "Festival de Jazz Santiago",
    organizador: "Productora Sur",
    inicio: "2026-06-01",
    fin: "2026-06-14",
    status: "PENDING_MODERATION",
  },
  {
    id: 2,
    image: null,
    eventoAsociado: "Lollapalooza Chile 2026",
    organizador: "DG Medios",
    inicio: "2026-05-01",
    fin: "2026-05-31",
    status: "APPROVED",
  },
  {
    id: 3,
    image: null,
    eventoAsociado: "Expo Arte Contemporáneo",
    organizador: "Galería Central",
    inicio: "2026-04-01",
    fin: "2026-04-20",
    status: "BANNED",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function statusClass(s: HeroStatus): string {
  if (s === "APPROVED") return "pub";
  if (s === "REJECTED") return "rej";
  if (s === "BANNED") return "ban";
  if (s === "EXPIRED") return "arc";
  return "rev";
}

function statusLabel(s: HeroStatus): string {
  if (s === "APPROVED") return "Activo";
  if (s === "REJECTED") return "Rechazado";
  if (s === "BANNED") return "Baneado";
  if (s === "EXPIRED") return "Expirado";
  return "Pendiente";
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ── Mock users for transfer ────────────────────────────────────────────────

type UserResult = { id: number; email: string; name: string; handle?: string };
const MOCK_USERS: UserResult[] = [
  { id: 10, email: "ana@ejemplo.com", name: "Ana Torres", handle: "anatorres" },
  { id: 11, email: "pedro@ejemplo.com", name: "Pedro Muñoz", handle: "pedrom" },
  { id: 12, email: "carla@ejemplo.com", name: "Carla Soto" },
  { id: 13, email: "juan@konbini.cl", name: "Juan Pérez", handle: "juanp" },
];

// ── Modals ─────────────────────────────────────────────────────────────────

function RejectModal({
  heroId,
  token,
  onClose,
  onDone,
}: {
  heroId: number;
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
      const r = await fetch(`/api/heroes/admin/${heroId}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("No se pudo rechazar la portada");
      onDone(heroId);
      toast.success("Portada rechazada");
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al rechazar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card">
        <h3>Rechazar portada</h3>
        <p>Indica el motivo del rechazo. Se notificará al organizador.</p>
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
            {busy ? "Rechazando…" : "Rechazar portada"}
          </button>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function BanModal({
  heroId,
  token,
  onClose,
  onDone,
}: {
  heroId: number;
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
      const r = await fetch(`/api/heroes/admin/${heroId}/ban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("No se pudo banear la portada");
      onDone(heroId);
      toast.success("Portada baneada");
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al banear");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card">
        <h3>Banear portada</h3>
        <p>La portada quedará oculta del sitio. Indica el motivo.</p>
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
            {busy ? "Baneando…" : "Banear portada"}
          </button>
          <button className="btn ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function TransferModal({
  heroId,
  token,
  onClose,
  onDone,
}: {
  heroId: number;
  token: string;
  onClose: () => void;
  onDone: (id: number, user: UserResult) => void;
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
      const r = await fetch(`/api/heroes/admin/${heroId}/transfer`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: selected.id }),
      });
      if (!r.ok) throw new Error("No se pudo transferir la portada");
      onDone(heroId, selected);
      toast.success(`Portada transferida a ${selected.email}`);
      onClose();
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al transferir");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="confirm-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="confirm-card" style={{ maxWidth: 460 }}>
        <h3>Transferir portada</h3>
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
                    background: isSelected ? "color-mix(in oklab, var(--accent) 12%, transparent)" : "var(--surface)",
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

// ── Component ──────────────────────────────────────────────────────────────

export default function HeroesSection() {
  const { token } = useUser();
  const [heroes, setHeroes] = useState<Hero[]>(MOCK_HEROES);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Modal state
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [banTarget, setBanTarget] = useState<number | null>(null);
  const [transferTarget, setTransferTarget] = useState<number | null>(null);

  const activeCount = useMemo(
    () => heroes.filter((h) => h.status === "APPROVED").length,
    [heroes],
  );

  const patch = (id: number, fields: Partial<Hero>) =>
    setHeroes((list) => list.map((h) => (h.id === id ? { ...h, ...fields } : h)));

  const restore = async (id: number) => {
    if (!token) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/heroes/admin/${id}/restore`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("No se pudo restaurar la portada");
      patch(id, { status: "PENDING_MODERATION" });
      toast.success("Portada restaurada");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al restaurar");
    } finally {
      setBusyId(null);
    }
  };

  const approve = async (id: number) => {
    if (!token) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/heroes/admin/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("No se pudo aprobar la portada");
      patch(id, { status: "APPROVED" });
      toast.success("Portada aprobada");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al aprobar");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {/* Modals */}
      {rejectTarget !== null && token && (
        <RejectModal
          heroId={rejectTarget}
          token={token}
          onClose={() => setRejectTarget(null)}
          onDone={(id) => patch(id, { status: "REJECTED" })}
        />
      )}
      {banTarget !== null && token && (
        <BanModal
          heroId={banTarget}
          token={token}
          onClose={() => setBanTarget(null)}
          onDone={(id) => patch(id, { status: "BANNED" })}
        />
      )}
      {transferTarget !== null && token && (
        <TransferModal
          heroId={transferTarget}
          token={token}
          onClose={() => setTransferTarget(null)}
          onDone={() => {/* owner display not tracked in mock */}}
        />
      )}

      {/* Panel header with occupancy */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="ph">
          <h3>Portadas</h3>
          <div className="right-act">
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 700,
                padding: "5px 14px",
                borderRadius: 999,
                background: "color-mix(in oklab, var(--accent) 12%, transparent)",
                color: "var(--accent)",
                letterSpacing: ".04em",
              }}
            >
              {activeCount} / 5 portadas activas
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="evt">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Evento asociado</th>
                <th>Organizador</th>
                <th>Fechas activación</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {heroes.map((h) => {
                const isBusy = busyId === h.id;
                return (
                  <tr key={h.id}>
                    {/* Imagen banner 96x54 */}
                    <td>
                      <div
                        style={{
                          width: 96,
                          height: 54,
                          borderRadius: 6,
                          overflow: "hidden",
                          border: "1px solid var(--line)",
                          background: "var(--surface-2)",
                          flexShrink: 0,
                        }}
                      >
                        {h.image ? (
                          <img
                            src={h.image}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : null}
                      </div>
                    </td>

                    {/* Evento asociado */}
                    <td>
                      <div className="ti">{h.eventoAsociado}</div>
                    </td>

                    {/* Organizador */}
                    <td>
                      <div className="ti">{h.organizador}</div>
                    </td>

                    {/* Fechas activación */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{fmtDate(h.inicio)} – {fmtDate(h.fin)}</div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td>
                      <div className={`stat ${statusClass(h.status)}`}>
                        <span className="dot" />
                        {statusLabel(h.status)}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td>
                      <div className="row-acts">
                        {h.status === "PENDING_MODERATION" && (
                          <>
                            <button
                              className="ok"
                              disabled={isBusy}
                              onClick={() => approve(h.id)}
                            >
                              Aprobar
                            </button>
                            <button
                              className="bad"
                              disabled={isBusy}
                              onClick={() => setRejectTarget(h.id)}
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                        {h.status === "APPROVED" && (
                          <button
                            className="bad"
                            disabled={isBusy}
                            onClick={() => setBanTarget(h.id)}
                          >
                            Banear
                          </button>
                        )}
                        {(h.status === "REJECTED" || h.status === "BANNED") && (
                          <button
                            className="ok"
                            disabled={isBusy}
                            onClick={() => restore(h.id)}
                          >
                            Restaurar
                          </button>
                        )}
                        {/* Siempre: Transferir */}
                        <button
                          disabled={isBusy}
                          onClick={() => setTransferTarget(h.id)}
                        >
                          Transferir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
