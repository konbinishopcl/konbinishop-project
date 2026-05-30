import type { Metadata } from "next";
import { api } from "@/lib/api";
import type { ApiFaqItem } from "@/lib/api";
import { PricingView } from "./PricingView";

export const metadata: Metadata = {
  title: "Precios — Konbini",
  description: "Publica tu evento, aviso o portada en Konbini. Precios y planes para organizadores.",
};

export const dynamic = "force-dynamic";

const FAQS_FALLBACK: [string, string][] = [
  ["¿Cuánto cuesta publicar un evento?", "El precio varía según la categoría (Anime, Conciertos, Convenciones, etc.). Puedes elegir publicarlo entre 10 y 60 días — mientras más días, más tiempo está visible y descubrible."],
  ["¿Cuándo se publica mi evento?", "Tras enviarlo entra a revisión. Un admin lo aprueba (o rechaza con motivo) en menos de 24 horas hábiles. Te notificamos por email y en tu centro de mensajes."],
  ["¿Puedo editar un evento publicado?", "Una vez aprobado, no. Por eso te pedimos revisar bien antes de enviar. Si necesitas corregir algo importante después, contáctanos y vemos qué se puede hacer."],
  ["¿Qué pasa si compro suscripción y no uso los créditos?", "Los créditos no utilizados se pierden al final del mes — no se acumulan. Recomendamos la suscripción solo si publicas eventos seguido."],
  ["¿Qué diferencia hay entre Aviso y Portada?", "Una Portada aparece en el carrusel principal del home (máx 5 simultáneas). Un Aviso es un banner que aparece en home y al final de las categorías (máx 12 simultáneos). Las portadas son más exclusivas y caras."],
  ["¿Puedo pagar con tarjeta extranjera?", "Por ahora aceptamos solo tarjetas chilenas a través de WebPay (Transbank). Próximamente integraremos Mercado Pago para pagos internacionales."],
];

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

  let faqs: ApiFaqItem[];
  try {
    const data = await api.faqAll();
    faqs = data.length ? data : FAQS_FALLBACK.map(([q, a], i) => ({ id: i, question: q, answer: a, order: i, createdAt: "", updatedAt: "" }));
  } catch {
    faqs = FAQS_FALLBACK.map(([q, a], i) => ({ id: i, question: q, answer: a, order: i, createdAt: "", updatedAt: "" }));
  }

  return <PricingView settings={settings} eventMinPrice={eventMinPrice} faqs={faqs} />;
}
