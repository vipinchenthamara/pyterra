/**
 * World state is DERIVED, never accumulated: reduce the deltas of every passed mission.
 * Re-versioning a mission's deltas just means recomputing; nothing to migrate.
 */
import type { Mission, World } from "@content/schema";

export interface ComputedWorld {
  worldId: string;
  operationalPct: number;
  layers: Record<string, number>;
  stats: Record<string, number>;
  passedMissionIds: string[];
  totalMissions: number;
  bossPassed: boolean;
  unlocked: boolean;
}

export type WorldVisualState = "complete" | "active" | "unstable" | "locked" | "available";

export function computeWorld(
  world: World,
  worldMissions: Mission[],
  passedIds: ReadonlySet<string>,
  unlocked: boolean,
): ComputedWorld {
  const layers: Record<string, number> = Object.fromEntries(world.scene.layers.map((l) => [l.id, 0]));
  const stats: Record<string, number> = {};
  let passedWeight = 0;
  let totalWeight = 0;
  const passed: string[] = [];
  let bossPassed = false;
  for (const m of worldMissions) {
    totalWeight += m.weight;
    if (!passedIds.has(m.id)) continue;
    passed.push(m.id);
    passedWeight += m.weight;
    if (m.kind === "boss") bossPassed = true;
    for (const d of m.onComplete) {
      if (d.kind === "layer") layers[d.layer] = Math.max(layers[d.layer] ?? 0, d.level);
      else stats[d.stat] = (stats[d.stat] ?? 0) + d.add;
    }
  }
  const operationalPct = totalWeight === 0 ? 0 : Math.round((passedWeight / totalWeight) * 100);
  return { worldId: world.id, operationalPct, layers, stats, passedMissionIds: passed, totalMissions: worldMissions.length, bossPassed, unlocked };
}

/** A world unlocks when every world in `unlockedBy` is 100% operational. */
export function isWorldUnlocked(world: World, computed: ReadonlyMap<string, ComputedWorld>): boolean {
  return world.unlockedBy.every((id) => (computed.get(id)?.operationalPct ?? 0) >= 100);
}

/** Compute every world in order so unlock dependencies resolve. */
export function computeAllWorlds(
  worlds: readonly World[],
  missionsFor: (worldId: string) => Mission[],
  passedIds: ReadonlySet<string>,
): Map<string, ComputedWorld> {
  const out = new Map<string, ComputedWorld>();
  for (const w of [...worlds].sort((a, b) => a.order - b.order)) {
    const unlocked = isWorldUnlocked(w, out);
    out.set(w.id, computeWorld(w, missionsFor(w.id), passedIds, unlocked));
  }
  return out;
}

export function missionUnlocked(m: Mission, passedIds: ReadonlySet<string>): boolean {
  return m.prerequisites.every((p) => passedIds.has(p));
}

export function visualState(cw: ComputedWorld, hasFragileSkill: boolean, isCurrent: boolean): WorldVisualState {
  if (!cw.unlocked) return "locked";
  if (cw.operationalPct >= 100) return hasFragileSkill ? "unstable" : "complete";
  if (cw.operationalPct > 0 || isCurrent) return "active";
  return "available";
}

/** Dashboard headline: weighted mean over unlocked worlds that have missions authored. */
export function overallOperational(computed: Iterable<ComputedWorld>): number {
  let sum = 0;
  let n = 0;
  for (const c of computed) {
    if (!c.unlocked || c.totalMissions === 0) continue;
    sum += c.operationalPct;
    n += 1;
  }
  return n === 0 ? 0 : Math.round(sum / n);
}
