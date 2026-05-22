"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, minimum: 0.08, trickleSpeed: 200 });

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevKey = useRef(`${pathname}?${searchParams.toString()}`);
  const started = useRef(false);

  // Intercept link clicks → start bar
  useEffect(() => {
    const onAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor?.href) return;
      try {
        const url = new URL(anchor.href);
        if (url.origin !== window.location.origin) return;
        const key = `${url.pathname}?${url.search}`;
        if (key === prevKey.current) return;
        NProgress.start();
        started.current = true;
      } catch {
        // ignore
      }
    };
    document.addEventListener("click", onAnchorClick);
    return () => document.removeEventListener("click", onAnchorClick);
  }, []);

  // Route completed → finish bar
  useEffect(() => {
    const key = `${pathname}?${searchParams.toString()}`;
    if (key !== prevKey.current) {
      prevKey.current = key;
      if (started.current) {
        NProgress.done();
        started.current = false;
      }
    }
  }, [pathname, searchParams]);

  return null;
}
