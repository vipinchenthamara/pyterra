import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getMission } from "@content/registry";
import { toClientMission } from "@content/schema";
import * as repo from "@/db/repos";
import { MissionWorkspace } from "@/components/mission/MissionWorkspace";
import { missionUnlocked } from "@/engine/worldState";
import { missionViewProps } from "@/server/missionView";

export const dynamic = "force-dynamic";

export default async function MissionPage({ params }: PageProps<"/missions/[missionId]">) {
  const { missionId } = await params;
  const mission = getMission(missionId);
  if (!mission) notFound();
  // First time in this district: show the arrival screen before any code.
  if (!repo.hasArrived(mission.worldId)) redirect(`/worlds/${mission.worldId}/arrive`);
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
  const view = missionViewProps(mission);
  const initialCode = repo.loadCode(mission.id) ?? mission.starterCode;
  return (
    <MissionWorkspace
      mission={toClientMission(mission)}
      world={view.world}
      anchors={view.anchors}
      initialCode={initialCode}
      alreadyPassed={passed.has(mission.id)}
      artifactNames={view.artifactNames}
      mode="mission"
      skillNames={view.skillNames}
      skills={view.skills}
      primers={view.primers}
      checks={view.checks}
      art={view.art}
      operationalPct={view.operationalPct}
      worldLayers={view.worldLayers}
    />
  );
}
