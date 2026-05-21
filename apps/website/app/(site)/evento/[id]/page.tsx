import Link from "next/link";
import { Poster } from "@/components/Poster";
import { Ic } from "@/components/icons";
import { EVENTS } from "@/lib/data";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = EVENTS.find((x) => x.id === Number(id)) ?? EVENTS[0];

  return (
    <main className="container">
      <div className="event-hero">
        <div className={`poster-art ${e.art}`} style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div className="haze" />
        <div className="grain" />
        <div className="event-hero-body">
          <div className="event-poster-lg">
            <Poster e={e} />
          </div>
          <div>
            <div className="row" style={{ gap: 10 }}>
              <span className="pill solid">{e.cat}</span>
              <span className="pill">{e.ja}</span>
            </div>
            <h1>{e.title}</h1>
            <div className="sub-line">
              {e.date} · {e.place}
            </div>
          </div>
          <button className="btn ghost" style={{ marginLeft: "auto" }}>
            {Ic.share} Compartir
          </button>
        </div>
      </div>

      <div className="event-grid">
        <div className="event-body">
          <h2>Sobre el evento</h2>
          <p>
            Cinépolis trae a Chile la película más esperada del año: <strong>{e.title}</strong>.
            Ambientada en el legendario universo creado por J.R.R. Tolkien, esta épica animación nos
            transporta 183 años antes de los eventos de El Señor de los Anillos, a una historia jamás
            contada.
          </p>
          <p>
            Un ataque sorpresivo de Wulf, un astuto y traicionero lord de Rohan en busca de venganza
            por la muerte de su padre, fuerza a Helm Mano de Martillo, rey de Rohan, y a su pueblo a
            hacer una resistencia desesperada en la antigua fortaleza de Hornburg.
          </p>

          <h2>Galería</h2>
          <div className="gallery">
            <div className="g1">
              <div className="poster-art pa-3" />
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  color: "white",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: ".1em",
                }}
              >
                ▶ TRAILER OFICIAL
              </div>
            </div>
            <div><div className="poster-art pa-9" /></div>
            <div><div className="poster-art pa-5" /></div>
            <div><div className="poster-art pa-1" /></div>
            <div><div className="poster-art pa-6" /></div>
          </div>

          <h2>Etiquetas</h2>
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            {["anime", "fantasía", "tolkien", "warner bros", "estreno", "épica", "doblaje latino"].map(
              (t) => (
                <span key={t} className="pill">#{t}</span>
              ),
            )}
          </div>
        </div>

        <aside>
          <div className="ticket-panel">
            <span className="eyebrow">TICKETS · チケット</span>
            <h3 style={{ marginTop: 8 }}>Compra tu entrada</h3>
            <p style={{ color: "var(--ink-3)", fontSize: 12, margin: "4px 0 8px" }}>
              Pago seguro vía pasarela. No solicitamos datos de tarjeta.
            </p>
            <div>
              <div className="ticket-row">
                <div>
                  <div className="name">General</div>
                  <div className="desc">Sala estándar · butaca libre</div>
                </div>
                <div className="price">
                  $9.990 <span style={{ fontWeight: 400, color: "var(--ink-3)" }}>CLP</span>
                </div>
              </div>
              <div className="ticket-row">
                <div>
                  <div className="name">3D Premium</div>
                  <div className="desc">Lentes incluidos · sala IMAX</div>
                </div>
                <div className="price">
                  $14.990 <span style={{ fontWeight: 400, color: "var(--ink-3)" }}>CLP</span>
                </div>
              </div>
              <div className="ticket-row">
                <div>
                  <div className="name">VIP · Combo</div>
                  <div className="desc">Reclinable + cabritas + bebida</div>
                </div>
                <div className="price">
                  $22.990 <span style={{ fontWeight: 400, color: "var(--ink-3)" }}>CLP</span>
                </div>
              </div>
            </div>
            <Link className="btn primary block" style={{ marginTop: 14 }} href={`/checkout/${e.id}`}>
              Comprar entradas {Ic.arrow}
            </Link>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ink-3)",
                letterSpacing: ".1em",
                textAlign: "center",
                marginTop: 10,
              }}
            >
              POWERED BY · KONBINI PAY
            </div>
          </div>

          <div className="info-block">
            <div className="lbl">{Ic.cal} FECHA Y HORA</div>
            <div
              className="row"
              style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed var(--line)" }}
            >
              <div>
                <strong>23 Abril 2025</strong>
                <div style={{ color: "var(--ink-3)", fontSize: 12 }}>Miércoles</div>
              </div>
              <div className="mono" style={{ fontSize: 13 }}>12:00 · 15:30 · 19:00</div>
            </div>
            <div className="row" style={{ justifyContent: "space-between", padding: "8px 0" }}>
              <div>
                <strong>24 Abril 2025</strong>
                <div style={{ color: "var(--ink-3)", fontSize: 12 }}>Jueves</div>
              </div>
              <div className="mono" style={{ fontSize: 13 }}>14:00 · 18:00 · 21:30</div>
            </div>
          </div>

          <div className="info-block">
            <div className="lbl">{Ic.pin} UBICACIÓN</div>
            <div style={{ fontWeight: 600 }}>Teatro Cariola</div>
            <div style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 2 }}>
              San Diego nº 246, Santiago, Región Metropolitana
            </div>
            <div className="map">
              <div className="pin" />
            </div>
          </div>

          <div className="info-block">
            <div className="lbl">ENLACES</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
              <a className="pill" href="#">{Ic.insta} Instagram</a>
              <a className="pill" href="#">{Ic.fb} Facebook</a>
              <a className="pill" href="#">Sitio oficial</a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
