"use client";

import Link from "next/link";
import { HeroCarousel } from "@/components/HeroCarousel";
import { Rail } from "@/components/Rail";
import { imageUrl, type ApiCategory, type HeroSlide } from "@/lib/api";
import type { EventItem } from "@/lib/data";

/* ─── tipos locales ─────────────────────────────────── */
export type ApiSpot = {
  id: number;
  title: string;
  description: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  image: string | null;
  isActive: boolean;
};

export type ApiArticle = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  isSponsored: boolean;
  createdAt: string;
  tags?: { name: string }[];
};

/* ─── SpotCard ───────────────────────────────────────── */
function SpotCard({ s }: { s: ApiSpot | null }) {
  if (!s) {
    return (
      <Link href="/precios" className="spot empty">
        <div className="e-inner">
          <div className="ic">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div className="h">Tu aviso aquí</div>
          <div className="p">12 cupos · placement global en home y categorías.</div>
          <div className="e-cta">
            Contratar
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    );
  }
  return (
    <a className="spot" href={s.ctaUrl ?? "#"} target={s.ctaUrl ? "_blank" : undefined} rel="noopener noreferrer">
      {s.image && <div className="bg" style={{ backgroundImage: `url(${imageUrl(s.image)})` }} />}
      <span className="tag-ad">AVISO</span>
      <div className="body">
        <div className="t">{s.title}</div>
        {s.description && <div className="d">{s.description}</div>}
        {s.ctaLabel && (
          <button className="cta">
            {s.ctaLabel}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </a>
  );
}

/* ─── SpotsStrip ─────────────────────────────────────── */
function SpotsStrip({ spots }: { spots: ApiSpot[] }) {
  const MAX = 8;
  const filled = spots.slice(0, MAX);
  const empties = Math.max(0, 4 - filled.length); // mínimo 4 slots; vacíos como CTA
  const items: Array<ApiSpot | null> = [
    ...filled,
    ...Array(empties).fill(null),
  ].slice(0, MAX);

  return (
    <section>
      <div className="rail-head">
        <h2 className="display">
          Avisos <span className="jp">広告</span>
        </h2>
        <Link className="rail-more" href="/precios">
          Contratar aviso →
        </Link>
      </div>
      <div className="spots-grid">
        {items.map((s, i) => (
          <SpotCard key={s ? s.id : `empty-${i}`} s={s} />
        ))}
      </div>
    </section>
  );
}

/* ─── ArticleCard ────────────────────────────────────── */
function ArticleCard({ a }: { a: ApiArticle }) {
  const cat = a.tags?.[0]?.name ?? "Noticias";
  const date = new Date(a.createdAt).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <Link href={`/noticias/${a.slug}`} className="art-card">
      <div className="a-img">
        {a.image ? (
          <div className="pic" style={{ backgroundImage: `url(${imageUrl(a.image)})` }} />
        ) : (
          <div className="pic" style={{ background: "var(--surface-2)" }} />
        )}
        {a.isSponsored && <span className="sponsor">ARTÍCULO PATROCINADO</span>}
      </div>
      <div className="a-cat">{cat.toUpperCase()}</div>
      <h3 className="a-title">{a.title}</h3>
      <div className="a-meta">
        <span>{date}</span>
      </div>
    </Link>
  );
}

/* ─── NewsRail ───────────────────────────────────────── */
function NewsRail({ articles }: { articles: ApiArticle[] }) {
  if (articles.length === 0) return null;
  return (
    <section>
      <div className="rail-head">
        <h2 className="display">
          Últimas noticias <span className="jp">ニュース</span>
        </h2>
        <Link className="rail-more" href="/noticias">
          Ver todas →
        </Link>
      </div>
      <div className="card-grid">
        {articles.slice(0, 4).map((a) => (
          <ArticleCard key={a.id} a={a} />
        ))}
      </div>
    </section>
  );
}

/* ─── ServicesStrip ──────────────────────────────────── */
function ServicesStrip() {
  return (
    <div className="svcs">
      <Link href="/servicios/fotografia" className="svc">
        <div className="pic" style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #3d1515 100%)" }} />
        <div className="b">
          <div className="e">SERVICIO KONBINI</div>
          <div className="h">
            Fotografía
            <br />
            profesional
          </div>
          <div className="d">Cubrimos tu evento con cámara, luces y entrega rápida.</div>
          <span className="cta">
            Cotizar fotógrafo{" "}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
      <Link href="/servicios/creadores" className="svc">
        <div className="pic" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #151540 100%)" }} />
        <div className="b">
          <div className="e">SERVICIO KONBINI</div>
          <div className="h">
            Creadores de
            <br />
            contenido
          </div>
          <div className="d">Reels, aftermovie y cobertura en redes para amplificar tu evento.</div>
          <span className="cta">
            Cotizar contenido{" "}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </div>
  );
}

/* ─── LastJoinedStrip ────────────────────────────────── */
const ORG_PALETTE: [string, string][] = [
  ["#a25cff", "#5b39ff"],
  ["#ff5b8a", "#ff2a59"],
  ["#ff8a3b", "#ff5b1f"],
  ["#3bbf8a", "#1e8a5b"],
  ["#3b9eff", "#2a5bff"],
  ["#f3c053", "#d18a1f"],
];

function LastJoinedStrip() {
  return (
    <section className="lj">
      <div className="text">
        <h3>Únete a +500 organizadores</h3>
        <p>
          Llega a miles de fans geek y otaku en Chile. Publica desde $4.990 / día o suscríbete y publica hasta 10 eventos al mes.
        </p>
      </div>
      <div className="right">
        <div className="lj-stack">
          {ORG_PALETTE.map(([a, b], i) => (
            <span
              key={i}
              className="ob"
              style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
            >
              {String.fromCharCode(65 + i)}
            </span>
          ))}
          <span className="ob more">+500</span>
        </div>
        <Link className="btn primary lg" href="/crear">
          Publicar mi evento{" "}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

/* ─── HomeView principal ─────────────────────────────── */
type Props = {
  items: EventItem[];
  categories: ApiCategory[];
  slides: HeroSlide[];
  spots: ApiSpot[];
  articles: ApiArticle[];
};

export function HomeView({ items, categories, slides, spots, articles }: Props) {
  const byCategory = (slug: string) => items.filter((e) => e.catSlug === slug);

  // Top 4 categorías con eventos
  const topCats = categories.filter((c) => byCategory(c.slug).length > 0).slice(0, 4);

  return (
    <main className="container">
      <HeroCarousel slides={slides} />

      {/* Rail destacados — primeros 12 eventos */}
      {items.length > 0 && (
        <Rail
          title="Destacados"
          jp="注目の作品"
          items={items.slice(0, 12)}
          hrefSeeAll="/busqueda"
        />
      )}

      {/* Avisos — spots con CTAs de "Contratar aviso" en slots vacíos */}
      <SpotsStrip spots={spots} />

      {/* Rails por categoría */}
      {topCats.map((cat) => {
        const catItems = byCategory(cat.slug);
        return (
          <Rail
            key={cat.id}
            title={cat.name ?? cat.slug}
            jp={(cat as ApiCategory & { metadata?: { ja?: string } }).metadata?.ja ?? ""}
            items={catItems.slice(0, 12)}
            hrefSeeAll={`/categoria/${cat.slug}`}
          />
        );
      })}

      {/* Últimas noticias */}
      <NewsRail articles={articles} />

      {/* Servicios — fotografía + creadores */}
      <ServicesStrip />

      {/* CTA organizadores */}
      <LastJoinedStrip />
    </main>
  );
}
