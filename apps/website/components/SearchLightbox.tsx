"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { imageUrl, type ApiArticle, type ApiEvent } from "@/lib/api";

type Tab = "all" | "events" | "articles";

interface SearchLightboxProps {
  open: boolean;
  onClose: () => void;
}

type ResultEvent = Pick<ApiEvent, "id" | "slug" | "title" | "poster" | "banner" | "dates" | "eventCategory"> & {
  commune?: ApiEvent["commune"];
};
type ResultArticle = Pick<ApiArticle, "id" | "slug" | "title" | "image" | "createdAt" | "articleCategory">;

export function SearchLightbox({ open, onClose }: SearchLightboxProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<ResultEvent[]>([]);
  const [articles, setArticles] = useState<ResultArticle[]>([]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setEvents([]);
      setArticles([]);
      setTab("all");
    }
  }, [open]);

  // ESC key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setEvents([]);
      setArticles([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const q = encodeURIComponent(query.trim());
      try {
        const [evRes, artRes] = await Promise.allSettled([
          fetch(`/api/events?q=${q}&pageSize=8`).then((r) => r.json()),
          fetch(`/api/articles?q=${q}&pageSize=8`).then((r) => r.json()),
        ]);
        if (evRes.status === "fulfilled") {
          setEvents(evRes.value?.items ?? []);
        }
        if (artRes.status === "fulfilled") {
          setArticles(artRes.value?.items ?? []);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const evCount = events.length;
  const artCount = articles.length;

  const visibleEvents = tab === "articles" ? [] : events;
  const visibleArticles = tab === "events" ? [] : articles;
  const hasResults = visibleEvents.length > 0 || visibleArticles.length > 0;

  const handleNavigate = (href: string) => {
    onClose();
    router.push(href);
  };

  // Format article date
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };

  // Format event date from dates array
  const formatEventDate = (dates: ResultEvent["dates"]) => {
    const raw = dates?.find((d) => d.date)?.date;
    if (!raw) return "Fecha por confirmar";
    const d = new Date(raw);
    const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };

  return (
    <div
      className="search-lightbox"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="slb-close"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Cerrar búsqueda"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Inner content — stop propagation so click doesn't close */}
      <div className="slb-inner" onClick={(e) => e.stopPropagation()}>
        <div
          className="eyebrow"
          style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 12 }}
        >
          BUSCAR · 検索
        </div>

        <h1
          style={{ fontFamily: "var(--font-display)", fontSize: 56, letterSpacing: "-.025em", margin: "0 0 18px", lineHeight: 1.1 }}
        >
          ¿Qué buscas?
        </h1>

        {/* Search input */}
        <div className="search-input">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, color: "var(--ink-3)" }}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Animes, conciertos, articles…"
          />
          <kbd
            onClick={onClose}
            style={{ cursor: "pointer" }}
            title="Cerrar (ESC)"
          >
            ESC
          </kbd>
        </div>

        {/* Tabs */}
        <div className="search-tabs">
          <button
            className={tab === "all" ? "on" : ""}
            onClick={() => setTab("all")}
          >
            Todo
            {(evCount + artCount) > 0 && (
              <span className="ct">{evCount + artCount}</span>
            )}
          </button>
          <button
            className={tab === "events" ? "on" : ""}
            onClick={() => setTab("events")}
          >
            Eventos
            {evCount > 0 && <span className="ct">{evCount}</span>}
          </button>
          <button
            className={tab === "articles" ? "on" : ""}
            onClick={() => setTab("articles")}
          >
            Noticias
            {artCount > 0 && <span className="ct">{artCount}</span>}
          </button>
        </div>

        {/* Results area */}
        {loading && (
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>Buscando…</p>
        )}

        {!loading && !query.trim() && (
          <p style={{ color: "var(--ink-3)", fontSize: 14 }}>Escribe para buscar</p>
        )}

        {!loading && query.trim() && !hasResults && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--ink-3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍙</div>
            <p style={{ fontSize: 15 }}>Sin resultados para &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!loading && hasResults && (
          <>
            {/* Events */}
            {visibleEvents.map((ev) => (
              <div
                key={`ev-${ev.id}`}
                className="search-row"
                onClick={() => handleNavigate(`/evento/${ev.slug}`)}
              >
                <div className="thumb">
                  {(ev.poster || ev.banner) && (
                    <div
                      className="pic"
                      style={{ backgroundImage: `url(${imageUrl(ev.poster ?? ev.banner)})` }}
                    />
                  )}
                </div>
                <div className="info">
                  <span className="badge ev">EVENTO</span>
                  <div className="t">{ev.title}</div>
                  <div className="m">
                    {ev.eventCategory?.name && `${ev.eventCategory.name} · `}
                    {formatEventDate(ev.dates)}
                    {ev.commune?.name && ` · ${ev.commune.name}`}
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, color: "var(--ink-3)" }}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            ))}

            {/* Articles */}
            {visibleArticles.map((art) => (
              <div
                key={`art-${art.id}`}
                className="search-row"
                onClick={() => handleNavigate(`/noticias/${art.slug}`)}
              >
                <div className="thumb">
                  {art.image && (
                    <div
                      className="pic"
                      style={{ backgroundImage: `url(${imageUrl(art.image)})` }}
                    />
                  )}
                </div>
                <div className="info">
                  <span className="badge no">NOTICIA</span>
                  <div className="t">{art.title}</div>
                  <div className="m">
                    {art.articleCategory?.name && `${art.articleCategory.name} · `}
                    {formatDate(art.createdAt)}
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, color: "var(--ink-3)" }}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
