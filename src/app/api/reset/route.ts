import { z } from "zod";
import * as repo from "@/db/repos";

const Body = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("mission"), missionId: z.string(), confirm: z.literal(true) }),
  z.object({ scope: z.literal("all"), confirm: z.literal("RESET") }),
]);

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json());
  if (!body.success) return Response.json({ error: "Confirmation required" }, { status: 400 });
  if (body.data.scope === "mission") repo.resetMission(body.data.missionId);
  else repo.resetEverything();
  return Response.json({ ok: true });
}
