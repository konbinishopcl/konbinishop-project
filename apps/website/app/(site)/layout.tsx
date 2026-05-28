import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { api, type ApiEventCategory, type ApiArticleCategory, type ApiArticleTag } from "@/lib/api";

// Layout del sitio: header + footer. La vista de login queda fuera de este grupo.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  let categories: ApiEventCategory[] = [];
  let articleCategories: ApiArticleCategory[] = [];
  let topTags: ApiArticleTag[] = [];
  try {
    [categories, articleCategories, topTags] = await Promise.all([
      api.eventCategories(),
      api.articleCategories(),
      api.articleTags(),
    ]);
  } catch {
    // API no disponible — el nav muestra solo "Inicio".
  }

  return (
    <>
      <Header categories={categories} articleCategories={articleCategories} topTags={topTags} />
      {children}
      <Footer />
    </>
  );
}
