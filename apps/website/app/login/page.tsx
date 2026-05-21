"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { Ic } from "@/components/icons";
import { useTheme, useUser } from "@/components/providers";
import { MOCK_USER } from "@/lib/data";

const TILES = [
  "pa-1", "pa-2", "pa-3", "pa-4", "pa-5", "pa-6", "pa-7", "pa-8",
  "pa-9", "pa-10", "pa-11", "pa-12", "pa-1", "pa-2", "pa-3", "pa-4",
];

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setUser } = useUser();

  const login = () => {
    setUser(MOCK_USER);
    router.push("/");
  };

  return (
    <div className="login-shell">
      <div className="login-art">
        <div className="collage">
          {TILES.map((t, i) => (
            <div key={i} className={`poster-art ${t}`} />
          ))}
        </div>
        <div className="mask" />
        <Link href="/" style={{ position: "relative", zIndex: 2, display: "inline-block" }}>
          <BrandMark size={32} />
        </Link>
        <div className="login-brand-card">
          <div className="jp" style={{ fontSize: 11, letterSpacing: ".2em", color: "var(--ink-3)" }}>
            コンビニショップ
          </div>
          <div className="display" style={{ fontSize: 28, margin: "10px 0 6px", color: "var(--ink)" }}>
            Konbini
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
            El supermercado del entretenimiento geek en LATAM.
          </div>
        </div>
      </div>
      <div className="login-form-side">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 30 }}>
          <Link className="btn ghost" href="/">{Ic.chevL} Inicio</Link>
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? Ic.sun : Ic.moon}
          </button>
        </div>
        <div className="eyebrow">INGRESAR · ログイン</div>
        <h2 style={{ marginTop: 12 }}>
          Todo lo que amas,
          <br />
          en un solo lugar<span style={{ color: "var(--accent)" }}>.</span>
        </h2>
        <p className="lead">
          Crea tu cuenta para guardar eventos, comprar entradas con un click y publicar tu propio
          evento.
        </p>

        <button className="social-btn" onClick={login}>{Ic.google} Continuar con Google</button>
        <button className="social-btn" onClick={login}>{Ic.insta} Continuar con Instagram</button>
        <button className="social-btn" onClick={login}>{Ic.apple} Continuar con Apple</button>

        <div className="login-sep">o continúa con tu email</div>

        <div className="field">
          <input type="email" placeholder="tu@email.com" />
        </div>
        <button className="btn dark lg block" onClick={login}>
          Continuar {Ic.arrow}
        </button>

        <p className="legal">
          Al continuar aceptas nuestros <a>Términos</a> y <a>Política de privacidad</a>. Tus datos
          están protegidos bajo Ley 19.628 de Chile.
        </p>
      </div>
    </div>
  );
}
