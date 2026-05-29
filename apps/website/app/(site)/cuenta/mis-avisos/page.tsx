"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";
import { api, type ApiSpot } from "@/lib/api";

const TABS = ["Todos", "En revisión", "Activos", "Expirados", "Rechazados"];

function statusLabel(s: ApiSpot, now: Date): string {
  if (s.status === "PENDING_MODERATION") return "En revisión";
  if (s.status === "APPROVED") {
    if (s.expirationDate && new Date(s.expirationDate) < now) return "Expirado";
    return "Activo";
  }
  if (s.status === "REJECTED" || s.status === "BANNED") return "Rechazado";
  return s.status;
}

function statusClass(s: ApiSpot, now: Date): string {
  if (s.status === "PENDING_MODERATION") return "st-rev";
  if (s.status === "APPROVED") {
    if (s.expirationDate && new Date(s.expirationDate) < now) return "st-rej";
    return "st-pub";
  }
  if (s.status === "REJECTED" || s.status === "BANNED") return "st-rej";
  return "st-rev";
}

function matchesTab(s: ApiSpot, tab: string, now: Date): boolean {
  if (tab === "Todos") return true;
  if (tab === "En revisión") return s.status === "PENDING_MODERATION";
  if (tab === "Activos") return s.status === "APPROVED" && (!s.expirationDate || new Date(s.expirationDate) >= now);
  if (tab === "Expirados") return s.status === "APPROVED" && !!s.expirationDate && new Date(s.expirationDate) < now;
  if (tab === "Rechazados") return s.status === "REJECTED" || s.status === "BANNED";
  return true;
}

function formatCLP(amount: number): string {
  return "$" + amount.toLocaleString("es-CL");
}

export default function MisAvisosPage() {
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState("Todos");
  const [spots, setSpots] = useState<ApiSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) { router.replace("/login?returnTo=/cuenta/mis-avisos"); return; }
    if (!token) return;
    api.mySpots(token).then(setSpots).catch(() => setSpots([])).finally(() => setLoading(false));
  }, [ready, user, token, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo…" : "Verificando acceso…"}
      </main>
    );
  }

  const now = new Date();
  const filtered = spots.filter(s => matchesTab(s, tab, now));

  return (
    <AccountShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Mis avisos</h1>
          <p style={{ color: "var(--ink-3)", margin: "4px 0 0", fontSize: 14 }}>Banners pagados que aparecen en el home y categorías.</p>
        </div>
        <Link href="/crear-producto/spot" className="btn primary">+ Crear aviso</Link>
      </div>

      <div className="acc-tabs">
        {TABS.map(t => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="acc-empty" style={{ margin: "40px 0" }}>Cargando tus avisos…</div>
      ) : spots.length === 0 ? (
        <div className="acc-empty" style={{ margin: "40px 0" }}>
          <div className="ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
          </div>
          <h3>No tienes avisos aún</h3>
          <p>Los avisos aparecen en el home y al final de todas las categorías. Máximo 12 simultáneos.</p>
          <Link href="/crear-producto/spot" className="btn primary">Crear mi primer aviso</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="acc-empty" style={{ margin: "40px 0" }}>No hay avisos en esta categoría.</div>
      ) : (
        <div className="pub-grid">
          {filtered.map(s => {
            const label = statusLabel(s, now);
            const cls = statusClass(s, now);
            return (
              <div key={s.id} className="pub-card">
                <div className="img">
                  {s.image
                    ? <img src={s.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div className="poster-art pa-1" style={{ position: "absolute", inset: 0 }} />
                  }
                </div>
                <div className="body">
                  <div className={`status ${cls}`}>
                    <span className="dot" />{label}
                  </div>
                  <div className="ttl">{s.title}</div>
                  <div className="meta">
                    {s.days != null && `${s.days} días`}
                    {s.days != null && s.amount != null && " · "}
                    {s.amount != null && formatCLP(s.amount)}
                  </div>
                  {s.expirationDate && (
                    <div className="meta">
                      Vence: {new Date(s.expirationDate).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  )}
                  {(s.status === "REJECTED" || s.status === "BANNED") && s.statusReason && (
                    <div style={{ color: "var(--err)", fontSize: 11, marginTop: 6 }}>Motivo: {s.statusReason}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
