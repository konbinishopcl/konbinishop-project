"use client";
import { use } from "react";
import Link from "next/link";

export default function CartErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; code?: string; orderId?: string }>;
}) {
  const params = use(searchParams);
  const { reason, code } = params;

  let reasonMessage: string;
  if (reason === "aborted") {
    reasonMessage = "Cancelaste el pago antes de completarlo. No se cobró nada.";
  } else if (reason === "not_found") {
    reasonMessage = "No encontramos la transacción. Intenta nuevamente.";
  } else if (reason === "invalid_state") {
    reasonMessage = "Esta orden ya fue procesada o no está lista para pago.";
  } else if (code) {
    reasonMessage = `Transbank rechazó el pago (código ${code}). Tus datos están a salvo — no se cobró nada.`;
  } else {
    reasonMessage = "Transbank reportó que el pago no pudo procesarse. Tus datos están a salvo — no se cobró nada.";
  }

  return (
    <main className="container thanks-shell">
      <div className="ic" style={{ background: "var(--err)" }}>
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </div>
      <h1>
        El pago
        <br />
        <em>falló.</em>
      </h1>
      <p className="lead">{reasonMessage}</p>
      <div className="thanks-cta-row">
        <Link href="/carrito" className="btn primary lg">
          Reintentar con WebPay →
        </Link>
        <Link href="/carrito" className="btn ghost lg">
          Cambiar medio de pago
        </Link>
      </div>
    </main>
  );
}
