"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

interface Notification {
  id: number;
  type: string;
  title: string;
  message?: string;
  read: boolean;
  createdAt: string;
}

export default function MensajesPage() {
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?returnTo=/cuenta/mensajes");
      return;
    }
    if (!token) return;
    fetch("/api/notifications?page=1&limit=20", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setNotifications(Array.isArray(data) ? data : data.notifications ?? []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [ready, user, token, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  const markAllRead = async () => {
    if (!token) return;
    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Todos los mensajes marcados como leídos");
    } catch {
      toast.error("No se pudo marcar los mensajes");
    }
  };

  const markOneRead = async (id: number) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch {
      // silently ignore
    }
  };

  const typeColor = (t: string) =>
    t === "APPROVED" ? "var(--ok)" : t === "REJECTED" ? "var(--err)" : "var(--accent-3)";

  const typeLabel = (t: string) =>
    t === "APPROVED" ? "✓" : t === "REJECTED" ? "✕" : "i";

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AccountShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
        <h1>Mensajes</h1>
        {unreadCount > 0 && (
          <button className="btn ghost" style={{ fontSize: 13 }} onClick={markAllRead}>
            Marcar todas como leídas
          </button>
        )}
      </div>
      <p className="lead">Aprobaciones, rechazos y comunicaciones de Konbini.</p>

      {loading ? (
        <div className="acc-section" style={{ color: "var(--ink-3)", fontSize: 14 }}>Cargando mensajes…</div>
      ) : notifications.length === 0 ? (
        <div className="acc-section" style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ color: "var(--ink-3)", fontSize: 14 }}>No tienes mensajes aún.</div>
        </div>
      ) : (
        <div className="acc-section">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="acc-list-row"
              style={!n.read ? {
                background: "color-mix(in oklab, var(--accent) 4%, transparent)",
                borderRadius: 10,
                padding: "16px 12px",
                marginBottom: 4,
                borderBottom: "none",
                cursor: "pointer",
              } : { cursor: "pointer" }}
              onClick={() => !n.read && markOneRead(n.id)}
            >
              <div className="av" style={{
                background: typeColor(n.type),
                flex: "0 0 32px",
                width: 32,
                height: 32,
                fontSize: 14,
              }}>
                {typeLabel(n.type)}
              </div>
              <div className="main">
                <div className="t">{n.title}</div>
                <div className="m">
                  {new Date(n.createdAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                  {n.message ? ` · ${n.message}` : ""}
                </div>
              </div>
              {!n.read && (
                <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)", flex: "0 0 8px" }} />
              )}
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
