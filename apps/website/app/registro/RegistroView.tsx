"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AuthShell } from "@/components/AuthShell";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useUser } from "@/components/providers";
import { api, toUser, type ApiCountry } from "@/lib/api";

function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useUser();

  const returnTo = searchParams.get("returnTo") ?? searchParams.get("redirect") ?? "/";

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [countryId, setCountryId] = useState<number | "">("");
  const [countries, setCountries] = useState<ApiCountry[]>([]);
  const [busy, setBusy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [accept18, setAccept18] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  // Carga los países al pasar al paso 2
  useEffect(() => {
    if (step === 2 && countries.length === 0) {
      api.countries().then((list) => {
        setCountries(list);
        // Auto-selecciona si solo hay un país (e.g., Chile)
        if (list.length === 1) setCountryId(list[0].id);
      }).catch(() => { /* silencioso */ });
    }
  }, [step, countries.length]);

  const redirectAfterLogin = (role: string) =>
    router.push(role === "ADMIN" || role === "SUPER_ADMIN" ? "/dashboard" : returnTo);

  const handleGoogleSuccess = async (accessToken: string) => {
    setBusy(true);
    try {
      const res = await api.googleAuth(accessToken);
      setAuth(toUser(res.user), res.token);
      toast.success("Cuenta creada con Google");
      redirectAfterLogin(res.user.role);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo continuar con Google");
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
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (!firstname.trim() || !lastname.trim()) {
      toast.error("Completa tu nombre y apellido");
      return;
    }
    if (!acceptTerms) { toast.error("Debes aceptar los términos y condiciones"); return; }
    if (!accept18) { toast.error("Debes confirmar que eres mayor de 18 años"); return; }
    setBusy(true);
    try {
      const res = await api.register({
        email,
        password,
        firstname,
        lastname,
        ...(countryId !== "" ? { countryId } : {}),
      });
      setAuth(toUser(res.user), res.token);
      toast.success("Cuenta creada");
      redirectAfterLogin(res.user.role);
    } catch (ex) {
      toast.error(ex instanceof Error ? ex.message : "No se pudo crear la cuenta");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? "Crea tu cuenta" : "Casi listo."}
      subtitle={step === 1 ? "Empieza con tu email — es gratis y te toma 1 minuto." : "Estos datos son obligatorios por Ley 21.719."}
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
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>
              Inicia sesión
            </Link>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={submit}>
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
              <label>País</label>
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value ? Number(e.target.value) : "")}
                required
                disabled={countries.length === 0}
              >
                <option value="">{countries.length === 0 ? "Cargando…" : "Selecciona tu país"}</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid-2">
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
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "18px 0" }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Acepto los <Link href="/ayuda?tab=terms" target="_blank" style={{ color: "var(--accent)" }}>Términos y condiciones</Link> y la <Link href="/ayuda?tab=privacy" target="_blank" style={{ color: "var(--accent)" }}>Política de privacidad</Link> <span style={{ color: "var(--err)" }}>*</span></span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={accept18} onChange={e => setAccept18(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Confirmo que soy mayor de 18 años <span style={{ color: "var(--err)" }}>*</span></span>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={acceptMarketing} onChange={e => setAcceptMarketing(e.target.checked)} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ color: "var(--ink-3)" }}>Quiero recibir noticias y promociones de Konbini (opcional)</span>
              </label>
            </div>
            <button type="submit" className="btn primary block lg" disabled={busy}>
              {busy ? "Creando cuenta…" : "Crear cuenta →"}
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

export function RegistroView() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  );
}
