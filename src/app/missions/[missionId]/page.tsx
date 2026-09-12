import { notFound } from "next/navigation";
import { getMission, getSkill, getWorld, missionsForWorld } from "@content/registry";
import { toClientMission } from "@content/schema";
import * as repo from "@/db/repos";
import { MissionWorkspace } from "@/components/mission/MissionWorkspace";
import { missionUnlocked } from "@/engine/worldState";
import Link from "next/link";
import { Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MissionPage({ params }: PageProps<"/missions/[missionId]">) {
  const { missionId } = await params;
  const mission = getMission(missionId);
  if (!mission) notFound();
  const world = getWorld(mission.worldId)!;
  const passed = repo.passedMissionIds();
  if (!missionUnlocked(mission, passed)) {
    const missing = mission.prerequisites.filter((p) => !passed.has(p)).map((id) => getMission(id)!);
    return (
      <div className="mx-auto max-w-xl">
        <div className="panel hud p-8 text-center">
          <Lock className="mx-auto h-8 w-8 text-violet-2" />
          <h1 className="mt-3 font-display text-[22px] font-semibold">{mission.title} is locked</h1>
          <p className="mt-2 text-[13.5px] text-fg-3">Unlock rule: complete {missing.map((m) => m.title).join(", ")} first.</p>
          <Link href={`/missions/${missing[0].id}`} className="mt-4 inline-block font-mono text-[12px] uppercase tracking-wider text-cyan hover:underline">Go to {missing[0].title} →</Link>
        </div>
      </div>
    );
  }
  const initialCode = repo.loadCode(mission.id) ?? mission.starterCode;
  const anchors = mission.anchors.map((id) => {
    const s = getSkill(id);
    return { id: s.id, name: s.name, anchor: s.anchor, description: s.description };
  });
  const artifactNames = Object.fromEntries(world.artifacts.map((a) => [a.id, a.name]));
  const ms = missionsForWorld(world.id);
  const idx = ms.findIndex((m) => m.id === mission.id);
  return (
    <MissionWorkspace
      mission={toClientMission(mission)}
      world={{ id: world.id, name: world.name, accent: world.accent, scene: world.scene, codename: world.codename }}
      anchors={anchors}
      initialCode={initialCode}
      alreadyPassed={passed.has(mission.id)}
      artifactNames={artifactNames}
      mode="mission"
      skillNames={mission.skills.map((s) => getSkill(s.id).name)}
      prevMissionId={ms[idx - 1]?.id ?? null}
      nextMissionId={ms[idx + 1]?.id ?? null}
    />
  );
}
