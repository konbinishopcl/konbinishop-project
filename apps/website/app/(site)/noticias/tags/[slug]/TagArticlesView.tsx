"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import type { ApiArticle, ApiArticleTag } from "@/lib/api";

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

interface Props {
  tag: ApiArticleTag;
  initialArticles: ApiArticle[];
  initialTotal: number;
  initialTotalPages: number;
}

export function TagArticlesView({ tag, initialArticles, initialTotal, initialTotalPages }: Props) {
  const [articles, setArticles]     = useState<ApiArticle[]>(initialArticles);
  const [total, setTotal]           = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading]       = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [page, setPage]             = useState(1);
  const PAGE_SIZE = 24;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      articleTag: tag.slug,
      page: String(page),
      pageSize: String(PAGE_SIZE),
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
  }, [mounted, tag.slug, page]);

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);

  return (
    <main className="container">
      {/* ── BACK LINK ──────────────────────────────────────────────── */}
      <Link
        href="/noticias/tags"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--ink-3)",
          fontSize: 13,
          marginTop: 24,
          marginBottom: 4,
        }}
      >
        <ChevL /> Volver a todos los tags
      </Link>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ margin: "8px 0 32px" }}>
        <div className="eyebrow">TAG · タグ</div>
        <h1
          className="display"
          style={{ fontSize: "clamp(48px,6vw,80px)", margin: "12px 0 8px", letterSpacing: "-.035em", lineHeight: 0.95 }}
        >
          <span style={{ color: "var(--accent)" }}>#</span>
          {tag.name}
          <span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p style={{ color: "var(--ink-2)", margin: 0, fontSize: 15 }}>
          <strong style={{ color: "var(--ink)" }}>{total} artículo{total !== 1 ? "s" : ""}</strong>
          {" "}etiquetado{total !== 1 ? "s" : ""} con este tag en Konbini.
        </p>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ margin: "60px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
          Cargando artículos…
        </div>
      ) : articles.length === 0 ? (
        <div className="acc-empty" style={{ margin: "40px 0 60px" }}>
          <div className="ic">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </div>
          <h3>No hay artículos con este tag</h3>
          <p>Puede que aún no se hayan publicado artículos con este tag.</p>
          <Link href="/noticias/tags" className="btn ghost">
            Ver todos los tags
          </Link>
        </div>
      ) : (
        <div className="card-grid" style={{ marginTop: 16, marginBottom: 24 }}>
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}

      {/* ── PAGINATION ─────────────────────────────────────────────── */}
      {!loading && total > 0 && totalPages > 1 && (
        <div className="pag-bar">
          <div className="pag-info">
            <span>
              Mostrando{" "}
              <strong style={{ color: "var(--ink)" }}>{from}–{to}</strong>
              {" "}de{" "}
              <strong style={{ color: "var(--ink)" }}>{total}</strong>
              {" "}artículo{total !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="pag-pages">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} title="Anterior">
              <ChevL />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={page === p ? "on" : ""}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} title="Siguiente">
              <ChevR />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
