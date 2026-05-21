"use client";

import { usePathname } from "next/navigation";
import { Ic } from "./icons";
import { useTheme } from "@/components/providers";

const CRUMBS: Record<string, string[]> = {
  dashboard: ["Konbini Admin", "Dashboard"],
  events: ["Konbini Admin", "Catálogo", "Eventos"],
  users: ["Konbini Admin", "Usuarios"],
  payments: ["Konbini Admin", "Pagos & ventas"],
  categories: ["Konbini Admin", "Contenido", "Categorías"],
  reports: ["Konbini Admin", "Reportes"],
  logs: ["Konbini Admin", "Logs & auditoría"],
  settings: ["Konbini Admin", "Configuración"],
  help: ["Konbini Admin", "Ayuda"],
};

export function AdminTopbar() {
  const { theme, setTheme } = useTheme();
  const seg = usePathname().split("/")[2] || "dashboard";
  const crumbs = CRUMBS[seg] ?? ["Konbini Admin"];

  return (
    <div className="topbar">
      <div className="breadcrumbs">
        {crumbs.map((c, i) => (
          <span key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span className={i === crumbs.length - 1 ? "curr" : ""}>{c}</span>
          </span>
        ))}
      </div>
      <div className="topbar-actions">
        <div className="search-shell">
          {Ic.search}
          <input placeholder="Buscar en todo el panel… (eventos, usuarios, pagos)" />
          <span className="kbd">⌘K</span>
        </div>
        <button className="icon-btn notif" title="Notificaciones">
          {Ic.bell}
          <span className="dot" />
        </button>
        <button
          className="icon-btn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Tema"
        >
          {theme === "dark" ? Ic.sun : Ic.moon}
        </button>
      </div>
    </div>
  );
}
