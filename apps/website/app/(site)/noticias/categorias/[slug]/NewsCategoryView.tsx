"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { imageUrl } from "@/lib/api";
import { ArticleCard, formatDate, getCat, readingTime } from "@/components/ArticleCard";
import type { ApiArticle, ApiArticleCategory } from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────

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

const SORT_OPTIONS = ["Más recientes", "A-Z"] as const;
const TYPE_OPTIONS = ["Todos", "Artículos", "Entrevistas", "Reseñas"] as const;
const ORIGEN_OPTIONS = ["Todos", "Editoriales", "Patrocinados"] as const;
const PER_PAGE_OPTIONS = [12, 24, 48];

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  category: ApiArticleCategory;
  initialArticles: ApiArticle[];
  initialTotal: number;
  initialTotalPages: number;
  pageSize: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export function NewsCategoryView({
  category,
  initialArticles,
  initialTotal,
  initialTotalPages,
  pageSize,
}: Props) {
  // ── State ──────────────────────────────────────────────────────────────
  const [articles, setArticles]     = useState<ApiArticle[]>(initialArticles);
  const [total, setTotal]           = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading]       = useState(false);
  const [mounted, setMounted]       = useState(false);

  // Filters (client-side)
  const [period, setPeriod]         = useState<string | null>(null);
  const [type, setType]             = useState<string>("Todos");
  const [origen, setOrigen]         = useState<string>("Todos");
  const [q, setQ]                   = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // View + Sort + Pagination
  const [view, setView]             = useState<"grid" | "list">("grid");
  const [sort, setSort]             = useState<string>("Más recientes");
  const [page, setPage]             = useState(1);
  const [perPage, setPerPage]       = useState(pageSize);

  // Pop dropdown state
  const [openPop, setOpenPop]       = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      articleCategory: category.slug,
      page: String(page),
      pageSize: String(perPage),
    });

    fetch(`/api/articles?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
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
  }, [mounted, category.slug, page, perPage]);

  // ── Client-side filters ────────────────────────────────────────────────
  let filtered = [...articles];

  // Origen filter
  if (origen === "Editoriales") filtered = filtered.filter((a) => !a.isSponsored);
  if (origen === "Patrocinados") filtered = filtered.filter((a) => a.isSponsored);

  // Period filter (client-side approximation)
  if (period === "Hoy") {
    const today = new Date().toISOString().slice(0, 10);
    filtered = filtered.filter((a) => a.createdAt.slice(0, 10) === today);
  } else if (period === "Esta semana") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    filtered = filtered.filter((a) => new Date(a.createdAt) >= cutoff);
  }

  // Search filter
  if (q.trim()) {
    const lq = q.toLowerCase();
    filtered = filtered.filter((a) => a.title.toLowerCase().includes(lq));
  }

  // Sort
  if (sort === "A-Z") {
    filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title, "es"));
  }
  // "Más recientes" = default API order (already desc by createdAt)

  // ── Active filter count ────────────────────────────────────────────────
  const activeCount =
    (type !== "Todos" ? 1 : 0) +
    (origen !== "Todos" ? 1 : 0) +
    (period ? 1 : 0) +
    (q.trim() ? 1 : 0);

  function clearAll() {
    setType("Todos");
    setOrigen("Todos");
    setPeriod(null);
    setQ("");
    setPage(1);
  }

  // ── Pagination derived ─────────────────────────────────────────────────
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, total);

  // ── Pop dropdown helper ────────────────────────────────────────────────
  function Pop({
    id, label, options, value, onPick, icon, dflt,
  }: {
    id: string; label: string; options: readonly string[]; value: string;
    onPick: (v: string) => void; icon?: React.ReactNode; dflt: string;
  }) {
    return (
      <div style={{ position: "relative" }}>
        <button
          className={`sel ${openPop === id ? "on" : ""} ${value !== dflt ? "on" : ""}`}
          onClick={() => setOpenPop(openPop === id ? null : id)}
          title={label}
        >
          {icon}
          <strong style={{ fontWeight: 600 }}>{value}</strong>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 4 }}><polyline points="6 9 12 15 18 9" /></svg>
        </button>
        {openPop === id && (
          <div className="menu" style={{ top: 44, left: 0, minWidth: 200 }} onMouseLeave={() => setOpenPop(null)}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".15em", color: "var(--ink-3)", textTransform: "uppercase", padding: "8px 12px 4px" }}>
              {label}
            </div>
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { onPick(o); setOpenPop(null); }}
                style={value === o ? { background: "var(--surface-2)", color: "var(--ink)" } : undefined}
              >
                {value === o && <span style={{ color: "var(--accent)", marginRight: 4 }}>✓</span>}
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="container">
      {/* ── BACK LINK ──────────────────────────────────────────────── */}
      <Link
        href="/noticias/categorias"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)", fontSize: 13, marginTop: 24, marginBottom: 4 }}
      >
        <ChevL /> Volver a todas las categorías
      </Link>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ margin: "8px 0 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="eyebrow">
            NOTICIAS · {category.nameJa ?? "ニュース"}
          </div>
          <h1 className="display" style={{ fontSize: 64, margin: "12px 0 6px" }}>
            {category.name ?? category.slug}
            <span style={{ color: "var(--accent)" }}>.</span>
          </h1>
          <p style={{ color: "var(--ink-2)", margin: 0, maxWidth: "60ch" }}>
            <strong style={{ color: "var(--ink)" }}>{total} artículo{total !== 1 ? "s" : ""}</strong>
            {" "}· cobertura editorial de {(category.name ?? category.slug).toLowerCase()} en Konbini.
          </p>
        </div>
        <div
          className="jp"
          style={{ fontSize: 80, color: "var(--ink-3)", opacity: 0.3, lineHeight: 0.9, fontWeight: 900 }}
        >
          {category.nameJa ?? "ニュース"}
        </div>
      </div>

      {/* ── FILTER BAR ─────────────────────────────────────────────── */}
      <div className="fbar-sticky">
        <div className="fbar-inner">
          {/* Grupo 1: Period */}
          <div className="group">
            {["Hoy", "Esta semana"].map((p) => (
              <button
                key={p}
                className={`sel ${period === p ? "on" : ""}`}
                onClick={() => { setPeriod(period === p ? null : p); setPage(1); }}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="vline" />

          {/* Grupo 2: Tipo + Origen + Limpiar */}
          <div className="group">
            <Pop
              id="type"
              label="Tipo"
              options={TYPE_OPTIONS}
              value={type}
              onPick={(v) => { setType(v); setPage(1); }}
              dflt="Todos"
              icon={
                <span style={{ display: "inline-flex", marginRight: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 6h16M4 12h12M4 18h8" />
                  </svg>
                </span>
              }
            />
            <Pop
              id="origen"
              label="Origen"
              options={ORIGEN_OPTIONS}
              value={origen}
              onPick={(v) => { setOrigen(v); setPage(1); }}
              dflt="Todos"
              icon={
                <span style={{ display: "inline-flex", marginRight: 6, fontWeight: 700, fontSize: 14 }}>✦</span>
              }
            />
            {activeCount > 0 && (
              <button className="sel" style={{ color: "var(--accent)" }} onClick={clearAll}>
                ✕ Limpiar ({activeCount})
              </button>
            )}
          </div>

          {/* Grupo 3: Buscar + Grid/Lista + Ordenar */}
          <div className="group" style={{ marginLeft: "auto" }}>
            {/* Buscador inline */}
            <div style={{ position: "relative" }}>
              <button
                className={`sel ${searchOpen ? "on" : ""} ${q ? "on" : ""}`}
                onClick={() => setSearchOpen((o) => !o)}
                title="Buscar"
              >
                <span style={{ display: "inline-flex", marginRight: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                </span>
                <strong style={{ fontWeight: 600 }}>{q || "Buscar"}</strong>
              </button>
              {searchOpen && (
                <div
                  className="menu"
                  style={{ top: 44, right: 0, left: "auto", minWidth: 280, padding: 12 }}
                  onMouseLeave={() => setSearchOpen(false)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface-2)", borderRadius: 10, padding: "8px 12px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                    <input
                      autoFocus
                      placeholder={`Buscar en ${category.name ?? category.slug}…`}
                      value={q}
                      onChange={(e) => { setQ(e.target.value); setPage(1); }}
                      style={{ flex: 1, padding: 0, background: "transparent", border: 0, outline: "none", fontSize: 14 }}
                    />
                    {q && (
                      <button
                        onClick={() => setQ("")}
                        style={{ padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Grid / Lista toggle */}
            <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 999, padding: 3, background: "var(--surface)" }}>
              <button
                className={`sel ${view === "grid" ? "on" : ""}`}
                onClick={() => setView("grid")}
                title="Grilla"
                style={{ border: 0, padding: "6px 10px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                className={`sel ${view === "list" ? "on" : ""}`}
                onClick={() => setView("list")}
                title="Lista"
                style={{ border: 0, padding: "6px 10px" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                </svg>
              </button>
            </div>

            {/* Sort */}
            <Pop
              id="sort"
              label="Ordenar"
              options={SORT_OPTIONS}
              value={sort}
              onPick={(v) => { setSort(v); setPage(1); }}
              dflt="Más recientes"
              icon={
                <span style={{ display: "inline-flex", marginRight: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 6h13M3 12h9M3 18h5M17 8V4l3 3M17 16v4l3-3"/>
                  </svg>
                </span>
              }
            />
          </div>
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ margin: "60px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          Cargando artículos…
        </div>
      ) : filtered.length === 0 ? (
        <div className="acc-empty" style={{ margin: "40px 0 60px" }}>
          <div className="ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
            </svg>
          </div>
          <h3>No hay artículos con esos filtros</h3>
          <p>Prueba ampliando los filtros o quitando alguno.</p>
          {activeCount > 0 && (
            <button className="btn ghost" onClick={clearAll}>Limpiar filtros</button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="card-grid" style={{ marginTop: 16, marginBottom: 24 }}>
          {filtered.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      ) : (
        <div className="list-grid" style={{ marginTop: 16, marginBottom: 24 }}>
          {filtered.map((a) => (
            <Link
              key={a.id}
              className="list-row"
              href={`/noticias/${a.slug}`}
            >
              <div className="l-img">
                <div
                  className="pic"
                  style={{ backgroundImage: a.image ? `url(${imageUrl(a.image)})` : "linear-gradient(135deg,#2a1410,#4a1820)" }}
                />
                <span className="cat-tag">{getCat(a).toUpperCase()}</span>
              </div>
              <div className="l-info">
                <div className="l-date">
                  {formatDate(a.createdAt)} · {readingTime(a.content ?? "")} lectura
                </div>
                <h3 className="l-title">{a.title}</h3>
                {a.excerpt && (
                  <div className="l-place" style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 0 }}>
                    {a.excerpt.length > 100 ? a.excerpt.slice(0, 100) + "…" : a.excerpt}
                  </div>
                )}
                {a.isSponsored && (
                  <span className="pill" style={{ marginTop: 8, fontSize: 10, display: "inline-flex" }}>
                    ARTÍCULO PATROCINADO
                  </span>
                )}
              </div>
              <div />
              <span style={{ color: "var(--ink-3)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* ── PAGINATION ─────────────────────────────────────────────── */}
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
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              >
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
                <button
                  key={p}
                  className={page === p ? "on" : ""}
                  onClick={() => setPage(p)}
                >
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
