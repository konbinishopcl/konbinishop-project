"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";
import { api, toEventItem, type ApiEvent } from "@/lib/api";

type Status = "rev" | "pub" | "rej";

function statusOf(e: ApiEvent): Status {
  if (e.isRejected) return "rej";
  if (e.isApproved) return "pub";
  return "rev";
}

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  rev: { label: "En revisión", cls: "st-rev" },
  pub: { label: "Publicado", cls: "st-pub" },
  rej: { label: "Rechazado", cls: "st-rej" },
};

export default function PublicacionesPage() {
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | Status>("all");

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?returnTo=/cuenta/publicaciones");
      return;
    }
    if (!token) return;
    api
      .myEvents(token)
      .then(setEvents)
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

  const counts = {
    all: events.length,
    rev: events.filter((e) => statusOf(e) === "rev").length,
    pub: events.filter((e) => statusOf(e) === "pub").length,
    rej: events.filter((e) => statusOf(e) === "rej").length,
  };

  const filtered = tab === "all" ? events : events.filter((e) => statusOf(e) === tab);

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("¿Eliminar este evento? Esta acción no se puede deshacer.")) return;
    try {
      await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Evento eliminado");
    } catch {
      toast.error("No se pudo eliminar el evento");
    }
  };

  return (
    <AccountShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
        <h1>Mis eventos</h1>
        <Link className="btn primary" href="/crear">＋ Crear evento</Link>
      </div>
      <p className="lead">Te quedan créditos este mes. Revisa el estado de tus eventos.</p>

      <div className="tabs">
        {(["all", "rev", "pub", "rej"] as const).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {t === "all" ? "Todos" : STATUS_META[t].label}{" "}
            <span className="count">{counts[t]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dash-empty">Cargando tus publicaciones…</div>
      ) : filtered.length === 0 ? (
        <div className="dash-empty">
          {events.length === 0 ? (
            <>
              Todavía no has publicado eventos.{" "}
              <Link href="/crear" style={{ textDecoration: "underline" }}>
                Crea el primero
              </Link>
              .
            </>
          ) : (
            "No hay publicaciones en esta categoría."
          )}
        </div>
      ) : (
        <div className="pub-grid">
          {filtered.map((e) => {
            const item = toEventItem(e);
            const status = statusOf(e);
            const m = STATUS_META[status];
            return (
              <div key={e.id} className="pub-card">
                <div className="img">
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>
                <div className="body">
                  <div className={`status ${m.cls}`}>
                    <span className="dot" />
                    {m.label}
                  </div>
                  {status === "rej" && e.rejectedReason && (
                    <div style={{ color: "var(--err)", fontSize: 12, marginBottom: 8 }}>
                      Motivo: {e.rejectedReason}
                    </div>
                  )}
                  <div className="ttl">{item.title}</div>
                  <div className="meta">{item.date} · {item.place}</div>
                  <div className="pub-actions" style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    {status === "pub" && (
                      <Link className="btn ghost" href={`/evento/${e.slug}`} style={{ fontSize: 12, padding: "6px 12px" }}>
                        Ver
                      </Link>
                    )}
                    <Link className="btn ghost" href={`/crear?id=${e.id}`} style={{ fontSize: 12, padding: "6px 12px" }}>
                      Editar
                    </Link>
                    <button
                      className="btn ghost"
                      style={{ fontSize: 12, padding: "6px 12px", color: "var(--err)" }}
                      onClick={() => handleDelete(e.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
