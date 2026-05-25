import type { Metadata } from "next";
import { CreadoresView } from "./CreadoresView";
import type { ServiceOption } from "../fotografia/page";

export const metadata: Metadata = {
  title: "Creadores de contenido — Konbini",
  description: "Reels, aftermovie y cobertura en redes para amplificar tu evento. Equipo creativo dedicado.",
};

async function fetchOptions(): Promise<ServiceOption[]> {
  const base = process.env.API_URL || "http://localhost:3333/api";
  const headers: Record<string, string> = {};
  const key = process.env.API_KEY;
  if (key) headers["X-API-Key"] = key;
  try {
    const res = await fetch(`${base}/services/content-creators/options`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function CreadoresPage() {
  const options = await fetchOptions();
  return <CreadoresView options={options} />;
}
