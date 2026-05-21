"use client";

import { useState } from "react";
import { Ic } from "./icons";
import type { HeroSlide } from "@/lib/api";

export function HeroBlock({ slides }: { slides: HeroSlide[] }) {
  const [idx, setIdx] = useState(0);

  if (slides.length === 0) return null;
  const n = slides.length;
  const s = slides[idx];

  return (
    <section className="hero">
      {n > 1 && (
        <div className="hero-arrows">
          <button className="icon-btn" onClick={() => setIdx((i) => (i + n - 1) % n)}>
            {Ic.chevL}
          </button>
          <button className="icon-btn" onClick={() => setIdx((i) => (i + 1) % n)}>
            {Ic.chevR}
          </button>
        </div>
      )}
      <div className="hero-grid">
        <div className="hero-text">
          <div>
            <div className="row" style={{ gap: 10 }}>
              {s.category && <span className="pill accent">{s.category}</span>}
              <span className="eyebrow">FEATURED · 注目</span>
            </div>
            <h1>
              {s.title}
              {s.titleAccent && (
                <>
                  <br />
                  <em>{s.titleAccent}</em>
                </>
              )}
            </h1>
            {s.lead && <p className="lead">{s.lead}</p>}
          </div>
          <div className="hero-bottom">
            <a
              className="btn dark lg"
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver más {Ic.arrow}
            </a>
            {s.date && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>
                  FECHA
                </span>
                <span style={{ fontWeight: 600 }}>{s.date}</span>
              </div>
            )}
            {s.place && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".15em" }}>
                  LUGAR
                </span>
                <span style={{ fontWeight: 600 }}>{s.place}</span>
              </div>
            )}
            {n > 1 && (
              <div className="hero-dots" style={{ marginLeft: "auto" }}>
                {slides.map((_, i) => (
                  <div
                    key={i}
                    className={`d ${i === idx ? "on" : ""}`}
                    onClick={() => setIdx(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="hero-art">
          {s.image && <img className="hero-art-img" src={s.image} alt={s.title} />}
        </div>
      </div>
    </section>
  );
}
