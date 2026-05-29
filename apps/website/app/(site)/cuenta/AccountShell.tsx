"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/components/providers";

const TABS = [
  { id: "perfil",         href: "/cuenta/perfil",         label: "Perfil" },
  { id: "organizaciones", href: "/cuenta/organizaciones", label: "Organizaciones" },
  { id: "suscripcion",    href: "/cuenta/suscripcion",    label: "Suscripción" },
  { id: "publicaciones",  href: "/cuenta/publicaciones",  label: "Mis eventos" },
  { id: "mis-avisos",     href: "/cuenta/mis-avisos",     label: "Mis avisos" },
  { id: "mis-portadas",   href: "/cuenta/mis-portadas",   label: "Mis portadas" },
  { id: "articulos",      href: "/cuenta/articulos",      label: "Artículos" },
  { id: "favoritos",      href: "/cuenta/favoritos",      label: "Favoritos" },
  { id: "mensajes",       href: "/cuenta/mensajes",       label: "Mensajes" },
  { id: "pagos",          href: "/cuenta/pagos",          label: "Pagos" },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const { user, isOrgContext, logout } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const onLogout = () => {
    logout();
    router.push("/");
  };

  const displayName = user?.name ?? "Usuario";
  const displayEmail = isOrgContext && user?.handle ? `@${user.handle}` : (user?.email ?? "");
  const displayInitials = user?.initials ?? "?";

  return (
    <main className="container acc-shell">
      <aside className="acc-side">
        <div className="who">
          <div className="av" style={isOrgContext ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff" } : undefined}>{displayInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nm">{displayName}</div>
            <div className="em">{displayEmail}</div>
            {isOrgContext && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".12em", color: "var(--accent)", marginTop: 2, textTransform: "uppercase" }}>
                Operando como {displayName}
              </div>
            )}
          </div>
        </div>
        <nav className="acc-nav">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className={`acc-tab${pathname === t.href ? " on" : ""}`}
            >
              {t.label}
            </Link>
          ))}
          <div className="sep" />
          <button className="logout" onClick={onLogout}>
            Cerrar sesión
          </button>
        </nav>
      </aside>
      <div className="acc-body">
        {children}
      </div>
    </main>
  );
}
