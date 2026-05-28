"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { imageUrl, type ApiArticle, type ApiArticleTag, type ApiArticleCategory } from "@/lib/api";

const RECENT_KEY = "kb-recent-searches";
const MAX_RECENT = 5;

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
function saveRecent(q: string) {
  const prev = getRecent().filter((s) => s !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}

interface Props {
  open: boolean;
  onClose: () => void;
  articleCategories: ApiArticleCategory[];
  topTags: ApiArticleTag[];
}

type Hit = { kind: "event" | "article"; id: number; slug: string; title: string; image?: string | null; meta: string };

export function SearchLightbox({ open, onClose, articleCategories, topTags }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Foco y estado al abrir/cerrar
  useEffect(() => {
    if (open) {
      setQuery("");
      setHits([]);
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  // ESC cierra
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Buscar con debounce
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query.trim()) { setHits([]); setLoading(false); return; }

    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const q = encodeURIComponent(query.trim());
        const [evRes, arRes] = await Promise.allSettled([
          fetch(`/api/events?q=${q}&pageSize=5`).then((r) => r.ok ? r.json() : { items: [] }),
          fetch(`/api/articles?q=${q}&pageSize=5`).then((r) => r.ok ? r.json() : { items: [] }),
        ]);
        const evs: Hit[] = evRes.status === "fulfilled"
          ? (evRes.value.items ?? []).map((e: { id: number; slug: string; title: string; poster?: string | null; banner?: string | null; eventCategory?: { name?: string }; dates?: { dateStart?: string }[] }) => ({
              kind: "event" as const,
              id: e.id, slug: e.slug, title: e.title,
              image: e.poster ?? e.banner,
              meta: [e.eventCategory?.name, e.dates?.[0]?.dateStart?.slice(0, 10)].filter(Boolean).join(" · "),
            }))
          : [];
        const ars: Hit[] = arRes.status === "fulfilled"
          ? (arRes.value.items ?? []).map((a: ApiArticle) => ({
              kind: "article" as const,
              id: a.id, slug: a.slug, title: a.title,
              image: a.image,
              meta: [a.articleCategory?.name, a.createdAt?.slice(0, 10)].filter(Boolean).join(" · "),
            }))
          : [];
        setHits([...evs, ...ars]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, [query]);

  function go(href: string) {
    if (query.trim()) saveRecent(query.trim());
    onClose();
    router.push(href);
  }

  function submitSearch() {
    if (!query.trim()) return;
    saveRecent(query.trim());
    onClose();
    router.push(`/busqueda?q=${encodeURIComponent(query.trim())}`);
  }

  if (!open) return null;

  const topCats = articleCategories.slice(0, 6);

  return (
    <div className="slb-overlay" onClick={onClose}>
      <div className="slb-card" onClick={(e) => e.stopPropagation()}>

        {/* ── INPUT ───────────────────────────────────────────────── */}
        <div className="slb-input-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
          </svg>
          <input
            ref={inputRef}
            placeholder="Buscar eventos, noticias, organizadores, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitSearch(); }}
          />
          <kbd onClick={onClose}>ESC</kbd>
        </div>

        {/* ── BODY ────────────────────────────────────────────────── */}
        <div className="slb-body">

          {/* Estado vacío: tags + categorías + recientes */}
          {!query.trim() && (
            <>
              {topTags.length > 0 && (
                <div className="slb-section">
                  <div className="slb-label">Tags más buscados</div>
                  <div className="slb-tags">
                    {topTags.slice(0, 10).map((t) => (
                      <Link key={t.slug} href={`/noticias/tags/${t.slug}`} className="slb-tag" onClick={onClose}>
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>#</span>
                        {t.name}
                        {(t._count?.articles ?? 0) > 0 && (
                          <span className="ct">{t._count!.articles}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {topCats.length > 0 && (
                <div className="slb-section">
                  <div className="slb-label">Categorías populares</div>
                  <div className="slb-tags">
                    {topCats.map((c) => (
                      <Link key={c.slug} href={`/noticias/categorias/${c.slug}`} className="slb-cat" onClick={onClose}>
                        {c.name ?? c.slug}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {recent.length > 0 && (
                <div className="slb-section">
                  <div className="slb-label">Búsquedas recientes</div>
                  {recent.map((s) => (
                    <div key={s} className="slb-recent" onClick={() => setQuery(s)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/>
                      </svg>
                      <span>{s}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--ink-3)" }}>
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Buscando */}
          {query.trim() && loading && (
            <div style={{ padding: "24px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              Buscando…
            </div>
          )}

          {/* Sin resultados */}
          {query.trim() && !loading && hits.length === 0 && (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🍙</div>
              <div style={{ color: "var(--ink-2)", fontSize: 15 }}>Sin resultados para &ldquo;{query}&rdquo;</div>
              <div style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 4 }}>Prueba con otra palabra.</div>
            </div>
          )}

          {/* Resultados */}
          {query.trim() && !loading && hits.length > 0 && hits.map((h) => (
            <div
              key={`${h.kind}-${h.id}`}
              className="slb-row"
              onClick={() => go(h.kind === "event" ? `/evento/${h.slug}` : `/noticias/${h.slug}`)}
            >
              <div className="thumb">
                {h.image && <img src={imageUrl(h.image)} alt={h.title} />}
              </div>
              <div className="info">
                <span className={`badge ${h.kind === "event" ? "ev" : "no"}`}>
                  {h.kind === "event" ? "EVENTO" : "NOTICIA"}
                </span>
                <div className="t">{h.title}</div>
                {h.meta && <div className="m">{h.meta}</div>}
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ color: "var(--ink-3)", flexShrink: 0 }}>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          ))}

        </div>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <div className="slb-footer">
          <div className="slb-hints">
            <span>↕ navegar</span>
            <span>·</span>
            <span>↵ abrir</span>
          </div>
          <Link href="/busqueda" className="slb-adv" onClick={onClose}>
            Búsqueda avanzada
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
