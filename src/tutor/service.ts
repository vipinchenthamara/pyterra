/**
 * Tutor service: assembles context, enforces the hint ladder server-side, records interactions,
 * and delegates to a provider. Hint requests bump the attempt BEFORE the provider is called,
 * so the mastery penalty cannot be dodged by a failed API call (PRD AI-02).
 */
import { getMission, getSkill, getWorld } from "@content/registry";
import * as repo from "@/db/repos";
import { getSnapshot } from "@/server/state";
import { SYSTEM_PROMPT, missionBlock, progressBlock } from "./prompt";
import { mockProvider } from "./providers/mock";
import { anthropicProvider } from "./providers/anthropic";
import type { TutorContext, TutorProvider, TutorReply, TutorRequest, TutorTurn } from "./types";

export function activeProvider(): TutorProvider {
  return process.env.ANTHROPIC_API_KEY ? anthropicProvider : mockProvider;
}

export async function tutor(req: TutorRequest, now = new Date()): Promise<TutorReply> {
  const profile = repo.ensureProfile();
  const snapshot = getSnapshot({}, now);
  const attempt = req.attemptId ? repo.getAttempt(req.attemptId) : undefined;
  const mission = req.missionId ? getMission(req.missionId) : attempt ? getMission(attempt.missionId) : undefined;
  const world = mission ? getWorld(mission.worldId) : undefined;

  // Hint gating (server-side, authoritative)
  let allowed = attempt?.maxHintLevel ?? 0;
  let hintsUsed = attempt?.hintsUsed ?? 0;
  let note: string | undefined;
  if (req.requestHint && attempt && mission) {
    const elapsedMin = (now.getTime() - new Date(attempt.startedAt).getTime()) / 60_000;
    const wanted = Math.min(6, allowed + 1);
    if (wanted === 6 && !(attempt.runs >= 3 || elapsedMin >= 10)) {
      note = "The full walkthrough unlocks after 3 runs or 10 minutes on this mission.";
    } else if (wanted > allowed) {
      allowed = wanted;
      hintsUsed = Math.max(hintsUsed, wanted);
      repo.updateAttempt(attempt.id, { maxHintLevel: allowed, hintsUsed });
      repo.addEvent("hint", `Hint ${allowed} requested from the assistant`, { missionId: mission.id, level: allowed });
    }
  }

  const skills = mission ? mission.skills.map((s) => getSkill(s.id)) : [];
  const history: TutorTurn[] = repo.tutorHistory(attempt?.id, 12).map((r) => ({ role: r.role, content: r.content, mode: r.mode, hintLevel: r.hintLevel, createdAt: r.createdAt }));

  const ctx: TutorContext = {
    system: SYSTEM_PROMPT,
    missionBlock: mission && world ? missionBlock(mission, world, skills, allowed) : null,
    progressBlock: progressBlock(snapshot),
    code: req.code ?? null,
    lastError: req.lastError ?? null,
    lastTests: req.lastTests ?? null,
    history,
    message: req.message,
    mode: req.mode,
    allowedHintLevel: allowed,
    authoredHints: mission ? mission.hints.slice(0, allowed) : [],
    anchorLines: skills.map((s) => s.anchor),
    domain: profile.settings.domain,
  };

  // Budget + enablement
  let provider = activeProvider();
  if (!profile.settings.tutorEnabled) provider = mockProvider;
  const budget = profile.settings.dailyTokenBudget || Number(process.env.TUTOR_DAILY_TOKEN_BUDGET) || 200_000;
  if (provider.name === "anthropic" && repo.tutorTokensToday(now) >= budget) {
    provider = mockProvider;
    note = `Daily token budget reached (${budget.toLocaleString()}). Offline hints only until tomorrow.`;
  }

  repo.addTutorInteraction({ attemptId: attempt?.id ?? null, missionId: mission?.id ?? null, role: "user", mode: req.mode, content: req.message || `[${req.mode}]`, hintLevel: req.requestHint ? allowed : null, provider: provider.name });

  let text: string;
  let tokensIn = 0;
  let tokensOut = 0;
  try {
    const r = await provider.answer(ctx);
    text = r.text;
    tokensIn = r.tokensIn;
    tokensOut = r.tokensOut;
  } catch (e) {
    // NFR-03: an unavailable AI service never blocks learning. Fall back to authored hints.
    const r = await mockProvider.answer(ctx);
    text = r.text;
    note = `Claude is unreachable right now (${(e as Error).message.slice(0, 80)}). Showing authored guidance instead.`;
    provider = mockProvider;
  }
  repo.addTutorInteraction({ attemptId: attempt?.id ?? null, missionId: mission?.id ?? null, role: "tutor", mode: req.mode, content: text, hintLevel: req.requestHint ? allowed : null, provider: provider.name, tokensIn, tokensOut });

  return { reply: text, hintLevel: allowed, hintsUsed, provider: provider.name, note };
}
