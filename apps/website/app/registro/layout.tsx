import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description: "Regístrate en Konbini y empieza a publicar tus eventos de anime, conciertos, ferias y conventions.",
  robots: { index: false, follow: false },
};

export default function RegistroLayout({ children }: { children: ReactNode }) {
  return children;
}
