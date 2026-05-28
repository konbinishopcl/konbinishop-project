import type { Metadata } from "next";
import { api } from "@/lib/api";
import { NoticiasCategoriasView } from "./NoticiasCategoriasView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categorías de noticias · Konbini",
  description: "Todas las categorías editoriales de Konbini — anime, manga, gaming, cine y más.",
};

export default async function NoticiasCategoriasPage() {
  const categories = await api.articleCategories().catch(() => []);
  return <NoticiasCategoriasView categories={categories} />;
}
