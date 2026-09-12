"use client";
/**
 * Procedural renderers, one per scene layer kind. Each is a pure function of
 * (layer, level, seed, slot) so the same world always draws the same picture.
 * Level 0 is a ghost: the parent wraps it in a 22% dashed group, so renderers just
 * skip fills and lit parts via `paint()`.
 */
import type { JSX } from "react";
import type { SceneLayer } from "@content/schema";
import { mulberry32, rgba, type Slot } from "../sceneLayout";

export interface LayerRenderProps {
  layer: SceneLayer;
  level: number;
  /** 32-bit seed derived from world id + layer id. */
  seed: number;
  slot: Slot;
  /** Accent as a hex colour, e.g. "#22d3ee". */
  accent: string;
  compact: boolean;
  /** Looping SMIL/CSS animation allowed (false when compact or reduced motion). */
  animate: boolean;
  /** `prefix` namespaces gradient ids; `glow` is the scene's blur filter id. */
  ids: { prefix: string; glow: string };
  codename?: string;
}

export const EDGE = "rgba(230,237,247,0.25)";
const FG3 = "#6f7d96";
const MONO = "var(--font-mono), ui-monospace, monospace";

function paint(ghost: boolean) {
  return {
    ghost,
    edge: ghost ? "#e6edf7" : EDGE,
    fill: (f: string) => (ghost ? "none" : f),
  };
}

function Blink({ on, dur = "1.8s" }: { on: boolean; dur?: string }) {
  return on ? <animate attributeName="opacity" values="1;0.15;1" dur={dur} repeatCount="indefinite" /> : null;
}

// ---------------------------------------------------------------------------
export function Ground({ level, slot, accent, compact, ids }: LayerRenderProps): JSX.Element {
  const p = paint(level === 0);
  const [bx0, bx1, by, tx0, tx1, ty] = [70, 570, 352, 214, 426, 262];
  const plate = `${tx0},${ty} ${tx1},${ty} ${bx1},${by} ${bx0},${by}`;
  const cols = compact ? 4 : 8;
  const rows = compact ? 3 : 6;
  const verticals = Array.from({ length: cols + 1 }, (_, k) => bx0 + ((bx1 - bx0) * k) / cols);
  const horizontals = Array.from({ length: rows - 1 }, (_, k) => ty + (by - ty) * Math.pow((k + 1) / rows, 1.5));
  const grid = p.ghost ? p.edge : rgba(accent, 0.22);
  const id = ids.prefix;
  void slot;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity={0.16} />
          <stop offset="1" stopColor={accent} stopOpacity={0.02} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <polygon points={plate} />
        </clipPath>
      </defs>
      <polygon points={plate} fill={p.fill(`url(#${id}-plate)`)} stroke={p.ghost ? p.edge : rgba(accent, 0.55)} strokeWidth={1} />
      <g clipPath={`url(#${id}-clip)`} stroke={grid} strokeWidth={0.6}>
        {verticals.map((x) => (
          <line key={`v${x}`} x1={x} y1={by} x2={320} y2={150} />
        ))}
        {horizontals.map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={640} y2={y} />
        ))}
      </g>
      {!p.ghost && (
        <g stroke={accent} strokeWidth={1.5} fill="none" opacity={0.9} filter={`url(#${ids.glow})`}>
          <polyline points={`${tx0 + 14},${ty} ${tx0},${ty} ${tx0 + 6},${ty + 8}`} />
          <polyline points={`${tx1 - 14},${ty} ${tx1},${ty} ${tx1 - 6},${ty + 8}`} />
          <polyline points={`${bx0 + 16},${by} ${bx0},${by} ${bx0 + 8},${by - 10}`} />
          <polyline points={`${bx1 - 16},${by} ${bx1},${by} ${bx1 - 8},${by - 10}`} />
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
export function Building({ level, seed, slot, accent, compact, animate, ids }: LayerRenderProps): JSX.Element {
  const rnd = mulberry32(seed);
  const p = paint(level === 0);
  const id = ids.prefix;
  const blocks = 2 + Math.floor(rnd() * 3);
  const d = Math.max(8, Math.round(slot.width * 0.14));
  const cx = slot.x + slot.width / 2;
  const baseY = slot.y + slot.height;
  const pitch = compact ? 14 : 10;
  const litP = level >= 2 ? 0.72 : 0.4;
  const weights = Array.from({ length: blocks }, () => 0.6 + rnd());
  const total = weights.reduce((a, b) => a + b, 0);
  const parts: JSX.Element[] = [];
  let y = baseY;
  let roof = { x: cx, y: slot.y };
  for (let i = 0; i < blocks; i++) {
    const h = Math.round((slot.height * weights[i]) / total);
    const w = Math.round(slot.width * (1 - i * 0.16) - rnd() * 8);
    const shift = i === 0 ? 0 : Math.round((rnd() - 0.5) * (slot.width - w) * 0.6);
    const x = Math.round(cx - w / 2 + shift);
    const top = y - h;
    const windows: JSX.Element[] = [];
    if (!p.ghost) {
      const cols = Math.floor((w - 8) / pitch);
      const rows = Math.floor((h - 8) / pitch);
      const ox = x + (w - cols * pitch) / 2 + 2;
      const oy = top + (h - rows * pitch) / 2 + 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = rnd();
          const lit = v < litP;
          windows.push(
            <rect key={`${r}-${c}`} x={ox + c * pitch} y={oy + r * pitch} width={pitch * 0.42} height={pitch * 0.5} fill={lit ? accent : "rgba(230,237,247,0.06)"} opacity={lit ? 0.45 + (v / litP) * 0.5 : 1} />,
          );
        }
      }
    }
    parts.push(
      <g key={i}>
        <polygon points={`${x + w},${top} ${x + w + d},${top - d * 0.5} ${x + w + d},${y - d * 0.5} ${x + w},${y}`} fill={p.fill(`url(#${id}-side)`)} stroke={p.edge} />
        <polygon points={`${x},${top} ${x + d},${top - d * 0.5} ${x + w + d},${top - d * 0.5} ${x + w},${top}`} fill={p.fill(`url(#${id}-top)`)} stroke={p.edge} />
        <rect x={x} y={top} width={w} height={h} fill={p.fill(`url(#${id}-face)`)} stroke={p.edge} />
        {windows}
        {level >= 1 && <line x1={x} y1={top} x2={x} y2={y} stroke={accent} strokeOpacity={level >= 2 ? 0.7 : 0.35} />}
      </g>,
    );
    roof = { x: x + w / 2 + d / 2, y: top - d * 0.25 };
    y = top;
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b2942" /><stop offset="1" stopColor="#0b1120" /></linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f172a" /><stop offset="1" stopColor="#060910" /></linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a3b60" /><stop offset="1" stopColor="#1a2740" /></linearGradient>
      </defs>
      {!p.ghost && <ellipse cx={cx + d / 2} cy={baseY} rx={slot.width * 0.7} ry={5} fill={accent} opacity={level >= 2 ? 0.3 : 0.16} filter={`url(#${ids.glow})`} />}
      {parts}
      {level >= 2 && (
        <g>
          <line x1={roof.x} y1={roof.y} x2={roof.x} y2={roof.y - 24} stroke={EDGE} />
          <line x1={roof.x - 5} y1={roof.y - 14} x2={roof.x + 5} y2={roof.y - 14} stroke={EDGE} />
          <circle cx={roof.x} cy={roof.y - 26} r={2.2} fill={accent} filter={`url(#${ids.glow})`}><Blink on={animate} dur="2.4s" /></circle>
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
export function Spire({ level, seed, slot, accent, compact, animate, ids }: LayerRenderProps): JSX.Element {
  const rnd = mulberry32(seed);
  const p = paint(level === 0);
  const id = ids.prefix;
  const cx = slot.x + slot.width / 2;
  const baseY = slot.y + slot.height;
  const top = slot.y + 14;
  const bw = slot.width;
  const tw = Math.max(6, bw * 0.2);
  const ringStep = compact ? 32 : 18 + Math.floor(rnd() * 6);
  const rings: number[] = [];
  for (let yy = baseY - 14; yy > top + 10; yy -= ringStep) rings.push(yy);
  const half = (yy: number) => {
    const f = (baseY - yy) / (baseY - top);
    return (bw / 2) * (1 - f) + (tw / 2) * f;
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1f2e4c" /><stop offset="0.5" stopColor="#111a2c" /><stop offset="1" stopColor="#070b14" /></linearGradient>
      </defs>
      {!p.ghost && <ellipse cx={cx} cy={baseY} rx={bw * 1.1} ry={5} fill={accent} opacity={0.2} filter={`url(#${ids.glow})`} />}
      <rect x={cx - bw * 0.7} y={baseY - 7} width={bw * 1.4} height={7} fill={p.fill("#0d1526")} stroke={p.edge} />
      <polygon points={`${cx - bw / 2},${baseY - 7} ${cx - tw / 2},${top} ${cx + tw / 2},${top} ${cx + bw / 2},${baseY - 7}`} fill={p.fill(`url(#${id}-body)`)} stroke={p.edge} />
      <g stroke={p.edge} strokeWidth={0.8}>
        {rings.map((yy) => (
          <line key={yy} x1={cx - half(yy)} y1={yy} x2={cx + half(yy)} y2={yy} />
        ))}
      </g>
      <line x1={cx} y1={top} x2={cx} y2={top - 14} stroke={p.edge} />
      {level >= 1 && (
        <g>
          <line x1={cx} y1={top + 8} x2={cx} y2={baseY - 16} stroke={accent} strokeOpacity={level >= 2 ? 0.85 : 0.45} strokeWidth={1.2} filter={level >= 2 ? `url(#${ids.glow})` : undefined} />
          <circle cx={cx} cy={top - 16} r={3} fill={accent} filter={`url(#${ids.glow})`}><Blink on={animate} /></circle>
        </g>
      )}
      {level >= 2 && (
        <g fill="none" stroke={accent} filter={`url(#${ids.glow})`}>
          <ellipse cx={cx} cy={top + (baseY - top) * 0.22} rx={bw * 0.95} ry={bw * 0.22} strokeOpacity={0.7} className={animate ? "animate-pulse-slow" : undefined} />
          <ellipse cx={cx} cy={top + (baseY - top) * 0.5} rx={bw * 0.8} ry={bw * 0.18} strokeOpacity={0.35} />
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
export function Light({ level, seed, slot, accent, compact, animate, ids }: LayerRenderProps): JSX.Element {
  const rnd = mulberry32(seed);
  const p = paint(level === 0);
  const count = p.ghost ? 4 : (level >= 2 ? 8 : 4) - (compact ? 1 : 0);
  const heads = Array.from({ length: count }, (_, i) => {
    const x = slot.x + 20 + ((slot.width - 40) * i) / Math.max(1, count - 1) + (rnd() - 0.5) * 12;
    const base = 336 + (i % 2 === 0 ? -3 : 4);
    return { x, base, top: base - 20 };
  });
  const string = heads
    .map((h, i) => (i === 0 ? `M ${h.x},${h.top}` : `Q ${(heads[i - 1].x + h.x) / 2},${h.top + 9} ${h.x},${h.top}`))
    .join(" ");
  const id = ids.prefix;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-pool`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={accent} stopOpacity={0.35} /><stop offset="1" stopColor={accent} stopOpacity={0} /></radialGradient>
      </defs>
      {!p.ghost && (
        <g className={animate && level >= 2 ? "animate-pulse-slow" : undefined}>
          {(slot.anchors ?? []).map((a, i) => (
            <ellipse key={i} cx={a.x} cy={a.y - 2} rx={level >= 2 ? 64 : 44} ry={level >= 2 ? 11 : 8} fill={`url(#${id}-pool)`} />
          ))}
        </g>
      )}
      <path d={string} fill="none" stroke={p.ghost ? p.edge : rgba(accent, 0.4)} strokeWidth={0.8} />
      {heads.map((h, i) => (
        <g key={i}>
          <line x1={h.x} y1={h.base} x2={h.x} y2={h.top} stroke={p.edge} />
          <line x1={h.x - 4} y1={h.base} x2={h.x + 4} y2={h.base} stroke={p.edge} />
          {p.ghost ? (
            <circle cx={h.x} cy={h.top} r={2.4} fill="none" stroke={p.edge} />
          ) : (
            <g>
              <ellipse cx={h.x} cy={h.base} rx={18} ry={4} fill={`url(#${id}-pool)`} />
              <circle cx={h.x} cy={h.top} r={2.2} fill={accent} filter={`url(#${ids.glow})`} />
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
export function Drone({ level, seed, slot, accent, animate, ids }: LayerRenderProps): JSX.Element {
  const rnd = mulberry32(seed);
  const p = paint(level === 0);
  const count = p.ghost ? 1 : level >= 2 ? 3 : 1;
  const routes = Array.from({ length: 3 }, () => {
    const rx = 50 + rnd() * 90;
    const ry = 8 + rnd() * 14;
    const cx = slot.x + rx + rnd() * (slot.width - rx * 2);
    const cy = slot.y + slot.height * (0.25 + rnd() * 0.5);
    return { cx, cy, rx, ry, dur: `${(14 + rnd() * 10).toFixed(1)}s`, path: `M ${cx - rx},${cy} a ${rx},${ry} 0 1,0 ${rx * 2},0 a ${rx},${ry} 0 1,0 ${-rx * 2},0` };
  }).slice(0, count);
  const body = (i: number) => (
    <g>
      <ellipse cx={-8} cy={-3} rx={4} ry={1.2} fill="none" stroke={p.edge} />
      <ellipse cx={8} cy={-3} rx={4} ry={1.2} fill="none" stroke={p.edge} />
      <polygon points="-7,0 -3,-3 3,-3 7,0 3,3 -3,3" fill={p.fill("#1a2740")} stroke={p.edge} />
      {!p.ghost && <circle cx={0} cy={1} r={1.6} fill={accent} filter={`url(#${ids.glow})`}><Blink on={animate} dur={`${1.2 + i * 0.4}s`} /></circle>}
      {level >= 2 && <polygon points="-2,3 2,3 9,26 -9,26" fill={accent} opacity={0.07} />}
    </g>
  );
  return (
    <g>
      {routes.map((r, i) => (
        <g key={i}>
          <path d={r.path} fill="none" stroke={p.ghost ? p.edge : rgba(accent, 0.18)} strokeWidth={0.7} strokeDasharray={p.ghost ? undefined : "2 6"} />
          {animate && !p.ghost ? (
            <g>
              <animateMotion dur={r.dur} repeatCount="indefinite" path={r.path} />
              {body(i)}
            </g>
          ) : (
            <g transform={`translate(${r.cx - r.rx},${r.cy})`}>{body(i)}</g>
          )}
        </g>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
export function Dataflow({ level, seed, slot, accent, animate, ids }: LayerRenderProps): JSX.Element {
  const rnd = mulberry32(seed);
  const p = paint(level === 0);
  const [a, b] = slot.anchors ?? [
    { x: slot.x, y: slot.y + slot.height },
    { x: slot.x + slot.width, y: slot.y + slot.height },
  ];
  const lift = 48 + rnd() * 30;
  const curve = (extra: number) => {
    const cy = Math.min(a.y, b.y) - lift - extra;
    return `M ${a.x},${a.y} C ${a.x + (b.x - a.x) * 0.25},${cy} ${a.x + (b.x - a.x) * 0.75},${cy} ${b.x},${b.y}`;
  };
  const paths = level >= 2 ? [curve(0), curve(16)] : [curve(0)];
  return (
    <g fill="none">
      {p.ghost ? (
        <path d={paths[0]} stroke={p.edge} strokeWidth={1} />
      ) : (
        <g>
          {paths.map((d, i) => (
            <g key={i}>
              <path d={d} stroke={EDGE} strokeWidth={1} />
              <path d={d} stroke={accent} strokeOpacity={0.85} strokeWidth={1.4} strokeDasharray="6 6" className={animate ? "animate-flow" : undefined} filter={`url(#${ids.glow})`} />
            </g>
          ))}
          <circle cx={a.x} cy={a.y} r={3} fill={accent} filter={`url(#${ids.glow})`} />
          <circle cx={b.x} cy={b.y} r={3} fill={accent} filter={`url(#${ids.glow})`} />
          {level >= 2 && animate && [0, 1.1, 2.2].map((begin, i) => (
            <circle key={i} r={2.4} fill="#e6edf7" filter={`url(#${ids.glow})`}>
              <animateMotion dur="3.3s" begin={`${begin}s`} repeatCount="indefinite" path={paths[i % 2]} />
            </circle>
          ))}
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
export function Sign({ level, slot, accent, ids, codename }: LayerRenderProps): JSX.Element {
  const p = paint(level === 0);
  const id = ids.prefix;
  const { x, y, width: w } = slot;
  const h = 38;
  const baseY = slot.y + slot.height;
  const text = (codename ?? "W?").toUpperCase();
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sign`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141f36" /><stop offset="1" stopColor="#0a101d" /></linearGradient>
      </defs>
      {!p.ghost && <ellipse cx={x + w / 2} cy={baseY} rx={w * 0.6} ry={4} fill={accent} opacity={0.18} filter={`url(#${ids.glow})`} />}
      <line x1={x + 12} y1={y + h} x2={x + 12} y2={baseY} stroke={p.edge} />
      <line x1={x + w - 12} y1={y + h} x2={x + w - 12} y2={baseY} stroke={p.edge} />
      <rect x={x} y={y} width={w} height={h} rx={2} fill={p.fill(`url(#${id}-sign)`)} stroke={p.ghost ? p.edge : rgba(accent, 0.6)} />
      {!p.ghost && (
        <g>
          <rect x={x + 1} y={y + 1} width={w - 2} height={2} fill={accent} opacity={0.9} />
          <text x={x + w / 2} y={y + h / 2 + 5} textAnchor="middle" fontFamily={MONO} fontSize={13} fontWeight={600} letterSpacing="0.16em" fill={accent} filter={`url(#${ids.glow})`}>
            {text}
          </text>
          {[0, 1, 2].map((i) => (
            <rect key={i} x={x + 6 + i * 6} y={y + h - 6} width={4} height={2} fill={accent} opacity={0.3 + i * 0.25} />
          ))}
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
export function Shield({ level, slot, accent, compact, animate, ids }: LayerRenderProps): JSX.Element {
  const p = paint(level === 0);
  const id = ids.prefix;
  const cx = slot.x + slot.width / 2;
  const baseY = slot.y + slot.height;
  const rx = slot.width / 2;
  const ry = slot.height;
  const dome = `M ${cx - rx},${baseY} A ${rx},${ry} 0 0 1 ${cx + rx},${baseY}`;
  const r = compact ? 14 : 9;
  const hw = Math.sqrt(3) * r;
  const hex = (hx: number, hy: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const ang = Math.PI / 6 + (k * Math.PI) / 3;
      return `${(hx + r * Math.cos(ang)).toFixed(2)},${(hy + r * Math.sin(ang)).toFixed(2)}`;
    }).join(" ");
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-dome`} cx="50%" cy="100%" r="100%">
          <stop offset="0" stopColor={accent} stopOpacity={0} />
          <stop offset="0.72" stopColor={accent} stopOpacity={0.02} />
          <stop offset="1" stopColor={accent} stopOpacity={level >= 2 ? 0.22 : 0.14} />
        </radialGradient>
        <pattern id={`${id}-hex`} width={hw} height={r * 3} patternUnits="userSpaceOnUse">
          <g fill="none" stroke={accent} strokeOpacity={0.35} strokeWidth={0.6}>
            <polygon points={hex(hw / 2, r)} />
            <polygon points={hex(0, r * 2.5)} />
            <polygon points={hex(hw, r * 2.5)} />
          </g>
        </pattern>
        <clipPath id={`${id}-clip`}>
          <path d={`${dome} Z`} />
        </clipPath>
      </defs>
      {p.ghost ? (
        <path d={dome} fill="none" stroke={p.edge} />
      ) : (
        <g>
          <path d={`${dome} Z`} fill={`url(#${id}-dome)`} />
          <rect x={slot.x} y={slot.y} width={slot.width} height={slot.height} fill={`url(#${id}-hex)`} clipPath={`url(#${id}-clip)`} opacity={level >= 2 ? 0.55 : 0.32} />
          <path d={dome} fill="none" stroke={accent} strokeOpacity={level >= 2 ? 0.85 : 0.5} strokeWidth={1.2} filter={`url(#${ids.glow})`} className={animate && level >= 2 ? "animate-pulse-slow" : undefined} />
          {level >= 2 && <path d={`M ${cx - rx * 0.9},${baseY} A ${rx * 0.9},${ry * 0.88} 0 0 1 ${cx + rx * 0.9},${baseY}`} fill="none" stroke={accent} strokeOpacity={0.25} />}
          {[0.12, 0.5, 0.88].map((t) => (
            <circle key={t} cx={cx - rx * Math.cos(Math.PI * t)} cy={baseY - ry * Math.sin(Math.PI * t)} r={1.8} fill={accent} filter={`url(#${ids.glow})`} />
          ))}
        </g>
      )}
    </g>
  );
}

export const LAYER_RENDERERS: Record<SceneLayer["kind"], (p: LayerRenderProps) => JSX.Element> = {
  ground: Ground,
  building: Building,
  light: Light,
  drone: Drone,
  dataflow: Dataflow,
  sign: Sign,
  spire: Spire,
  shield: Shield,
};

/** Font/colour for ghost captions, shared with the scene so the look stays consistent. */
export const CAPTION = { fontFamily: MONO, fill: FG3, fontSize: 10 } as const;
