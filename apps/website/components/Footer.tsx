import Link from "next/link";
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
            El medio geek de Chile · directorio de eventos y noticias otaku.
          </p>
          <div className="row" style={{ marginTop: 18, gap: 10 }}>
            <a className="icon-btn" href="#" aria-label="Google">{Ic.google}</a>
            <a className="icon-btn" href="#" aria-label="Instagram">{Ic.insta}</a>
            <a className="icon-btn" href="#" aria-label="Facebook">{Ic.fb}</a>
            <a className="icon-btn" href="#" aria-label="Apple">{Ic.apple}</a>
          </div>
        </div>

        <div className="foot-col">
          <h4>Explora</h4>
          <Link href="/">Inicio</Link>
          <Link href="/noticias">Noticias</Link>
          <Link href="/busqueda">Buscar</Link>
          <Link href="/nosotros">About</Link>
        </div>

        <div className="foot-col">
          <h4>Organiza</h4>
          <Link href="/precios">Publicar evento</Link>
          <Link href="/servicios/fotografia">Fotografía</Link>
          <Link href="/servicios/creadores">Creadores de contenido</Link>
          <Link href="/ayuda">Soporte</Link>
        </div>

        <div className="foot-col">
          <h4>Ayuda</h4>
          <Link href="/ayuda">Preguntas frecuentes</Link>
          <Link href="/ayuda?tab=terms">Términos</Link>
          <Link href="/ayuda?tab=privacy">Privacidad</Link>
          <Link href="/ayuda?tab=contact">Contacto</Link>
        </div>

        <div className="foot-col">
          <h4>Comunidad</h4>
          <a href="#">Instagram</a>
          <a href="#">TikTok</a>
          <a href="#">Discord</a>
          <a href="#">Newsletter</a>
        </div>
      </div>

      <div className="container foot-bot">
        <div>© 2026 KONBINI — コンビニ</div>
        <div>v2.0 / SANTIAGO · CHILE</div>
      </div>
    </footer>
  );
}
