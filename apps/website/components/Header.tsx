"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./BrandMark";
import { Ic } from "./icons";
import { NewsMegaMenu } from "./NewsMegaMenu";
import { SearchLightbox } from "./SearchLightbox";
import { useTheme, useUser } from "./providers";
import { UserMenu } from "./UserMenu";
import type { ApiEventCategory, ApiArticleCategory, ApiArticleTag } from "@/lib/api";

export function Header({
  categories = [],
  articleCategories = [],
  topTags = [],
}: {
  categories?: ApiEventCategory[];
  articleCategories?: ApiArticleCategory[];
  topTags?: ApiArticleTag[];
}) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [catsOpen, setCatsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newsMenuOpen, setNewsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
            : (pathname.startsWith("/ayuda") || pathname.startsWith("/preguntas-frecuentes") || pathname.startsWith("/terminos-y-condiciones") || pathname.startsWith("/politica-de-privacidad") || pathname.startsWith("/contacto"))
              ? "help"
              : "";

  const topCats = categories.slice(0, 4);
  const moreCats = categories.slice(4);

  const go = (href: string) => {
    setMobileOpen(false);
    router.push(href);
  };

  return (
    <>
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
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setNewsMenuOpen(true)}
            >
              <button
                className={active === "news" ? "active" : ""}
                onClick={() => router.push("/noticias")}
              >
                Noticias
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ marginLeft: 4, opacity: 0.6, transform: newsMenuOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
            <button
              className={active === "about" ? "active" : ""}
              onClick={() => router.push("/nosotros")}
            >
              About
            </button>
            <button
              className={active === "help" ? "active" : ""}
              onClick={() => router.push("/contacto")}
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
            onClick={() => setSearchOpen(true)}
          >
            {Ic.search}
          </button>
          <button className="icon-btn" title="Tema" onClick={toggleTheme}>
            {theme === "dark" ? Ic.sun : Ic.moon}
          </button>

          {user && (
            <button className="icon-btn" title="Notificaciones" onClick={() => router.push("/cuenta/mensajes")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
          )}

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
              <UserMenu />
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
            <button onClick={() => go("/contacto")}>Contacto</button>
            <button onClick={() => { setMobileOpen(false); setSearchOpen(true); }}>Buscar</button>
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
    {newsMenuOpen && (
      <NewsMegaMenu categories={articleCategories} onClose={() => setNewsMenuOpen(false)} />
    )}
    <SearchLightbox open={searchOpen} onClose={() => setSearchOpen(false)} articleCategories={articleCategories} topTags={topTags} />
    </>
  );
}
