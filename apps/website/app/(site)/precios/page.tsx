import type { Metadata } from "next";
import { api } from "@/lib/api";
import { PricingView } from "./PricingView";

export const metadata: Metadata = {
  title: "Precios — Konbini",
  description: "Publica tu evento, aviso o portada en Konbini. Precios y planes para organizadores.",
};

export const dynamic = "force-dynamic";

export default async function PreciosPage() {
  let settings: Record<string, string> = {};
  let eventMinPrice = 4990;

  try {
    const [s, categories] = await Promise.all([
      api.settingsPublic(),
      api.eventCategories(),
    ]);
    settings = s;
    if (categories.length > 0) {
      eventMinPrice = Math.min(...categories.map((c) => c.pricePerDay));
    }
  } catch {
    // API unavailable — PricingView will use fallback values
  }

  return <PricingView settings={settings} eventMinPrice={eventMinPrice} />;
}
