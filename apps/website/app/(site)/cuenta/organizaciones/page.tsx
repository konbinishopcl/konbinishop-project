"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AccountShell } from "../AccountShell";
import { useUser } from "@/components/providers";

interface Org {
  id: number;
  name: string;
  handle: string;
  role: string;
}

export default function OrganizacionesPage() {
  const { user, token, ready } = useUser();
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login?returnTo=/cuenta/organizaciones");
      return;
    }
    if (!token) return;
    fetch("/api/organizations/mine", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setOrgs(Array.isArray(data) ? data : data.organizations ?? []))
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, [ready, user, token, router]);

  if (!ready || !user) {
    return (
      <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
        {ready ? "Redirigiendo al inicio de sesión…" : "Verificando acceso…"}
      </main>
    );
  }

  const handleCreate = async () => {
    toast.info("Próximamente: Crear organización");
  };

  return (
    <AccountShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
        <h1>Mis organizaciones</h1>
        <button className="btn primary" onClick={handleCreate}>＋ Crear organización</button>
      </div>
      <p className="lead">Cuentas compartidas con miembros, carrito y suscripción independientes.</p>

      {loading ? (
        <div className="acc-section" style={{ color: "var(--ink-3)", fontSize: 14 }}>Cargando organizaciones…</div>
      ) : orgs.length === 0 ? (
        <div className="acc-section">
          <div style={{ color: "var(--ink-3)", fontSize: 14, textAlign: "center", padding: "24px 0" }}>
            No perteneces a ninguna organización aún.
          </div>
        </div>
      ) : (
        <div className="acc-section">
          {orgs.map((o) => (
            <div key={o.id} className="acc-list-row">
              <div className="av" style={{ background: "linear-gradient(135deg, var(--accent-3), var(--accent))" }}>
                {o.name?.[0] ?? "O"}
              </div>
              <div className="main">
                <div className="t">{o.name}</div>
                <div className="m">@{o.handle} · {o.role}</div>
              </div>
              <button className="btn ghost">Entrar</button>
            </div>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
