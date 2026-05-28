"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { imageUrl } from "@/lib/api";
import { EventCard } from "@/components/EventCard";
import { Ic } from "@/components/icons";
import type { EventItem } from "@/lib/data";
import type { ApiArticle, ApiArticleEvent } from "@/lib/api";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const meses = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return `${d.getUTCDate()} ${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatEventDate(dates: { id: number; date: string | null }[]): string {
  const raw = dates?.find((d) => d.date)?.date;
  if (!raw) return "Próximamente";
  const d = new Date(raw);
  const meses = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return `${d.getUTCDate()} ${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function getCat(a: ApiArticle): string {
  if (a.articleCategory?.name) return a.articleCategory.name;
  if (a.articleTags?.length)   return a.articleTags[0].name;
  if (a.tags?.length)          return a.tags[0].name;
  return "Noticias";
}

function authorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "K";
}

/** Convierte ApiArticleEvent al shape EventItem que espera EventCard/Poster */
function toEventItem(e: ApiArticleEvent): EventItem {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    cat: e.category?.name ?? "Evento",
    image: imageUrl(e.poster ?? e.banner ?? ""),
    date: formatEventDate(e.dates),
    place: e.city?.name ?? "",
    price: 0,
  };
}

// Markdown sencillo → HTML (párrafos, h2, blockquote, bold, italic)
function renderMarkdown(md: string): string {
  return md
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("# ")) return `<h1>${trimmed.slice(2)}</h1>`;
      if (trimmed.startsWith("> ")) return `<blockquote>${trimmed.slice(2)}</blockquote>`;
      if (!trimmed) return "";
      const html = trimmed
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/`(.+?)`/g, "<code>$1</code>");
      return `<p>${html}</p>`;
    })
    .join("");
}

interface ArticleViewProps {
  article: ApiArticle;
  related: ApiArticle[];
  linkedEvent: ApiArticleEvent | null;
  relatedEvents: ApiArticleEvent[];
}

export function ArticleView({ article, related, linkedEvent, relatedEvents }: ArticleViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const authorName = "Konbini Editorial";
  const cat = getCat(article);

  return (
    <main className="container art-shell">
      <Link href="/noticias" className="art-back">
        ← Volver a noticias
      </Link>

      <div className="art-grid">
        {/* ─── Columna principal ─── */}
        <div>
          <div className="art-head" style={{ maxWidth: "none" }}>
            <div className="cat">
              <span>{cat}</span>
              {article.isSponsored && (
                <span
                  style={{
                    background: "rgba(255,255,255,.06)",
                    padding: "4px 10px",
                    borderRadius: 999,
                    color: "var(--ink-2)",
                    letterSpacing: ".1em",
                    fontSize: 11,
                  }}
                >
                  ARTÍCULO PATROCINADO
                </span>
              )}
            </div>
            <h1>{article.title}</h1>
            {article.excerpt && <p className="lede">{article.excerpt}</p>}
            <div className="art-meta-row">
              <div className="by">
                <div className="av">{authorInitials(authorName)}</div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ink)" }}>{authorName}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {formatDate(article.createdAt)}
                  </div>
                </div>
              </div>
              <div className="share-grp">
                <button
                  className="icon-btn"
                  onClick={handleShare}
                  title={copied ? "¡Copiado!" : "Compartir"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Imagen principal 16:10 */}
          <div className="art-image-main" style={{ aspectRatio: "16/10" }}>
            {article.image ? (
              <img
                src={imageUrl(article.image)}
                alt={article.title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#2a1410,#4a1820)" }} />
            )}
            <div className="cap">FOTO · {cat.toUpperCase()} · KONBINI EDITORIAL</div>
          </div>

          {/* Cuerpo del artículo */}
          <div
            className="art-body"
            style={{ maxWidth: "none" }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />

          {/* Tags */}
          {(article.articleTags?.length ?? 0) > 0 && (
            <div
              className="tags-row"
              style={{
                marginTop: 24,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                paddingTop: 24,
                borderTop: "1px solid var(--line)",
              }}
            >
              {article.articleTags.map((t) => (
                <Link key={t.id} href={`/noticias/tags/${t.slug}`} className="pill">
                  <span style={{ color: "var(--accent)" }}>#</span>{t.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ─── Sidebar derecho: evento vinculado + eventos relacionados ─── */}
        <aside className="art-side">
          {/* EVENTO VINCULADO — usa EventCard igual que el diseño */}
          {linkedEvent && (
            <div>
              <div className="art-side-title">
                <span className="badge-link">EVENTO VINCULADO</span>
                <h4 style={{ margin: "8px 0 4px" }}>Asiste al evento</h4>
                <div className="sub">El organizador encargó este artículo a Konbini.</div>
              </div>
              <div style={{ cursor: "pointer", marginTop: 14 }}>
                <EventCard e={toEventItem(linkedEvent)} />
              </div>
            </div>
          )}

          {/* EVENTOS RELACIONADOS */}
          <div
            className="blk"
            style={{
              padding: linkedEvent ? "22px" : "0",
              background: linkedEvent ? "var(--surface)" : "transparent",
              border: linkedEvent ? "1px solid var(--line)" : "0",
            }}
          >
            <h4>Eventos relacionados</h4>
            <div className="sub">Misma categoría · próximos</div>
            <div style={{ marginTop: 8 }}>
              {relatedEvents.map((e) => (
                <div
                  key={e.id}
                  className="mini-evt"
                  onClick={() => router.push(`/evento/${e.slug}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="mt">
                    {e.poster || e.banner ? (
                      <img
                        src={imageUrl(e.poster ?? e.banner ?? "")}
                        alt={e.title}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#1a0e1e,#3a1840)" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="nm">{e.title}</div>
                    <div className="dt">
                      {formatEventDate(e.dates)}
                      {e.city?.name ? ` · ${e.city.name}` : ""}
                    </div>
                  </div>
                  <span style={{ color: "var(--ink-3)" }}>{Ic.arrow}</span>
                </div>
              ))}
            </div>
            <button
              className="btn ghost block"
              style={{ marginTop: 14 }}
              onClick={() => router.push("/")}
            >
              Ver más eventos de {cat} {Ic.arrow}
            </button>
          </div>
        </aside>
      </div>

      {/* ─── Sigue leyendo (debajo del grid) ─── */}
      {related.length > 0 && (
        <div style={{ marginTop: 80 }}>
          <div className="section-head">
            <div className="sh-title">Sigue leyendo</div>
            <div className="sh-ja">次の記事</div>
          </div>
          <div className="card-grid" style={{ marginTop: 16, marginBottom: 60 }}>
            {related.map((a) => (
              <Link key={a.id} href={`/noticias/${a.slug}`} style={{ textDecoration: "none" }}>
                <article className="art-card">
                  <div className="a-img">
                    {a.image ? (
                      <img
                        src={imageUrl(a.image)}
                        alt={a.title}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#2a1410,#4a1820)" }} />
                    )}
                    {a.isSponsored && <span className="sponsor">ARTÍCULO PATROCINADO</span>}
                  </div>
                  <div className="a-cat">{getCat(a)}</div>
                  <h3 className="a-title">{a.title}</h3>
                  <div className="a-meta">
                    <span>{formatDate(a.createdAt)}</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
