"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ic } from "./icons";
import { useUser } from "@/components/providers";
import type { Role } from "@/lib/data";

type NavItem =
  | { group: string }
  | { id: string; label: string; ic: React.ReactNode; badge?: string; superAdminOnly?: boolean };

const ITEMS: NavItem[] = [
  { group: "GENERAL" },
  { id: "dashboard", label: "Dashboard", ic: Ic.dash },
  { id: "events", label: "Eventos", ic: Ic.evt, badge: "12" },
  { id: "users", label: "Usuarios", ic: Ic.usr, superAdminOnly: true },
  { id: "payments", label: "Pagos & ventas", ic: Ic.pay },
  { group: "CONTENIDO" },
  { id: "categories", label: "Categorías", ic: Ic.tag },
  { id: "reports", label: "Reportes", ic: Ic.rep },
  { id: "logs", label: "Logs & auditoría", ic: Ic.log },
  { group: "SISTEMA" },
  { id: "settings", label: "Configuración", ic: Ic.cog },
  { id: "help", label: "Ayuda & docs", ic: Ic.hlp },
];

const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: "SUPER ADMIN",
  ADMIN: "ADMIN",
  AUTHENTICATED: "USUARIO",
};

export function AdminSidebar() {
  const { user, logout } = useUser();
  const router = useRouter();
  const active = usePathname().split("/")[2] || "dashboard";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const items = ITEMS.filter((it) => !("superAdminOnly" in it && it.superAdminOnly && !isSuperAdmin));

  const onLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="mark">K</div>
        <div>
          <div className="lbl">コンビニ</div>
          <div className="name">Konbini Admin</div>
        </div>
      </div>
      {items.map((it, i) =>
        "group" in it ? (
          <div key={`g-${i}`} className="sb-section">{it.group}</div>
        ) : (
          <Link
            key={it.id}
            href={it.id === "dashboard" ? "/dashboard" : `/dashboard/${it.id}`}
            className={`sb-link ${active === it.id ? "on" : ""}`}
          >
            {it.ic} <span>{it.label}</span>
            {it.badge && <span className="badge">{it.badge}</span>}
          </Link>
        ),
      )}
      <div className="sb-foot">
        <div className="sb-user">
          <div className="av">{user?.initials ?? "?"}</div>
          <div style={{ minWidth: 0 }}>
            <div className="nm">{user?.name ?? "Invitado"}</div>
            <div className="ro">{user ? ROLE_LABEL[user.role] : ""}</div>
          </div>
          <button
            className="icon-btn sq"
            style={{ marginLeft: "auto", width: 30, height: 30 }}
            title="Cerrar sesión"
            onClick={onLogout}
          >
            {Ic.chev}
          </button>
        </div>
      </div>
    </aside>
  );
}
