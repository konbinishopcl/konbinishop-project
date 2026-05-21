import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { api, type ApiCategory } from "@/lib/api";

// Layout del sitio: header + footer. La vista de login queda fuera de este grupo.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  let categories: ApiCategory[] = [];
  try {
    categories = await api.categories();
  } catch {
    // API no disponible — el nav muestra solo "Inicio".
  }

  return (
    <>
      <Header categories={categories} />
      {children}
      <Footer />
    </>
  );
}
