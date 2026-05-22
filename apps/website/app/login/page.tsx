"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { BrandMark } from "@/components/BrandMark";
import { Ic } from "@/components/icons";
import { useTheme, useUser } from "@/components/providers";
import { api, toUser } from "@/lib/api";

const TILES = [
  "pa-1", "pa-2", "pa-3", "pa-4", "pa-5", "pa-6", "pa-7", "pa-8",
  "pa-9", "pa-10", "pa-11", "pa-12", "pa-1", "pa-2", "pa-3", "pa-4",
];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const { setAuth } = useUser();

  const returnTo = searchParams.get("returnTo") || "/";

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirect = (role: string) =>
    router.push(role === "ADMIN" || role === "SUPER_ADMIN" ? "/dashboard" : returnTo);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const { token, user } = await api.googleAuth(tokenResponse.access_token);
        setAuth(toUser(user), token);
        redirect(user.role);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo iniciar sesión con Google");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("No se pudo conectar con Google"),
  });

  // Paso 1 → 2: primero sólo el email; al continuar aparece la contraseña.
  const goStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Ingresa tu email para continuar");
      return;
    }
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await api.login({ email, password });
      setAuth(toUser(user), token);
      redirect(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
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
          Ingresa para comprar entradas, guardar eventos y publicar los tuyos.
        </p>

        {step === 1 && (
          <>
            <button className="social-btn" type="button" onClick={() => loginWithGoogle()} disabled={loading}>
              {Ic.google} Continuar con Google
            </button>
            <button className="social-btn" type="button">{Ic.insta} Continuar con Instagram</button>
            <button className="social-btn" type="button">{Ic.apple} Continuar con Apple</button>

            <div className="login-sep">o continúa con tu email</div>

            <form onSubmit={goStep2}>
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div style={{ color: "var(--err)", fontSize: 13, margin: "2px 0 14px" }}>{error}</div>
              )}
              <button type="submit" className="btn dark lg block">
                Continuar {Ic.arrow}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={email} disabled />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>
            {error && (
              <div style={{ color: "var(--err)", fontSize: 13, margin: "2px 0 14px" }}>{error}</div>
            )}
            <button type="submit" className="btn dark lg block" disabled={loading}>
              {loading ? "Ingresando…" : <>Ingresar {Ic.arrow}</>}
            </button>
            <button
              type="button"
              className="btn ghost block"
              style={{ marginTop: 10 }}
              onClick={() => {
                setError("");
                setStep(1);
              }}
            >
              {Ic.chevL} Volver
            </button>
          </form>
        )}

        <p className="legal">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>
            Crear cuenta
          </Link>
        </p>
        <p className="legal">
          Al continuar aceptas nuestros <a>Términos</a> y <a>Política de privacidad</a>. Tus datos
          están protegidos bajo Ley 19.628 de Chile.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginContent /></Suspense>;
}
