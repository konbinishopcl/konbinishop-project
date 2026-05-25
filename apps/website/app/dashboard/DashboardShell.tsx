"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { useUser } from "@/components/providers";

const ADMIN_NAV = [
  {
    grp: "INICIO",
    items: [
      { label: "Vista general", ic: "◉", href: "/dashboard" },
    ],
  },
  {
    grp: "MODERACIÓN",
    items: [
      { label: "Eventos",   ic: "▦", href: "/dashboard/events" },
      { label: "Avisos",    ic: "▰", href: "/dashboard/spots" },
      { label: "Portadas",  ic: "▶", href: "/dashboard/heroes" },
      { label: "Artículos", ic: "▤", href: "/dashboard/articles" },
    ],
  },
  {
    grp: "COMERCIAL",
    items: [
      { label: "Pagos & ventas",    ic: "$", href: "/dashboard/payments" },
      { label: "Suscripciones",     ic: "★", href: "/dashboard/subscriptions" },
      { label: "Contacto",          ic: "✉", href: "/dashboard/contact" },
      { label: "Fotografía",        ic: "◐", href: "/dashboard/photography" },
      { label: "Creadores",         ic: "◑", href: "/dashboard/content-creators" },
      { label: "CRM",               ic: "▣", href: "/dashboard/crm" },
    ],
  },
  {
    grp: "MANTENEDORES",
    items: [
      { label: "Categorías",        ic: "#", href: "/dashboard/categories" },
      { label: "Tags",              ic: "#", href: "/dashboard/tags" },
      { label: "Países",            ic: "⊕", href: "/dashboard/countries" },
      { label: "Divisiones",        ic: "⊕", href: "/dashboard/states" },
      { label: "Ciudades",          ic: "⊕", href: "/dashboard/cities" },
      { label: "FAQ",               ic: "?", href: "/dashboard/faq" },
    ],
  },
  {
    grp: "SISTEMA",
    superAdminOnly: true,
    items: [
      { label: "Usuarios",          ic: "◎", href: "/dashboard/users",    superOnly: true },
      { label: "Reportes",          ic: "△", href: "/dashboard/reports" },
      { label: "Logs & auditoría",  ic: "≡", href: "/dashboard/logs" },
      { label: "Configuración",     ic: "⚙", href: "/dashboard/settings" },
    ],
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const activeGroup = ADMIN_NAV.find((g) =>
    g.items.some((i) => isActive(i.href))
  )?.grp ?? "INICIO";

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ADMIN_NAV.forEach((g, i) => {
      init[g.grp] = i === 0 || g.grp === activeGroup;
    });
    return init;
  });

  const allItems = ADMIN_NAV.flatMap((g) => g.items);
  const cur = allItems.find((i) => isActive(i.href)) ?? ADMIN_NAV[0].items[0];

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const initials = user
    ? [user.name?.split(" ")[0]?.[0], user.name?.split(" ")[1]?.[0]]
        .filter(Boolean).join("").toUpperCase() || "?"
    : "?";

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="brand-row">
          <Link href="/"><BrandMark /></Link>
          <div className="role">{isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}</div>
        </div>

        <div className="scroll">
          {ADMIN_NAV.map((g) => (
            <div key={g.grp}>
              <button
                className={`grp ${openGroups[g.grp] ? "open" : ""}`}
                onClick={() => setOpenGroups((o) => ({ ...o, [g.grp]: !o[g.grp] }))}
              >
                <span className="chev">▶</span>
                <span>{g.grp}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.5 }}>
                  {g.items.length}
                </span>
              </button>
              <div className={`grp-items ${!openGroups[g.grp] ? "closed" : ""}`}>
                {g.items.map((i) => (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={`nav-item${isActive(i.href) ? " on" : ""}${"superOnly" in i && i.superOnly ? " super" : ""}`}
                  >
                    <span style={{ width: 18, textAlign: "center", opacity: 0.7 }}>{i.ic}</span>
                    <span>{i.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="who">
          <div className="av">{initials}</div>
          <div>
            <div className="nm">{user?.name ?? "Admin"}</div>
            <div className="em">{user?.email ?? ""}</div>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-top">
          <div>
            <div className="crumb">DASHBOARD / {cur.label.toUpperCase()}</div>
            <h1>{cur.label}</h1>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link className="icon-btn" href="/" title="Ir al sitio">↗</Link>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initials}</div>
          </div>
        </div>
        <div className="admin-body">
          {children}
        </div>
      </div>
    </div>
  );
}
