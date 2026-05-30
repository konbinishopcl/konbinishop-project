"use client";
import Link from "next/link";
import type { ApiFaqItem } from "@/lib/api";

function formatCLP(value: number): string {
  return `$${value.toLocaleString("es-CL")}`;
}

type Props = {
  settings: Record<string, string>;
  eventMinPrice: number;
  faqs: ApiFaqItem[];
};

export function PricingView({ settings, eventMinPrice, faqs }: Props) {
  const n = (k: string, fb: number) => parseInt(settings[k] ?? "", 10) || fb;

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
            <span className="v">desde {formatCLP(eventMinPrice)}</span>
            <span className="u">CLP / día</span>
          </div>
          <p className="desc">Pago por publicación. Eliges los días que quieras estar visible. El precio varía según la categoría.</p>
          <ul>
            <li>Publicación de 10 a {n("EVENT_MAX_DAYS", 60)} días</li>
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
            <span className="v">{formatCLP(n("SUBSCRIPTION_PRICE", 9990))}</span>
            <span className="u">CLP / mes</span>
          </div>
          <p className="desc">Para organizadores frecuentes. Publica hasta {n("SUBSCRIPTION_CREDITS", 10)} eventos al mes y obtén descuento en avisos y portadas.</p>
          <ul>
            <li><strong>{n("SUBSCRIPTION_CREDITS", 10)} créditos</strong> de publicación al mes</li>
            <li>Cada crédito = 45 días de publicación</li>
            <li><strong>{n("SUBSCRIPTION_SPOT_DISCOUNT", 20)}% off</strong> en avisos y portadas</li>
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
            <span className="v">desde {formatCLP(n("SPOT_PRICE_PER_DAY", 8000))}</span>
            <span className="u">CLP / día</span>
          </div>
          <p className="desc">Productos pagados premium para destacar tu evento en el home y categorías.</p>
          <ul>
            <li>Avisos: {n("SPOT_MAX_ACTIVE", 12)} cupos globales</li>
            <li>Portadas: {n("HERO_MAX_ACTIVE", 5)} cupos en home</li>
            <li>Mínimo {n("SPOT_MIN_DAYS", 10)} días, máximo {n("SPOT_MAX_DAYS", 30)}</li>
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
          {faqs.map((item, i) => (
            <details key={item.id} className="faq-item" open={i === 0}>
              <summary>{item.question}</summary>
              <div className="faq-a">{item.answer}</div>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
