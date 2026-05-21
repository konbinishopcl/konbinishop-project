"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProfileModal } from "@/components/ProfileModal";
import { useUser } from "@/components/providers";
import { MOCK_USER, PUBS, STATUS_META, type Pub } from "@/lib/data";

type Tab = "all" | Pub["status"];

export default function DashboardPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [profileOpen, setProfileOpen] = useState(false);

  const filtered = tab === "all" ? PUBS : PUBS.filter((p) => p.status === tab);
  const counts = {
    all: PUBS.length,
    rev: PUBS.filter((p) => p.status === "rev").length,
    pub: PUBS.filter((p) => p.status === "pub").length,
    rej: PUBS.filter((p) => p.status === "rej").length,
    arc: PUBS.filter((p) => p.status === "arc").length,
  };
  const u = user ?? MOCK_USER;

  return (
    <main className="container">
      <div className="dash">
        <aside className="dash-side">
          <div className="av-lg">{u.initials}</div>
          <h3>{u.name}</h3>
          <div className="em">{u.email}</div>
          <button className="btn ghost block" style={{ width: "100%" }} onClick={() => setProfileOpen(true)}>
            Editar perfil
          </button>
          <nav className="dash-nav">
            <button>👤 Mi cuenta</button>
            <button className="on">📋 Mis publicaciones</button>
            <button>🎫 Mis entradas</button>
            <button>⚙️ Configuración</button>
            <button>🔒 Contraseña y seguridad</button>
            <button className="danger">↩  Cerrar sesión</button>
          </nav>
        </aside>

        <div className="dash-body">
          <div className="eyebrow">DASHBOARD · ダッシュボード</div>
          <h1 style={{ marginTop: 8 }}>Mis publicaciones</h1>
          <p className="sub">
            Gestiona tus eventos, revisa el estado de publicación y edita lo que necesites.
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
            <button className={tab === "arc" ? "on" : ""} onClick={() => setTab("arc")}>
              Archivados <span className="count">{counts.arc}</span>
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="dash-empty">No hay publicaciones en esta categoría.</div>
          ) : (
            <div className="pub-grid">
              {filtered.map((p) => {
                const m = STATUS_META[p.status];
                return (
                  <div key={p.id} className="pub-card">
                    <div className="img">
                      <div className={`poster-art ${p.art}`} />
                      <div className="stamp">Creado {p.created}</div>
                    </div>
                    <div className="body">
                      <div className={`status ${m.cls}`}>
                        <span className="dot" />
                        {m.label}
                        {p.reason && (
                          <a style={{ marginLeft: 6, textDecoration: "underline", color: "inherit" }}>
                            · ver motivo
                          </a>
                        )}
                      </div>
                      <div className="ttl">{p.title}</div>
                      <div className="meta">
                        {p.date} · {p.place}
                      </div>
                      <div className="price">
                        Entrada desde <strong>{p.price} CLP</strong>
                      </div>
                      <div className="pub-actions">
                        <button onClick={() => router.push("/evento/1")}>Ver</button>
                        <button>Editar</button>
                        <button className="primary-act">⋯</button>
                      </div>
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
