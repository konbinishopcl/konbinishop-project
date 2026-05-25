"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { imageUrl } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

type SpotStatus = "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED" | "EXPIRED" | string;

type Spot = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  link?: string | null;
  status: SpotStatus;
  expirationDate?: string | null;
  createdAt?: string | null;
  statusReason?: string | null;
  owner?: { name?: string | null; email?: string | null } | null;
};

type FilterChip = "all" | "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED" | "EXPIRED";

const CHIPS: { key: FilterChip; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "PENDING_MODERATION", label: "Pendiente" },
  { key: "APPROVED", label: "Activo" },
  { key: "REJECTED", label: "Rechazado" },
  { key: "BANNED", label: "Baneado" },
  { key: "EXPIRED", label: "Expirado" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function statusClass(s: SpotStatus): string {
  if (s === "APPROVED") return "pub";
  if (s === "REJECTED") return "rej";
  if (s === "BANNED") return "arc";
  if (s === "EXPIRED") return "arc";
  return "rev"; // PENDING_MODERATION, DRAFT, etc.
}

function statusLabel(s: SpotStatus): string {
  if (s === "APPROVED") return "Activo";
  if (s === "REJECTED") return "Rechazado";
  if (s === "BANNED") return "Baneado";
  if (s === "EXPIRED") return "Expirado";
  return "Pendiente";
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function isExpired(spot: Spot): boolean {
  if (!spot.expirationDate) return false;
  return new Date(spot.expirationDate) < new Date();
}

function effectiveStatus(spot: Spot): SpotStatus {
  if (spot.status === "APPROVED" && isExpired(spot)) return "EXPIRED";
  return spot.status;
}

// ── Confirm modal state ────────────────────────────────────────────────────

type ModalAction = "reject" | "ban";
type ModalState = { open: false } | { open: true; action: ModalAction; spotId: number; reason: string };

// ── Icons (SVG, no emoji) ──────────────────────────────────────────────────

const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconBan = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 10.5l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconRestore = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 5.5A5 5 0 1 1 3.5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M2 2.5v3h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.6" />
    <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// ── Component ──────────────────────────────────────────────────────────────

export default function SpotsSection() {
  const { token } = useUser();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<FilterChip>("all");
  const [busy, setBusy] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false });

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = () => {
    if (!token) return;
    setLoading(true);
    fetch("/api/spots/admin", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error al cargar avisos");
        const data = await r.json();
        setSpots(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar avisos"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeCount = useMemo(
    () => spots.filter((s) => effectiveStatus(s) === "APPROVED").length,
    [spots],
  );

  const filtered = useMemo(() => {
    let res = spots;
    if (chip !== "all") res = res.filter((s) => effectiveStatus(s) === chip);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter((s) => s.title.toLowerCase().includes(q));
    }
    return res;
  }, [spots, chip, search]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const patch = (id: number, fields: Partial<Spot>) =>
    setSpots((list) => list.map((s) => (s.id === id ? { ...s, ...fields } : s)));

  const callApi = async (id: number, endpoint: string, body?: object) => {
    if (!token) return false;
    setBusy(id);
    try {
      const r = await fetch(`/api/spots/admin/${id}/${endpoint}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? "Error al ejecutar la acción");
      }
      return true;
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const approve = async (id: number) => {
    const ok = await callApi(id, "approve", {});
    if (ok) {
      patch(id, { status: "APPROVED", statusReason: null });
      toast.success("Aviso aprobado");
    }
  };

  const openReject = (id: number) =>
    setModal({ open: true, action: "reject", spotId: id, reason: "" });

  const openBan = (id: number) =>
    setModal({ open: true, action: "ban", spotId: id, reason: "" });

  const closeModal = () => setModal({ open: false });

  const confirmModal = async () => {
    if (!modal.open) return;
    const { action, spotId, reason } = modal;
    if (reason.trim().length < 3) {
      toast.error("El motivo debe tener al menos 3 caracteres");
      return;
    }
    closeModal();
    if (action === "reject") {
      const ok = await callApi(spotId, "reject", { reason: reason.trim() });
      if (ok) {
        patch(spotId, { status: "REJECTED", statusReason: reason.trim() });
        toast.success("Aviso rechazado");
      }
    } else {
      const ok = await callApi(spotId, "ban", { reason: reason.trim() });
      if (ok) {
        patch(spotId, { status: "BANNED", statusReason: reason.trim() });
        toast.success("Aviso baneado");
      }
    }
  };

  const restore = async (id: number) => {
    const ok = await callApi(id, "restore", {});
    if (ok) {
      patch(id, { status: "PENDING_MODERATION", statusReason: null });
      toast.success("Aviso restaurado");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Confirm modal */}
      {modal.open && (
        <div className="confirm-bg" onClick={closeModal}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h3>
              {modal.action === "reject" ? "Rechazar aviso" : "Banear aviso"}
            </h3>
            <p>
              {modal.action === "reject"
                ? "Indica el motivo del rechazo. Se notificará al organizador."
                : "Indica el motivo del baneo. El aviso dejará de ser visible."}
            </p>
            <textarea
              placeholder="Motivo (mínimo 3 caracteres)…"
              value={modal.reason}
              onChange={(e) =>
                setModal((m) => (m.open ? { ...m, reason: e.target.value } : m))
              }
              autoFocus
            />
            <div className="modal-acts">
              <button className="btn ghost sm" onClick={closeModal}>
                Cancelar
              </button>
              <button
                className="btn primary sm"
                style={{ background: "var(--err)", color: "#fff" }}
                onClick={confirmModal}
              >
                {modal.action === "reject" ? "Rechazar" : "Banear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="section-head">
        <h2>Avisos</h2>
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
          {activeCount} / 12 avisos activos
        </span>
      </div>

      {/* Filterbar */}
      <div className="filterbar">
        <div className="search-shell">
          <IconSearch />
          <input
            placeholder="Buscar por título…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              style={{ background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer", lineHeight: 1, padding: 0 }}
              onClick={() => setSearch("")}
              aria-label="Limpiar búsqueda"
            >
              <IconX />
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CHIPS.map((c) => (
            <button
              key={c.key}
              className={`sel${chip === c.key ? " on" : ""}`}
              onClick={() => setChip(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="empty">
            <h3>Cargando avisos…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="ic">
              <IconSearch />
            </div>
            <h3>Sin avisos</h3>
            <p>No hay avisos con esos filtros.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Aviso</th>
                <th>Organizador</th>
                <th>Creado</th>
                <th>Expira</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const thumb = imageUrl(s.image);
                const status = effectiveStatus(s);
                return (
                  <tr key={s.id}>
                    {/* Aviso */}
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
                          <div className="ti">{s.title}</div>
                          {s.description && (
                            <div className="mt" style={{ maxWidth: 260 }}>
                              {s.description.length > 80
                                ? s.description.slice(0, 80) + "…"
                                : s.description}
                            </div>
                          )}
                          {status === "REJECTED" && s.statusReason && (
                            <div
                              className="mt"
                              style={{ color: "var(--err)", marginTop: 2 }}
                            >
                              Motivo: {s.statusReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Organizador */}
                    <td>
                      {s.owner ? (
                        <div className="cell-prod">
                          <div className="nm">{s.owner.name ?? "—"}</div>
                          <div className="em">{s.owner.email ?? ""}</div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--ink-3)" }}>—</span>
                      )}
                    </td>

                    {/* Creado */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{fmtDate(s.createdAt)}</div>
                      </div>
                    </td>

                    {/* Expira */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{fmtDate(s.expirationDate)}</div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td>
                      <div className={`stat ${statusClass(status)}`}>
                        <span className="dot" />
                        {statusLabel(status)}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td>
                      <div className="row-acts">
                        {status === "PENDING_MODERATION" && (
                          <>
                            <button
                              className="ok"
                              disabled={busy === s.id}
                              onClick={() => approve(s.id)}
                              title="Aprobar aviso"
                            >
                              <IconCheck /> Aprobar
                            </button>
                            <button
                              className="bad"
                              disabled={busy === s.id}
                              onClick={() => openReject(s.id)}
                              title="Rechazar aviso"
                            >
                              <IconX /> Rechazar
                            </button>
                          </>
                        )}
                        {status === "APPROVED" && (
                          <button
                            className="bad"
                            disabled={busy === s.id}
                            onClick={() => openBan(s.id)}
                            title="Banear aviso"
                          >
                            <IconBan /> Banear
                          </button>
                        )}
                        {status === "BANNED" && (
                          <button
                            className="ok"
                            disabled={busy === s.id}
                            onClick={() => restore(s.id)}
                            title="Restaurar aviso"
                          >
                            <IconRestore /> Restaurar
                          </button>
                        )}
                        {(status === "REJECTED" || status === "EXPIRED") && (
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              color: "var(--ink-3)",
                            }}
                          >
                            —
                          </span>
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
