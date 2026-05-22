"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { Ic } from "@/components/icons";

interface Props {
  onSuccess: (accessToken: string) => void;
  onError: () => void;
  disabled?: boolean;
  label?: string;
}

export function GoogleLoginButton({ onSuccess, onError, disabled, label = "Continuar con Google" }: Props) {
  const login = useGoogleLogin({
    onSuccess: (r) => onSuccess(r.access_token),
    onError,
  });

  return (
    <button className="social-btn" type="button" onClick={() => login()} disabled={disabled}>
      {Ic.google} {label}
    </button>
  );
}
