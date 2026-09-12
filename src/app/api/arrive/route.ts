import { z } from "zod";
import { getWorld } from "@content/registry";
import * as repo from "@/db/repos";

export async function POST(request: Request) {
  const body = z.object({ worldId: z.string() }).safeParse(await request.json());
  if (!body.success || !getWorld(body.data.worldId)) return Response.json({ error: "Unknown world" }, { status: 400 });
  repo.markArrived(body.data.worldId);
  return Response.json({ ok: true });
}
