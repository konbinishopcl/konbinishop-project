import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konbini · Plataforma de eventos",
  description:
    "Todo lo que amas — anime, conciertos, ferias y conventions — en un solo lugar.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <body>
        {/* Aplica el tema guardado antes del primer paint para evitar parpadeo */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('kb-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}",
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
