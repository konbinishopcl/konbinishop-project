"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Ic } from "./icons";
import type { HeroSlide } from "@/lib/api";

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [idx, setIdx] = useState(0);
  const n = slides.length;

  // Auto-advance every 7 seconds — hooks BEFORE early return (Rules of Hooks)
  useEffect(() => {
    if (n === 0) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % n), 7000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;

  const next = () => setIdx((i) => (i + 1) % n);
  const prev = () => setIdx((i) => (i - 1 + n) % n);

  return (
    <section className="pcar">
      {/* Navigation arrows */}
      <div className="nav">
        <button className="icon-btn" onClick={prev} aria-label="Anterior">
          {Ic.chevL}
        </button>
        <button className="icon-btn" onClick={next} aria-label="Siguiente">
          {Ic.chevR}
        </button>
      </div>

      {/* Slides */}
      {slides.map((s, i) => (
        <div key={i} className={`slide ${i === idx ? "on" : ""}`}>
          {/* Background image */}
          <div
            className="bg"
            style={
              s.image
                ? { backgroundImage: `url(${s.image})` }
                : undefined
            }
          />

          {/* Content body */}
          <div className="body">
            <div className="eyebrow-w">
              {s.category ? `${s.category} · PORTADA` : "PORTADA"}
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
            <div className="meta-row">
              {s.date && (
                <div>
                  <span className="k">Fecha</span>
                  <strong>{s.date}</strong>
                </div>
              )}
              {s.place && (
                <div>
                  <span className="k">Lugar</span>
                  <strong>{s.place}</strong>
                </div>
              )}
            </div>
            {s.href && (
              <div>
                <Link className="btn primary lg" href={s.href}>
                  Ver evento {Ic.arrow}
                </Link>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Dot indicators */}
      <div className="dots">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`d ${i === idx ? "on" : ""}`}
            onClick={() => setIdx(i)}
            role="button"
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
