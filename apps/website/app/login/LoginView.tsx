"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthShell } from "@/components/AuthShell";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useUser } from "@/components/providers";
import { api, toUser } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useUser();

  const returnTo = searchParams.get("returnTo") ?? searchParams.get("redirect") ?? "/";

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const redirectAfterLogin = (role: string) =>
    router.push(role === "ADMIN" || role === "SUPER_ADMIN" ? "/dashboard" : returnTo);

  const handleGoogleSuccess = async (accessToken: string) => {
    setBusy(true);
    try {
      const res = await api.googleAuth(accessToken);
      setAuth(toUser(res.user), res.token);
      toast.success("Bienvenido");
      redirectAfterLogin(res.user.role);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo iniciar sesión con Google");
    } finally {
      setBusy(false);
    }
  };

  const goStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Ingresa tu email para continuar");
      return;
    }
    setStep(2);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.login({ email, password });
      setAuth(toUser(res.user), res.token);
      toast.success("Bienvenido de vuelta");
      redirectAfterLogin(res.user.role);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? "Bienvenido de vuelta" : "Tu contraseña"}
      subtitle={step === 1 ? "Ingresa con tu cuenta de Konbini para guardar eventos y publicar." : email ? `Para ${email}` : undefined}
      step={step}
      of={2}
    >
      {step === 1 ? (
        <>
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error("No se pudo conectar con Google")}
            disabled={busy}
          />
          <div className="login-sep">o con email</div>
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
            <button type="submit" className="btn primary block lg" disabled={busy}>
              Continuar →
            </button>
          </form>
          <div style={{ marginTop: 18, fontSize: 13, color: "var(--ink-3)" }}>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" style={{ color: "var(--accent)", textDecoration: "none" }}>
              Regístrate
            </Link>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={submit}>
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
            <div style={{ marginBottom: 18, fontSize: 13 }}>
              <Link href="/recuperar" style={{ color: "var(--accent)" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <button type="submit" className="btn primary block lg" disabled={busy}>
              {busy ? "Ingresando…" : "Iniciar sesión →"}
            </button>
          </form>
          <button
            type="button"
            className="btn ghost block"
            style={{ marginTop: 10 }}
            onClick={() => setStep(1)}
          >
            ← Volver
          </button>
        </>
      )}
    </AuthShell>
  );
}

export function LoginView() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
