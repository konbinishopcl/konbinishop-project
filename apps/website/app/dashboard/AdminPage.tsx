"use client";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { BrandMark } from "@/components/BrandMark";
import { useUser } from "@/components/providers";

import HomeSection from "./sections/HomeSection";
import EventsSection from "./sections/EventsSection";
import ArticlesSection from "./sections/ArticlesSection";
import UsersSection from "./sections/UsersSection";
import PaymentsSection from "./sections/PaymentsSection";
import SubsSection from "./sections/SubsSection";
import InboxSection from "./sections/InboxSection";
import CRMSection from "./sections/CRMSection";
import CategoriesSection from "./sections/CategoriesSection";
import SpotsSection from "./sections/SpotsSection";
import HeroesSection from "./sections/HeroesSection";
import FAQSection from "./sections/FAQSection";
import ReportsSection from "./sections/ReportsSection";
import LogsSection from "./sections/LogsSection";
import SettingsSection from "./sections/SettingsSection";

const ADMIN_NAV = [
  {
    grp: "OPERACIÓN",
    items: [
      { id: "home", label: "Inicio", ic: "◉", crumb: "INICIO" },
      { id: "events", label: "Eventos", ic: "▦", crumb: "EVENTOS" },
      { id: "articles", label: "Artículos", ic: "▤", crumb: "ARTÍCULOS" },
      { id: "users", label: "Usuarios", ic: "◎", crumb: "USUARIOS" },
    ],
  },
  {
    grp: "COMERCIO",
    items: [
      { id: "payments", label: "Pagos", ic: "$", crumb: "PAGOS" },
      { id: "subs", label: "Suscripciones", ic: "★", crumb: "SUSCRIPCIONES" },
    ],
  },
  {
    grp: "MENSAJES",
    items: [
      { id: "contact", label: "Contacto", ic: "✉", crumb: "CONTACTO" },
      { id: "photo", label: "Fotografía", ic: "◐", crumb: "FOTOGRAFÍA" },
      { id: "creators", label: "Creadores", ic: "◑", crumb: "CREADORES" },
      { id: "crm", label: "CRM", ic: "▣", crumb: "CRM" },
    ],
  },
  {
    grp: "CATÁLOGO",
    items: [
      { id: "categories", label: "Categorías", ic: "#", crumb: "CATEGORÍAS" },
      { id: "spots", label: "Avisos", ic: "▰", crumb: "AVISOS" },
      { id: "heroes", label: "Portadas", ic: "▶", crumb: "PORTADAS" },
      { id: "faq", label: "FAQ", ic: "?", crumb: "FAQ" },
    ],
  },
  {
    grp: "SISTEMA",
    items: [
      { id: "reports", label: "Reportes", ic: "△", crumb: "REPORTES" },
      { id: "logs", label: "Logs", ic: "≡", crumb: "LOGS" },
      { id: "settings", label: "Configuración", ic: "⚙", crumb: "CONFIGURACIÓN" },
    ],
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SECTIONS: Record<string, React.ComponentType<any>> = {
  home: HomeSection,
  events: EventsSection,
  articles: ArticlesSection,
  users: UsersSection,
  payments: PaymentsSection,
  subs: SubsSection,
  contact: InboxSection,
  photo: InboxSection,
  creators: InboxSection,
  crm: CRMSection,
  categories: CategoriesSection,
  spots: SpotsSection,
  heroes: HeroesSection,
  faq: FAQSection,
  reports: ReportsSection,
  logs: LogsSection,
  settings: SettingsSection,
};

export default function AdminPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const sel = params.get("section") ?? "home";
  const allItems = ADMIN_NAV.flatMap((g) => g.items);
  const cur = allItems.find((i) => i.id === sel) ?? ADMIN_NAV[0].items[0];
  const activeGroup = ADMIN_NAV.find((g) => g.items.some((i) => i.id === sel))?.grp;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    ADMIN_NAV.forEach((g) => {
      init[g.grp] = true;
    });
    return init;
  });

  // Auto-expand group containing the active section
  useEffect(() => {
    if (activeGroup) {
      setOpenGroups((o) => ({ ...o, [activeGroup]: true }));
    }
  }, [activeGroup]);

  const Section = SECTIONS[sel] ?? HomeSection;
  const inboxKind = sel === "photo" ? "photo" : sel === "creators" ? "creators" : "contact";

  const initials = user
    ? [user.name?.split(" ")[0]?.[0], user.name?.split(" ")[1]?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase() || "?"
    : "?";

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="brand-row">
          <Link href="/">
            <BrandMark />
          </Link>
          <div className="role">SUPER ADMIN</div>
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
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    opacity: 0.5,
                  }}
                >
                  {g.items.length}
                </span>
              </button>
              <div className={`grp-items ${!openGroups[g.grp] ? "closed" : ""}`}>
                {g.items.map((i) => (
                  <button
                    key={i.id}
                    className={`nav-item ${sel === i.id ? "on" : ""}`}
                    onClick={() => router.push(`/dashboard?section=${i.id}`)}
                  >
                    <span style={{ width: 18, textAlign: "center", opacity: 0.7 }}>{i.ic}</span>
                    <span>{i.label}</span>
                  </button>
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
            <div className="crumb">DASHBOARD / {cur.crumb ?? cur.label.toUpperCase()}</div>
            <h1>{cur.label}</h1>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link className="icon-btn" href="/" title="Ir al sitio">
              ↗
            </Link>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
              {initials}
            </div>
          </div>
        </div>
        <div className="admin-body">
          <Section kind={inboxKind} />
        </div>
      </div>
    </div>
  );
}
