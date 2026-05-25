"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./BrandMark";
import { Ic } from "./icons";
import { useTheme, useUser } from "./providers";
import type { ApiCategory } from "@/lib/api";

export function Header({ categories = [] }: { categories?: ApiCategory[] }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Headroom: hide on scroll down, show on scroll up
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
        : pathname.startsWith("/noticias")
          ? "news"
          : pathname.startsWith("/nosotros")
            ? "about"
            : pathname.startsWith("/ayuda")
              ? "help"
              : "";

  const topCats = categories.slice(0, 4);
  const moreCats = categories.slice(4);

  const go = (href: string) => {
    setMobileOpen(false);
    router.push(href);
  };

  return (
    <header className="app" ref={headerRef}>
      <div className="container nav-wrap">
        <div className="row" style={{ gap: 28 }}>
          <Link href="/" style={{ cursor: "pointer" }}>
            <BrandMark />
          </Link>
          <nav className="cats">
            {topCats.map((c) => (
              <button
                key={c.id}
                className={active === c.slug ? "active" : ""}
                onClick={() => router.push(`/categoria/${c.slug}`)}
              >
                {c.name ?? c.slug}
              </button>
            ))}
            {moreCats.length > 0 && (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setCatsOpen((o) => !o)}
                  title="Más categorías"
                  style={{ padding: "10px 14px" }}
                >
                  {Ic.plus}
                </button>
                {catsOpen && (
                  <div
                    className="menu"
                    onMouseLeave={() => setCatsOpen(false)}
                    style={{ minWidth: 200 }}
                  >
                    <div className="hdr">
                      <div
                        className="nm"
                        style={{
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          letterSpacing: ".15em",
                          color: "var(--ink-3)",
                          textTransform: "uppercase",
                        }}
                      >
                        Más categorías
                      </div>
                    </div>
                    {moreCats.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          router.push(`/categoria/${c.slug}`);
                          setCatsOpen(false);
                        }}
                      >
                        {c.name ?? c.slug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div
              style={{
                width: 1,
                height: 22,
                background: "var(--line)",
                margin: "0 8px",
                alignSelf: "center",
              }}
            />
            <button
              className={active === "news" ? "active" : ""}
              onClick={() => router.push("/noticias")}
            >
              Noticias
            </button>
            <button
              className={active === "about" ? "active" : ""}
              onClick={() => router.push("/nosotros")}
            >
              About
            </button>
            <button
              className={active === "help" ? "active" : ""}
              onClick={() => router.push("/ayuda")}
            >
              Contacto
            </button>
          </nav>
        </div>

        <div className="head-actions" style={{ position: "relative" }}>
          {/* Mobile hamburger */}
          <button
            className="nav-hamb"
            title="Menú"
            onClick={() => setMobileOpen(true)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          <button
            className="icon-btn"
            title="Buscar"
            onClick={() => router.push("/busqueda")}
          >
            {Ic.search}
          </button>
          <button className="icon-btn" title="Tema" onClick={toggleTheme}>
            {theme === "dark" ? Ic.sun : Ic.moon}
          </button>

          {!user ? (
            <>
              <Link
                className="btn ghost"
                href={`/login?returnTo=${encodeURIComponent(pathname)}`}
              >
                Ingresar
              </Link>
              <Link className="btn primary" href="/crear">
                ＋ Crear evento
              </Link>
            </>
          ) : (
            <>
              <Link className="btn primary" href="/crear">
                ＋ Crear evento
              </Link>
              <button
                className="avatar"
                onClick={() => setMenu((m) => !m)}
                title={user.name}
              >
                {user.initials}
              </button>
              {menu && (
                <div
                  className="menu"
                  onMouseLeave={() => setMenu(false)}
                  style={{ minWidth: 280 }}
                >
                  {/* Operando como */}
                  <div className="hdr">
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
                      Operando como
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 999, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                        {user.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="nm">{user.name}</div>
                        <div className="em" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Admin */}
                  {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                    <button onClick={() => { router.push("/dashboard"); setMenu(false); }}>
                      🛠 Panel de administración
                    </button>
                  )}

                  {/* Separador */}
                  <div style={{ height: 1, background: "var(--line)", margin: "6px 8px" }} />

                  {/* Cuenta */}
                  <button onClick={() => { router.push("/cuenta/perfil"); setMenu(false); }}>
                    👤 Mi cuenta
                  </button>
                  <button onClick={() => { router.push("/cuenta/publicaciones"); setMenu(false); }}>
                    📋 Mis eventos
                  </button>
                  <button onClick={() => { router.push("/cuenta/suscripcion"); setMenu(false); }}>
                    ✦ Suscripción
                  </button>
                  <button onClick={() => { router.push("/cuenta/favoritos"); setMenu(false); }}>
                    ♡ Favoritos
                  </button>

                  {/* Separador */}
                  <div style={{ height: 1, background: "var(--line)", margin: "6px 8px" }} />

                  <button className="danger" onClick={() => { logout(); setMenu(false); router.push("/"); }}>
                    ↩ Cerrar sesión
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="nav-overlay">
          <div className="o-top">
            <Link href="/" onClick={() => setMobileOpen(false)} style={{ cursor: "pointer" }}>
              <BrandMark />
            </Link>
            <button className="icon-btn" onClick={() => setMobileOpen(false)}>
              {Ic.close}
            </button>
          </div>
          <div className="o-section">
            <div className="o-label">Categorías</div>
            {categories.map((c) => (
              <button key={c.id} onClick={() => go(`/categoria/${c.slug}`)}>
                {c.name ?? c.slug}
              </button>
            ))}
          </div>
          <div className="o-section">
            <div className="o-label">Konbini</div>
            <button onClick={() => go("/noticias")}>Noticias</button>
            <button onClick={() => go("/nosotros")}>About</button>
            <button onClick={() => go("/ayuda")}>Contacto</button>
            <button onClick={() => go("/busqueda")}>Buscar</button>
          </div>
          {user && (
            <div className="o-section">
              <div className="o-label">Mi cuenta</div>
              <button onClick={() => go("/cuenta")}>Mi perfil</button>
              <button onClick={() => go("/cuenta")}>Mis eventos</button>
              <button onClick={() => go("/cuenta")}>Favoritos</button>
            </div>
          )}
          <div className="o-foot">
            {!user ? (
              <>
                <Link
                  className="btn ghost lg"
                  href={`/login?returnTo=${encodeURIComponent(pathname)}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Ingresar
                </Link>
                <Link
                  className="btn primary lg"
                  href="/crear"
                  onClick={() => setMobileOpen(false)}
                >
                  ＋ Crear evento
                </Link>
              </>
            ) : (
              <>
                <Link
                  className="btn primary lg"
                  href="/crear"
                  onClick={() => setMobileOpen(false)}
                >
                  ＋ Crear evento
                </Link>
                <button
                  className="btn ghost lg"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                    router.push("/");
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
