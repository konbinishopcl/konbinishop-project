"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { imageUrl } from "@/lib/api";
import type { ApiArticle } from "../page";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const meses = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return `${d.getUTCDate()} ${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function getCat(a: ApiArticle): string {
  if (a.tags.length > 0) return a.tags[0].name;
  return "Noticias";
}

function AuthorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "K";
}

// Simple markdown-to-HTML renderer (paragraphs, headings, bold, italic, blockquote)
function renderMarkdown(md: string): string {
  return md
    .split("\n\n")
    .map((block) => {
      if (block.startsWith("## ")) return `<h2>${block.slice(3)}</h2>`;
      if (block.startsWith("# ")) return `<h1>${block.slice(2)}</h1>`;
      if (block.startsWith("> ")) return `<blockquote>${block.slice(2)}</blockquote>`;
      const html = block
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
}

export function ArticleView({ article, related }: ArticleViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const authorName = article.userId ? "Konbini Editorial" : "Konbini Editorial";

  return (
    <main className="container art-shell">
      <Link href="/noticias" className="art-back">
        ← Volver a noticias
      </Link>

      <div className="art-grid">
        <div>
          <div className="art-head">
            <div className="cat">
              <span>{getCat(article)}</span>
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
                <div className="av">{AuthorInitials(authorName)}</div>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ink)" }}>{authorName}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {formatDate(article.createdAt)}
                  </div>
                </div>
              </div>
              <div className="share-grp">
                <button className="icon-btn" onClick={handleShare} title="Compartir">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {article.image && (
            <div className="art-image-main">
              <img
                src={imageUrl(article.image)}
                alt={article.title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          <div
            className="art-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
          />

          {article.tags.length > 0 && (
            <div className="tags-row" style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
              {article.tags.map((t) => (
                <Link key={t.id} href={`/tag/${t.slug}`} className="pill">
                  #{t.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="art-side">
          {related.length > 0 && (
            <div className="blk">
              <h4>Más noticias</h4>
              <div className="sub">Misma categoría</div>
              <div>
                {related.map((a) => (
                  <div
                    key={a.id}
                    className="mini-evt"
                    onClick={() => router.push(`/noticias/${a.slug}`)}
                  >
                    <div className="mt">
                      {a.image ? (
                        <img
                          src={imageUrl(a.image)}
                          alt={a.title}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#2a1410,#4a1820)" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="nm">{a.title}</div>
                      <div className="dt">{formatDate(a.createdAt)}</div>
                    </div>
                    <span style={{ color: "var(--ink-3)" }}>→</span>
                  </div>
                ))}
              </div>
              <button
                className="btn ghost block"
                style={{ marginTop: 14 }}
                onClick={() => router.push("/noticias")}
              >
                Ver todas las noticias →
              </button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
