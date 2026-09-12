import { notFound } from "next/navigation";
import { getMission, getSkill } from "@content/registry";
import { toClientMission, toReviewMission } from "@content/schema";
import * as repo from "@/db/repos";
import { MissionWorkspace } from "@/components/mission/MissionWorkspace";
import { missionViewProps, visibleChecks } from "@/server/missionView";

export const dynamic = "force-dynamic";

export default async function ReviewPage({ params }: PageProps<"/review/[reviewId]">) {
  const { reviewId } = await params;
  const review = repo.getReview(reviewId);
  if (!review) notFound();
  const base = getMission(review.missionId);
  if (!base) notFound();
  const mission = toReviewMission(base);
  const view = missionViewProps(base);
  const skill = getSkill(review.skillId);
  return (
    <MissionWorkspace
      mission={toClientMission(mission)}
      world={view.world}
      anchors={view.anchors}
      initialCode={base.reviewVariant ? mission.starterCode : ""}
      alreadyPassed
      artifactNames={{}}
      mode="review"
      reviewItemId={review.id}
      skillNames={[skill.name]}
      skills={[{ id: skill.id, name: skill.name, isNew: false }]}
      primers={view.primers.map((p) => ({ ...p, isNew: false }))}
      checks={visibleChecks(mission)}
    />
  );
}
