"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ic } from "./icons";

type NavItem =
  | { group: string }
  | { id: string; label: string; ic: React.ReactNode; badge?: string };

const ITEMS: NavItem[] = [
  { group: "GENERAL" },
  { id: "dashboard", label: "Dashboard", ic: Ic.dash },
  { id: "events", label: "Eventos", ic: Ic.evt, badge: "12" },
  { id: "users", label: "Usuarios", ic: Ic.usr },
  { id: "payments", label: "Pagos & ventas", ic: Ic.pay },
  { group: "CONTENIDO" },
  { id: "categories", label: "Categorías", ic: Ic.tag },
  { id: "reports", label: "Reportes", ic: Ic.rep },
  { id: "logs", label: "Logs & auditoría", ic: Ic.log },
  { group: "SISTEMA" },
  { id: "settings", label: "Configuración", ic: Ic.cog },
  { id: "help", label: "Ayuda & docs", ic: Ic.hlp },
];

export function AdminSidebar() {
  const active = usePathname().split("/")[2] || "dashboard";

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="mark">K</div>
        <div>
          <div className="lbl">コンビニ</div>
          <div className="name">Konbini Admin</div>
        </div>
      </div>
      {ITEMS.map((it, i) =>
        "group" in it ? (
          <div key={i} className="sb-section">{it.group}</div>
        ) : (
          <Link
            key={it.id}
            href={`/admin/${it.id}`}
            className={`sb-link ${active === it.id ? "on" : ""}`}
          >
            {it.ic} <span>{it.label}</span>
            {it.badge && <span className="badge">{it.badge}</span>}
          </Link>
        ),
      )}
      <div className="sb-foot">
        <div className="sb-user">
          <div className="av">GB</div>
          <div style={{ minWidth: 0 }}>
            <div className="nm">Gabriel Burgos</div>
            <div className="ro">SUPER ADMIN</div>
          </div>
          <button
            className="icon-btn sq"
            style={{ marginLeft: "auto", width: 30, height: 30 }}
            title="Salir"
          >
            {Ic.chev}
          </button>
        </div>
      </div>
    </aside>
  );
}
