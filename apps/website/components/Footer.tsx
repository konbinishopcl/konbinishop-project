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
            <a className="icon-btn" href="https://instagram.com/konbinishop.cl" aria-label="Instagram" target="_blank" rel="noopener noreferrer">{Ic.insta}</a>
            <a className="icon-btn" href="https://facebook.com/konbinishop" aria-label="Facebook" target="_blank" rel="noopener noreferrer">{Ic.fb}</a>
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
          <Link href="/preguntas-frecuentes">Soporte</Link>
        </div>

        <div className="foot-col">
          <h4>Ayuda</h4>
          <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
          <Link href="/terminos-y-condiciones">Términos</Link>
          <Link href="/politica-de-privacidad">Privacidad</Link>
          <Link href="/contacto">Contacto</Link>
        </div>

        <div className="foot-col">
          <h4>Comunidad</h4>
          <a href="https://instagram.com/konbinishop.cl" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://tiktok.com/@konbinishop.cl" target="_blank" rel="noopener noreferrer">TikTok</a>
          <a href="#">Discord</a>
          <Link href="/contacto">Newsletter</Link>
        </div>
      </div>

      <div className="container foot-bot">
        <div>© 2026 KONBINI — コンビニ</div>
        <div>v2.0 / SANTIAGO · CHILE</div>
      </div>
    </footer>
  );
}
