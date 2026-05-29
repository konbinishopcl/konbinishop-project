"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  sideContent?: ReactNode;
  step?: number;
  of?: number;
}

export function AuthShell({ title, subtitle, children, sideContent, step, of }: AuthShellProps) {
  return (
    <div className="auth-shell">
      <div className="auth-art">
        <Image
          src="/images/auth-bg.jpg"
          alt=""
          fill
          className="auth-art-img"
          style={{ objectFit: "cover", objectPosition: "center" }}
          priority
        />
        <div style={{ position: "relative", zIndex: 2, padding: 4 }}>
          <Link href="/"><BrandMark size={28} /></Link>
        </div>
        <div className="blurb">
          <div className="q">
            {sideContent ?? "\"Encontré mi primera convención de cosplay aquí. Ahora soy parte del grupo de organización.\""}
          </div>
          <div className="b">
            <div style={{ width: 32, height: 32, borderRadius: 999, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>M</div>
            <div><div style={{ fontWeight: 600 }}>Martina F.</div><div style={{ color: "var(--ink-3)", fontSize: 11 }}>Konbinera desde 2023</div></div>
          </div>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          {step !== undefined && of !== undefined && (
            <>
              <div className="step">PASO {step} / {of} · KONBINI</div>
              <div className="auth-progress">
                {Array.from({ length: of }).map((_, i) => (
                  <div key={i} className={`seg ${i < step ? "on" : ""}`} />
                ))}
              </div>
            </>
          )}
          <div className="auth-brand">
            {/* handled in auth-art */}
          </div>
          <div className="auth-hero">
            <h2>{title}</h2>
            {subtitle && <p className="lead">{subtitle}</p>}
          </div>
          <div className="auth-form">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
