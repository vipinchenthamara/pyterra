import { z } from "zod";
import * as repo from "@/db/repos";

const Body = z.object({ missionId: z.string(), code: z.string().max(200_000) });

export async function PUT(request: Request) {
  const body = Body.safeParse(await request.json());
  if (!body.success) return Response.json({ error: body.error.issues }, { status: 400 });
  repo.saveCode(body.data.missionId, body.data.code);
  return Response.json({ ok: true, savedAt: new Date().toISOString() });
}

export async function DELETE(request: Request) {
  const { missionId } = z.object({ missionId: z.string() }).parse(await request.json());
  repo.clearCode(missionId);
  return Response.json({ ok: true });
}
