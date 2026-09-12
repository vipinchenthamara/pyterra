"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchPalette } from "./SearchPalette";

export function TopBar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const crumbs = path.split("/").filter(Boolean);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-line bg-bg/70 px-6 backdrop-blur md:px-8">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 font-mono text-[12px] text-fg-3">
        <Link href="/" className="hover:text-fg">
          home
        </Link>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-fg-4">/</span>
            <span className="truncate text-fg-2">{decodeURIComponent(c)}</span>
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-[13px] text-fg-3 transition-colors hover:border-line-2 hover:text-fg-2"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search worlds, missions, concepts…</span>
          <kbd className="ml-2 hidden rounded border border-line-2 bg-bg-deep px-1.5 font-mono text-[10px] text-fg-3 sm:inline">⌘K</kbd>
        </button>
        <StreakChip />
      </div>
      <SearchPalette open={open} onClose={() => setOpen(false)} />
    </header>
  );
}

function StreakChip() {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => setDays(p?.streakDays ?? 0))
      .catch(() => setDays(0));
  }, []);
  return (
    <div className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-panel px-3 font-mono text-[12px] text-fg-2" title="Streaks are soft. Missing a day never erases progress.">
      <Flame className="h-4 w-4 text-amber" />
      <span className="readout">{days ?? "–"}</span>
      <span className="text-fg-3">day streak</span>
    </div>
  );
}
