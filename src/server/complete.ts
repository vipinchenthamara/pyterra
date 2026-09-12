/**
 * THE completion transaction (plan §7). Runs when an attempt passes:
 * attempt → skills → world state → artifacts → reviews → events → xp. One SQLite transaction.
 * The client never writes state directly.
 */
import { allArtifacts, getMission, getSkill, missionsForWorld, worlds } from "@content/registry";
import { withTransaction } from "@/db/client";
import * as repo from "@/db/repos";
import type { SkillStateRow } from "@/db/schema";
import { applyCompletion, applyReview, emptySkillState, health, mastery, type SkillStateLike } from "@/engine/mastery";
import { nextIntervalIdx, scheduleReview } from "@/engine/spaced";
import { computeAllWorlds } from "@/engine/worldState";
import { completionStatement } from "@/engine/voice";

export interface CompletionInput {
  attemptId: string;
  code: string;
  runs: number;
  hintsUsed: number;
  maxHintLevel: number;
  durationMs: number;
  testSummary: { visiblePassed: number; visibleTotal: number; hiddenPassed: number; hiddenTotal: number };
  explainWhyCorrect?: boolean | null;
}

export interface CompletionResult {
  xpGained: number;
  statements: string[];
  skillChanges: { skillId: string; name: string; before: number; after: number; health: string }[];
  worldBefore: { operationalPct: number; layers: Record<string, number> };
  worldAfter: { operationalPct: number; layers: Record<string, number> };
  newArtifacts: string[];
  worldUnlocked: string | null;
  nextMissionId: string | null;
  alreadyPassed: boolean;
}

function rowToState(r: SkillStateRow): SkillStateLike {
  return { skillId: r.skillId, understanding: r.understanding, recall: r.recall, application: r.application, independence: r.independence, timesPracticed: r.timesPracticed, reviewsDone: r.reviewsDone, intervalIdx: r.intervalIdx, lastPracticedAt: r.lastPracticedAt, nextReviewAt: r.nextReviewAt };
}

export function completeAttempt(input: CompletionInput, now = new Date()): CompletionResult {
  return withTransaction((db) => {
    const attempt = repo.getAttempt(input.attemptId, db);
    if (!attempt) throw new Error("Unknown attempt");
    const mission = getMission(attempt.missionId);
    if (!mission) throw new Error("Unknown mission");
    const world = worlds.find((w) => w.id === mission.worldId)!;

    const passedBefore = repo.passedMissionIds(db);
    const alreadyPassed = passedBefore.has(mission.id);
    const computedBefore = computeAllWorlds(worlds, missionsForWorld, passedBefore);
    const wb = computedBefore.get(world.id)!;

    repo.updateAttempt(
      input.attemptId,
      { status: "passed", completedAt: now.toISOString(), finalCode: input.code, runs: input.runs, hintsUsed: input.hintsUsed, maxHintLevel: input.maxHintLevel, durationMs: input.durationMs, testSummary: input.testSummary, explainWhyCorrect: input.explainWhyCorrect ?? null },
      db,
    );
    repo.saveCode(mission.id, input.code, db);

    const isReview = attempt.mode === "review";
    const states = new Map(repo.allSkillStates(db).map((r) => [r.skillId, rowToState(r)]));
    const skillChanges: CompletionResult["skillChanges"] = [];
    const statements: string[] = [];

    for (const s of mission.skills) {
      const before = states.get(s.id) ?? emptySkillState(s.id);
      let after: SkillStateLike;
      if (isReview) {
        after = applyReview(before, { passed: true, hintsUsed: input.hintsUsed }, now);
        const review = attempt.reviewItemId ? repo.getReview(attempt.reviewItemId, db) : repo.reviewForSkillMission(s.id, mission.id, db);
        const idx = nextIntervalIdx(review?.intervalIdx ?? before.intervalIdx, { passed: true, hintsUsed: input.hintsUsed });
        const next = scheduleReview(now, idx, mastery(after));
        after = { ...after, intervalIdx: idx, nextReviewAt: next.toISOString() };
        if (review) repo.updateReview(review.id, { intervalIdx: idx, nextReviewAt: next.toISOString(), lastResult: "pass", reviewsDone: (review.reviewsDone ?? 0) + 1 }, db);
      } else if (alreadyPassed) {
        // Re-solving a passed mission counts as light practice only.
        after = { ...before, lastPracticedAt: now.toISOString(), timesPracticed: before.timesPracticed + 1 };
      } else {
        after = applyCompletion(before, { hintsUsed: input.hintsUsed, runs: input.runs, role: s.role, difficulty: mission.difficulty }, now);
        // Schedule the first review only for primary skills, one per skill+mission.
        if (s.role === "primary" && !repo.reviewForSkillMission(s.id, mission.id, db)) {
          const next = scheduleReview(now, 0, mastery(after));
          repo.createReview({ skillId: s.id, missionId: mission.id, intervalIdx: 0, nextReviewAt: next.toISOString() }, db);
          after = { ...after, nextReviewAt: before.nextReviewAt && before.nextReviewAt < next.toISOString() ? before.nextReviewAt : next.toISOString() };
        }
      }
      states.set(s.id, after);
      repo.upsertSkillState({ ...after }, db);
      const skill = getSkill(s.id);
      const h = health(after, now);
      skillChanges.push({ skillId: s.id, name: skill.name, before: mastery(before), after: mastery(after), health: h });
      if (s.role === "primary") statements.push(completionStatement({ hintsUsed: input.hintsUsed, skillName: skill.name, health: h, runs: input.runs }));
    }

    // World state (derived) + cache
    const passedAfter = new Set(passedBefore);
    passedAfter.add(mission.id);
    const computedAfter = computeAllWorlds(worlds, missionsForWorld, passedAfter);
    for (const c of computedAfter.values()) repo.upsertWorldState({ worldId: c.worldId, operationalPct: c.operationalPct, layers: c.layers, stats: c.stats, unlocked: c.unlocked }, db);
    const wa = computedAfter.get(world.id)!;
    let worldUnlocked: string | null = null;
    for (const w of worlds) if (!computedBefore.get(w.id)?.unlocked && computedAfter.get(w.id)?.unlocked) worldUnlocked = w.id;

    // Artifacts
    const newArtifacts: string[] = [];
    if (!isReview && !alreadyPassed) {
      const owned = new Set(repo.allArtifactRows(db).map((a) => a.artifactId));
      for (const a of allArtifacts()) {
        if (owned.has(a.id)) continue;
        if (!a.unlockedBy.every((m) => passedAfter.has(m))) continue;
        const code: Record<string, string> = {};
        for (const mid of a.unlockedBy) {
          const best = repo.attemptsForMission(mid, db).find((x) => x.status === "passed" && x.finalCode);
          if (best?.finalCode) code[mid] = best.finalCode;
        }
        repo.unlockArtifact({ artifactId: a.id, worldId: a.worldId, sourceMissionId: mission.id, code }, db);
        newArtifacts.push(a.id);
      }
    }

    // XP + activity + events
    let xp = 0;
    if (isReview) xp = input.hintsUsed === 0 ? 20 : 10;
    else if (!alreadyPassed) xp = Math.round((30 + mission.difficulty * 10) * Math.max(0.4, 1 - 0.1 * input.hintsUsed) * (mission.kind === "boss" ? 2 : 1));
    const profile = repo.touchActivity(now, db);
    repo.updateProfile({ xp: profile.xp + xp, lastWorldId: world.id }, db);

    if (isReview) repo.addEvent("review", `${world.name} repaired: ${getSkill(mission.skills[0].id).name} recall restored`, { missionId: mission.id, hintsUsed: input.hintsUsed }, db);
    else if (!alreadyPassed) {
      repo.addEvent("mission", `You completed ${mission.title}`, { missionId: mission.id, worldId: world.id, hintsUsed: input.hintsUsed, runs: input.runs }, db);
      if (wa.operationalPct !== wb.operationalPct) repo.addEvent("world", `${world.name} is now ${wa.operationalPct}% operational`, { worldId: world.id, pct: wa.operationalPct }, db);
      for (const a of newArtifacts) repo.addEvent("artifact", `New build: ${allArtifacts().find((x) => x.id === a)?.name}`, { artifactId: a }, db);
      if (worldUnlocked) repo.addEvent("unlock", `${worlds.find((w) => w.id === worldUnlocked)?.name} unlocked`, { worldId: worldUnlocked }, db);
      for (const c of skillChanges) if (c.before < 40 && c.after >= 40) repo.addEvent("skill", `New concept unlocked: ${c.name}`, { skillId: c.skillId }, db);
    }

    const next = missionsForWorld(world.id).find((m) => !passedAfter.has(m.id) && m.prerequisites.every((p) => passedAfter.has(p)));
    return {
      xpGained: xp, statements, skillChanges,
      worldBefore: { operationalPct: wb.operationalPct, layers: wb.layers },
      worldAfter: { operationalPct: wa.operationalPct, layers: wa.layers },
      newArtifacts, worldUnlocked, nextMissionId: next?.id ?? null, alreadyPassed,
    };
  });
}

/** A failed review shortens the interval and lowers recall. */
export function failReview(reviewId: string, hintsUsed: number, now = new Date()) {
  return withTransaction((db) => {
    const review = repo.getReview(reviewId, db);
    if (!review) return;
    const row = repo.allSkillStates(db).find((s) => s.skillId === review.skillId);
    const before = row ? rowToState(row) : emptySkillState(review.skillId);
    const after = applyReview(before, { passed: false, hintsUsed }, now);
    const idx = nextIntervalIdx(review.intervalIdx, { passed: false, hintsUsed });
    const next = scheduleReview(now, idx, mastery(after));
    repo.upsertSkillState({ ...after, intervalIdx: idx, nextReviewAt: next.toISOString() }, db);
    repo.updateReview(review.id, { intervalIdx: idx, nextReviewAt: next.toISOString(), lastResult: "fail", reviewsDone: review.reviewsDone + 1 }, db);
    repo.addEvent("review", `${getSkill(review.skillId).name} recall slipped. Repair rescheduled sooner.`, { skillId: review.skillId }, db);
  });
}
