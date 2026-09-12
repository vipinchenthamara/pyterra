"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

const OPTIONS = [
  { v: "5", label: "5 min" },
  { v: "15", label: "15 min" },
  { v: "0", label: "Deep session" },
];

export function SessionSelector() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("session") ?? "0";
  return (
    <div className="inline-flex rounded-lg border border-line bg-bg-deep p-0.5" role="radiogroup" aria-label="Session length">
      {OPTIONS.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={current === o.v}
          onClick={() => router.push(o.v === "0" ? "/" : `/?session=${o.v}`)}
          className={cn("rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors", current === o.v ? "bg-cyan/15 text-cyan" : "text-fg-3 hover:text-fg-2")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
