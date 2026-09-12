import { z } from "zod";
import * as repo from "@/db/repos";

export async function GET() {
  const p = repo.ensureProfile();
  return Response.json({ displayName: p.displayName, xp: p.xp, streakDays: p.streakDays, lastActiveAt: p.lastActiveAt, lastWorldId: p.lastWorldId, settings: p.settings, tutorProvider: process.env.ANTHROPIC_API_KEY ? "anthropic" : "mock" });
}

const Patch = z.object({
  displayName: z.string().min(1).max(40).optional(),
  settings: z
    .object({
      domain: z.enum(["security", "cloud", "ai", "general"]).optional(),
      defaultSessionMinutes: z.union([z.literal(5), z.literal(15), z.literal(0)]).optional(),
      tutorEnabled: z.boolean().optional(),
      dailyTokenBudget: z.number().int().min(0).optional(),
      notes: z.record(z.string(), z.string()).optional(),
      onboarded: z.boolean().optional(),
    })
    .optional(),
});

export async function PATCH(request: Request) {
  const body = Patch.safeParse(await request.json());
  if (!body.success) return Response.json({ error: body.error.issues }, { status: 400 });
  const p = repo.ensureProfile();
  const settings = { ...p.settings, ...(body.data.settings ?? {}), notes: { ...p.settings.notes, ...(body.data.settings?.notes ?? {}) } };
  repo.updateProfile({ ...(body.data.displayName ? { displayName: body.data.displayName } : {}), settings });
  return Response.json({ ok: true });
}
