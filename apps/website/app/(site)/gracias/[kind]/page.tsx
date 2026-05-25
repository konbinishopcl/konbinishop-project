"use client";
import Link from "next/link";
import { use } from "react";

type Kind = "foto" | "creadores" | "contacto";

const CONTENT: Record<Kind, { h: string; p: string }> = {
  foto: {
    h: "Tu solicitud\nllegó.",
    p: "Recibimos tus datos y un miembro del equipo de Konbini te contactará en menos de 24 horas con una cotización personalizada.",
  },
  creadores: {
    h: "Vamos a hacer\nalgo increíble.",
    p: "Recibimos tu solicitud. Nuestro equipo creativo te escribirá pronto para hablar del contenido que necesitas.",
  },
  contacto: {
    h: "Recibimos\ntu mensaje.",
    p: "Te responderemos pronto al email que nos dejaste. Si es urgente, escríbenos por Instagram.",
  },
};

const DEFAULT_CONTENT = {
  h: "¡Gracias!",
  p: "Hemos recibido tu solicitud. Nos pondremos en contacto pronto.",
};

export default function GraciasPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = use(params);
  const content = CONTENT[kind as Kind] ?? DEFAULT_CONTENT;
  const lines = content.h.split("\n");

  return (
    <main className="container thanks-shell">
      <div className="ic">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1>
        {lines[0]}
        {lines[1] && (
          <>
            <br />
            <em>{lines[1]}</em>
          </>
        )}
      </h1>
      <p className="lead">{content.p}</p>
      <div className="thanks-cta-row">
        <Link href="/" className="btn primary lg">
          Ver eventos próximos →
        </Link>
        <Link href="/noticias" className="btn ghost lg">
          Leer noticias
        </Link>
      </div>
    </main>
  );
}
