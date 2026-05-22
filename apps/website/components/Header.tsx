"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./BrandMark";
import { Ic } from "./icons";
import { ProfileModal } from "./ProfileModal";
import { useTheme, useUser } from "./providers";
import type { ApiCategory } from "@/lib/api";

export function Header({ categories = [] }: { categories?: ApiCategory[] }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const el = headerRef.current;
        if (el) {
          if (y < 80) {
            el.classList.remove("headroom--hidden");
          } else if (y - lastY > 4) {
            el.classList.add("headroom--hidden");
          } else if (lastY - y > 4) {
            el.classList.remove("headroom--hidden");
          }
        }
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active =
    pathname === "/"
      ? "home"
      : pathname.startsWith("/categoria/")
        ? pathname.split("/")[2]
        : "";

  return (
    <header className="app" ref={headerRef}>
      <div className="container nav-wrap">
        <div className="row" style={{ gap: 32 }}>
          <Link href="/" style={{ cursor: "pointer" }}>
            <BrandMark />
          </Link>
          <nav className="cats">
            <button
              className={active === "home" ? "active" : ""}
              onClick={() => router.push("/")}
            >
              Inicio
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={active === c.slug ? "active" : ""}
                onClick={() => router.push(`/categoria/${c.slug}`)}
              >
                {c.name ?? c.slug}
              </button>
            ))}
          </nav>
        </div>
        <div className="head-actions" style={{ position: "relative" }}>
          <button className="icon-btn" title="Buscar" onClick={() => router.push("/busqueda")}>
            {Ic.search}
          </button>
          <button
            className="icon-btn"
            title="Tema"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? Ic.sun : Ic.moon}
          </button>
          {!user ? (
            <>
              <Link className="btn ghost" href={`/login?returnTo=${encodeURIComponent(pathname)}`}>Ingresar</Link>
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
                    <button onClick={() => { router.push("/dashboard"); setMenu(false); }}>🛠 Panel de administración</button>
                  )}
                  <button onClick={() => { setProfileOpen(true); setMenu(false); }}>👤 Editar perfil</button>
                  <button onClick={() => { router.push("/cuenta"); setMenu(false); }}>📋 Mis publicaciones</button>
                  <button onClick={() => { router.push("/cuenta"); setMenu(false); }}>🎫 Mis entradas</button>
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
