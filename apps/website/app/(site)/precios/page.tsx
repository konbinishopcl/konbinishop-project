import type { Metadata } from "next";
import { PricingView } from "./PricingView";

export const metadata: Metadata = {
  title: "Precios — Konbini",
  description: "Publica tu evento, aviso o portada en Konbini. Precios y planes para organizadores.",
};

export default function PreciosPage() {
  return <PricingView />;
}
