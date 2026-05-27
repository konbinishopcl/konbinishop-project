"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AccountShell } from "../cuenta/AccountShell";
import { useUser } from "@/components/providers";
import { ArticleForm } from "@/app/dashboard/articles/ArticleForm";

export default function CrearArticuloPage() {
  const { user, ready } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?returnTo=/crear-articulo");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  return (
    <AccountShell>
      <ArticleForm mode="create" variant="sponsored" />
    </AccountShell>
  );
}
