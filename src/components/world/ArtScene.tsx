"use client";

import { useMemo, useRef, useState } from "react";
import type { World } from "@content/schema";
import { WorldScene } from "./WorldScene";
import { HudOverlay } from "./HudOverlay";
import { cn } from "@/lib/cn";

export interface ArtSceneProps {
  world: Pick<World, "id" | "name" | "accent" | "scene"> & { codename?: string };
  /** Stage image URLs; when absent the procedural scene renders alone. */
  art: { stages: string[] } | null;
  operationalPct: number;
  layers: Record<string, number>;
  previousLayers?: Record<string, number>;
  locked?: boolean;
  compact?: boolean;
  /** Show HUD markers for scene layers (default true unless compact). */
  hud?: boolean;
  className?: string;
  /** Slow parallax on pointer move (hero contexts only). */
  parallax?: boolean;
}

/** Stage index and blend: 0% → stage 0; 1–99% → dissolve 0→1→2; 100% → stage 2. */
export function stageMix(pct: number, locked: boolean): [number, number, number] {
  if (locked) return [1, 0, 0];
  if (pct <= 0) return [1, 0, 0];
  if (pct >= 100) return [0, 0, 1];
  if (pct < 50) {
    const t = pct / 50;
    return [1 - t * 0.85, t, 0];
  }
  const t = (pct - 50) / 50;
  return [0, 1 - t, t];
}

export function ArtScene(p: ArtSceneProps) {
  const mix = stageMix(p.operationalPct, !!p.locked);
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const sweep = useMemo(() => {
    if (!p.previousLayers) return false;
    return Object.entries(p.layers).some(([id, lvl]) => lvl > (p.previousLayers?.[id] ?? 0));
  }, [p.layers, p.previousLayers]);

  if (!p.art) {
    return <WorldScene world={p.world} layers={p.layers} previousLayers={p.previousLayers} locked={p.locked} compact={p.compact} className={p.className} />;
  }
  return (
    <div
      ref={ref}
      className={cn("relative h-full w-full overflow-hidden bg-bg-deep", p.className)}
      onPointerMove={
        p.parallax
          ? (e) => {
              const r = ref.current?.getBoundingClientRect();
              if (!r) return;
              setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
            }
          : undefined
      }
      onPointerLeave={p.parallax ? () => setTilt({ x: 0, y: 0 }) : undefined}
      role="img"
      aria-label={`${p.world.name}, ${p.locked ? "signal lost" : `${p.operationalPct}% operational`}`}
    >
      {p.art.stages.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className={cn("absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-[1600ms] ease-out", p.locked && "saturate-[0.35] brightness-[0.55]")}
          style={{ opacity: mix[i], transform: p.parallax ? `scale(1.06) translate(${tilt.x * -6}px, ${tilt.y * -4}px)` : undefined, transition: p.parallax ? "opacity 1.6s ease-out, transform 0.6s ease-out" : undefined }}
        />
      ))}
      {/* Atmosphere: vignette + faint scanlines so the painting sits inside the UI */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(4,6,12,0.65) 100%)" }} />
      {!p.compact && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0 3px, rgba(230,237,247,0.6) 3px 4px)" }} />
      )}
      {sweep && <div className="pointer-events-none absolute inset-y-0 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-cyan/25 to-transparent" />}
      {(p.hud ?? !p.compact) && <HudOverlay world={p.world} layers={p.layers} previousLayers={p.previousLayers} locked={!!p.locked} />}
      {p.locked && !p.compact && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <span className="rounded border border-line-2 bg-bg-deep/85 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-3">signal lost</span>
        </div>
      )}
    </div>
  );
}
