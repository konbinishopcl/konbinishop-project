import type { Metadata } from "next";
import { api } from "@/lib/api";
import { NoticiasTagsView } from "./NoticiasTagsView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tags de noticias · Konbini",
  description: "Todos los tags activos de noticias en Konbini.",
};

export default async function NoticiasTagsPage() {
  const tags = await api.articleTags().catch(() => []);
  return <NoticiasTagsView tags={tags} />;
}
