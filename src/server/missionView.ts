import { getSkill, getWorld, missionsForWorld } from "@content/registry";
import type { Mission } from "@content/schema";
import * as repo from "@/db/repos";
import type { PrimerView } from "@/components/mission/PrimerStep";
import { artForWorld } from "./art";
import { computeAllWorlds } from "@/engine/worldState";
import { worlds } from "@content/registry";

/** Visible test docstrings, in definition order, for the objective checklist. */
export function visibleChecks(m: Mission): string[] {
  const out: string[] = [];
  const re = /def\s+(test_\w+)\s*\([^)]*\):\s*\n\s*(?:"""([^"]+)"""|"([^"\n]+)"|'([^'\n]+)')?/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(m.tests.visible))) {
    const doc = match[2] ?? match[3] ?? match[4];
    out.push((doc ?? match[1].replace(/^test_/, "").replace(/_/g, " ")).trim());
  }
  return out;
}

export function missionViewProps(m: Mission) {
  const world = getWorld(m.worldId)!;
  const practised = new Set(repo.allSkillStates().filter((s) => s.timesPracticed > 0).map((s) => s.skillId));
  const skills = m.skills.map((s) => ({ id: s.id, name: getSkill(s.id).name, isNew: !practised.has(s.id) }));
  const primers: PrimerView[] = m.skills
    .map((s) => getSkill(s.id))
    .filter((sk) => sk.primer)
    .map((sk) => ({ skillId: sk.id, name: sk.name, anchor: sk.anchor, primer: sk.primer!, isNew: !practised.has(sk.id) }));
  const anchors = m.anchors.map((id) => {
    const s = getSkill(id);
    return { id: s.id, name: s.name, anchor: s.anchor, description: s.description };
  });
  const ms = missionsForWorld(world.id);
  const computed = computeAllWorlds(worlds, missionsForWorld, repo.passedMissionIds()).get(world.id)!;
  return {
    art: artForWorld(world.id),
    operationalPct: computed.operationalPct,
    worldLayers: computed.layers,
    world: { id: world.id, name: world.name, accent: world.accent, scene: world.scene, codename: world.codename },
    anchors,
    skills,
    primers,
    checks: visibleChecks(m),
    skillNames: skills.map((s) => s.name),
    artifactNames: Object.fromEntries(world.artifacts.map((a) => [a.id, a.name])),
    missionIndex: ms.findIndex((x) => x.id === m.id),
  };
}
