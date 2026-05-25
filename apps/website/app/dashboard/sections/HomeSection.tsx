"use client";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { useUser } from "@/components/providers";
import { api, imageUrl, type ApiEvent } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────

type Spot = {
  id: number;
  title: string;
  description?: string | null;
  image?: string | null;
  status?: string;
};

type Hero = {
  id: number;
  title: string;
  titleAccent?: string | null;
  image?: string | null;
  status?: string;
};

type ActivityItem = {
  initials: string;
  txt: string;
  time: string;
};

// ── Constants ────────────────────────────────────────────────────

const MESES_SHORT = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const REVENUE_DATA = [42, 51, 38, 60, 72, 65, 80, 90, 75, 88, 110, 142];

const MOCK_ACTIVITY: ActivityItem[] = [
  { initials: "CT", txt: "Camila T. aprobó Anime Crunchyroll Fest", time: "hace 5 min" },
  { initials: "DS", txt: "Diego S. rechazó RetroGaming Fake", time: "hace 22 min" },
  { initials: "CT", txt: "Camila T. verificó organizador @cinepolis", time: "hace 1 h" },
  { initials: "SI", txt: "Sistema renovó suscripción de Cinépolis Chile", time: "hace 2 h" },
  { initials: "CT", txt: "Camila T. respondió contacto de María Pérez", time: "hace 4 h" },
];

// ── Helpers ──────────────────────────────────────────────────────

function isPending(status?: string): boolean {
  return status !== "ACTIVE" && status !== "REJECTED";
}

// ── Sub-components ───────────────────────────────────────────────

function ReviewItem({
  title,
  subtitle,
  thumb,
  onApprove,
  onReject,
}: {
  title: string;
  subtitle?: string;
  thumb?: string | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(thumb)}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              color: "var(--ink-3)",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      <div className="row-acts">
        <button className="ok" onClick={onApprove} title="Aprobar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        <button className="bad" onClick={onReject} title="Rechazar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EmptyQueue({ label }: { label: string }) {
  return (
    <div style={{ padding: "28px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
      Sin {label} pendientes
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────

export default function HomeSection() {
  const { token } = useUser();

  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [loadingHeroes, setLoadingHeroes] = useState(true);

  // ── Data fetching ──────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;

    api
      .adminEvents(token, { pageSize: 100 })
      .then((r) => setEvents(r.items))
      .catch(() => toast.error("Error al cargar eventos"))
      .finally(() => setLoadingEvents(false));

    fetch("/api/spots/admin", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error al cargar avisos");
        const data = await r.json();
        setSpots(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar avisos"))
      .finally(() => setLoadingSpots(false));

    fetch("/api/heroes/admin", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error("Error al cargar portadas");
        const data = await r.json();
        setHeroes(Array.isArray(data) ? data : (data.items ?? []));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar portadas"))
      .finally(() => setLoadingHeroes(false));
  }, [token]);

  // ── Derived counts ─────────────────────────────────────────────

  const publishedEvents = events.filter((e) => e.isApproved && !e.isRejected).length;
  const pendingEvents = events.filter((e) => !e.isApproved && !e.isRejected);
  const activeSpots = spots.filter((s) => s.status === "ACTIVE").length;
  const pendingSpots = spots.filter((s) => isPending(s.status));
  const activeHeroes = heroes.filter((h) => h.status === "ACTIVE").length;
  const pendingHeroes = heroes.filter((h) => isPending(h.status));

  // ── Category distribution ──────────────────────────────────────

  const catRows = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      if (e.category) {
        const nm = e.category.name ?? e.category.slug;
        map.set(nm, (map.get(nm) ?? 0) + 1);
      }
    }
    return [...map.entries()]
      .map(([nm, n]) => ({ nm, n }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 7);
  }, [events]);
  const maxCat = Math.max(1, ...catRows.map((c) => c.n));

  // ── Revenue chart (mock) ───────────────────────────────────────
  const revenueMax = Math.max(...REVENUE_DATA);
  const currentMonthIdx = new Date().getMonth();
  // Rearrange so chart starts from oldest and ends on current month
  const revenueOrdered = [
    ...REVENUE_DATA.slice(currentMonthIdx + 1),
    ...REVENUE_DATA.slice(0, currentMonthIdx + 1),
  ];
  const monthLabels = [
    ...MESES_SHORT.slice(currentMonthIdx + 1),
    ...MESES_SHORT.slice(0, currentMonthIdx + 1),
  ];

  // ── Actions: events ───────────────────────────────────────────

  const approveEvent = async (id: number) => {
    if (!token) return;
    try {
      await api.approveEvent(id, token);
      setEvents((list) =>
        list.map((e) => (e.id === id ? { ...e, isApproved: true } : e))
      );
      toast.success("Evento aprobado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al aprobar evento");
    }
  };

  const rejectEvent = async (id: number) => {
    if (!token) return;
    const reason = window.prompt("Motivo del rechazo:");
    if (!reason || reason.trim().length < 3) {
      if (reason !== null) toast.error("Motivo mínimo 3 caracteres");
      return;
    }
    try {
      await api.rejectEvent(id, reason.trim(), token);
      setEvents((list) =>
        list.map((e) => (e.id === id ? { ...e, isRejected: true } : e))
      );
      toast.success("Evento rechazado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al rechazar evento");
    }
  };

  // ── Actions: spots ────────────────────────────────────────────

  const approveSpot = async (id: number) => {
    if (!token) return;
    try {
      const r = await fetch(`/api/spots/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al aprobar");
      setSpots((list) =>
        list.map((s) => (s.id === id ? { ...s, status: "ACTIVE" } : s))
      );
      toast.success("Aviso aprobado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al aprobar aviso");
    }
  };

  const rejectSpot = async (id: number) => {
    if (!token) return;
    const reason = window.prompt("Motivo del rechazo:");
    if (!reason || reason.trim().length < 3) {
      if (reason !== null) toast.error("Motivo mínimo 3 caracteres");
      return;
    }
    try {
      const r = await fetch(`/api/spots/${id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("Error al rechazar");
      setSpots((list) =>
        list.map((s) => (s.id === id ? { ...s, status: "REJECTED" } : s))
      );
      toast.success("Aviso rechazado");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al rechazar aviso");
    }
  };

  // ── Actions: heroes ───────────────────────────────────────────

  const approveHero = async (id: number) => {
    if (!token) return;
    try {
      const r = await fetch(`/api/heroes/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error("Error al aprobar");
      setHeroes((list) =>
        list.map((h) => (h.id === id ? { ...h, status: "ACTIVE" } : h))
      );
      toast.success("Portada aprobada");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al aprobar portada");
    }
  };

  const rejectHero = async (id: number) => {
    if (!token) return;
    const reason = window.prompt("Motivo del rechazo:");
    if (!reason || reason.trim().length < 3) {
      if (reason !== null) toast.error("Motivo mínimo 3 caracteres");
      return;
    }
    try {
      const r = await fetch(`/api/heroes/${id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!r.ok) throw new Error("Error al rechazar");
      setHeroes((list) =>
        list.map((h) => (h.id === id ? { ...h, status: "REJECTED" } : h))
      );
      toast.success("Portada rechazada");
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al rechazar portada");
    }
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      {/* ── KPI Grid (4 cols, 7 KPIs → row 1: 4, row 2: 3) ── */}
      <div className="kpi-grid">
        {/* Row 1 */}
        <div className="kpi">
          <div className="l">Ingresos del mes</div>
          <div className="v">$3.8M</div>
          <div className="d up">+24% vs mes anterior</div>
        </div>
        <div className="kpi">
          <div className="l">Eventos publicados</div>
          <div className="v">{loadingEvents ? "--" : publishedEvents}</div>
          <div className="d up">activos en plataforma</div>
        </div>
        <div className="kpi">
          <div className="l">Eventos en revision</div>
          <div className="v">{loadingEvents ? "--" : pendingEvents.length}</div>
          <div className={`d ${pendingEvents.length > 0 ? "" : "up"}`}>
            {pendingEvents.length > 0 ? "pendientes de revision" : "al dia"}
          </div>
        </div>
        <div className="kpi">
          <div className="l">Avisos activos</div>
          <div className="v">{loadingSpots ? "--" : activeSpots}</div>
          <div className="d">
            {loadingSpots ? "--" : `${pendingSpots.length} en revision`}
          </div>
        </div>

        {/* Row 2 */}
        <div className="kpi">
          <div className="l">Portadas activas</div>
          <div className="v">{loadingHeroes ? "--" : activeHeroes}</div>
          <div className="d">
            {loadingHeroes ? "--" : `${pendingHeroes.length} en revision`}
          </div>
        </div>
        <div className="kpi">
          <div className="l">Usuarios registrados</div>
          <div className="v">1.2K</div>
          <div className="d up">+48 este mes</div>
        </div>
        <div className="kpi">
          <div className="l">Suscriptores activos</div>
          <div className="v">87</div>
          <div className="d up">+12 este mes</div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {/* Revenue chart */}
        <div className="panel">
          <div className="ph">
            <h3>Ingresos mensuales</h3>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--ink-3)",
                letterSpacing: ".1em",
              }}
            >
              ULTIMOS 12 MESES (MOCK)
            </div>
          </div>
          <div
            className="chart"
            style={{ overflowX: "auto" }}
            role="img"
            aria-label="Grafico de ingresos mensuales"
          >
            {revenueOrdered.map((v, i) => (
              <div
                key={i}
                className="bar"
                style={{ height: `${Math.round((v / revenueMax) * 100)}%` }}
              >
                <span className="lbl">{monthLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category distribution */}
        <div className="panel">
          <div className="ph">
            <h3>Por categoria</h3>
          </div>
          {loadingEvents ? (
            <div
              style={{
                color: "var(--ink-3)",
                fontSize: 13,
                fontFamily: "var(--font-mono)",
              }}
            >
              Cargando...
            </div>
          ) : catRows.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13 }}>Sin datos.</div>
          ) : (
            catRows.map((c) => (
              <div key={c.nm} className="cat-bar">
                <div className="name">{c.nm}</div>
                <div className="track">
                  <div style={{ width: `${Math.round((c.n / maxCat) * 100)}%` }} />
                </div>
                <div className="v">{c.n} evt</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Review queue: 3 panels side by side ── */}
      <div className="section-head">
        <h2>Cola de revision</h2>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {/* Eventos panel */}
        <div className="panel">
          <div className="ph">
            <h3>Eventos</h3>
            <span
              className={`stat ${pendingEvents.length > 0 ? "rev" : "pub"}`}
              style={{ fontSize: 11 }}
            >
              <span className="dot" />
              {loadingEvents ? "--" : `${pendingEvents.length} pendientes`}
            </span>
          </div>
          {loadingEvents ? (
            <div
              style={{
                padding: "28px 0",
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
            >
              Cargando...
            </div>
          ) : pendingEvents.length === 0 ? (
            <EmptyQueue label="eventos" />
          ) : (
            <>
              {pendingEvents.slice(0, 5).map((e) => (
                <ReviewItem
                  key={e.id}
                  title={e.title}
                  subtitle={`${e.category?.name ?? "Sin categoria"} · ${e.commune?.name ?? e.address}`}
                  thumb={e.poster ?? e.banner}
                  onApprove={() => approveEvent(e.id)}
                  onReject={() => rejectEvent(e.id)}
                />
              ))}
              {pendingEvents.length > 5 && (
                <div
                  style={{
                    paddingTop: 10,
                    fontSize: 11,
                    color: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    textAlign: "center",
                  }}
                >
                  +{pendingEvents.length - 5} mas en la cola
                </div>
              )}
            </>
          )}
        </div>

        {/* Avisos panel */}
        <div className="panel">
          <div className="ph">
            <h3>Avisos</h3>
            <span
              className={`stat ${pendingSpots.length > 0 ? "rev" : "pub"}`}
              style={{ fontSize: 11 }}
            >
              <span className="dot" />
              {loadingSpots ? "--" : `${pendingSpots.length} pendientes`}
            </span>
          </div>
          {loadingSpots ? (
            <div
              style={{
                padding: "28px 0",
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
            >
              Cargando...
            </div>
          ) : pendingSpots.length === 0 ? (
            <EmptyQueue label="avisos" />
          ) : (
            <>
              {pendingSpots.slice(0, 5).map((s) => (
                <ReviewItem
                  key={s.id}
                  title={s.title}
                  subtitle={s.description ?? undefined}
                  thumb={s.image}
                  onApprove={() => approveSpot(s.id)}
                  onReject={() => rejectSpot(s.id)}
                />
              ))}
              {pendingSpots.length > 5 && (
                <div
                  style={{
                    paddingTop: 10,
                    fontSize: 11,
                    color: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    textAlign: "center",
                  }}
                >
                  +{pendingSpots.length - 5} mas en la cola
                </div>
              )}
            </>
          )}
        </div>

        {/* Portadas panel */}
        <div className="panel">
          <div className="ph">
            <h3>Portadas</h3>
            <span
              className={`stat ${pendingHeroes.length > 0 ? "rev" : "pub"}`}
              style={{ fontSize: 11 }}
            >
              <span className="dot" />
              {loadingHeroes ? "--" : `${pendingHeroes.length} pendientes`}
            </span>
          </div>
          {loadingHeroes ? (
            <div
              style={{
                padding: "28px 0",
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
              }}
            >
              Cargando...
            </div>
          ) : pendingHeroes.length === 0 ? (
            <EmptyQueue label="portadas" />
          ) : (
            <>
              {pendingHeroes.slice(0, 5).map((h) => (
                <ReviewItem
                  key={h.id}
                  title={h.titleAccent ? `${h.title} ${h.titleAccent}` : h.title}
                  thumb={h.image}
                  onApprove={() => approveHero(h.id)}
                  onReject={() => rejectHero(h.id)}
                />
              ))}
              {pendingHeroes.length > 5 && (
                <div
                  style={{
                    paddingTop: 10,
                    fontSize: 11,
                    color: "var(--ink-3)",
                    fontFamily: "var(--font-mono)",
                    textAlign: "center",
                  }}
                >
                  +{pendingHeroes.length - 5} mas en la cola
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Activity feed ── */}
      <div className="section-head">
        <h2>Actividad reciente</h2>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-3)",
            letterSpacing: ".1em",
          }}
        >
          MOCK
        </span>
      </div>
      <div className="panel">
        {MOCK_ACTIVITY.map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              padding: "12px 0",
              borderBottom:
                i < MOCK_ACTIVITY.length - 1 ? "1px solid var(--line)" : "0",
              fontSize: 13,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                background: "linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent)))",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 10,
                flex: "0 0 30px",
                letterSpacing: ".04em",
              }}
            >
              {a.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "var(--ink-2)", lineHeight: 1.4 }}>{a.txt}</div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--ink-3)",
                  marginTop: 3,
                }}
              >
                {a.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
