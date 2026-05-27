import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "./SearchView";
import { api, toEventItem, type ApiEventCategory, type ApiRegion } from "@/lib/api";
import type { EventItem } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buscar eventos",
  description: "Encuentra eventos de anime, conciertos, ferias y conventions en Chile. Filtra por categoría, región y fecha.",
  openGraph: {
    title: "Buscar eventos · Konbini",
    description: "Encuentra eventos de anime, conciertos, ferias y conventions en Chile.",
  },
};

type Props = { searchParams: Promise<{ q?: string; category?: string; region?: string }> };

export default async function BusquedaPage({ searchParams }: Props) {
  const { q, category, region } = await searchParams;

  let initialResults: EventItem[] = [];
  let initialCategories: ApiEventCategory[] = [];
  let initialRegions: ApiRegion[] = [];

  try {
    const [list, cats, regs] = await Promise.all([
      api.events({ q, eventCategory: category, region, pageSize: 60 }),
      api.eventCategories(),
      api.regions(),
    ]);
    initialResults = list.items.map(toEventItem);
    initialCategories = cats;
    initialRegions = regs;
  } catch {
    // API no disponible — SearchView maneja el estado vacío.
  }

  return (
    <Suspense>
      <SearchView
        initialResults={initialResults}
        initialCategories={initialCategories}
        initialRegions={initialRegions}
      />
    </Suspense>
  );
}
