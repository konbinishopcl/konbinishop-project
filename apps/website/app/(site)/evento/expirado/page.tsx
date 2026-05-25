import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Evento expirado — Konbini",
};

export default function EventoExpiradoPage() {
  return (
    <main
      className="container thanks-shell"
      style={{ maxWidth: 600 }}
    >
      <div
        className="ic"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          color: "var(--ink-3)",
        }}
      >
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <h1>
        Este evento
        <br />
        <em>ya pasó.</em>
      </h1>
      <p className="lead">
        El evento que buscas ya no está disponible. Puede que haya expirado o sido removido. Aquí encontrarás otros eventos próximos.
      </p>
      <div className="thanks-cta-row">
        <Link href="/busqueda" className="btn primary lg">
          Buscar eventos →
        </Link>
        <Link href="/" className="btn ghost lg">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
