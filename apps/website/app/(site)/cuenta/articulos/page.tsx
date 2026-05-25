"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

interface Article {
  id: number;
  title: string;
  status: string;
  statusReason?: string | null;
  category?: { name: string } | null;
  publishedAt?: string | null;
  createdAt: string;
  slug?: string;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Borrador",    color: "var(--ink-3)" },
  SUBMITTED: { label: "En revisión", color: "var(--warn)" },
  APPROVED:  { label: "Publicado",   color: "var(--ok)" },
  REJECTED:  { label: "Rechazado",   color: "var(--err)" },
};

export default function ArticulosPage() {
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?returnTo=/cuenta/articulos");
      return;
    }
    if (!token) return;
    fetch("/api/articles?mine=true", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setArticles(Array.isArray(data) ? data : data.articles ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [ready, user, token, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm("¿Eliminar este artículo? Esta acción no se puede deshacer.")) return;
    try {
      await fetch(`/api/articles/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast.success("Artículo eliminado");
    } catch {
      toast.error("No se pudo eliminar el artículo");
    }
  };

  return (
    <AccountShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
        <h1>Mis artículos</h1>
        <Link className="btn primary" href="/crear/articulo">＋ Solicitar artículo</Link>
      </div>
      <p className="lead">Artículos patrocinados que pediste a Konbini.</p>

      {loading ? (
        <div className="acc-section" style={{ color: "var(--ink-3)", fontSize: 14 }}>Cargando artículos…</div>
      ) : articles.length === 0 ? (
        <div className="acc-section" style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ color: "var(--ink-3)", fontSize: 14 }}>No tienes artículos aún.</div>
        </div>
      ) : (
        <div className="acc-section">
          {articles.map((a) => {
            const sm = STATUS_META[a.status] ?? { label: a.status, color: "var(--ink-3)" };
            return (
              <div key={a.id} className="acc-list-row">
                <div className="main">
                  <div className="t">{a.title}</div>
                  <div className="m">
                    {a.category?.name ?? "Sin categoría"} ·{" "}
                    {new Date(a.createdAt).toLocaleDateString("es-CL")}
                    {a.statusReason && ` · ${a.statusReason}`}
                  </div>
                </div>
                <span className="pill" style={{ color: sm.color, borderColor: `color-mix(in oklab, ${sm.color} 30%, transparent)`, background: `color-mix(in oklab, ${sm.color} 10%, transparent)` }}>
                  {sm.label}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  {a.slug && (
                    <Link className="btn ghost" href={`/noticias/${a.slug}`} style={{ fontSize: 12, padding: "6px 12px" }}>
                      Ver
                    </Link>
                  )}
                  <button className="btn ghost" style={{ fontSize: 12, padding: "6px 12px", color: "var(--err)" }} onClick={() => handleDelete(a.id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}
