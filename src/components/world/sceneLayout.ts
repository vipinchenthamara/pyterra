/**
 * Pure layout helpers for the procedural world scene.
 * Everything here is deterministic: the same layer list always yields the same slots.
 * Canvas is 640x360; horizon at y=210; ground plane 210..360; vanishing point (320,150).
 */
import type { SceneLayer } from "@content/schema";

export const SCENE_W = 640;
export const SCENE_H = 360;
export const HORIZON_Y = 210;
export const VANISH = { x: 320, y: 150 } as const;

export interface Point {
  x: number;
  y: number;
}

/**
 * A stable rectangle on the canvas for one layer. `x`/`y` is the top-left corner.
 * `depth` orders layers back-to-front (sort ascending before drawing).
 * `anchors` are extra points some kinds need: dataflow = [from, to]; light = base-centres of structures.
 */
export interface Slot {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  anchors?: Point[];
}

/** xmur3 string hash: turns an id into a 32-bit seed. */
export function hashId(id: string): number {
  let h = 1779033703 ^ id.length;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 PRNG: returns a function producing floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded PRNG for an id. Same id, same sequence, forever. */
export function seedFrom(id: string): () => number {
  return mulberry32(hashId(id));
}

const ACCENTS: Record<string, string> = {
  cyan: "#22d3ee",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  emerald: "#34d399",
  rose: "#fb7185",
  orange: "#fb923c",
  sky: "#38bdf8",
};

export function accentHex(accent: string): string {
  return ACCENTS[accent] ?? ACCENTS.cyan;
}

/** hex "#rrggbb" -> "rgba(r,g,b,a)" */
export function rgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** Perspective scale for a base line at ground y (1 at the front edge, ~0.72 at the horizon). */
export function groundScale(baseY: number): number {
  return 0.72 + 0.28 * Math.min(1, Math.max(0, (baseY - HORIZON_Y) / (SCENE_H - HORIZON_Y)));
}

const STRUCTURE_KINDS = new Set(["building", "spire"]);

/**
 * Place every layer in a stable slot. Structures (building/spire) are spread across the ground in a
 * gentle arc, spires pulled to the back-centre; other kinds get fixed regions of the composition.
 */
export function layoutSlots(layers: SceneLayer[]): Map<string, Slot> {
  const slots = new Map<string, Slot>();

  // Order structures: buildings left-to-right in authored order, spires spliced into the middle.
  const ordered: SceneLayer[] = layers.filter((l) => l.kind === "building");
  for (const spire of layers.filter((l) => l.kind === "spire")) {
    ordered.splice(Math.floor(ordered.length / 2), 0, spire);
  }
  const n = ordered.length;
  const spread = n <= 1 ? 0 : n === 2 ? 250 : Math.min(400, 130 * n);
  const structureAnchors: Point[] = [];

  ordered.forEach((layer, i) => {
    const rnd = seedFrom(`slot:${layer.id}`);
    const t = n === 1 ? 0.5 : (i + 0.5) / n;
    const cx = 320 + (t - 0.5) * spread + (rnd() - 0.5) * 18;
    // Arc: centre sits further back, edges come forward; parity staggers rows for overlap.
    const baseY = 334 - 62 * Math.sin(Math.PI * t) + (i % 2 === 0 ? -8 : 8);
    const s = groundScale(baseY);
    const isSpire = layer.kind === "spire";
    const width = isSpire ? Math.round(50 * s) : Math.round((118 + rnd() * 34) * s);
    const height = isSpire ? Math.round((182 + rnd() * 24) * s) : Math.round((110 + rnd() * 50) * s);
    const slot: Slot = {
      x: Math.round(cx - width / 2),
      y: Math.round(baseY - height),
      width,
      height,
      depth: 10 + ((baseY - HORIZON_Y) / (SCENE_H - HORIZON_Y)) * 70,
    };
    slots.set(layer.id, slot);
    structureAnchors.push({ x: cx, y: baseY });
  });

  // Dataflow endpoints: the two structures furthest apart, else fixed points on the ground.
  const flowAnchors = (index: number): Point[] => {
    const tops = ordered.map((l) => {
      const s = slots.get(l.id)!;
      return { x: s.x + s.width / 2, y: s.y + 10 };
    });
    if (tops.length >= 2) {
      const a = tops[0];
      const b = tops[tops.length - 1];
      return index % 2 === 0 ? [a, b] : [b, a];
    }
    if (tops.length === 1) return [{ x: 70, y: 300 }, tops[0]];
    return [
      { x: 90, y: 300 },
      { x: 550, y: 290 },
    ];
  };

  let flowIndex = 0;
  for (const layer of layers) {
    if (STRUCTURE_KINDS.has(layer.kind)) continue;
    switch (layer.kind) {
      case "ground":
        slots.set(layer.id, { x: 0, y: HORIZON_Y, width: SCENE_W, height: SCENE_H - HORIZON_Y, depth: 0 });
        break;
      case "light":
        slots.set(layer.id, { x: 40, y: 290, width: 560, height: 60, depth: 86, anchors: structureAnchors });
        break;
      case "dataflow": {
        const anchors = flowAnchors(flowIndex++);
        const xs = anchors.map((p) => p.x);
        const ys = anchors.map((p) => p.y);
        const x = Math.min(...xs);
        const y = Math.min(...ys) - 60;
        slots.set(layer.id, { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y, depth: 84, anchors });
        break;
      }
      case "drone":
        slots.set(layer.id, { x: 140, y: 56, width: 380, height: 110, depth: 90 });
        break;
      case "sign":
        slots.set(layer.id, { x: 46, y: 288, width: 100, height: 60, depth: 95 });
        break;
      case "shield":
        slots.set(layer.id, { x: 36, y: 96, width: 568, height: 234, depth: 99 });
        break;
    }
  }
  return slots;
}

/** Where a ghost caption sits for a slot of the given kind. */
export function captionFor(kind: SceneLayer["kind"], slot: Slot): { x: number; y: number; anchor: "start" | "middle" | "end" } {
  switch (kind) {
    case "ground":
      return { x: 14, y: 352, anchor: "start" };
    case "light":
      return { x: 626, y: 352, anchor: "end" };
    case "shield":
      return { x: 320, y: slot.y - 6, anchor: "middle" };
    case "drone":
      return { x: slot.x + slot.width / 2, y: slot.y - 4, anchor: "middle" };
    case "dataflow": {
      // Near the LOWER end of the arc (never the spire end, never the apex over a spire).
      const [a, b] = slot.anchors ?? [];
      if (!a || !b) return { x: slot.x + slot.width / 2, y: slot.y + 4, anchor: "middle" };
      const t = a.y < b.y ? 0.78 : 0.22;
      const cy = slot.y + 8;
      const k = 1 - t;
      const x = k * k * k * a.x + 3 * k * k * t * (a.x + (b.x - a.x) * 0.25) + 3 * k * t * t * (a.x + (b.x - a.x) * 0.75) + t * t * t * b.x;
      const y = k * k * k * a.y + 3 * k * k * t * cy + 3 * k * t * t * cy + t * t * t * b.y;
      return { x, y: y - 10, anchor: "middle" };
    }
    default:
      return { x: slot.x + slot.width / 2, y: slot.y - 8, anchor: "middle" };
  }
}
