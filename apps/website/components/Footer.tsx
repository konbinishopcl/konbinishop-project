import { BrandMark } from "./BrandMark";
import { Ic } from "./icons";

export function Footer() {
  return (
    <footer className="app">
      <div className="container foot-grid">
        <div className="foot-col">
          <BrandMark size={32} />
          <p
            style={{
              color: "var(--ink-3)",
              fontSize: 13,
              lineHeight: 1.6,
              marginTop: 14,
              maxWidth: "32ch",
            }}
          >
            Todo lo que amas — anime, conciertos, ferias y conventions — en un solo lugar.
          </p>
          <div className="row" style={{ marginTop: 18, gap: 10 }}>
            <a className="icon-btn" href="#">{Ic.google}</a>
            <a className="icon-btn" href="#">{Ic.insta}</a>
            <a className="icon-btn" href="#">{Ic.fb}</a>
            <a className="icon-btn" href="#">{Ic.apple}</a>
          </div>
        </div>
        <div className="foot-col">
          <h4>Explora</h4>
          <a>Cine</a><a>Conciertos</a><a>Convenciones</a><a>Ferias</a>
        </div>
        <div className="foot-col">
          <h4>Organiza</h4>
          <a>Crear evento</a><a>Guía publicación</a><a>Pasarela de pago</a><a>Soporte</a>
        </div>
        <div className="foot-col">
          <h4>Comunidad</h4>
          <a>Instagram</a><a>TikTok</a><a>Discord</a><a>Newsletter</a>
        </div>
        <div className="foot-col">
          <h4>Legal</h4>
          <a>Términos</a><a>Privacidad</a><a>Cookies</a><a>Copyright</a>
        </div>
      </div>
      <div className="container foot-bot">
        <div>© 2025 KONBINI SHOP — コンビニショップ</div>
        <div>v2.0 / SANTIAGO · CHILE</div>
      </div>
    </footer>
  );
}
