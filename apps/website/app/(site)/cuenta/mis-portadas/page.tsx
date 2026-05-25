"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

const TABS = ["Todos", "En revisión", "Activas", "Expiradas", "Rechazadas"];

export default function MisPortadasPage() {
  const { user, ready } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState("Todos");

  useEffect(() => {
    if (ready && !user) router.replace("/login?returnTo=/cuenta/mis-portadas");
  }, [ready, user, router]);

  if (!ready || !user) return null;

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

      <div className="acc-empty" style={{ margin: "40px 0" }}>
        <div className="ic">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>
        </div>
        <h3>No tienes portadas aún</h3>
        <p>Las portadas aparecen en el carrusel principal del home. Son el placement más premium de Konbini.</p>
        <Link href="/crear-producto/hero" className="btn primary">Crear mi primera portada</Link>
      </div>
    </AccountShell>
  );
}
