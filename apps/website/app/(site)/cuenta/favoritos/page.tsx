"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountShell } from "../AccountShell";
import { EventCard } from "@/components/EventCard";
import { useUser } from "@/components/providers";
import { toEventItem, type ApiEvent } from "@/lib/api";

export default function FavoritosPage() {
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?returnTo=/cuenta/favoritos");
      return;
    }
    if (!token) return;
    fetch("/api/users/me/saved-events", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data : data.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [ready, user, token, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  return (
    <AccountShell>
      <h1>Favoritos</h1>
      <p className="lead">Eventos guardados con el corazón.</p>

      {loading ? (
        <div style={{ color: "var(--ink-3)", fontSize: 14, padding: "24px 0" }}>Cargando favoritos…</div>
      ) : events.length === 0 ? (
        <div className="empty" style={{ textAlign: "center", padding: "48px 0" }}>
          <h3>Sin favoritos</h3>
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>Guarda eventos desde sus páginas.</p>
        </div>
      ) : (
        <div className="card-grid">
          {events.map((e) => (
            <EventCard key={e.id} e={toEventItem(e)} />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
