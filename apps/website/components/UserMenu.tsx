"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  CalendarDays,
  Sparkles,
  Heart,
  LogOut,
  Plus,
  Check,
} from "lucide-react";
import { useUser } from "./providers";

export function UserMenu({ size = 40 }: { size?: number }) {
  const { user, token, personalToken, personalUser, logout, switchToOrg, switchBack, isOrgContext } = useUser();
  const router    = useRouter();
  const pathname  = usePathname();
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<{ id: number; name: string | null; handle: string | null }[]>([]);

  // Load user's organizations when menu opens — always use personal token (org JWTs have no memberships)
  useEffect(() => {
    if (!open) return;
    const authToken = personalToken ?? token;
    if (!authToken) return;
    fetch("/api/organizations/mine", { headers: { Authorization: `Bearer ${authToken}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: { id: number; firstname?: string | null; name?: string | null; handle?: string | null }[]) =>
        setOrgs(data.map(o => ({ id: o.id, name: o.firstname ?? o.name ?? null, handle: o.handle ?? null })))
      )
      .catch(() => {});
  }, [open, token, personalToken]);

  if (!user) return null;

  const close       = () => setOpen(false);
  const go          = (href: string) => { close(); router.push(href); };
  const isAdmin     = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const inDashboard = pathname?.startsWith("/dashboard");

  const personalDisplay = personalUser ?? user;

  return (
    <div style={{ position: "relative" }}>
      <button
        className="avatar"
        style={{ width: size, height: size, fontSize: size * 0.3, ...(isOrgContext ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff" } : {}) }}
        title={user.name}
        onClick={() => setOpen((o) => !o)}
      >
        {user.initials}
      </button>

      {open && (
        <div className="menu" onMouseLeave={close} style={{ minWidth: 280, top: "calc(100% + 8px)" }}>

          {/* Operando como */}
          <div className="hdr">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
              Operando como
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: isOrgContext ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                {user.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">{user.name}</div>
                <div className="em" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {isOrgContext && user.handle ? `@${user.handle}` : user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Cambiar de cuenta */}
          <div style={{ padding: "4px 10px 2px", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase" }}>
            Cambiar de cuenta
          </div>
          <button
            style={{ background: !isOrgContext ? "var(--surface-2)" : "transparent", color: "var(--ink)" }}
            onClick={() => { switchBack(); close(); toast.success("Operando como cuenta personal"); }}
          >
            <span style={{ width: 22, height: 22, borderRadius: 999, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
              {personalDisplay.initials}
            </span>
            <span style={{ flex: 1 }}>{personalDisplay.name ?? "Cuenta personal"}</span>
            {!isOrgContext && <Check size={14} style={{ color: "var(--accent)" }} />}
          </button>
          {orgs.map(org => (
            <button
              key={org.id}
              style={{ background: isOrgContext && user.id === org.id ? "var(--surface-2)" : "transparent", color: "var(--ink)" }}
              onClick={async () => {
                try {
                  await switchToOrg(org.id);
                  close();
                  toast.success(`Operando como ${org.name ?? org.handle ?? "organización"}`);
                } catch {
                  toast.error("No se pudo cambiar de cuenta");
                }
              }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 999, background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                {(org.name ?? "O")[0].toUpperCase()}
              </span>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {org.name ?? org.handle ?? "Organización"}
              </span>
              {isOrgContext && user.id === org.id
                ? <Check size={14} style={{ color: "var(--accent)" }} />
                : org.handle && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>@{org.handle}</span>
              }
            </button>
          ))}
          <button onClick={() => go("/cuenta/organizaciones")} style={{ color: "var(--ink-3)", fontSize: 12 }}>
            <span style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={14} />
            </span>
            <span>Crear organización</span>
          </button>

          {/* Panel de admin — solo fuera del dashboard */}
          {isAdmin && !inDashboard && (
            <>
              <div style={{ height: 1, background: "var(--line)", margin: "6px 8px" }} />
              <button onClick={() => go("/dashboard")}>
                <LayoutDashboard size={15} style={{ opacity: .7 }} />
                Panel de administración
              </button>
            </>
          )}

          <div style={{ height: 1, background: "var(--line)", margin: "6px 8px" }} />

          <button onClick={() => go("/cuenta/perfil")}>
            <User size={15} style={{ opacity: .7 }} /> Mi cuenta
          </button>
          <button onClick={() => go("/cuenta/publicaciones")}>
            <CalendarDays size={15} style={{ opacity: .7 }} /> Mis eventos
          </button>
          <button onClick={() => go("/cuenta/suscripcion")}>
            <Sparkles size={15} style={{ opacity: .7 }} /> Suscripción
          </button>
          <button onClick={() => go("/cuenta/favoritos")}>
            <Heart size={15} style={{ opacity: .7 }} /> Favoritos
          </button>

          <div style={{ height: 1, background: "var(--line)", margin: "6px 8px" }} />
          <button className="danger" onClick={() => { logout(); close(); router.push("/"); }}>
            <LogOut size={15} style={{ opacity: .7 }} /> Cerrar sesión
          </button>

        </div>
      )}
    </div>
  );
}
