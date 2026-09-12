import { notFound } from "next/navigation";
import { getMission, getSkill, getWorld } from "@content/registry";
import { toClientMission, toReviewMission } from "@content/schema";
import * as repo from "@/db/repos";
import { MissionWorkspace } from "@/components/mission/MissionWorkspace";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: PageProps<"/review/[reviewId]">) {
  const { reviewId } = await params;
  const review = repo.getReview(reviewId);
  if (!review) notFound();
  const base = getMission(review.missionId);
  if (!base) notFound();
  const mission = toReviewMission(base);
  const world = getWorld(mission.worldId)!;
  const skill = getSkill(review.skillId);
  const anchors = mission.anchors.map((id) => {
    const s = getSkill(id);
    return { id: s.id, name: s.name, anchor: s.anchor, description: s.description };
  });
  return (
    <MissionWorkspace
      mission={toClientMission(mission)}
      world={{ id: world.id, name: world.name, accent: world.accent, scene: world.scene, codename: world.codename }}
      anchors={anchors}
      initialCode={base.reviewVariant ? mission.starterCode : ""}
      alreadyPassed
      artifactNames={{}}
      mode="review"
      reviewItemId={review.id}
      skillNames={[skill.name]}
    />
  );
}
