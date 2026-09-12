import { z } from "zod";
import type { NextRequest } from "next/server";
import * as repo from "@/db/repos";
import { activeProvider, tutor } from "@/tutor/service";
import { TUTOR_MODES } from "@/tutor/types";

const Body = z.object({
  mode: z.enum(TUTOR_MODES.map((m) => m.id) as [string, ...string[]]),
  message: z.string().max(4000).default(""),
  attemptId: z.string().optional(),
  missionId: z.string().optional(),
  code: z.string().max(20_000).optional(),
  lastError: z.string().max(4000).nullable().optional(),
  lastTests: z.string().max(4000).nullable().optional(),
  requestHint: z.boolean().optional(),
});

export async function POST(request: Request) {
  const body = Body.safeParse(await request.json());
  if (!body.success) return Response.json({ error: body.error.issues }, { status: 400 });
  const reply = await tutor({ ...body.data, mode: body.data.mode as (typeof TUTOR_MODES)[number]["id"] });
  return Response.json(reply);
}

export async function GET(request: NextRequest) {
  const attemptId = request.nextUrl.searchParams.get("attemptId");
  const history = repo.tutorHistory(attemptId, 20).map((r) => ({ role: r.role, content: r.content, mode: r.mode, hintLevel: r.hintLevel, createdAt: r.createdAt }));
  return Response.json({ provider: activeProvider().name, history });
}
