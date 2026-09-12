"use client";
/**
 * WorldScene: a procedural, layered SVG "district" that grows as missions are completed.
 * Level 0 layers render as ghost outlines (what the learner's code WILL build), level 1 built,
 * level 2 upgraded. Deterministic: same world + levels always draws the same picture, so it
 * server-renders and hydrates without mismatch.
 */
import { useId, useMemo, type JSX } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { World } from "@content/schema";
import { cn } from "@/lib/cn";
import { CAPTION, EDGE, LAYER_RENDERERS } from "./layers";
import { accentHex, captionFor, hashId, layoutSlots, rgba, seedFrom, HORIZON_Y, SCENE_H, SCENE_W, VANISH } from "./sceneLayout";

export interface WorldSceneProps {
  world: Pick<World, "id" | "name" | "accent" | "scene"> & { codename?: string };
  /** layerId -> current level (0..maxLevel). Missing ids count as 0. */
  layers: Record<string, number>;
  /** When provided and different, newly raised layers animate in (fade + rise + glow pulse). */
  previousLayers?: Record<string, number>;
  /** Small card thumbnail: no labels, no animation loops. */
  compact?: boolean;
  /** World not unlocked: everything ghosted, desaturated, "SIGNAL LOST" scanline overlay. */
  locked?: boolean;
  className?: string;
  /** Ghost layers show their label as a mono caption. Defaults to true unless compact. */
  showLabels?: boolean;
}

interface Backdrop {
  stars: { x: number; y: number; r: number; o: number }[];
  skyline: { x: number; w: number; h: number }[];
}

function buildBackdrop(worldId: string): Backdrop {
  const rnd = seedFrom(`backdrop:${worldId}`);
  const stars = Array.from({ length: 46 }, () => ({
    x: Math.round(rnd() * SCENE_W),
    y: Math.round(rnd() * (HORIZON_Y - 40)),
    r: 0.5 + rnd() * 0.8,
    o: 0.15 + rnd() * 0.5,
  }));
  const skyline: Backdrop["skyline"] = [];
  let x = -10;
  while (x < SCENE_W + 10) {
    const w = 12 + Math.floor(rnd() * 30);
    const tall = rnd() < 0.18;
    skyline.push({ x, w, h: tall ? 30 + rnd() * 26 : 6 + rnd() * 20 });
    x += w + Math.floor(rnd() * 6);
  }
  return { stars, skyline };
}

export function WorldScene({ world, layers, previousLayers, compact = false, locked = false, className, showLabels }: WorldSceneProps): JSX.Element {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const prefix = `ws${reactId}-${world.id}`;
  const glowId = `${prefix}-glow`;
  const reduce = useReducedMotion();
  const animate = !compact && !reduce;
  const labels = showLabels ?? !compact;
  const accent = accentHex(world.accent);

  const slots = useMemo(() => layoutSlots(world.scene.layers), [world.scene.layers]);
  const backdrop = useMemo(() => buildBackdrop(world.id), [world.id]);
  const ordered = useMemo(
    () => [...world.scene.layers].sort((a, b) => (slots.get(a.id)?.depth ?? 0) - (slots.get(b.id)?.depth ?? 0)),
    [world.scene.layers, slots],
  );

  const levelOf = (id: string, max: number) => (locked ? 0 : Math.min(max, Math.max(0, layers[id] ?? 0)));
  const builtCount = world.scene.layers.filter((l) => levelOf(l.id, l.maxLevel) > 0).length;
  const ariaLabel = `${world.name} scene: ${builtCount} of ${world.scene.layers.length} layers built${locked ? ", signal lost" : ""}`;

  // Perspective grid: verticals converge on the vanishing point, horizontals bunch toward the horizon.
  const vStep = compact ? 160 : 80;
  const verticals: number[] = [];
  for (let x0 = -480; x0 <= SCENE_W + 480; x0 += vStep) verticals.push(x0);
  const hRows = compact ? 5 : 10;
  const horizontals = Array.from({ length: hRows }, (_, k) => HORIZON_Y + (SCENE_H - HORIZON_Y) * Math.pow((k + 1) / hRows, 2));
  const horizonX = (x0: number) => VANISH.x + (x0 - VANISH.x) * ((HORIZON_Y - VANISH.y) / (SCENE_H - VANISH.y));

  return (
    <svg
      viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient id={`${prefix}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04060c" />
          <stop offset="0.65" stopColor="#070d1c" />
          <stop offset="1" stopColor="#0d1730" />
        </linearGradient>
        <radialGradient id={`${prefix}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={accent} stopOpacity={0.3} />
          <stop offset="0.45" stopColor={accent} stopOpacity={0.09} />
          <stop offset="1" stopColor={accent} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${prefix}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101b34" />
          <stop offset="0.35" stopColor="#0a1223" />
          <stop offset="1" stopColor="#04060c" />
        </linearGradient>
        <radialGradient id={`${prefix}-vignette`} cx="50%" cy="50%" r="70%">
          <stop offset="0.5" stopColor="#04060c" stopOpacity={0} />
          <stop offset="1" stopColor="#04060c" stopOpacity={0.75} />
        </radialGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={compact ? 1.5 : 2.6} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {locked && (
          <>
            <filter id={`${prefix}-desat`}>
              <feColorMatrix type="saturate" values="0.12" />
            </filter>
            <pattern id={`${prefix}-scan`} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="1" fill="rgba(230,237,247,0.08)" />
            </pattern>
          </>
        )}
      </defs>

      <g filter={locked ? `url(#${prefix}-desat)` : undefined}>
        {/* Sky */}
        <rect width={SCENE_W} height={SCENE_H} fill={`url(#${prefix}-sky)`} />
        <ellipse cx={VANISH.x} cy={HORIZON_Y - 6} rx={380} ry={160} fill={`url(#${prefix}-halo)`} />
        <g fill="#e6edf7">
          {backdrop.stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
          ))}
        </g>

        {/* Distant skyline */}
        <g fill="#070c18" opacity={0.92}>
          {backdrop.skyline.map((b, i) => (
            <rect key={i} x={b.x} y={HORIZON_Y - b.h} width={b.w} height={b.h} />
          ))}
        </g>
        <g fill={accent} opacity={0.35}>
          {backdrop.skyline
            .filter((_, i) => i % 5 === 2)
            .map((b, i) => (
              <rect key={i} x={b.x + b.w / 2 - 1} y={HORIZON_Y - b.h + 4} width={2} height={2} />
            ))}
        </g>

        {/* Ground plane + perspective grid */}
        <rect x={0} y={HORIZON_Y} width={SCENE_W} height={SCENE_H - HORIZON_Y} fill={`url(#${prefix}-floor)`} />
        <g stroke="rgba(230,237,247,0.055)" strokeWidth={0.7}>
          {verticals.map((x0) => (
            <line key={`v${x0}`} x1={x0} y1={SCENE_H} x2={horizonX(x0)} y2={HORIZON_Y} />
          ))}
          {horizontals.map((y) => (
            <line key={`h${y}`} x1={0} y1={y} x2={SCENE_W} y2={y} />
          ))}
        </g>
        <line x1={0} y1={HORIZON_Y} x2={SCENE_W} y2={HORIZON_Y} stroke={accent} strokeOpacity={0.4} strokeWidth={1} />
        <line x1={0} y1={HORIZON_Y} x2={SCENE_W} y2={HORIZON_Y} stroke={accent} strokeOpacity={0.35} strokeWidth={4} filter={`url(#${glowId})`} />

        {/* Layers, back to front */}
        {ordered.map((layer) => {
          const slot = slots.get(layer.id);
          if (!slot) return null;
          const level = levelOf(layer.id, layer.maxLevel);
          const ghost = level === 0;
          const prev = previousLayers?.[layer.id];
          const raised = !compact && !locked && !reduce && prev !== undefined && level > prev;
          const Renderer = LAYER_RENDERERS[layer.kind];
          const content = (
            <Renderer
              layer={layer}
              level={level}
              seed={hashId(`${world.id}:${layer.id}`)}
              slot={slot}
              accent={accent}
              compact={compact}
              animate={animate && !locked}
              ids={{ prefix: `${prefix}-${layer.id}`, glow: glowId }}
              codename={world.codename}
            />
          );
          const body = ghost ? (
            <g opacity={0.22} strokeDasharray="4 4" strokeWidth={1}>
              {content}
            </g>
          ) : (
            content
          );
          const cap = captionFor(layer.kind, slot);
          const pulseX = slot.x + slot.width / 2;
          const pulseY = layer.kind === "shield" || layer.kind === "drone" ? slot.y + slot.height / 2 : slot.y + slot.height;
          return (
            <g key={layer.id}>
              {raised ? (
                <motion.g
                  key={`${layer.id}-${level}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  {body}
                  <motion.ellipse
                    cx={pulseX}
                    cy={pulseY}
                    rx={Math.max(40, slot.width * 0.75)}
                    ry={16}
                    fill={accent}
                    filter={`url(#${glowId})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.55, 0] }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.15 }}
                    style={{ pointerEvents: "none" }}
                  />
                </motion.g>
              ) : (
                body
              )}
              {ghost && labels && (
                <text
                  x={cap.x}
                  y={cap.y}
                  textAnchor={cap.anchor}
                  fontFamily={CAPTION.fontFamily}
                  fontSize={CAPTION.fontSize}
                  fill={CAPTION.fill}
                  letterSpacing="0.12em"
                  opacity={0.85}
                >
                  {layer.label.toUpperCase()}
                </text>
              )}
            </g>
          );
        })}

        <rect width={SCENE_W} height={SCENE_H} fill={`url(#${prefix}-vignette)`} style={{ pointerEvents: "none" }} />
      </g>

      {locked && (
        <g style={{ pointerEvents: "none" }}>
          <rect width={SCENE_W} height={SCENE_H} fill={`url(#${prefix}-scan)`} opacity={0.7} />
          <rect width={SCENE_W} height={SCENE_H} fill="#04060c" opacity={0.28} />
          <g className={animate ? "animate-pulse-slow" : undefined}>
            <rect x={250} y={166} width={140} height={26} rx={3} fill="#070b14" fillOpacity={0.85} stroke={EDGE} />
            <text
              x={SCENE_W / 2}
              y={183}
              textAnchor="middle"
              fontFamily={CAPTION.fontFamily}
              fontSize={compact ? 13 : 11}
              letterSpacing="0.32em"
              fill="#a9b6cc"
            >
              SIGNAL LOST
            </text>
            <line x1={262} y1={196} x2={378} y2={196} stroke={rgba(accent, 0.45)} strokeDasharray="2 4" />
          </g>
        </g>
      )}
    </svg>
  );
}

export default WorldScene;
