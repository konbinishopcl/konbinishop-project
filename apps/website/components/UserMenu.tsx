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
import { useUser, type OrgEntry } from "./providers";

export function UserMenu({ size = 40 }: { size?: number }) {
  const { user, token, logout, activeOrg, setActiveOrg } = useUser();
  const router    = useRouter();
  const pathname  = usePathname();
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<{ id: number; name: string | null; handle: string | null }[]>([]);

  // Load user's organizations when menu opens
  useEffect(() => {
    if (!open || !token) return;
    fetch("/api/organizations/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: { id: number; firstname?: string | null; name?: string | null; handle?: string | null }[]) =>
        setOrgs(data.map(o => ({ id: o.id, name: o.firstname ?? o.name ?? null, handle: o.handle ?? null })))
      )
      .catch(() => {});
  }, [open, token]);

  if (!user) return null;

  const close       = () => setOpen(false);
  const go          = (href: string) => { close(); router.push(href); };
  const isAdmin     = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const inDashboard = pathname?.startsWith("/dashboard");

  return (
    <div style={{ position: "relative" }}>
      <button
        className="avatar"
        style={{ width: size, height: size, fontSize: size * 0.3, ...(activeOrg ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff" } : {}) }}
        title={activeOrg ? (activeOrg.name ?? activeOrg.handle ?? "Organización") : user.name}
        onClick={() => setOpen((o) => !o)}
      >
        {activeOrg ? (activeOrg.name ?? activeOrg.handle ?? "O")[0].toUpperCase() : user.initials}
      </button>

      {open && (
        <div className="menu" onMouseLeave={close} style={{ minWidth: 280, top: "calc(100% + 8px)" }}>

          {/* Operando como */}
          <div className="hdr">
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 6 }}>
              Operando como
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: activeOrg ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                {activeOrg ? (activeOrg.name ?? "O")[0].toUpperCase() : user.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">{activeOrg ? (activeOrg.name ?? activeOrg.handle) : user.name}</div>
                <div className="em" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeOrg ? (activeOrg.handle ? `@${activeOrg.handle}` : "Organización") : user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Cambiar de cuenta */}
          <div style={{ padding: "4px 10px 2px", fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase" }}>
            Cambiar de cuenta
          </div>
          <button
            style={{ background: !activeOrg ? "var(--surface-2)" : "transparent", color: "var(--ink)" }}
            onClick={() => { setActiveOrg(null); close(); toast.success("Operando como cuenta personal"); }}
          >
            <span style={{ width: 22, height: 22, borderRadius: 999, background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
              {user.initials}
            </span>
            <span style={{ flex: 1 }}>Cuenta personal</span>
            {!activeOrg && <Check size={14} style={{ color: "var(--accent)" }} />}
          </button>
          {orgs.map(org => (
            <button
              key={org.id}
              style={{ background: activeOrg?.id === org.id ? "var(--surface-2)" : "transparent", color: "var(--ink)" }}
              onClick={() => { setActiveOrg(org); close(); toast.success(`Operando como ${org.name ?? org.handle ?? "organización"}`); }}
            >
              <span style={{ width: 22, height: 22, borderRadius: 999, background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                {(org.name ?? "O")[0].toUpperCase()}
              </span>
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {org.name ?? org.handle ?? "Organización"}
              </span>
              {activeOrg?.id === org.id
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
