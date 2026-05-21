import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://konbini.cl";
const TITLE = "Konbini · Plataforma de eventos";
const DESCRIPTION =
  "Todo lo que amas — anime, conciertos, ferias y conventions — en un solo lugar.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Konbini",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "Konbini",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
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
