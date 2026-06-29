import type { Metadata } from "next";
import { HelpShell } from "@/components/HelpShell";
import { api } from "@/lib/api";
import type { ApiFaqItem } from "@/lib/api";

export const metadata: Metadata = {
  title: "Preguntas frecuentes · Konbini",
  description: "Todo lo que la gente nos pregunta más seguido sobre eventos, publicaciones y Konbini.",
};

export default async function PreguntasFrecuentesPage() {
  const FAQS_FALLBACK: [string, string][] = [
    ["¿Cómo publico un evento?", "Ve a Crear evento, rellena el formulario con los datos de tu evento y haz clic en Enviar. Un admin revisará tu evento en menos de 24 horas."],
    ["¿Cuánto cuesta publicar?", "Desde $4.990 CLP por día. Puedes elegir entre 10 y 60 días de visibilidad. También existe una suscripción mensual de $29.990 con 10 créditos de publicación."],
    ["¿Cómo me registro?", "Haz clic en Ingresar y completa el formulario de registro. Recibirás un email de confirmación."],
    ["¿Puedo editar mi evento después de publicarlo?", "Una vez aprobado, no se puede editar. Te recomendamos revisar bien antes de enviar. Para cambios urgentes, contáctanos."],
    ["¿Cómo recupero mi contraseña?", "En la pantalla de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?' y sigue las instrucciones."],
    ["¿Qué es un Aviso?", "Un Aviso es un banner pagado que aparece en el home y al final de las categorías. Máximo 12 simultáneos. Precio desde $8.000 CLP/día."],
    ["¿Qué es una Portada?", "Una Portada es una imagen de fondo del carrusel principal del home. Máximo 5 simultáneas. Precio desde $15.000 CLP/día."],
    ["¿Puedo crear avisos o portadas sin un evento?", "Sí. Desde Mi Cuenta → Mis avisos o Mis portadas puedes crearlos directamente, siempre que haya cupo disponible (12 avisos / 5 portadas)."],
    ["¿Qué incluye la suscripción mensual?", "10 créditos de publicación al mes (cada crédito = 45 días o hasta la fecha del evento), 20% off en avisos y portadas, y soporte prioritario. Los créditos no usados se pierden al final del mes."],
    ["¿Puedo transferir un evento a una organización?", "Sí. Desde cada evento puedes pulsar \"Transferir a organización\". Si eres Owner, se aplica inmediato; si eres Member, se envía solicitud al Owner."],
    ["¿Dónde reporto un evento que no es seguro?", "Escríbenos a hola@konbini.cl con el link. Los admins pueden banear cualquier contenido que viole las reglas."],
  ];

  let faqs: ApiFaqItem[];
  try {
    faqs = await api.faqAll();
    if (!faqs.length) throw new Error("empty");
  } catch {
    faqs = FAQS_FALLBACK.map(([q, a], i) => ({
      id: i,
      question: q,
      answer: a,
      order: i,
      createdAt: "",
      updatedAt: "",
    }));
  }

  return (
    <HelpShell>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 48, letterSpacing: "-.025em", margin: "0 0 8px" }}>
        Preguntas frecuentes
      </h1>
      <p style={{ color: "var(--ink-3)", marginBottom: 24 }}>Todo lo que la gente nos pregunta más seguido.</p>
      <div>
        {faqs.map((item, i) => (
          <details key={item.id} className="faq-item" open={i === 0}>
            <summary>{item.question}</summary>
            <div className="faq-a">{item.answer}</div>
          </details>
        ))}
      </div>
    </HelpShell>
  );
}
