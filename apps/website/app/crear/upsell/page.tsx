"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { UpsellView } from "@/app/(site)/upsell/UpsellView";

function useHeadroomRef() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const el = ref.current;
      if (el) {
        if (y < 80) el.style.transform = "";
        else if (y > lastY + 4) el.style.transform = "translateY(-100%)";
        else if (lastY > y + 4) el.style.transform = "";
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return ref;
}

export default function UpsellPage() {
  const headerRef = useHeadroomRef();

  return (
    <main style={{ paddingTop: 64 }}>
      <header className="pub-header" ref={headerRef} style={{ transition: "transform .3s ease" }}>
        <div className="container row" style={{ justifyContent: "space-between" }}>
          <Link href="/"><BrandMark size={28} /></Link>
          <span className="mono" style={{ fontSize: 11, letterSpacing: ".15em", color: "var(--ink-3)" }}>
            AMPLIFICA TU EVENTO
          </span>
        </div>
      </header>

      <UpsellView />
    </main>
  );
}
