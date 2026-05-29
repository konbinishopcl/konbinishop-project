"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AccountShell } from "../../../AccountShell";
import { useUser } from "@/components/providers";
import { ArticleForm, type InitialArticle } from "@/app/dashboard/articles/ArticleForm";

export default function EditMyArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [initial, setInitial] = useState<InitialArticle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?returnTo=/cuenta/articulos/${slug}/edit`);
      return;
    }
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
          id:         data.id,
          title:      data.title,
          slug:       data.slug,
          excerpt:    data.excerpt ?? null,
          content:    data.content,
          image:      data.image ?? null,
          youtubeUrl: data.youtubeUrl ?? null,
          status:     data.status,
          tags:       data.tags ?? [],
          articleCategories: data.articleCategories ?? [],
          events:     data.events ?? [],
        });
      })
      .catch((ex) => setError(ex instanceof Error ? ex.message : "Error al cargar"));
  }, [ready, user, token, slug, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  return (
    <AccountShell>
      {error ? (
        <div style={{ padding: 32, color: "var(--err)" }}>{error}</div>
      ) : !initial ? (
        <div style={{ padding: 32, color: "var(--ink-3)" }}>Cargando artículo…</div>
      ) : (
        <ArticleForm mode="edit" variant="sponsored" initial={initial} />
      )}
    </AccountShell>
  );
}
