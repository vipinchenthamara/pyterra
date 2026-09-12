"use client";

import { motion, useReducedMotion } from "motion/react";
import type { World } from "@content/schema";
import { accentHex } from "./sceneLayout";
import { cn } from "@/lib/cn";

/**
 * HUD markers over a painted district: one marker per scene layer around an ellipse.
 * Built = lit dot with label; upgraded = pulsing ring; unbuilt = dashed ghost with "not built".
 * This is the live "your code built this" signal on top of a static painting.
 */
export function HudOverlay({ world, layers, previousLayers, locked }: { world: Pick<World, "id" | "accent" | "scene">; layers: Record<string, number>; previousLayers?: Record<string, number>; locked: boolean }) {
  const reduce = useReducedMotion();
  const accent = accentHex(world.accent);
  const n = world.scene.layers.length;
  return (
    <svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <filter id={`hud-glow-${world.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {world.scene.layers.map((l, i) => {
        // Ellipse ring around the island, starting top-left, deterministic by index.
        const angle = -Math.PI * 0.9 + (i / n) * Math.PI * 1.8;
        const cx = 320 + Math.cos(angle) * 205;
        const cy = 190 + Math.sin(angle) * 96;
        const level = locked ? 0 : Math.min(l.maxLevel, layers[l.id] ?? 0);
        const prev = previousLayers?.[l.id] ?? level;
        const raised = !reduce && level > prev;
        const built = level > 0;
        // Labels point away from the island but flip inward near the frame edge so they never clip.
        let left = cx < 320;
        if (cx < 120) left = false;
        if (cx > 520) left = true;
        const labelX = left ? cx - 12 : cx + 12;
        return (
          <g key={l.id} className="font-mono">
            {built && <circle cx={cx} cy={cy} r={9} fill={accent} opacity={0.35} filter={`url(#hud-glow-${world.id})`} />}
            {level >= 2 && !reduce && <circle cx={cx} cy={cy} r={7} fill="none" stroke={accent} strokeWidth={1} className="animate-pulse-slow" />}
            <motion.circle
              cx={cx}
              cy={cy}
              r={built ? 4 : 3.5}
              fill={built ? accent : "transparent"}
              stroke={built ? "#e6edf7" : "rgba(230,237,247,0.5)"}
              strokeWidth={built ? 1 : 1}
              strokeDasharray={built ? undefined : "2 2"}
              initial={raised ? { scale: 0.2, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            <text x={labelX} y={cy + 3.5} fontSize={built ? 11 : 10} textAnchor={left ? "end" : "start"} fill={built ? "#e6edf7" : "#8b97ad"} opacity={built ? 1 : 0.75} className={cn(!built && "italic")} style={{ paintOrder: "stroke", stroke: "rgba(4,6,12,0.85)", strokeWidth: 3 }}>
              {l.label}
              {built ? (level >= 2 ? " · L2" : "") : " · not built"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
