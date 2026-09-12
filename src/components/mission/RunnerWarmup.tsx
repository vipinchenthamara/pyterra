"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getRunner } from "@/engine/runner/pyodideClient";

/** Warms the Pyodide worker as soon as the learner is near a mission, so Run feels instant. */
export function RunnerWarmup() {
  const path = usePathname();
  useEffect(() => {
    if (path.startsWith("/missions") || path.startsWith("/worlds") || path.startsWith("/review") || path === "/") {
      getRunner().warm().catch(() => {});
    }
  }, [path]);
  return null;
}
