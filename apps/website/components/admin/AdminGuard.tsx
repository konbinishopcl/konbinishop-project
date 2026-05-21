"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useUser } from "@/components/providers";

/** Sólo deja pasar a ADMIN y SUPER_ADMIN; al resto los manda a /login. */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, ready } = useUser();
  const router = useRouter();
  const allowed = !!user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");

  useEffect(() => {
    if (ready && !allowed) router.replace("/login");
  }, [ready, allowed, router]);

  if (!ready || !allowed) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-3)",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          letterSpacing: ".08em",
        }}
      >
        {ready ? "Acceso restringido — redirigiendo…" : "Verificando acceso…"}
      </div>
    );
  }

  return <>{children}</>;
}
