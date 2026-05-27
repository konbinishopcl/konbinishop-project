import type { Metadata } from "next";
import { HelpShell } from "@/components/HelpShell";

export const metadata: Metadata = {
  title: "Política de privacidad · Konbini",
  description: "Cómo Konbini recopila, usa y protege tus datos personales.",
};

const PRIVACY: [string, string][] = [
  ["1. Datos que recopilamos", "Email, nombre, país, y datos opcionales del perfil (avatar, bio, redes sociales). Para organizadores: nombre público y handle. Para pagos: el procesador (Transbank) maneja directamente los datos de tarjeta — Konbini nunca los almacena."],
  ["2. Para qué los usamos", "Operar el servicio (autenticación, notificaciones), proteger contra abuso, y enviarte comunicaciones de Konbini si lo aceptaste explícitamente al registrarte. Nunca vendemos ni compartimos tus datos con terceros para fines de marketing."],
  ["3. Tus derechos", "Puedes pedir copia de tus datos, corregirlos o eliminarlos en cualquier momento desde /cuenta. La eliminación es permanente e irreversible. La Ley 21.719 te respalda en estos derechos."],
  ["4. Cookies", "Usamos cookies esenciales para el funcionamiento del sitio, y analíticas si las aceptaste en el banner. Puedes cambiar tu preferencia desde el footer en cualquier momento."],
  ["5. Almacenamiento", "Tus datos se guardan en servidores en Chile. Los respaldos se cifran en reposo. Solo personal autorizado de Konbini puede acceder a información personal."],
  ["6. Cómo contactarnos", "Para ejercer cualquiera de tus derechos o reportar un incidente de datos personales, escríbenos a privacidad@konbini.cl. Te responderemos en máximo 30 días hábiles según la ley."],
];

export default function PrivacidadPage() {
  return (
    <HelpShell>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, letterSpacing: "-.025em", margin: "0 0 8px" }}>
        Política de privacidad
      </h1>
      <p style={{ color: "var(--ink-3)", marginBottom: 24, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: ".08em" }}>
        ÚLTIMA ACTUALIZACIÓN · 01 MAY 2026
      </p>
      <div>
        {PRIVACY.map(([s, body], i) => (
          <details key={i} className="faq-item" open={i === 0}>
            <summary>{s}</summary>
            <div className="faq-a">{body}</div>
          </details>
        ))}
      </div>
    </HelpShell>
  );
}
