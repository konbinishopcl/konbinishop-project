"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";

NProgress.configure({ showSpinner: false, minimum: 0.08, trickleSpeed: 200 });

export function NavigationProgress() {
  const pathname = usePathname();
  const started = useRef(false);

  // Patch history.pushState — fires before React's event system, works in production
  useEffect(() => {
    const original = history.pushState.bind(history);
    history.pushState = function (...args: Parameters<typeof history.pushState>) {
      NProgress.start();
      started.current = true;
      return original(...args);
    };
    return () => {
      history.pushState = original;
    };
  }, []);

  // Route completed → finish bar
  useEffect(() => {
    if (started.current) {
      NProgress.done();
      started.current = false;
    }
  }, [pathname]);

  return null;
}
