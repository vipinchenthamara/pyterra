import { z } from "zod";
import * as repo from "@/db/repos";
import { completeAttempt, failReview } from "@/server/complete";

const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("run"), passed: z.boolean(), code: z.string() }),
  z.object({ action: z.literal("hint"), level: z.number().int().min(1).max(6) }),
  z.object({ action: z.literal("predict"), text: z.string().max(500) }),
  z.object({
    action: z.literal("complete"),
    code: z.string(),
    runs: z.number().int().min(0),
    hintsUsed: z.number().int().min(0).max(6),
    maxHintLevel: z.number().int().min(0).max(6),
    durationMs: z.number().int().min(0),
    testSummary: z.object({ visiblePassed: z.number(), visibleTotal: z.number(), hiddenPassed: z.number(), hiddenTotal: z.number() }),
    explainWhyCorrect: z.boolean().nullable().optional(),
  }),
  z.object({ action: z.literal("fail-review"), hintsUsed: z.number().int().min(0).max(6) }),
  z.object({ action: z.literal("abandon") }),
]);

export async function GET(_req: Request, ctx: RouteContext<"/api/attempts/[id]">) {
  const { id } = await ctx.params;
  const a = repo.getAttempt(id);
  return a ? Response.json(a) : Response.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/attempts/[id]">) {
  const { id } = await ctx.params;
  const attempt = repo.getAttempt(id);
  if (!attempt) return Response.json({ error: "Not found" }, { status: 404 });
  const body = Action.safeParse(await request.json());
  if (!body.success) return Response.json({ error: body.error.issues }, { status: 400 });
  const a = body.data;
  switch (a.action) {
    case "run": {
      repo.updateAttempt(id, { runs: attempt.runs + 1, finalCode: a.code });
      repo.saveCode(attempt.missionId, a.code);
      return Response.json({ ok: true, runs: attempt.runs + 1 });
    }
    case "hint": {
      const maxHintLevel = Math.max(attempt.maxHintLevel, a.level);
      // hintsUsed counts distinct levels revealed; the ladder is sequential so level == count.
      const hintsUsed = Math.max(attempt.hintsUsed, a.level);
      repo.updateAttempt(id, { hintsUsed, maxHintLevel });
      if (a.level > attempt.maxHintLevel) repo.addEvent("hint", `Hint ${a.level} revealed`, { missionId: attempt.missionId, level: a.level });
      return Response.json({ ok: true, hintsUsed, maxHintLevel });
    }
    case "predict": {
      repo.updateAttempt(id, { predicted: a.text });
      return Response.json({ ok: true });
    }
    case "complete": {
      if (attempt.status === "passed") return Response.json({ alreadyPassed: true });
      const result = completeAttempt({ attemptId: id, ...a });
      return Response.json(result);
    }
    case "fail-review": {
      if (attempt.reviewItemId) failReview(attempt.reviewItemId, a.hintsUsed);
      repo.updateAttempt(id, { status: "failed", completedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }
    case "abandon": {
      repo.updateAttempt(id, { status: "abandoned", completedAt: new Date().toISOString() });
      return Response.json({ ok: true });
    }
  }
}
