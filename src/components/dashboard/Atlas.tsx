"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { ArtScene } from "@/components/world/ArtScene";
import type { World } from "@content/schema";
import type { WorldVisualState } from "@/engine/worldState";
import { cn } from "@/lib/cn";

export interface AtlasTile {
  world: Pick<World, "id" | "name" | "accent" | "scene" | "codename" | "order">;
  art: { stages: string[] } | null;
  pct: number;
  layers: Record<string, number>;
  visual: WorldVisualState;
}

const RING: Record<WorldVisualState, string> = {
  complete: "ring-cyan/70 shadow-glow-cyan",
  active: "ring-amber/80 shadow-glow-amber",
  unstable: "ring-rose/70",
  available: "ring-cyan-2/50",
  locked: "ring-line",
};
const TEXT: Record<WorldVisualState, string> = { complete: "text-cyan", active: "text-amber-2", unstable: "text-rose", available: "text-cyan-2", locked: "text-fg-4" };

/** The painted world atlas: sixteen districts as tiles, in unlock order, with live status. */
export function Atlas({ tiles, currentId }: { tiles: AtlasTile[]; currentId?: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {tiles.map((t) => {
        const locked = t.visual === "locked";
        const current = t.world.id === currentId;
        return (
          <Link
            key={t.world.id}
            href={`/worlds/${t.world.id}`}
            aria-label={`${t.world.name}, ${locked ? "signal lost" : `${t.pct}% operational`}`}
            className={cn("group relative aspect-[4/3] overflow-hidden rounded-xl ring-1 transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5", RING[t.visual], current && "ring-2")}
          >
            <ArtScene world={t.world} art={t.art} operationalPct={t.pct} layers={t.layers} locked={locked} compact hud={false} className="h-full w-full" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-bg-deep/95 via-bg-deep/40 to-transparent px-2.5 pb-2 pt-8">
              <div className="min-w-0">
                <div className="readout text-[9.5px] text-fg-3">{t.world.codename}</div>
                <div className={cn("truncate font-display text-[12.5px] font-semibold leading-tight", locked ? "text-fg-3" : "text-fg")}>{t.world.name}</div>
              </div>
              <div className={cn("readout shrink-0 text-[11px]", TEXT[t.visual])}>{locked ? <Lock className="h-3.5 w-3.5" /> : `${t.pct}%`}</div>
            </div>
            {current && <span className="absolute left-2 top-2 rounded bg-amber/90 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-bg-deep">current</span>}
          </Link>
        );
      })}
    </div>
  );
}
