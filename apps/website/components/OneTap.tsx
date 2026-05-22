"use client";

import { useGoogleOneTapLogin } from "@react-oauth/google";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/components/providers";
import { api, toUser } from "@/lib/api";

const EXCLUDED = ["/dashboard", "/cuenta"];

export function OneTap() {
  const { user, setAuth } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const excluded = EXCLUDED.some((p) => pathname.startsWith(p));

  useGoogleOneTapLogin({
    disabled: !!user || excluded,
    onSuccess: async ({ credential }) => {
      if (!credential) return;
      try {
        const { token, user: apiUser } = await api.googleOneTap(credential);
        setAuth(toUser(apiUser), token);
        const isAdmin = apiUser.role === "ADMIN" || apiUser.role === "SUPER_ADMIN";
        router.push(isAdmin ? "/dashboard" : "/");
      } catch {
        // One Tap es no intrusivo — fallo silencioso
      }
    },
    onError: () => {},
  });

  return null;
}
