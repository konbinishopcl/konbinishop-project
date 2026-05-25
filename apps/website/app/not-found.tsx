import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "80px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(80px,12vw,160px)",
          fontWeight: 800,
          letterSpacing: "-.04em",
          lineHeight: 1,
          color: "var(--accent)",
          opacity: 0.18,
          marginBottom: 8,
          userSelect: "none",
        }}
      >
        404
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(36px,5vw,56px)",
          letterSpacing: "-.025em",
          margin: "0 0 16px",
        }}
      >
        Página no encontrada
      </h1>
      <p
        style={{
          color: "var(--ink-2)",
          fontSize: 17,
          lineHeight: 1.55,
          maxWidth: "48ch",
          margin: "0 auto 32px",
        }}
      >
        La página que buscas no existe o fue movida. Prueba buscando un evento o volviendo al inicio.
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Link href="/" className="btn primary lg">
          Volver al inicio →
        </Link>
        <Link href="/busqueda" className="btn ghost lg">
          Buscar eventos
        </Link>
      </div>
    </main>
  );
}
