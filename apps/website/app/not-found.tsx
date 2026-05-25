"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/busqueda?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(80px,12vw,160px)",
        fontWeight: 800,
        letterSpacing: "-.04em",
        lineHeight: 1,
        color: "var(--accent)",
        opacity: 0.18,
        marginBottom: 8,
        userSelect: "none",
      }}>
        404
      </div>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontSize: "clamp(36px,5vw,56px)",
        letterSpacing: "-.025em",
        margin: "0 0 16px",
      }}>
        Página no encontrada
      </h1>
      <p style={{
        color: "var(--ink-2)",
        fontSize: 17,
        lineHeight: 1.55,
        maxWidth: "48ch",
        margin: "0 auto 32px",
      }}>
        La página que buscas no existe o fue movida. Prueba buscando un evento o volviendo al inicio.
      </p>

      {/* Buscador inline */}
      <form onSubmit={handleSearch} style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 999,
        padding: "10px 10px 10px 22px",
        maxWidth: 480,
        margin: "0 auto 32px",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
          <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar eventos…"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 16,
            color: "var(--ink)",
          }}
          autoFocus
        />
        <button type="submit" className="btn dark" style={{ padding: "8px 18px", fontSize: 14 }}>
          Buscar
        </button>
      </form>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/" className="btn primary lg">Volver al inicio →</Link>
        <Link href="/busqueda" className="btn ghost lg">Ver todos los eventos</Link>
      </div>
    </main>
  );
}
