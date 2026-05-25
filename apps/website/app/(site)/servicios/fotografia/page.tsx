import type { Metadata } from "next";
import { FotografiaView } from "./FotografiaView";

export const metadata: Metadata = {
  title: "Fotografía de eventos — Konbini",
  description: "Cobertura fotográfica profesional para tu evento. Cotiza con el equipo de Konbini.",
};

export type ServiceOption = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  kind: string;
};

async function fetchOptions(): Promise<ServiceOption[]> {
  const base = process.env.API_URL || "http://localhost:3333/api";
  const headers: Record<string, string> = {};
  const key = process.env.API_KEY;
  if (key) headers["X-API-Key"] = key;
  try {
    const res = await fetch(`${base}/services/photography/options`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function FotografiaPage() {
  const options = await fetchOptions();
  return <FotografiaView options={options} />;
}
