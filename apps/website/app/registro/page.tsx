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
  "pa-12", "pa-11", "pa-10", "pa-9", "pa-8", "pa-7", "pa-6", "pa-5",
  "pa-4", "pa-3", "pa-2", "pa-1", "pa-12", "pa-11", "pa-10", "pa-9",
];

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const { setAuth } = useUser();

  const returnTo = searchParams.get("returnTo") || "/";

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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
        setError(err instanceof Error ? err.message : "No se pudo continuar con Google");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("No se pudo conectar con Google"),
  });

  // Paso 1 → 2: como es copia del login, sólo se muestra el email aquí.
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
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!firstname.trim() || !lastname.trim()) {
      setError("Completa tu nombre y apellido");
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await api.register({ email, password, firstname, lastname });
      setAuth(toUser(user), token);
      redirect(user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
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
            Crea tu cuenta y suma a la comunidad geek de LATAM.
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
        <div className="eyebrow">CREAR CUENTA · 新規登録 · PASO {step} / 2</div>
        <h2 style={{ marginTop: 12 }}>
          Únete a Konbini<span style={{ color: "var(--accent)" }}>.</span>
        </h2>
        <p className="lead">
          {step === 1
            ? "Empecemos con tu email."
            : "Ya casi — define tu contraseña y completa tus datos."}
        </p>

        {step === 1 && (
          <>
            {googleClientId && (
              <button className="social-btn" type="button" onClick={() => loginWithGoogle()} disabled={loading}>
                {Ic.google} Continuar con Google
              </button>
            )}
            <button className="social-btn" type="button">{Ic.insta} Continuar con Instagram</button>
            <button className="social-btn" type="button">{Ic.apple} Continuar con Apple</button>

            <div className="login-sep">o regístrate con tu email</div>

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
            <div className="grid-2">
              <div className="field">
                <label>Nombre</label>
                <input
                  type="text"
                  placeholder="Camila"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Apellido</label>
                <input
                  type="text"
                  placeholder="Rojas"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{ color: "var(--err)", fontSize: 13, margin: "2px 0 14px" }}>{error}</div>
            )}

            <button type="submit" className="btn dark lg block" disabled={loading}>
              {loading ? "Creando cuenta…" : <>Crear cuenta {Ic.arrow}</>}
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
          ¿Ya tienes cuenta? <Link href="/login" style={{ color: "var(--ink-2)", textDecoration: "underline" }}>Ingresar</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return <Suspense><RegistroContent /></Suspense>;
}
