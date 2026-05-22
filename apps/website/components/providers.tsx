"use client";

import { createContext, useContext, useEffect, useState, Suspense, type ReactNode } from "react";
import { NavigationProgress } from "./NavigationProgress";
import type { User } from "@/lib/data";

type Theme = "dark" | "light";

/* ───────────────── theme ───────────────── */
const ThemeCtx = createContext<{ theme: Theme; setTheme: (t: Theme) => void } | null>(null);

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

  return <ThemeCtx.Provider value={{ theme, setTheme }}>{children}</ThemeCtx.Provider>;
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
  setAuth: (user: User, token: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
};

const UserCtx = createContext<UserCtxValue | null>(null);

function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem("kb-user");
      const t = localStorage.getItem("kb-token");
      if (u && u !== "null") setUserState(JSON.parse(u));
      if (t) setToken(t);
    } catch {
      /* ignore */
    }
    setReady(true);
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
    localStorage.removeItem("kb-user");
    localStorage.removeItem("kb-token");
  };

  return (
    <UserCtx.Provider value={{ user, token, ready, setAuth, setUser, logout }}>
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
  return (
    <ThemeProvider>
      <UserProvider>
        <Suspense>
          <NavigationProgress />
        </Suspense>
        {children}
      </UserProvider>
    </ThemeProvider>
  );
}
