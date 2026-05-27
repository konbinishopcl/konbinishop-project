import type { Metadata } from "next";
import { HelpShell } from "@/components/HelpShell";

export const metadata: Metadata = {
  title: "Términos y condiciones · Konbini",
  description: "Términos y condiciones de uso de Konbini.",
};

const TERMS: [string, string][] = [
  ["1. Sobre Konbini", "Konbini es un medio editorial y directorio de eventos operado en Chile. No vendemos entradas — conectamos personas con eventos y a organizadores con su audiencia."],
  ["2. Uso del servicio", "Al registrarte, declaras tener al menos 18 años y aceptas no publicar contenido que viole las leyes chilenas o derechos de terceros. Nos reservamos el derecho de banear contenido y cuentas que violen estas reglas."],
  ["3. Pagos y reembolsos", "Los pagos se procesan a través de pasarelas certificadas (WebPay y otras). Las publicaciones rechazadas no se cobran. Las publicaciones aprobadas no son reembolsables salvo error de Konbini."],
  ["4. Propiedad intelectual", "Los organizadores conservan los derechos sobre las imágenes y textos que suben. Al publicar, otorgan a Konbini licencia no exclusiva para mostrarlos en el sitio."],
  ["5. Limitación de responsabilidad", "Konbini no es responsable por el cumplimiento de los eventos publicados. La compra de entradas se hace en el sitio del organizador — cualquier disputa se resuelve directamente con quien organiza."],
  ["6. Modificaciones", "Podemos actualizar estos términos en cualquier momento. Te avisaremos por email si los cambios son materiales. El uso continuado del servicio implica aceptación de la nueva versión."],
];

export default function TerminosPage() {
  return (
    <HelpShell>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, letterSpacing: "-.025em", margin: "0 0 8px" }}>
        Términos y condiciones
      </h1>
      <p style={{ color: "var(--ink-3)", marginBottom: 24, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: ".08em" }}>
        ÚLTIMA ACTUALIZACIÓN · 01 MAY 2026
      </p>
      <div>
        {TERMS.map(([s, body], i) => (
          <details key={i} className="faq-item" open={i === 0}>
            <summary>{s}</summary>
            <div className="faq-a">{body}</div>
          </details>
        ))}
      </div>
    </HelpShell>
  );
}
