"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { imageUrl } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

type HeroStatus = "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED" | "EXPIRED" | string;

type Hero = {
  id: number;
  title: string;
  titleAccent?: string | null;
  lead?: string | null;
  image?: string | null;
  link?: string | null;
  status: HeroStatus;
  expirationDate?: string | null;
  days?: number | null;
  amount?: number | null;
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

function statusClass(s: HeroStatus): string {
  if (s === "APPROVED") return "pub";
  if (s === "REJECTED") return "rej";
  if (s === "BANNED") return "arc";
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

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function isExpired(hero: Hero): boolean {
  if (!hero.expirationDate) return false;
  return new Date(hero.expirationDate) < new Date();
}

function effectiveStatus(hero: Hero): HeroStatus {
  if (hero.status === "APPROVED" && isExpired(hero)) return "EXPIRED";
  return hero.status;
}

// ── Confirm modal state ────────────────────────────────────────────────────

type ModalAction = "reject" | "ban";
type ModalState = { open: false } | { open: true; action: ModalAction; heroId: number; reason: string };

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

export default function HeroesSection() {
  const { token } = useUser();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState<FilterChip>("all");
  const [busy, setBusy] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false });

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = () => {
    if (!token) return;
    setLoading(true);
    fetch("/api/heroes/admin", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error al cargar portadas");
        const data = await r.json();
        setHeroes(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar portadas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────────────────────

  const activeCount = useMemo(
    () => heroes.filter((h) => effectiveStatus(h) === "APPROVED").length,
    [heroes],
  );

  const filtered = useMemo(() => {
    let res = heroes;
    if (chip !== "all") res = res.filter((h) => effectiveStatus(h) === chip);
    if (search) {
      const q = search.toLowerCase();
      res = res.filter((h) => h.title.toLowerCase().includes(q));
    }
    return res;
  }, [heroes, chip, search]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const patch = (id: number, fields: Partial<Hero>) =>
    setHeroes((list) => list.map((h) => (h.id === id ? { ...h, ...fields } : h)));

  const callApi = async (id: number, endpoint: string, body?: object) => {
    if (!token) return false;
    setBusy(id);
    try {
      const r = await fetch(`/api/heroes/admin/${id}/${endpoint}`, {
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
      toast.success("Portada aprobada");
    }
  };

  const openReject = (id: number) =>
    setModal({ open: true, action: "reject", heroId: id, reason: "" });

  const openBan = (id: number) =>
    setModal({ open: true, action: "ban", heroId: id, reason: "" });

  const closeModal = () => setModal({ open: false });

  const confirmModal = async () => {
    if (!modal.open) return;
    const { action, heroId, reason } = modal;
    if (reason.trim().length < 3) {
      toast.error("El motivo debe tener al menos 3 caracteres");
      return;
    }
    closeModal();
    if (action === "reject") {
      const ok = await callApi(heroId, "reject", { reason: reason.trim() });
      if (ok) {
        patch(heroId, { status: "REJECTED", statusReason: reason.trim() });
        toast.success("Portada rechazada");
      }
    } else {
      const ok = await callApi(heroId, "ban", { reason: reason.trim() });
      if (ok) {
        patch(heroId, { status: "BANNED", statusReason: reason.trim() });
        toast.success("Portada baneada");
      }
    }
  };

  const restore = async (id: number) => {
    const ok = await callApi(id, "restore", {});
    if (ok) {
      patch(id, { status: "PENDING_MODERATION", statusReason: null });
      toast.success("Portada restaurada");
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
              {modal.action === "reject" ? "Rechazar portada" : "Banear portada"}
            </h3>
            <p>
              {modal.action === "reject"
                ? "Indica el motivo del rechazo. Se notificará al organizador."
                : "Indica el motivo del baneo. La portada dejará de ser visible."}
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
        <h2>Portadas</h2>
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
            <h3>Cargando portadas…</h3>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="ic">
              <IconSearch />
            </div>
            <h3>Sin portadas</h3>
            <p>No hay portadas con esos filtros.</p>
          </div>
        ) : (
          <table className="evt">
            <thead>
              <tr>
                <th>Portada</th>
                <th>Organizador</th>
                <th>Inicio</th>
                <th>Expira</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => {
                const thumb = imageUrl(h.image);
                const status = effectiveStatus(h);
                return (
                  <tr key={h.id}>
                    {/* Portada — banner 16:9 */}
                    <td>
                      <div className="cell-evt">
                        <div
                          className="thumb"
                          style={{
                            width: 96,
                            height: 54,
                            flexShrink: 0,
                            borderRadius: 6,
                            overflow: "hidden",
                            border: "1px solid var(--line)",
                            background: "var(--surface-2)",
                          }}
                        >
                          {thumb && (
                            <img
                              src={thumb}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          )}
                        </div>
                        <div>
                          <div className="ti">{h.title}</div>
                          {h.titleAccent && (
                            <div className="mt" style={{ color: "var(--accent)" }}>
                              {h.titleAccent}
                            </div>
                          )}
                          {status === "REJECTED" && h.statusReason && (
                            <div
                              className="mt"
                              style={{ color: "var(--err)", marginTop: 2 }}
                            >
                              Motivo: {h.statusReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Organizador */}
                    <td>
                      {h.owner ? (
                        <div className="cell-prod">
                          <div className="nm">{h.owner.name ?? "—"}</div>
                          <div className="em">{h.owner.email ?? ""}</div>
                        </div>
                      ) : (
                        <span style={{ color: "var(--ink-3)" }}>—</span>
                      )}
                    </td>

                    {/* Inicio */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{fmtDate(h.createdAt)}</div>
                        {h.days != null && (
                          <div className="t">{h.days}d</div>
                        )}
                      </div>
                    </td>

                    {/* Expira */}
                    <td>
                      <div className="cell-date">
                        <div className="d">{fmtDate(h.expirationDate)}</div>
                        {h.amount != null && (
                          <div className="t">
                            ${h.amount.toLocaleString("es-CL")} CLP
                          </div>
                        )}
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
                              disabled={busy === h.id}
                              onClick={() => approve(h.id)}
                              title="Aprobar portada"
                            >
                              <IconCheck /> Aprobar
                            </button>
                            <button
                              className="bad"
                              disabled={busy === h.id}
                              onClick={() => openReject(h.id)}
                              title="Rechazar portada"
                            >
                              <IconX /> Rechazar
                            </button>
                          </>
                        )}
                        {status === "APPROVED" && (
                          <button
                            className="bad"
                            disabled={busy === h.id}
                            onClick={() => openBan(h.id)}
                            title="Banear portada"
                          >
                            <IconBan /> Banear
                          </button>
                        )}
                        {status === "BANNED" && (
                          <button
                            className="ok"
                            disabled={busy === h.id}
                            onClick={() => restore(h.id)}
                            title="Restaurar portada"
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
