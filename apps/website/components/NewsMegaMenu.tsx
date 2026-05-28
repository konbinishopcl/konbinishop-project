"use client";
import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ApiArticleCategory } from "@/lib/api";

interface Props {
  categories: ApiArticleCategory[];
  onClose: () => void;
}

export function NewsMegaMenu({ categories, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  // Sort alphabetically — memoized, no fetch needed
  const sorted = useMemo(
    () => [...categories].sort((a, b) =>
      (a.name ?? a.slug).localeCompare(b.name ?? b.slug, "es")
    ),
    [categories]
  );

  // Detect current category slug from pathname (e.g. /noticias/categoria/anime)
  const currentSlug = pathname.startsWith("/noticias/categoria/")
    ? pathname.split("/noticias/categoria/")[1]?.split("/")[0]
    : null;

  function go(slug: string | null) {
    onClose();
    if (slug === null) {
      router.push("/noticias");
    } else {
      router.push(`/noticias/categoria/${slug}`);
    }
  }

  return (
    <div
      className="mega-bg"
      style={{ "--mega-top": "72px" } as React.CSSProperties}
      onMouseLeave={onClose}
    >
      <div className="mega-inner">
        <aside className="mega-aside">
          <div className="label">NOTICIAS · ニュース</div>
          <h3>
            Lo último<span style={{ color: "var(--accent)" }}>.</span>
          </h3>
          <p>
            Cobertura editorial diaria de anime, manga, gaming y cultura otaku
            — donde la comunidad llega primero.
          </p>
          <button className="mega-cta" onClick={() => go(null)}>
            Ver todas las noticias
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </aside>

        <div className="mega-flat">
          {sorted.map((c) => (
            <button
              key={c.slug}
              className={currentSlug === c.slug ? "on" : ""}
              onClick={() => go(c.slug)}
            >
              <span>{c.name ?? c.slug}</span>
              {c.nameJa && <span className="ja">{c.nameJa}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
