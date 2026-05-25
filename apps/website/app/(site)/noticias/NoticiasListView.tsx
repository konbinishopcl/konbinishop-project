"use client";
import { useState } from "react";
import Link from "next/link";
import { imageUrl } from "@/lib/api";
import type { ApiArticle } from "./page";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const meses = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return `${d.getUTCDate()} ${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function getCat(a: ApiArticle): string {
  if (a.tags.length > 0) return a.tags[0].name;
  return "Noticias";
}

const CATS = ["Todas", "Anime", "Manga", "Cine", "Gaming", "K-Pop", "Cosplay"];

export function NoticiasListView({ articles }: { articles: ApiArticle[] }) {
  const [cat, setCat] = useState("Todas");

  const filtered =
    cat === "Todas"
      ? articles
      : articles.filter((a) =>
          a.tags.some((t) => t.name.toLowerCase() === cat.toLowerCase()),
        );

  return (
    <main className="container">
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

      <div className="fbar-sticky">
        <div className="fbar-inner">
          <div className="group">
            {CATS.map((c) => (
              <button
                key={c}
                className={`sel ${cat === c ? "on" : ""}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty" style={{ margin: "60px 0" }}>
          Sin artículos en esta categoría.
        </div>
      ) : (
        <div className="card-grid" style={{ marginTop: 16, marginBottom: 60 }}>
          {filtered.map((a) => (
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
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(135deg,#2a1410,#4a1820)",
                      }}
                    />
                  )}
                  {a.isSponsored && (
                    <span className="sponsor">ARTÍCULO PATROCINADO</span>
                  )}
                </div>
                <div className="a-cat">{getCat(a)}</div>
                <h3 className="a-title">{a.title}</h3>
                <div className="a-meta">
                  <span>{formatDate(a.createdAt)}</span>
                  {a.excerpt && (
                    <>
                      <span>·</span>
                      <span style={{ color: "var(--ink-3)", fontSize: 12 }}>
                        {a.excerpt.length > 60 ? a.excerpt.slice(0, 60) + "…" : a.excerpt}
                      </span>
                    </>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
