"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "./BrandMark";
import { Ic } from "./icons";
import { ProfileModal } from "./ProfileModal";
import { useTheme, useUser } from "./providers";
import { CATEGORIES } from "@/lib/data";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const active =
    pathname === "/"
      ? "home"
      : pathname.startsWith("/categoria/")
        ? pathname.split("/")[2]
        : "";

  return (
    <header className="app">
      <div className="container nav-wrap">
        <div className="row" style={{ gap: 32 }}>
          <Link href="/" style={{ cursor: "pointer" }}>
            <BrandMark />
          </Link>
          <nav className="cats">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={active === c.id ? "active" : ""}
                onClick={() => router.push(c.id === "home" ? "/" : `/categoria/${c.id}`)}
              >
                {c.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="head-actions" style={{ position: "relative" }}>
          <button className="icon-btn" title="Buscar">{Ic.search}</button>
          <button
            className="icon-btn"
            title="Tema"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? Ic.sun : Ic.moon}
          </button>
          {!user ? (
            <>
              <Link className="btn ghost" href="/login">Ingresar</Link>
              <Link className="btn primary" href="/crear">＋ Crear evento</Link>
            </>
          ) : (
            <>
              <Link className="btn primary" href="/crear">＋ Crear evento</Link>
              <button className="avatar" onClick={() => setMenu((m) => !m)} title={user.name}>
                {user.initials}
              </button>
              {menu && (
                <div className="menu" onMouseLeave={() => setMenu(false)}>
                  <div className="hdr">
                    <div className="nm">{user.name}</div>
                    <div className="em">{user.email}</div>
                  </div>
                  {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                    <button onClick={() => { router.push("/admin"); setMenu(false); }}>🛠 Panel de administración</button>
                  )}
                  <button onClick={() => { setProfileOpen(true); setMenu(false); }}>👤 Editar perfil</button>
                  <button onClick={() => { router.push("/dashboard"); setMenu(false); }}>📋 Mis publicaciones</button>
                  <button onClick={() => { router.push("/dashboard"); setMenu(false); }}>🎫 Mis entradas</button>
                  <button onClick={() => setMenu(false)}>⚙️ Configuración</button>
                  <button
                    className="danger"
                    onClick={() => { logout(); setMenu(false); router.push("/"); }}
                  >
                    ↩  Cerrar sesión
                  </button>
                </div>
              )}
              {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
