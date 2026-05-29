"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { NavigationProgress } from "./NavigationProgress";
import { OneTap } from "./OneTap";
import type { User } from "@/lib/data";
import { api, toUser, type ApiUser } from "@/lib/api";

type Theme = "dark" | "light";

/* ───────────────── theme ───────────────── */
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void; toggleTheme: () => void } | null>(null);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("kb-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("kb-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return <ThemeCtx.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <Providers>");
  return ctx;
}

/* ───────────────── user / auth ───────────────── */

type UserCtxValue = {
  user: User | null;
  token: string | null;
  /** Listo cuando ya se leyó el estado persistido (evita parpadeo en los guards). */
  ready: boolean;
  isOrgContext: boolean;       // true when user.type === 'ORGANIZATION'
  personalUser: User | null;   // personal user while in org mode (for UserMenu display)
  personalToken: string | null;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  switchToOrg: (orgId: number) => Promise<void>;
  switchBack: () => void;
};

const UserCtx = createContext<UserCtxValue | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [personalToken, setPersonalToken] = useState<string | null>(null);
  const [personalUser, setPersonalUser] = useState<User | null>(null);

  const isOrgContext = user?.type === "ORGANIZATION";

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let storedToken: string | null = null;
      try {
        const u = localStorage.getItem("kb-user");
        const t = localStorage.getItem("kb-token");
        if (u && u !== "null") {
          const parsed = JSON.parse(u) as User;
          // Re-computa initials por si quedaron vacías (ej. usuarios Google sin nombre)
          if (!parsed.initials) {
            const local = parsed.email?.split("@")[0] ?? parsed.email ?? "";
            parsed.initials = (parsed.name?.split(/\s+/).filter(Boolean).map((s: string) => s[0]).slice(0, 2).join("").toUpperCase()) || local.slice(0, 2).toUpperCase() || "?";
          }
          setUserState(parsed);
        }
        if (t) { setToken(t); storedToken = t; }
        // Restore personal session if we're mid-org-mode
        const pt = localStorage.getItem("kb-personal-token");
        const pu = localStorage.getItem("kb-personal-user");
        if (pt) setPersonalToken(pt);
        if (pu && pu !== "null") setPersonalUser(JSON.parse(pu) as User);
        localStorage.removeItem("kb-org"); // migrate away stale key
      } catch {
        /* ignore */
      }
      setReady(true);

      // Refresca el JWT en background para obtener el rol actual desde DB.
      // Si el token expiró → 401 → auto-logout.
      // Si el rol cambió sin re-login → nuevo JWT con rol actualizado.
      if (storedToken) {
        try {
          const r = await fetch("/api/auth/refresh", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (cancelled) return;
          if (r.ok) {
            const data = await r.json() as { token: string; user: ApiUser };
            const mappedUser = toUser(data.user);
            setUserState(mappedUser);
            setToken(data.token);
            localStorage.setItem("kb-user", JSON.stringify(mappedUser));
            localStorage.setItem("kb-token", data.token);
          } else if (r.status === 401) {
            // Token expirado o inválido → cerrar sesión completa
            setUserState(null);
            setToken(null);
            setPersonalToken(null);
            setPersonalUser(null);
            localStorage.removeItem("kb-user");
            localStorage.removeItem("kb-token");
            localStorage.removeItem("kb-personal-token");
            localStorage.removeItem("kb-personal-user");
          }
          // Otros errores (502 si el backend está caído) → mantener sesión existente
        } catch {
          /* error de red → mantener sesión existente */
        }
      }
    }

    void init();
    return () => { cancelled = true; };
  }, []);

  const setAuth = (nextUser: User, nextToken: string) => {
    setUserState(nextUser);
    setToken(nextToken);
    localStorage.setItem("kb-user", JSON.stringify(nextUser));
    localStorage.setItem("kb-token", nextToken);
  };

  const setUser = (nextUser: User | null) => {
    setUserState(nextUser);
    localStorage.setItem("kb-user", JSON.stringify(nextUser));
  };

  const logout = () => {
    setUserState(null);
    setToken(null);
    setPersonalToken(null);
    setPersonalUser(null);
    localStorage.removeItem("kb-user");
    localStorage.removeItem("kb-token");
    localStorage.removeItem("kb-personal-token");
    localStorage.removeItem("kb-personal-user");
    localStorage.removeItem("kb-org");
  };

  const switchToOrg = async (orgId: number) => {
    if (!token || !user) throw new Error("No hay sesión activa");
    const { token: orgToken, user: apiUser } = await api.switchOrg(orgId, token);
    // Save personal session for switch-back
    setPersonalToken(token);
    setPersonalUser(user);
    localStorage.setItem("kb-personal-token", token);
    localStorage.setItem("kb-personal-user", JSON.stringify(user));
    // Swap in the org session (writes kb-token + kb-user)
    setAuth(toUser(apiUser), orgToken);
  };

  const switchBack = () => {
    if (!personalToken || !personalUser) return;
    setAuth(personalUser, personalToken);
    setPersonalToken(null);
    setPersonalUser(null);
    localStorage.removeItem("kb-personal-token");
    localStorage.removeItem("kb-personal-user");
  };

  return (
    <UserCtx.Provider value={{ user, token, ready, isOrgContext, personalUser, personalToken, setAuth, setUser, logout, switchToOrg, switchBack }}>
      {children}
    </UserCtx.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserCtx);
  if (!ctx) throw new Error("useUser debe usarse dentro de <Providers>");
  return ctx;
}

/* ───────────────── wrapper ───────────────── */
export function Providers({ children }: { children: ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <UserProvider>
          <NavigationProgress />
          {googleClientId && <OneTap />}
          {children}
        </UserProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
