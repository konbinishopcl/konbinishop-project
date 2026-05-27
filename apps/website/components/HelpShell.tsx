"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV = [
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/terminos-y-condiciones",             label: "Términos y condiciones" },
  { href: "/politica-de-privacidad",           label: "Política de privacidad" },
  { href: "/contacto",             label: "Contacto" },
];

export function HelpShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="container help-shell">
      <aside className="help-side">
        <div className="eyebrow" style={{ marginBottom: 16 }}>AYUDA · ヘルプ</div>
        <nav className="menu-h">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "on" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>{children}</div>
    </main>
  );
}
