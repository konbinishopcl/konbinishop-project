"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Megaphone,
  Layers,
  FileText,
  CreditCard,
  Repeat2,
  Mail,
  Camera,
  Clapperboard,
  Users,
  Tag,
  Tags,
  Globe,
  Map,
  MapPin,
  HelpCircle,
  UserCog,
  BarChart2,
  ScrollText,
  Settings,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { UserMenu } from "@/components/UserMenu";
import { useUser } from "@/components/providers";

type NavItem = {
  label:     string;
  ic:        LucideIcon;
  href:      string;
  superOnly?: boolean;
};

type NavGroup = {
  grp:            string;
  superAdminOnly?: boolean;
  items:          NavItem[];
};

const ADMIN_NAV: NavGroup[] = [
  {
    grp: "INICIO",
    items: [
      { label: "Vista general", ic: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    grp: "EVENTOS",
    items: [
      { label: "Eventos",    ic: CalendarDays, href: "/dashboard/events" },
      { label: "Categorías", ic: Tag,          href: "/dashboard/event-categories" },
      { label: "Tags",       ic: Tags,         href: "/dashboard/event-tags" },
    ],
  },
  {
    grp: "NOTICIAS",
    items: [
      { label: "Artículos",  ic: FileText, href: "/dashboard/articles" },
      { label: "Categorías", ic: Tag,      href: "/dashboard/article-categories" },
      { label: "Tags",       ic: Tags,     href: "/dashboard/article-tags" },
    ],
  },
  {
    grp: "COMUNIDAD",
    items: [
      { label: "Usuarios",     ic: UserCog,    href: "/dashboard/users", superOnly: true },
      { label: "Contacto",     ic: Mail,       href: "/dashboard/contact" },
      { label: "CRM",          ic: Users,      href: "/dashboard/crm" },
    ],
  },
  {
    grp: "COMERCIAL",
    items: [
      { label: "Pagos & ventas",  ic: CreditCard,   href: "/dashboard/payments" },
      { label: "Suscripciones",   ic: Repeat2,      href: "/dashboard/subscriptions" },
      { label: "Avisos",          ic: Megaphone,    href: "/dashboard/spots" },
      { label: "Portadas",        ic: Layers,       href: "/dashboard/heroes" },
      { label: "Fotografía",      ic: Camera,       href: "/dashboard/photography" },
      { label: "Creadores",       ic: Clapperboard, href: "/dashboard/content-creators" },
    ],
  },
  {
    grp: "CATÁLOGOS",
    items: [
      { label: "Países",     ic: Globe,  href: "/dashboard/countries" },
      { label: "Divisiones", ic: Map,    href: "/dashboard/states" },
      { label: "Ciudades",   ic: MapPin, href: "/dashboard/cities" },
    ],
  },
  {
    grp: "SISTEMA",
    superAdminOnly: true,
    items: [
      { label: "FAQ",              ic: HelpCircle, href: "/dashboard/faq" },
      { label: "Reportes",         ic: BarChart2,  href: "/dashboard/reports" },
      { label: "Logs & auditoría", ic: ScrollText, href: "/dashboard/logs" },
      { label: "Configuración",    ic: Settings,   href: "/dashboard/settings" },
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

  const SUB_PAGES: Record<string, { label: string; crumb: string }> = {
    "/dashboard/settings/terms":   { label: "Términos y condiciones", crumb: "CONFIGURACIÓN / TÉRMINOS" },
    "/dashboard/settings/privacy": { label: "Política de privacidad", crumb: "CONFIGURACIÓN / PRIVACIDAD" },
    "/dashboard/settings/cookies": { label: "Política de cookies",    crumb: "CONFIGURACIÓN / COOKIES" },
    "/dashboard/events/new":       { label: "Crear evento",           crumb: "EVENTOS / NUEVO" },
    "/dashboard/articles/new":     { label: "Crear artículo",         crumb: "ARTÍCULOS / NUEVO" },
  };

  const editMatch = pathname.match(/^\/dashboard\/events\/(\d+)\/edit$/);
  if (editMatch) {
    SUB_PAGES[pathname] = { label: "Editar evento", crumb: "EVENTOS / EDITAR" };
  }

  const articleEditMatch = pathname.match(/^\/dashboard\/articles\/([^/]+)\/edit$/);
  if (articleEditMatch) {
    SUB_PAGES[pathname] = { label: "Editar artículo", crumb: "ARTÍCULOS / EDITAR" };
  }

  const allItems  = ADMIN_NAV.flatMap((g) => g.items);
  const subPage   = SUB_PAGES[pathname];
  const cur       = subPage ?? allItems.find((i) => isActive(i.href)) ?? ADMIN_NAV[0].items[0];
  const crumbPrefix = subPage?.crumb ?? `${activeGroup} / ${cur.label.toUpperCase()}`;
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
                <ChevronRight size={12} className="chev" />
                <span>{g.grp}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.5 }}>
                  {g.items.length}
                </span>
              </button>
              <div className={`grp-items ${!openGroups[g.grp] ? "closed" : ""}`}>
                {g.items.map((i) => {
                  const Icon = i.ic;
                  return (
                    <Link
                      key={i.href}
                      href={i.href}
                      className={`nav-item${isActive(i.href) ? " on" : ""}${i.superOnly ? " super" : ""}`}
                    >
                      <Icon size={15} style={{ flexShrink: 0, opacity: 0.7 }} />
                      <span>{i.label}</span>
                    </Link>
                  );
                })}
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
            <div className="crumb">{crumbPrefix}</div>
            <h1>{cur.label}</h1>
          </div>
          <UserMenu size={36} />
        </div>
        <div className="admin-body">
          {children}
        </div>
      </div>
    </div>
  );
}
