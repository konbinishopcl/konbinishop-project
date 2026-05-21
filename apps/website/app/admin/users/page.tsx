"use client";

import { PlaceholderView } from "@/components/admin/PlaceholderView";
import { useUser } from "@/components/providers";

export default function UsersPage() {
  const { user } = useUser();

  // El AdminGuard ya garantizó ADMIN o SUPER_ADMIN; aquí restringimos a SUPER_ADMIN.
  if (user?.role !== "SUPER_ADMIN") {
    return (
      <>
        <div className="page-head">
          <div>
            <div className="eyebrow">USUARIOS · ユーザー</div>
            <h1>
              Usuarios <span style={{ color: "var(--accent)" }}>.</span>
            </h1>
            <div className="sub">Gestiona organizadores, asistentes y permisos.</div>
          </div>
        </div>
        <div className="panel" style={{ padding: 60, textAlign: "center" }}>
          <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 8px", fontSize: 20 }}>
            Acceso restringido
          </h3>
          <p style={{ color: "var(--ink-3)", fontSize: 14, maxWidth: "44ch", margin: "0 auto" }}>
            La gestión de usuarios (crear, editar, bannear y eliminar) está reservada al rol{" "}
            <strong style={{ color: "var(--ink)" }}>SUPER ADMIN</strong>.
          </p>
        </div>
      </>
    );
  }

  return (
    <PlaceholderView
      title="Usuarios"
      ja="ユーザー"
      subtitle="Gestiona organizadores, asistentes y permisos."
    />
  );
}
