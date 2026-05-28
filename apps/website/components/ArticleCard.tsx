"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { imageUrl } from "@/lib/api";
import type { ApiArticle } from "@/lib/api";
import { useUser } from "@/components/providers";
import { useLiked } from "@/components/LikedArticlesProvider";

// ── Helpers ────────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const meses = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return `${d.getUTCDate()} ${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function getCat(a: ApiArticle): string {
  if (a.articleCategory?.name) return a.articleCategory.name;
  if (a.articleTags?.length)   return a.articleTags[0].name;
  if (a.tags?.length)          return a.tags[0].name;
  return "Noticias";
}

export function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min`;
}

// ── Component ──────────────────────────────────────────────────────────────

interface Props {
  article: ApiArticle;
  /** Si true, el h3 usa font-size 28px (para uso en featured/big cards) */
  big?: boolean;
}

export function ArticleCard({ article: a, big = false }: Props) {
  const { user, token } = useUser();
  const { isLiked, setLiked: persistLiked } = useLiked();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(a._count?.likes ?? 0);

  // Sync con el contexto cuando el batch fetch resuelva
  useEffect(() => {
    setLiked(isLiked(a.id));
  }, [isLiked, a.id]);

  async function toggleLike(ev: React.MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();

    if (!user || !token) {
      toast.error("Inicia sesión para dar like");
      return;
    }

    const next = !liked;
    setLiked(next);
    setLikes((c) => c + (next ? 1 : -1));

    try {
      const res = await fetch(`/api/articles/${a.id}/like`, {
        method: next ? "POST" : "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { liked: boolean; likes: number };
      setLiked(data.liked);
      persistLiked(a.id, data.liked);
      setLikes(data.likes);
    } catch {
      setLiked(!next);
      setLikes((c) => c + (next ? -1 : 1));
      toast.error("No se pudo actualizar el like");
    }
  }

  const relatedCount = a.events?.length ?? 0;
  const rt = readingTime(a.content ?? "");

  return (
    <Link href={`/noticias/${a.slug}`} style={{ textDecoration: "none" }}>
      <article className="art-card" style={{ position: "relative" }}>
        <div className="a-img" style={{ position: "relative" }}>
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

          {/* Like button */}
          <button
            className={`a-like ${liked ? "on" : ""}`}
            onClick={toggleLike}
            title={liked ? "Quitar like" : "Me gusta"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 22V11"/>
              <path d="M2 13a2 2 0 0 1 2-2h3v11H4a2 2 0 0 1-2-2v-7z"/>
              <path d="M22 11.5a2.5 2.5 0 0 0-2.5-2.5h-5l1-4.5a2 2 0 0 0-3.9-.9L7 11v11h11.4a2 2 0 0 0 2-1.7l1.5-7.3a2.5 2.5 0 0 0 .1-1.5z"/>
            </svg>
            <span>{likes >= 1000 ? (likes / 1000).toFixed(1) + "k" : likes}</span>
          </button>
        </div>

        <div className="a-cat">{getCat(a)}</div>
        <h3 className="a-title" style={big ? { fontSize: 28 } : undefined}>{a.title}</h3>
        <div className="a-meta">
          <span>{formatDate(a.createdAt)}</span>
          <span>·</span>
          <span>{rt} lectura</span>
          {relatedCount > 0 && (
            <>
              <span>·</span>
              <span className="a-rel">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/>
                </svg>
                {relatedCount} evento{relatedCount > 1 ? "s" : ""} relacionado{relatedCount > 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </article>
    </Link>
  );
}
