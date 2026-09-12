"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import type { WorldVisualState } from "@/engine/worldState";
import { cn } from "@/lib/cn";

export interface MapNode {
  id: string;
  order: number;
  name: string;
  codename: string;
  pct: number;
  visual: WorldVisualState;
  accent: string;
}

/** Serpentine layout: 4 rows × 4, alternating direction, with deterministic jitter for an organic path. */
function positions(n: number, w: number, h: number) {
  const cols = 4;
  const rows = Math.ceil(n / cols);
  const padX = 90;
  const padY = 70;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const cIdx = i % cols;
    const c = r % 2 === 0 ? cIdx : cols - 1 - cIdx;
    const jitterY = ((i * 37) % 23) - 11;
    const jitterX = ((i * 53) % 19) - 9;
    out.push({
      x: padX + (c * (w - padX * 2)) / (cols - 1) + jitterX,
      y: padY + (r * (h - padY * 2)) / Math.max(1, rows - 1) + jitterY,
    });
  }
  return out;
}

const TONE: Record<WorldVisualState, { stroke: string; fill: string; text: string; glow: string }> = {
  complete: { stroke: "#22d3ee", fill: "rgba(34,211,238,0.16)", text: "text-cyan", glow: "0 0 18px rgba(34,211,238,0.55)" },
  active: { stroke: "#f59e0b", fill: "rgba(245,158,11,0.16)", text: "text-amber-2", glow: "0 0 18px rgba(245,158,11,0.55)" },
  unstable: { stroke: "#fb7185", fill: "rgba(251,113,133,0.14)", text: "text-rose", glow: "0 0 16px rgba(251,113,133,0.5)" },
  available: { stroke: "#67e8f9", fill: "rgba(103,232,249,0.08)", text: "text-cyan-2", glow: "0 0 12px rgba(103,232,249,0.35)" },
  locked: { stroke: "#3b2a6b", fill: "rgba(139,92,246,0.06)", text: "text-fg-4", glow: "none" },
};

export function WorldMap({ nodes, currentId, compact = false, className = "" }: { nodes: MapNode[]; currentId?: string | null; compact?: boolean; className?: string }) {
  const W = 1000;
  const H = compact ? 420 : 520;
  const pos = positions(nodes.length, W, H);
  const path = pos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="World map">
        <defs>
          <radialGradient id="map-bg" cx="50%" cy="40%" r="70%">
            <stop offset="0" stopColor="#111a2c" />
            <stop offset="1" stopColor="#070b14" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#map-bg)" rx="14" />
        {/* grid */}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={(i * W) / 10} y1={0} x2={(i * W) / 10} y2={H} stroke="rgba(255,255,255,0.03)" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={(i * H) / 5} x2={W} y2={(i * H) / 5} stroke="rgba(255,255,255,0.03)" />
        ))}
        {/* route */}
        <path d={path} fill="none" stroke="rgba(230,237,247,0.12)" strokeWidth="2" strokeDasharray="6 8" />
        {nodes.map((n, i) => {
          if (i === 0) return null;
          const a = pos[i - 1];
          const b = pos[i];
          const lit = nodes[i - 1].pct >= 100;
          return <line key={`e${n.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={lit ? "#22d3ee" : "transparent"} strokeWidth="2" strokeDasharray="6 8" opacity="0.7" className={lit ? "animate-flow" : ""} style={{ strokeDashoffset: 0 }} />;
        })}
      </svg>
      {nodes.map((n, i) => {
        const p = pos[i];
        const t = TONE[n.visual];
        const isCurrent = n.id === currentId;
        const r = compact ? 16 : 22;
        return (
          <Link
            key={n.id}
            href={`/worlds/${n.id}`}
            aria-label={`${n.name}, ${n.visual}, ${n.pct}% operational`}
            className="group absolute -translate-x-1/2 -translate-y-1/2 outline-none"
            style={{ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` }}
          >
            <div className="flex flex-col items-center">
              <div
                className={cn("relative flex items-center justify-center rounded-full border-2 font-display font-semibold transition-transform group-hover:scale-110 group-focus-visible:scale-110", compact ? "text-[11px]" : "text-[13px]", t.text)}
                style={{ width: r * 2, height: r * 2, borderColor: t.stroke, background: t.fill, boxShadow: isCurrent || n.visual === "active" ? t.glow : undefined }}
              >
                {n.visual === "locked" ? <Lock className={compact ? "h-3 w-3" : "h-4 w-4"} /> : n.order}
                {(isCurrent || n.visual === "active") && <span className="absolute inset-0 -m-1.5 animate-pulse-slow rounded-full border" style={{ borderColor: t.stroke, opacity: 0.6 }} />}
              </div>
              {!compact && (
                <div className="mt-1.5 hidden whitespace-nowrap text-center md:block">
                  <div className={cn("font-display text-[12.5px] font-semibold leading-tight", n.visual === "locked" ? "text-fg-4" : "text-fg")}>{n.name}</div>
                  <div className={cn("readout text-[11px]", t.text)}>{n.visual === "locked" ? "SIGNAL LOST" : `${n.pct}%`}</div>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
