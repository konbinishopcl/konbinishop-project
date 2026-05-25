import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, toEventItem } from "@/lib/api";
import { CategoryView } from "./CategoryView";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  { params }: { params: Promise<{ cat: string }> },
): Promise<Metadata> {
  const { cat } = await params;
  try {
    const categories = await api.categories();
    const found = categories.find((c) => c.slug === cat);
    const name = found?.name ?? cat;
    const description = `Explora eventos de ${name} en Konbini — anime, conciertos, ferias y conventions en Chile.`;
    return {
      title: name,
      description,
      openGraph: { title: `${name} · Konbini`, description },
    };
  } catch {
    return { title: "Categoría" };
  }
}

export default async function CategoryPage({ params }: { params: Promise<{ cat: string }> }) {
  const { cat } = await params;

  let items: ReturnType<typeof toEventItem>[] = [];
  let categories: Awaited<ReturnType<typeof api.categories>> = [];
  let category: Awaited<ReturnType<typeof api.categories>>[number] | undefined;

  try {
    const [cats, list] = await Promise.all([
      api.categories(),
      api.events({ category: cat, pageSize: 60 }),
    ]);
    categories = cats;
    category = cats.find((c) => c.slug === cat);
    items = list.items.map(toEventItem);
  } catch {
    // API no disponible.
  }

  if (!category) {
    // Fallback: if categories couldn't load but slug seems valid, create minimal entry
    if (items.length > 0) {
      category = { id: 0, name: cat, slug: cat, description: null };
    } else {
      notFound();
    }
  }

  return (
    <CategoryView
      category={category}
      allCategories={categories}
      items={items}
    />
  );
}
