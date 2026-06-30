"use client";

import { useEffect } from "react";
import LogRocket from "logrocket";

export function LogRocketInit() {
  useEffect(() => {
    LogRocket.init("6ha0vp/konbinishopcl");
  }, []);

  return null;
}
