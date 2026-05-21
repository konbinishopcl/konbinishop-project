"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProfileModal } from "@/components/ProfileModal";
import { useUser } from "@/components/providers";
import { api, toEventItem, type ApiEvent } from "@/lib/api";
import { STATUS_META } from "@/lib/data";

type Status = "rev" | "pub" | "rej";
type Tab = "all" | Status;

function statusOf(e: ApiEvent): Status {
  if (e.isRejected) return "rej";
  if (e.isApproved) return "pub";
  return "rev";
}

export default function CuentaPage() {
  const { user, token, ready, logout } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [profileOpen, setProfileOpen] = useState(false);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  useEffect(() => {
    if (!token) return;
    api
      .myEvents(token)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [token]);

  if (!ready || !user) {
    return (
      <main
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-3)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
        }}
      >
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

  const onLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <main className="container">
      <div className="dash">
        <aside className="dash-side">
          <div className="av-lg">{user.initials}</div>
          <h3>{user.name}</h3>
          <div className="em">{user.email}</div>
          <button
            className="btn ghost block"
            style={{ width: "100%" }}
            onClick={() => setProfileOpen(true)}
          >
            Editar perfil
          </button>
          <nav className="dash-nav">
            <button className="on">📋 Mis publicaciones</button>
            <Link className="btn primary block" href="/crear" style={{ marginTop: 4 }}>
              ＋ Crear evento
            </Link>
            <button className="danger" onClick={onLogout}>
              ↩ Cerrar sesión
            </button>
          </nav>
        </aside>

        <div className="dash-body">
          <div className="eyebrow">MI CUENTA · マイページ</div>
          <h1 style={{ marginTop: 8 }}>Mis publicaciones</h1>
          <p className="sub">
            Revisa el estado de tus eventos. Los publicados ya son visibles en Konbini.
          </p>

          <div className="tabs">
            <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>
              Todos <span className="count">{counts.all}</span>
            </button>
            <button className={tab === "rev" ? "on" : ""} onClick={() => setTab("rev")}>
              En revisión <span className="count">{counts.rev}</span>
            </button>
            <button className={tab === "pub" ? "on" : ""} onClick={() => setTab("pub")}>
              Publicados <span className="count">{counts.pub}</span>
            </button>
            <button className={tab === "rej" ? "on" : ""} onClick={() => setTab("rej")}>
              Rechazados <span className="count">{counts.rej}</span>
            </button>
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
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
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
                      <div className="meta">
                        {item.date} · {item.place}
                      </div>
                      <div className="price">
                        {item.price > 0 ? (
                          <>
                            Entrada desde{" "}
                            <strong>${item.price.toLocaleString("es-CL")} CLP</strong>
                          </>
                        ) : (
                          <strong>Entrada liberada</strong>
                        )}
                      </div>
                      {status === "pub" && (
                        <Link
                          className="btn ghost block"
                          href={`/evento/${e.slug}`}
                          style={{ marginTop: 10 }}
                        >
                          Ver publicación
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
    </main>
  );
}
