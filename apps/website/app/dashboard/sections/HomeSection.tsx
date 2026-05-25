"use client";
import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/providers";
import { api, type ApiEvent } from "@/lib/api";

export default function HomeSection() {
  const { token } = useUser();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.adminEvents(token, { pageSize: 100 })
      .then((r) => setEvents(r.items))
      .finally(() => setLoading(false));
  }, [token]);

  const aprobados = events.filter((e) => e.isApproved && !e.isRejected).length;
  const pendientes = events.filter((e) => !e.isApproved && !e.isRejected).length;

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
      .slice(0, 6);
  }, [events]);
  const maxCat = Math.max(1, ...catRows.map((c) => c.n));

  const activity = [
    { initials: "CT", txt: "Camila T. aprobó Anime Crunchyroll Fest", time: "hace 5 min" },
    { initials: "DS", txt: "Diego S. baneó RetroGaming Fake", time: "hace 22 min" },
    { initials: "CT", txt: "Camila T. verificó organizador @cinepolis", time: "hace 1 h" },
    { initials: "SI", txt: "Sistema renovó suscripción de Cinépolis Chile", time: "hace 2 h" },
    { initials: "CT", txt: "Camila T. respondió contacto de María Pérez", time: "hace 4 h" },
  ];

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="l">INGRESOS MES</div>
          <div className="v">$3.8M</div>
          <div className="d up">↑ 24%</div>
        </div>
        <div className="kpi">
          <div className="l">EVENTOS PUBLICADOS</div>
          <div className="v">{loading ? "…" : aprobados}</div>
          <div className="d up">activos</div>
        </div>
        <div className="kpi">
          <div className="l">EN REVISIÓN</div>
          <div className="v">{loading ? "…" : pendientes}</div>
          <div className="d">{pendientes > 0 ? "pendientes" : "al día"}</div>
        </div>
        <div className="kpi">
          <div className="l">SUSCRIPTORES</div>
          <div className="v">87</div>
          <div className="d up">↑ 12</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, marginBottom: 18 }}>
        <div className="panel">
          <div className="ph">
            <h3>Ingresos mensuales</h3>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>ÚLTIMOS 12 MESES</div>
          </div>
          <div className="chart">
            {[42, 51, 38, 60, 72, 65, 80, 90, 75, 88, 110, 142].map((v, i) => (
              <div key={i} className="bar" style={{ height: `${v}%` }}>
                <span className="lbl">
                  {["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="ph">
            <h3>Por categoría</h3>
          </div>
          {loading ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13 }}>Cargando…</div>
          ) : catRows.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13 }}>Sin datos.</div>
          ) : (
            catRows.map((c) => (
              <div key={c.nm} className="cat-bar">
                <div className="name">{c.nm}</div>
                <div className="track">
                  <div style={{ width: `${(c.n / maxCat) * 100}%` }} />
                </div>
                <div className="v">{c.n} evt</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="panel">
          <div className="ph">
            <h3>Cola de revisión</h3>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
              {pendientes} PENDIENTES
            </span>
          </div>
          {loading ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13, padding: "12px 0" }}>Cargando…</div>
          ) : pendientes === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: 13, padding: "12px 0" }}>
              No hay eventos pendientes de revisión.
            </div>
          ) : (
            events
              .filter((e) => !e.isApproved && !e.isRejected)
              .slice(0, 5)
              .map((e, i, arr) => (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "0",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "var(--surface-2)",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{e.title}</div>
                    <div style={{ color: "var(--ink-3)", fontSize: 11.5 }}>
                      {e.category?.name ?? "Sin categoría"} ·{" "}
                      {e.commune?.name ?? e.address}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        <div className="panel">
          <div className="ph">
            <h3>Actividad reciente</h3>
          </div>
          {activity.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                padding: "10px 0",
                borderBottom: i < activity.length - 1 ? "1px solid var(--line)" : "0",
                fontSize: 13,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 11,
                  flex: "0 0 28px",
                }}
              >
                {a.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--ink-2)" }}>{a.txt}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                  {a.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
