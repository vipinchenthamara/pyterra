import { z } from "zod";
import { getMission } from "@content/registry";
import * as repo from "@/db/repos";

const Body = z.object({ missionId: z.string(), mode: z.enum(["mission", "review"]).optional(), reviewItemId: z.string().optional() });

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json());
  if (!body.success) return Response.json({ error: body.error.issues }, { status: 400 });
  const mission = getMission(body.data.missionId);
  if (!mission) return Response.json({ error: "Unknown mission" }, { status: 404 });
  repo.touchActivity(new Date());
  repo.updateProfile({ lastWorldId: mission.worldId });
  const attempt = repo.startAttempt({ missionId: mission.id, missionVersion: mission.version, mode: body.data.mode, reviewItemId: body.data.reviewItemId });
  return Response.json(attempt);
}
