"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Target, Radar, BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SearchEntry {
  kind: "world" | "mission" | "skill" | "anchor";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const ICON = { world: Globe2, mission: Target, skill: Radar, anchor: BookOpen } as const;

function score(q: string, e: SearchEntry): number {
  const hay = `${e.title} ${e.subtitle}`.toLowerCase();
  if (!q) return 1;
  if (hay.includes(q)) return 3 + (e.title.toLowerCase().startsWith(q) ? 2 : 0);
  // subsequence match
  let i = 0;
  for (const ch of hay) if (ch === q[i]) i++;
  return i === q.length ? 1 : 0;
}

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    let cancelled = false;
    if (entries.length === 0) {
      fetch("/api/search")
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setEntries(data);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, entries.length]);

  const results = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return entries
      .map((e) => ({ e, s: score(ql, e) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((x) => x.e);
  }, [q, entries]);

  const safeCursor = Math.min(cursor, Math.max(0, results.length - 1));

  if (!open) return null;
  const go = (e: SearchEntry) => {
    onClose();
    setQ("");
    router.push(e.href);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg-deep/70 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal aria-label="Search">
      <div className="panel hud w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setCursor(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onClose();
              setQ("");
            }
            if (e.key === "ArrowDown") setCursor((c) => Math.min(c + 1, results.length - 1));
            if (e.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
            if (e.key === "Enter" && results[safeCursor]) go(results[safeCursor]);
          }}
          placeholder="Search worlds, missions, skills, anchors…"
          className="w-full border-b border-line bg-transparent px-5 py-4 font-sans text-[15px] text-fg placeholder:text-fg-4 focus:outline-none"
        />
        <ul className="max-h-[50vh] overflow-y-auto py-2" role="listbox">
          {results.length === 0 && <li className="px-5 py-6 text-center text-[13px] text-fg-3">No matches.</li>}
          {results.map((e, i) => {
            const Icon = ICON[e.kind];
            return (
              <li
                key={`${e.kind}:${e.id}`}
                role="option"
                aria-selected={i === safeCursor}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(e)}
                className={cn("flex cursor-pointer items-center gap-3 px-5 py-2.5", i === safeCursor ? "bg-cyan/10" : "hover:bg-panel-3")}
              >
                <Icon className={cn("h-4 w-4", i === safeCursor ? "text-cyan" : "text-fg-3")} />
                <div className="min-w-0">
                  <div className="truncate text-[14px] text-fg">{e.title}</div>
                  <div className="truncate font-mono text-[11px] text-fg-3">{e.subtitle}</div>
                </div>
                <span className="label ml-auto !text-[0.58rem]">{e.kind}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
