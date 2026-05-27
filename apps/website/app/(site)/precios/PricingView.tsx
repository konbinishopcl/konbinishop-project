"use client";
import Link from "next/link";

const FAQS = [
  ["¿Cuánto cuesta publicar un evento?", "Desde $4.990 CLP por día. El precio varía según la categoría (Anime, Conciertos, Convenciones, etc.). Puedes elegir publicarlo entre 10 y 60 días — mientras más días, más tiempo está visible y descubrible."],
  ["¿Cuándo se publica mi evento?", "Tras enviarlo entra a revisión. Un admin lo aprueba (o rechaza con motivo) en menos de 24 horas hábiles. Te notificamos por email y en tu centro de mensajes."],
  ["¿Puedo editar un evento publicado?", "Una vez aprobado, no. Por eso te pedimos revisar bien antes de enviar. Si necesitas corregir algo importante después, contáctanos y vemos qué se puede hacer."],
  ["¿Qué pasa si compro suscripción y no uso los 10 créditos?", "Los créditos no utilizados se pierden al final del mes — no se acumulan. Recomendamos la suscripción solo si publicas eventos seguido."],
  ["¿Qué diferencia hay entre Aviso y Portada?", "Una Portada aparece en el carrusel principal del home (máx 5 simultáneas). Un Aviso es un banner que aparece en home y al final de las categorías (máx 12 simultáneos). Las portadas son más exclusivas y caras."],
  ["¿Puedo pagar con tarjeta extranjera?", "Por ahora aceptamos solo tarjetas chilenas a través de WebPay (Transbank). Próximamente integraremos Mercado Pago para pagos internacionales."],
];

export function PricingView() {
  return (
    <main className="container">
      <div className="price-hero">
        <div className="eyebrow">PUBLICAR · 出版</div>
        <h1>
          Llega a miles de fans <em>geek y otaku</em> en Chile.
        </h1>
        <p className="lead">
          Konbini conecta organizadores con la comunidad otaku más grande del país. Más de 244.000 seguidores en Instagram y miles de visitas mensuales a nuestro directorio de eventos.
        </p>
        <div style={{ marginTop: 28, display: "inline-flex", gap: 12 }}>
          <Link href="/crear" className="btn primary lg">
            Publicar mi evento →
          </Link>
          <Link href="/preguntas-frecuentes" className="btn ghost lg">
            Ver más info
          </Link>
        </div>
      </div>

      <div className="price-grid">
        <div className="price-card">
          <div className="nm">Publicación de evento</div>
          <div className="price">
            <span className="v">$4.990</span>
            <span className="u">CLP / día</span>
          </div>
          <p className="desc">Pago por publicación. Eliges los días que quieras estar visible. El precio varía según la categoría.</p>
          <ul>
            <li>Publicación de 10 a 60 días</li>
            <li>Aparece en el listado y en la categoría</li>
            <li>Métricas de vistas y guardados</li>
            <li>Botón compartir nativo</li>
          </ul>
          <div className="cta-row">
            <Link href="/crear" className="btn ghost block">
              Crear evento
            </Link>
          </div>
        </div>

        <div className="price-card featured">
          <div className="b">RECOMENDADO</div>
          <div className="nm">Suscripción mensual</div>
          <div className="price">
            <span className="v">$29.990</span>
            <span className="u">CLP / mes</span>
          </div>
          <p className="desc">Para organizadores frecuentes. Publica hasta 10 eventos al mes y obtén descuento en avisos y portadas.</p>
          <ul>
            <li><strong>10 créditos</strong> de publicación al mes</li>
            <li>Cada crédito = 45 días de publicación</li>
            <li><strong>20% off</strong> en avisos y portadas</li>
            <li>Cancela cuando quieras</li>
          </ul>
          <div className="cta-row">
            <Link href="/cuenta/suscripcion" className="btn primary block">
              Suscribirme
            </Link>
          </div>
        </div>

        <div className="price-card">
          <div className="nm">Avisos y portadas</div>
          <div className="price">
            <span className="v">desde $8.000</span>
            <span className="u">CLP / día</span>
          </div>
          <p className="desc">Productos pagados premium para destacar tu evento en el home y categorías.</p>
          <ul>
            <li>Avisos: 12 cupos globales</li>
            <li>Portadas: 5 cupos en home</li>
            <li>Mínimo 10 días, máximo 30</li>
            <li>Artículo patrocinado disponible</li>
          </ul>
          <div className="cta-row">
            <Link href="/preguntas-frecuentes" className="btn ghost block">
              Más info
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--r-xl)",
          padding: 48,
          margin: "32px 0",
        }}
      >
        <div className="section-head">
          <div className="sh-title">Preguntas frecuentes de publicación</div>
          <div className="sh-ja">よくある質問</div>
        </div>
        <div style={{ marginTop: 8 }}>
          {FAQS.map((q, i) => (
            <details key={i} className="faq-item" open={i === 0}>
              <summary>{q[0]}</summary>
              <div className="faq-a">{q[1]}</div>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
