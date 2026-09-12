/**
 * Content registry. Parses every world and mission at import time, checks referential
 * integrity and exposes typed lookups. Throws with a readable path if content is broken,
 * so a bad mission fails `next dev` and `vitest` instead of surprising the learner.
 */
import {
  MissionSchema,
  SkillSchema,
  WorldSchema,
  type Mission,
  type MissionInput,
  type Skill,
  type World,
  type WorldInput,
} from "./schema";
import { skills as skillInputs } from "./skills";
import { worldPacks } from "./worlds";

export interface WorldPack {
  world: WorldInput;
  missions: MissionInput[];
}

function parseAll<T>(label: string, schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: { path: PropertyKey[]; message: string }[] } } }, inputs: unknown[]): T[] {
  return inputs.map((input, i) => {
    const r = schema.safeParse(input);
    if (!r.success || !r.data) {
      const id = (input as { id?: string })?.id ?? `#${i}`;
      const issues = (r.error?.issues ?? [])
        .map((iss) => `  ${iss.path.map(String).join(".") || "(root)"}: ${iss.message}`)
        .join("\n");
      throw new Error(`Invalid ${label} "${id}":\n${issues}`);
    }
    return r.data;
  });
}

export const skills: readonly Skill[] = parseAll<Skill>("skill", SkillSchema, skillInputs);
export const worlds: readonly World[] = parseAll<World>(
  "world",
  WorldSchema,
  worldPacks.map((p) => p.world),
).sort((a, b) => a.order - b.order);
export const missions: readonly Mission[] = parseAll<Mission>(
  "mission",
  MissionSchema,
  worldPacks.flatMap((p) => p.missions),
);

const skillById = new Map(skills.map((s) => [s.id, s]));
const worldById = new Map(worlds.map((w) => [w.id, w]));
const missionById = new Map(missions.map((m) => [m.id, m]));
const missionsByWorld = new Map<string, Mission[]>();
for (const m of missions) {
  const list = missionsByWorld.get(m.worldId) ?? [];
  list.push(m);
  missionsByWorld.set(m.worldId, list);
}
for (const list of missionsByWorld.values()) list.sort((a, b) => a.order - b.order);

export function getSkill(id: string): Skill {
  const s = skillById.get(id);
  if (!s) throw new Error(`Unknown skill "${id}"`);
  return s;
}
export function getWorld(id: string): World | undefined {
  return worldById.get(id);
}
export function getMission(id: string): Mission | undefined {
  return missionById.get(id);
}
export function missionsForWorld(worldId: string): Mission[] {
  return missionsByWorld.get(worldId) ?? [];
}
export function bossForWorld(worldId: string): Mission | undefined {
  return missionsForWorld(worldId).find((m) => m.kind === "boss");
}
export function worldForMission(missionId: string): World | undefined {
  const m = missionById.get(missionId);
  return m ? worldById.get(m.worldId) : undefined;
}
export function allArtifacts() {
  return worlds.flatMap((w) => w.artifacts.map((a) => ({ ...a, worldId: w.id })));
}

/** Referential integrity. Called once at import; also run by vitest. */
export function validateRegistry(): void {
  const errors: string[] = [];
  const dup = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errors.push(`Duplicate ${label} id "${id}"`);
      seen.add(id);
    }
  };
  dup("skill", skills.map((s) => s.id));
  dup("world", worlds.map((w) => w.id));
  dup("mission", missions.map((m) => m.id));
  dup("world order", worlds.map((w) => String(w.order)));

  for (const s of skills) {
    for (const p of s.prerequisites) if (!skillById.has(p)) errors.push(`Skill "${s.id}" prerequisite "${p}" does not exist`);
  }
  const artifactIds = new Set<string>();
  for (const w of worlds) {
    for (const sid of w.skillIds) if (!skillById.has(sid)) errors.push(`World "${w.id}" skill "${sid}" does not exist`);
    for (const u of w.unlockedBy) if (!worldById.has(u)) errors.push(`World "${w.id}" unlockedBy "${u}" does not exist`);
    dup(`scene layer in ${w.id}`, w.scene.layers.map((l) => l.id));
    for (const a of w.artifacts) {
      if (artifactIds.has(a.id)) errors.push(`Duplicate artifact id "${a.id}"`);
      artifactIds.add(a.id);
      for (const mid of a.unlockedBy) {
        const m = missionById.get(mid);
        if (!m) errors.push(`Artifact "${a.id}" unlockedBy mission "${mid}" does not exist`);
        else if (m.worldId !== w.id) errors.push(`Artifact "${a.id}" unlockedBy mission "${mid}" from a different world`);
      }
    }
    if (w.status === "authored" && missionsForWorld(w.id).length === 0) errors.push(`Authored world "${w.id}" has no missions`);
    if (w.status === "authored" && !bossForWorld(w.id)) errors.push(`Authored world "${w.id}" has no boss mission`);
  }
  for (const m of missions) {
    const w = worldById.get(m.worldId);
    if (!w) {
      errors.push(`Mission "${m.id}" world "${m.worldId}" does not exist`);
      continue;
    }
    const layerIds = new Set(w.scene.layers.map((l) => l.id));
    const layerMax = new Map(w.scene.layers.map((l) => [l.id, l.maxLevel]));
    for (const s of m.skills) {
      if (!skillById.has(s.id)) errors.push(`Mission "${m.id}" skill "${s.id}" does not exist`);
      else if (!w.skillIds.includes(s.id)) errors.push(`Mission "${m.id}" uses skill "${s.id}" not declared on world "${w.id}"`);
    }
    for (const a of m.anchors) if (!skillById.has(a)) errors.push(`Mission "${m.id}" anchor "${a}" does not exist`);
    for (const p of m.prerequisites) {
      const pm = missionById.get(p);
      if (!pm) errors.push(`Mission "${m.id}" prerequisite "${p}" does not exist`);
      else if (pm.worldId !== m.worldId) errors.push(`Mission "${m.id}" prerequisite "${p}" is in another world`);
    }
    for (const d of m.onComplete) {
      if (d.kind === "layer") {
        if (!layerIds.has(d.layer)) errors.push(`Mission "${m.id}" onComplete layer "${d.layer}" not in world scene`);
        else if (d.level > (layerMax.get(d.layer) ?? 1)) errors.push(`Mission "${m.id}" layer "${d.layer}" level ${d.level} exceeds maxLevel`);
      }
    }
    for (const a of m.artifacts) {
      const art = w.artifacts.find((x) => x.id === a);
      if (!art) errors.push(`Mission "${m.id}" artifact "${a}" not declared on world "${w.id}"`);
      else if (!art.unlockedBy.includes(m.id)) errors.push(`Mission "${m.id}" lists artifact "${a}" but is not in its unlockedBy`);
    }
    if (m.explainWhy && m.explainWhy.correctIndex >= m.explainWhy.options.length) errors.push(`Mission "${m.id}" explainWhy.correctIndex out of range`);
    const orders = missionsForWorld(m.worldId).map((x) => x.order);
    if (new Set(orders).size !== orders.length) errors.push(`World "${m.worldId}" has duplicate mission orders`);
  }
  // Prerequisite cycles
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (id: string, trail: string[]) => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      errors.push(`Prerequisite cycle: ${[...trail, id].join(" -> ")}`);
      return;
    }
    visiting.add(id);
    for (const p of missionById.get(id)?.prerequisites ?? []) visit(p, [...trail, id]);
    visiting.delete(id);
    done.add(id);
  };
  for (const m of missions) visit(m.id, []);

  if (errors.length) throw new Error(`Content registry invalid:\n- ${errors.join("\n- ")}`);
}

validateRegistry();
