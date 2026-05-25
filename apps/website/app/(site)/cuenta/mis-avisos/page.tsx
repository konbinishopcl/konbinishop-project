"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

const TABS = ["Todos", "En revisión", "Activos", "Expirados", "Rechazados"];

export default function MisAvisosPage() {
  const { user, ready } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState("Todos");

  useEffect(() => {
    if (ready && !user) router.replace("/login?returnTo=/cuenta/mis-avisos");
  }, [ready, user, router]);

  if (!ready || !user) return null;

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

      <div className="acc-empty" style={{ margin: "40px 0" }}>
        <div className="ic">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
        </div>
        <h3>No tienes avisos aún</h3>
        <p>Los avisos aparecen en el home y al final de todas las categorías. Máximo 12 simultáneos.</p>
        <Link href="/crear-producto/spot" className="btn primary">Crear mi primer aviso</Link>
      </div>
    </AccountShell>
  );
}
