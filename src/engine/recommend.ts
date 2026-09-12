/** Next-mission recommendation and Today's Briefing (PRD §6). Pure. */
import type { Mission, World } from "@content/schema";
import { effectiveSkill, health, mastery, type SkillStateLike } from "./mastery";
import { daysOverdue, isDue } from "./spaced";
import type { ComputedWorld } from "./worldState";
import { missionUnlocked } from "./worldState";

export interface ReviewItemLike {
  id: string;
  skillId: string;
  missionId: string;
  nextReviewAt: string;
}

export interface RecommendInput {
  now: Date;
  worlds: readonly World[];
  missions: readonly Mission[];
  computed: ReadonlyMap<string, ComputedWorld>;
  passedIds: ReadonlySet<string>;
  skillStates: ReadonlyMap<string, SkillStateLike>;
  reviews: readonly ReviewItemLike[];
  lastWorldId?: string | null;
  /** 5, 15 or undefined (deep session) */
  sessionMinutes?: number;
  learnerLevel?: number; // 1–5, derived from average mastery
}

export interface Candidate {
  mission: Mission;
  score: number;
  reasons: string[];
}

export function candidateMissions(input: RecommendInput): Candidate[] {
  const { missions, computed, passedIds, skillStates, now } = input;
  const level = input.learnerLevel ?? 1;
  const out: Candidate[] = [];
  for (const m of missions) {
    if (passedIds.has(m.id)) continue;
    const cw = computed.get(m.worldId);
    if (!cw?.unlocked) continue;
    if (!missionUnlocked(m, passedIds)) continue;
    if (input.sessionMinutes && m.estimatedMinutes > input.sessionMinutes) continue;
    const gaps = m.skills.map((s) => {
      const st = skillStates.get(s.id);
      return st ? 100 - mastery(effectiveSkill(st, now)) : 100;
    });
    const skillGap = gaps.reduce((a, b) => a + b, 0) / gaps.length / 100;
    const momentum = input.lastWorldId === m.worldId ? 1 : 0;
    const difficultyFit = 1 - Math.abs(m.difficulty - level) / 4;
    const novelty = m.skills.some((s) => !skillStates.get(s.id) || skillStates.get(s.id)!.timesPracticed === 0) ? 1 : 0;
    const score = 0.4 * skillGap + 0.3 * momentum + 0.2 * difficultyFit + 0.1 * novelty;
    const reasons: string[] = [];
    if (novelty) reasons.push("introduces a new skill");
    if (momentum) reasons.push("continues your current world");
    if (m.kind === "boss") reasons.push("boss challenge");
    out.push({ mission: m, score, reasons });
  }
  const worldOrder = new Map(input.worlds.map((w) => [w.id, w.order]));
  return out.sort(
    (a, b) => b.score - a.score || (worldOrder.get(a.mission.worldId) ?? 0) - (worldOrder.get(b.mission.worldId) ?? 0) || a.mission.order - b.mission.order,
  );
}

export function nextMission(input: RecommendInput): Candidate | undefined {
  return candidateMissions(input)[0];
}

export type BriefingCard =
  | { kind: "review"; reviewId: string; skillId: string; missionId: string; overdueDays: number; minutes: number }
  | { kind: "mission"; missionId: string; minutes: number; reasons: string[] }
  | { kind: "fragile"; skillId: string; missionId?: string }
  | { kind: "artifact"; artifactId: string; missionId: string }
  | { kind: "streak"; days: number };

export interface BriefingInput extends RecommendInput {
  streakDays: number;
  artifacts: readonly { id: string; worldId: string; unlockedBy: string[] }[];
  unlockedArtifactIds: ReadonlySet<string>;
}

export function buildBriefing(input: BriefingInput): BriefingCard[] {
  const cards: BriefingCard[] = [];
  const { now } = input;
  const due = input.reviews
    .filter((r) => isDue(r.nextReviewAt, now))
    .sort((a, b) => daysOverdue(b.nextReviewAt, now) - daysOverdue(a.nextReviewAt, now))
    .slice(0, 2);
  for (const r of due) cards.push({ kind: "review", reviewId: r.id, skillId: r.skillId, missionId: r.missionId, overdueDays: Math.floor(daysOverdue(r.nextReviewAt, now)), minutes: 3 });

  const next = nextMission(input);
  if (next) cards.push({ kind: "mission", missionId: next.mission.id, minutes: next.mission.estimatedMinutes, reasons: next.reasons });

  const fragile = [...input.skillStates.values()]
    .filter((s) => health(s, now) === "fragile")
    .sort((a, b) => mastery(effectiveSkill(a, now)) - mastery(effectiveSkill(b, now)))[0];
  if (fragile) {
    const repair = input.missions
      .filter((m) => m.skills.some((s) => s.id === fragile.skillId) && input.passedIds.has(m.id))
      .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)[0];
    cards.push({ kind: "fragile", skillId: fragile.skillId, missionId: repair?.id });
  }

  for (const a of input.artifacts) {
    if (input.unlockedArtifactIds.has(a.id)) continue;
    const missing = a.unlockedBy.filter((m) => !input.passedIds.has(m));
    if (missing.length === 1) {
      cards.push({ kind: "artifact", artifactId: a.id, missionId: missing[0] });
      break;
    }
  }

  if (input.streakDays > 0) cards.push({ kind: "streak", days: input.streakDays });
  return cards.slice(0, 5);
}

/** Learner level 1–5 from mean mastery of practised skills. */
export function learnerLevel(skillStates: Iterable<SkillStateLike>, now: Date): number {
  const ms = [...skillStates].filter((s) => s.timesPracticed > 0).map((s) => mastery(effectiveSkill(s, now)));
  if (ms.length === 0) return 1;
  const mean = ms.reduce((a, b) => a + b, 0) / ms.length;
  return Math.max(1, Math.min(5, 1 + Math.floor(mean / 25)));
}
