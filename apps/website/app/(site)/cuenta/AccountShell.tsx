"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/components/providers";

const TABS = [
  { id: "perfil",        href: "/cuenta/perfil",        label: "Perfil" },
  { id: "organizaciones",href: "/cuenta/organizaciones", label: "Organizaciones" },
  { id: "suscripcion",   href: "/cuenta/suscripcion",    label: "Suscripción" },
  { id: "publicaciones", href: "/cuenta/publicaciones",  label: "Mis eventos" },
  { id: "articulos",     href: "/cuenta/articulos",      label: "Artículos" },
  { id: "favoritos",     href: "/cuenta/favoritos",      label: "Favoritos" },
  { id: "mensajes",      href: "/cuenta/mensajes",       label: "Mensajes" },
  { id: "pagos",         href: "/cuenta/pagos",          label: "Pagos" },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const { user, logout } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const onLogout = () => {
    logout();
    router.push("/");
  };

  const initials = user?.initials ?? user?.name?.[0] ?? "?";

  return (
    <main className="container acc-shell">
      <aside className="acc-side">
        <div className="who">
          <div className="av">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nm">{user?.name ?? "Usuario"}</div>
            <div className="em">{user?.email ?? ""}</div>
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
