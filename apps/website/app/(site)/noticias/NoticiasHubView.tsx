"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArticleCard, formatDate, readingTime } from "@/components/ArticleCard";
import { imageUrl } from "@/lib/api";
import type { ApiArticle, ApiArticleCategory } from "@/lib/api";

interface Props {
  articles: ApiArticle[];
  categories: ApiArticleCategory[];
}

export function NoticiasHubView({ articles, categories }: Props) {
  const router = useRouter();

  // Derivar artículos para cada sección
  const featured = articles.find((a) => a.image !== null) ?? articles[0];
  const featuredIdx = featured ? articles.indexOf(featured) : -1;
  // Picks = siguientes 3 después del featured
  const editorPicks = articles.filter((_, i) => i !== featuredIdx).slice(0, 3);
  // "Lo último" = primeros 4 artículos que no son el featured
  const latest = articles.filter((_, i) => i !== featuredIdx).slice(0, 4);
  // Patrocinado = primer artículo con isSponsored: true
  const sponsored = articles.find((a) => a.isSponsored);

  // Top 5 categorías con más artículos en el batch (dinámico)
  const catCounts: Record<string, number> = {};
  for (const a of articles) {
    const slug = a.articleCategory?.slug;
    if (slug) catCounts[slug] = (catCounts[slug] ?? 0) + 1;
  }
  const topSlugs = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug]) => slug);

  // Rails por las top 5 categorías
  const railsData = topSlugs.map((slug) => {
    const cat = categories.find((c) => c.slug === slug);
    const items = articles
      .filter((a) => a.articleCategory?.slug === slug)
      .slice(0, 4);
    return { slug, cat, items };
  }).filter((r) => r.items.length > 0);

  // Categorías para explore — ordenadas alfabéticamente
  const sortedCats = [...categories].sort((a, b) =>
    (a.name ?? a.slug).localeCompare(b.name ?? b.slug, "es")
  );

  if (!featured) {
    return (
      <main className="container" style={{ padding: "60px 0" }}>
        <div className="eyebrow">NOTICIAS · ニュース</div>
        <h1 className="display" style={{ fontSize: "clamp(40px,5vw,64px)", margin: "12px 0 6px" }}>
          Lo último<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p style={{ color: "var(--ink-3)" }}>No hay artículos publicados todavía.</p>
      </main>
    );
  }

  return (
    <main className="container">
      {/* ── HERO + PICKS ─────────────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 360px",
          gap: 28,
          margin: "28px 0 56px",
        }}
        className="news-hero"
      >
        {/* Featured article */}
        <div
          style={{
            position: "relative",
            aspectRatio: "16/10",
            borderRadius: "var(--r-xl)",
            overflow: "hidden",
            cursor: "pointer",
          }}
          onClick={() => router.push(`/noticias/${featured.slug}`)}
        >
          {featured.image ? (
            <img
              src={imageUrl(featured.image)}
              alt={featured.title}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#2a1410,#4a1820)" }} />
          )}
          {/* Gradient overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,0) 60%)" }} />
          {/* Content */}
          <div style={{ position: "absolute", left: 36, right: 36, bottom: 36, color: "#fff", zIndex: 2 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".2em", color: "rgba(255,255,255,.78)", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <span>DESTACADO · {(featured.articleCategory?.name ?? "NOTICIAS").toUpperCase()}</span>
              <span style={{ opacity: .5 }}>·</span>
              <span>{formatDate(featured.createdAt)} · {readingTime(featured.content ?? "")} lectura</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4.6vw, 56px)", lineHeight: 1.05, letterSpacing: "-.025em", margin: "0 0 14px", fontWeight: 700 }}>
              {featured.title}
            </h1>
            {featured.excerpt && (
              <p style={{ color: "rgba(255,255,255,.85)", fontSize: 16, lineHeight: 1.55, margin: "0 0 18px", maxWidth: "62ch" }}>
                {featured.excerpt}
              </p>
            )}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 999, background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 600 }}>
              Leer artículo →
            </div>
          </div>
        </div>

        {/* Picks de la redacción */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 12 }}>
            Picks de la redacción
          </div>
          {editorPicks.map((a, i) => (
            <div
              key={a.id}
              onClick={() => router.push(`/noticias/${a.slug}`)}
              style={{ display: "flex", gap: 14, cursor: "pointer", padding: "12px 0", borderTop: i > 0 ? "1px solid var(--line)" : "none" }}
            >
              <div style={{ flex: "0 0 28px", fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--accent)", lineHeight: 1, paddingTop: 4 }}>
                0{i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".12em", color: "var(--accent)", marginBottom: 4 }}>
                  {(a.articleCategory?.name ?? "NOTICIAS").toUpperCase()}
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, lineHeight: 1.25, letterSpacing: "-.01em", marginBottom: 6 }}>
                  {a.title}
                </div>
                <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
                  {formatDate(a.createdAt)} · {readingTime(a.content ?? "")} lectura
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LO ÚLTIMO ────────────────────────────────────────────── */}
      <div className="sec-head">
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <h2>Lo último</h2>
          <span className="ja">最新</span>
        </div>
        <Link className="more" href="/noticias">Ver todas las noticias →</Link>
      </div>
      <div className="card-grid" style={{ marginBottom: 56 }}>
        {latest.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>

      {/* ── ARTÍCULO PATROCINADO ──────────────────────────────────── */}
      {sponsored && (
        <section
          style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--r-xl)", padding: 32, margin: "0 0 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, cursor: "pointer" }}
          onClick={() => router.push(`/noticias/${sponsored.slug}`)}
          className="sponsored-feature"
        >
          {/* Image */}
          <div style={{ position: "relative", aspectRatio: "16/10", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            {sponsored.image ? (
              <img
                src={imageUrl(sponsored.image)}
                alt={sponsored.title}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#2a1410,#4a1820)" }} />
            )}
            <span style={{ position: "absolute", top: 14, left: 14, background: "rgba(15,12,10,.75)", color: "#fff", padding: "6px 12px", borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: ".14em" }}>
              ARTÍCULO PATROCINADO
            </span>
          </div>
          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: 12 }}>
              {sponsored.articleCategory?.name ?? "NOTICIAS"} · PATROCINADO
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: "-.02em", lineHeight: 1.1, margin: "0 0 12px", fontWeight: 700 }}>
              {sponsored.title}
            </h3>
            {sponsored.excerpt && (
              <p style={{ color: "var(--ink-2)", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>
                {sponsored.excerpt}
              </p>
            )}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button className="btn primary" onClick={(e) => { e.stopPropagation(); router.push(`/noticias/${sponsored.slug}`); }}>
                Leer artículo →
              </button>
              <span style={{ color: "var(--ink-3)", fontSize: 12 }}>
                {formatDate(sponsored.createdAt)} · {readingTime(sponsored.content ?? "")} lectura
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ── RAILS POR CATEGORÍA ──────────────────────────────────── */}
      {railsData.map(({ slug, cat, items }) => (
        <section key={slug} style={{ marginBottom: 56 }}>
          <div className="sec-head">
            <div style={{ display: "flex", alignItems: "baseline" }}>
              <h2>{cat?.name ?? slug}</h2>
              {cat?.nameJa && <span className="ja">{cat.nameJa}</span>}
            </div>
            <Link className="more" href={`/noticias/categoria/${slug}`}>
              Ver más de {cat?.name ?? slug} →
            </Link>
          </div>
          <div className="card-grid">
            {items.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ))}

      {/* ── EXPLORA POR CATEGORÍA ─────────────────────────────────── */}
      {sortedCats.length > 0 && (
        <section style={{ marginBottom: 60, padding: 36, border: "1px solid var(--line)", borderRadius: "var(--r-xl)" }}>
          <div style={{ marginBottom: 28 }}>
            <div className="eyebrow">CATEGORÍAS · カテゴリ</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 44, letterSpacing: "-.025em", margin: "10px 0 0", fontWeight: 700, lineHeight: 1.05 }}>
              {sortedCats.length} categorías editoriales
            </h2>
          </div>
          <div style={{ columns: 4, columnGap: 40 }} className="explore-cats">
            {sortedCats.map((c) => (
              <button
                key={c.slug}
                onClick={() => router.push(`/noticias/categoria/${c.slug}`)}
                style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: "8px 0", color: "var(--ink)", textAlign: "left", background: "transparent", border: 0, cursor: "pointer", transition: "color .12s, transform .12s", width: "100%", breakInside: "avoid" }}
                onMouseOver={(ev) => { ev.currentTarget.style.color = "var(--accent)"; ev.currentTarget.style.transform = "translateX(4px)"; }}
                onMouseOut={(ev) => { ev.currentTarget.style.color = "var(--ink)"; ev.currentTarget.style.transform = ""; }}
              >
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, letterSpacing: "-.01em" }}>
                  {c.name ?? c.slug}
                </span>
                {c.nameJa && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", letterSpacing: ".06em" }}>
                    {c.nameJa}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
