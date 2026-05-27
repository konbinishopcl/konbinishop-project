"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/components/providers";
import { ArticleForm, type InitialArticle } from "../../ArticleForm";

export default function EditArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useUser();
  const [initial, setInitial] = useState<InitialArticle | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!token || !slug) return;
    fetch(`/api/articles/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Artículo no encontrado");
        return r.json();
      })
      .then((data) => {
        setInitial({
          id:      data.id,
          title:   data.title,
          slug:    data.slug,
          excerpt: data.excerpt ?? null,
          content: data.content,
          image:   data.image ?? null,
          status:  data.status,
          tags:    data.tags ?? [],
          events:  data.events ?? [],
        });
      })
      .catch((ex) => setError(ex instanceof Error ? ex.message : "Error al cargar"));
  }, [token, slug]);

  if (error)   return <div style={{ padding: 32, color: "var(--err)" }}>{error}</div>;
  if (!initial) return <div style={{ padding: 32, color: "var(--ink-3)", fontSize: 13 }}>Cargando artículo…</div>;

  return <ArticleForm mode="edit" variant="admin" initial={initial} />;
}
