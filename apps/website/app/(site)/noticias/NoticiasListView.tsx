"use client";
import { useEffect, useState } from "react";
import type { ApiArticleCategory } from "@/lib/api";
import type { ApiArticle } from "@/lib/api";
import { ArticleCard } from "@/components/ArticleCard";

/** Genera array de páginas con ellipsis. Ej: [1, "…", 4, 5, 6, "…", 12] */
function pageWindows(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [];
  const add = (p: number) => { if (!pages.includes(p)) pages.push(p); };
  add(1);
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) add(p);
  if (current < total - 2) pages.push("…");
  add(total);
  return pages;
}

const ChevL = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const ChevR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const PER_PAGE_OPTIONS = [12, 24, 48];

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  initialArticles: ApiArticle[];
  initialTotal: number;
  initialTotalPages: number;
  pageSize: number;
  categories: ApiArticleCategory[];
}

// ── Component ──────────────────────────────────────────────────────────────

export function NoticiasListView({
  initialArticles,
  initialTotal,
  initialTotalPages,
  pageSize,
  categories,
}: Props) {
  const [cat,        setCat]        = useState<string>("Todas");
  const [page,       setPage]       = useState(1);
  const [perPage,    setPerPage]    = useState(pageSize);
  const [articles,   setArticles]   = useState<ApiArticle[]>(initialArticles);
  const [total,      setTotal]      = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading,    setLoading]    = useState(false);
  const [mounted,    setMounted]    = useState(false);

  // Primer render: marca como montado para activar fetches en cliente
  useEffect(() => { setMounted(true); }, []);

  // Fetch cada vez que cambia page, perPage o cat (sólo después del montaje)
  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      page:     String(page),
      pageSize: String(perPage),
      ...(cat !== "Todas" ? { articleCategory: cat } : {}),
    });

    fetch(`/api/articles?${params}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (cancelled) return;
        setArticles(data.items ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => {
        if (!cancelled) { setArticles([]); setTotal(0); setTotalPages(1); }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [mounted, page, perPage, cat]);

  // Handlers
  function changeCat(slug: string) {
    setCat(slug);
    setPage(1);
  }
  function changePerPage(ps: number) {
    setPerPage(ps);
    setPage(1);
  }

  // Computed
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  return (
    <main className="container">
      {/* Header */}
      <div style={{ margin: "32px 0 24px" }}>
        <div className="eyebrow">NOTICIAS · ニュース</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(40px,5vw,64px)", margin: "12px 0 6px" }}
        >
          Lo último<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p style={{ color: "var(--ink-2)", margin: 0, maxWidth: "60ch" }}>
          Cobertura editorial de anime, manga, cine, gaming y cultura otaku.
        </p>
      </div>

      {/* Filter bar */}
      {categories.length > 0 && (
        <div className="fbar-sticky">
          <div className="fbar-inner">
            <div className="group">
              <button
                className={`sel ${cat === "Todas" ? "on" : ""}`}
                onClick={() => changeCat("Todas")}
              >
                Todas
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  className={`sel ${cat === c.slug ? "on" : ""}`}
                  onClick={() => changeCat(c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ margin: "60px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          Cargando artículos…
        </div>
      ) : articles.length === 0 ? (
        <div className="empty" style={{ margin: "60px 0" }}>
          Sin artículos en esta categoría.
        </div>
      ) : (
        <div className="card-grid" style={{ marginTop: 16, marginBottom: 16 }}>
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}

      {/* Pagination bar */}
      {!loading && total > 0 && (
        <div className="pag-bar">
          <div className="pag-info">
            <span>
              Mostrando{" "}
              <strong style={{ color: "var(--ink)" }}>{from}–{to}</strong>
              {" "}de{" "}
              <strong style={{ color: "var(--ink)" }}>{total}</strong>
              {" "}artículo{total !== 1 ? "s" : ""}
            </span>
            <span style={{ color: "var(--line)" }}>·</span>
            <span className="ips">
              <span>Mostrar</span>
              <select value={perPage} onChange={(e) => changePerPage(Number(e.target.value))}>
                {PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span>por página</span>
            </span>
          </div>
          <div className="pag-pages">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} title="Anterior">
              <ChevL />
            </button>
            {pageWindows(page, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`ell-${i}`} className="ell">…</span>
              ) : (
                <button key={p} className={page === p ? "on" : ""} onClick={() => setPage(p)}>
                  {p}
                </button>
              )
            )}
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} title="Siguiente">
              <ChevR />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
