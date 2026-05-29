"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";
import { api, type ApiHero } from "@/lib/api";

const TABS = ["Todos", "En revisión", "Activas", "Expiradas", "Rechazadas"];

function statusLabel(h: ApiHero, now: Date): string {
  if (h.status === "PENDING_MODERATION") return "En revisión";
  if (h.status === "APPROVED") {
    if (h.expirationDate && new Date(h.expirationDate) < now) return "Expirada";
    return "Activa";
  }
  if (h.status === "REJECTED" || h.status === "BANNED") return "Rechazada";
  return h.status;
}

function statusClass(h: ApiHero, now: Date): string {
  if (h.status === "PENDING_MODERATION") return "st-rev";
  if (h.status === "APPROVED") {
    if (h.expirationDate && new Date(h.expirationDate) < now) return "st-rej";
    return "st-pub";
  }
  if (h.status === "REJECTED" || h.status === "BANNED") return "st-rej";
  return "st-rev";
}

function matchesTab(h: ApiHero, tab: string, now: Date): boolean {
  if (tab === "Todos") return true;
  if (tab === "En revisión") return h.status === "PENDING_MODERATION";
  if (tab === "Activas") return h.status === "APPROVED" && (!h.expirationDate || new Date(h.expirationDate) >= now);
  if (tab === "Expiradas") return h.status === "APPROVED" && !!h.expirationDate && new Date(h.expirationDate) < now;
  if (tab === "Rechazadas") return h.status === "REJECTED" || h.status === "BANNED";
  return true;
}

function formatCLP(amount: number): string {
  return "$" + amount.toLocaleString("es-CL");
}

export default function MisPortadasPage() {
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState("Todos");
  const [heroes, setHeroes] = useState<ApiHero[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) { router.replace("/login?returnTo=/cuenta/mis-portadas"); return; }
    if (!token) return;
    api.myHeroes(token).then(setHeroes).catch(() => setHeroes([])).finally(() => setLoading(false));
  }, [ready, user, token, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo…" : "Verificando acceso…"}
      </main>
    );
  }

  const now = new Date();
  const filtered = heroes.filter(h => matchesTab(h, tab, now));

  return (
    <AccountShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Mis portadas</h1>
          <p style={{ color: "var(--ink-3)", margin: "4px 0 0", fontSize: 14 }}>Apareces en el carrusel principal del home. Máximo 5 activas simultáneas.</p>
        </div>
        <Link href="/crear-producto/hero" className="btn primary">+ Crear portada</Link>
      </div>

      <div className="acc-tabs">
        {TABS.map(t => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="acc-empty" style={{ margin: "40px 0" }}>Cargando tus portadas…</div>
      ) : heroes.length === 0 ? (
        <div className="acc-empty" style={{ margin: "40px 0" }}>
          <div className="ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>
          </div>
          <h3>No tienes portadas aún</h3>
          <p>Las portadas aparecen en el carrusel principal del home. Son el placement más premium de Konbini.</p>
          <Link href="/crear-producto/hero" className="btn primary">Crear mi primera portada</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="acc-empty" style={{ margin: "40px 0" }}>No hay portadas en esta categoría.</div>
      ) : (
        <div className="pub-grid">
          {filtered.map(h => {
            const label = statusLabel(h, now);
            const cls = statusClass(h, now);
            const fullTitle = `${h.title}${h.titleAccent ? ` ${h.titleAccent}` : ""}`;
            return (
              <div key={h.id} className="pub-card">
                <div className="img">
                  {h.image
                    ? <img src={h.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div className="poster-art pa-1" style={{ position: "absolute", inset: 0 }} />
                  }
                </div>
                <div className="body">
                  <div className={`status ${cls}`}>
                    <span className="dot" />{label}
                  </div>
                  <div className="ttl">{fullTitle}</div>
                  <div className="meta">
                    {h.days != null && `${h.days} días`}
                    {h.days != null && h.amount != null && " · "}
                    {h.amount != null && formatCLP(h.amount)}
                  </div>
                  {h.expirationDate && (
                    <div className="meta">
                      Vence: {new Date(h.expirationDate).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  )}
                  {(h.status === "REJECTED" || h.status === "BANNED") && h.statusReason && (
                    <div style={{ color: "var(--err)", fontSize: 11, marginTop: 6 }}>Motivo: {h.statusReason}</div>
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
