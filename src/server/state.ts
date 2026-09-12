/** Full learner snapshot for pages and /api/state. Read-only; recomputes derived state each call (cheap). */
import { allArtifacts, getMission, getSkill, missions, missionsForWorld, skills, worlds } from "@content/registry";
import type { ArtifactDef, Mission, World } from "@content/schema";
import { getDb } from "@/db/client";
import * as repo from "@/db/repos";
import type { SkillStateRow } from "@/db/schema";
import { effectiveSkill, emptySkillState, health, mastery, type SkillHealth, type SkillStateLike } from "@/engine/mastery";
import { buildBriefing, learnerLevel, nextMission, type BriefingCard } from "@/engine/recommend";
import { daysOverdue } from "@/engine/spaced";
import { computeAllWorlds, overallOperational, visualState, type ComputedWorld, type WorldVisualState } from "@/engine/worldState";
import { repairLine, tensionLine, unlockLine } from "@/engine/voice";

export interface SkillView extends SkillStateLike {
  name: string;
  anchor: string;
  domain: string;
  description: string;
  mastery: number;
  health: SkillHealth;
  worldId: string | null;
}

export interface WorldView {
  world: World;
  computed: ComputedWorld;
  visual: WorldVisualState;
  missionCount: number;
  passedCount: number;
  nextMissionId: string | null;
  fragileSkills: string[];
  minutesToComplete: number;
}

export interface ArtifactView extends ArtifactDef {
  worldId: string;
  worldName: string;
  unlocked: boolean;
  unlockedAt: string | null;
  code: Record<string, string>;
  missingMissionIds: string[];
}

export interface Snapshot {
  now: string;
  profile: { displayName: string; xp: number; streakDays: number; lastActiveAt: string | null; lastWorldId: string | null; settings: import("@/db/schema").LearnerSettings };
  overallPct: number;
  worlds: WorldView[];
  skills: SkillView[];
  briefing: BriefingCard[];
  next: { mission: Mission; worldName: string; reasons: string[]; unlocksLine: string } | null;
  artifacts: ArtifactView[];
  events: { id: string; type: string; title: string; createdAt: string }[];
  reviewsDue: { id: string; skillId: string; skillName: string; missionId: string; missionTitle: string; worldName: string; overdueDays: number }[];
  stats: { linesOfCode: number; missionsPassed: number; artifactsBuilt: number; toolsUnlocked: number; independentSolves: number; avgHints: number };
  maintenanceLine: string | null;
}

function rowToState(r: SkillStateRow): SkillStateLike {
  return { skillId: r.skillId, understanding: r.understanding, recall: r.recall, application: r.application, independence: r.independence, timesPracticed: r.timesPracticed, reviewsDone: r.reviewsDone, intervalIdx: r.intervalIdx, lastPracticedAt: r.lastPracticedAt, nextReviewAt: r.nextReviewAt };
}

export function getSnapshot(opts: { sessionMinutes?: number } = {}, now = new Date()): Snapshot {
  const db = getDb();
  const profile = repo.ensureProfile(db);
  const passedIds = repo.passedMissionIds(db);
  const computed = computeAllWorlds(worlds, missionsForWorld, passedIds);
  const stateRows = repo.allSkillStates(db);
  const skillStates = new Map(stateRows.map((r) => [r.skillId, rowToState(r)]));
  const skillWorld = new Map<string, string>();
  for (const w of worlds) for (const s of w.skillIds) if (!skillWorld.has(s)) skillWorld.set(s, w.id);

  const skillViews: SkillView[] = skills.map((s) => {
    const st = effectiveSkill(skillStates.get(s.id) ?? emptySkillState(s.id), now);
    return { ...st, name: s.name, anchor: s.anchor, domain: s.domain, description: s.description, mastery: mastery(st), health: health(st, now), worldId: skillWorld.get(s.id) ?? null };
  });
  const healthById = new Map(skillViews.map((s) => [s.skillId, s.health]));

  const worldViews: WorldView[] = worlds.map((w) => {
    const c = computed.get(w.id)!;
    const ms = missionsForWorld(w.id);
    const fragile = w.skillIds.filter((s) => healthById.get(s) === "fragile");
    const next = ms.find((m) => !passedIds.has(m.id) && m.prerequisites.every((p) => passedIds.has(p)));
    return {
      world: w, computed: c, visual: visualState(c, fragile.length > 0, profile.lastWorldId === w.id), missionCount: ms.length, passedCount: c.passedMissionIds.length,
      nextMissionId: next?.id ?? null, fragileSkills: fragile, minutesToComplete: ms.filter((m) => !passedIds.has(m.id)).reduce((a, m) => a + m.estimatedMinutes, 0),
    };
  });

  const reviews = repo.allReviews(db).map((r) => ({ id: r.id, skillId: r.skillId, missionId: r.missionId, nextReviewAt: r.nextReviewAt }));
  const artifactRows = new Map(repo.allArtifactRows(db).map((a) => [a.artifactId, a]));
  const artifactDefs = allArtifacts();
  const artifacts: ArtifactView[] = artifactDefs.map((a) => {
    const row = artifactRows.get(a.id);
    return { ...a, worldName: worlds.find((w) => w.id === a.worldId)?.name ?? "", unlocked: !!row, unlockedAt: row?.unlockedAt ?? null, code: row?.code ?? {}, missingMissionIds: a.unlockedBy.filter((m) => !passedIds.has(m)) };
  });

  const recInput = { now, worlds, missions, computed, passedIds, skillStates, reviews, lastWorldId: profile.lastWorldId, sessionMinutes: opts.sessionMinutes, learnerLevel: learnerLevel(skillStates.values(), now) };
  const nm = nextMission(recInput);
  const briefing = buildBriefing({ ...recInput, streakDays: profile.streakDays, artifacts: artifactDefs, unlockedArtifactIds: new Set(artifactRows.keys()) });

  let next: Snapshot["next"] = null;
  if (nm) {
    const w = worlds.find((x) => x.id === nm.mission.worldId)!;
    const wv = worldViews.find((x) => x.world.id === w.id)!;
    const remaining = missionsForWorld(w.id).filter((m) => !passedIds.has(m.id));
    const nextWorld = worlds.find((x) => x.unlockedBy.includes(w.id));
    let unlocksLine = "";
    if (nm.mission.kind === "boss" && nextWorld) unlocksLine = tensionLine(nm.mission.title, nextWorld.name);
    else if (remaining.length === 2 && nextWorld) unlocksLine = `One more mission after this unlocks the boss challenge.`;
    else if (wv.minutesToComplete > 0 && nextWorld) unlocksLine = unlockLine(nextWorld.name, wv.minutesToComplete, nm.mission.title);
    next = { mission: nm.mission, worldName: w.name, reasons: nm.reasons, unlocksLine };
  }

  const passedAttempts = repo.allPassedAttempts(db).filter((a) => a.mode === "mission");
  const linesOfCode = passedAttempts.reduce((n, a) => n + (a.finalCode?.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length ?? 0), 0);
  const independent = passedAttempts.filter((a) => a.hintsUsed === 0).length;
  const avgHints = passedAttempts.length ? passedAttempts.reduce((n, a) => n + a.hintsUsed, 0) / passedAttempts.length : 0;

  const reviewsDue = reviews
    .filter((r) => new Date(r.nextReviewAt) <= now)
    .map((r) => {
      const m = getMission(r.missionId);
      return { id: r.id, skillId: r.skillId, skillName: getSkill(r.skillId).name, missionId: r.missionId, missionTitle: m?.title ?? r.missionId, worldName: worlds.find((w) => w.id === m?.worldId)?.name ?? "", overdueDays: Math.floor(daysOverdue(r.nextReviewAt, now)) };
    })
    .sort((a, b) => b.overdueDays - a.overdueDays);

  const firstDue = reviewsDue[0];
  const maintenanceLine = firstDue ? repairLine(firstDue.worldName, firstDue.skillName, 3) : null;

  return {
    now: now.toISOString(),
    profile: { displayName: profile.displayName, xp: profile.xp, streakDays: profile.streakDays, lastActiveAt: profile.lastActiveAt, lastWorldId: profile.lastWorldId, settings: profile.settings },
    overallPct: overallOperational(computed.values()),
    worlds: worldViews, skills: skillViews, briefing, next, artifacts,
    events: repo.recentEvents(8, db).map((e) => ({ id: e.id, type: e.type, title: e.title, createdAt: e.createdAt })),
    reviewsDue,
    stats: { linesOfCode, missionsPassed: passedIds.size, artifactsBuilt: artifactRows.size, toolsUnlocked: skillViews.filter((s) => s.timesPracticed > 0).length, independentSolves: independent, avgHints: Math.round(avgHints * 10) / 10 },
    maintenanceLine,
  };
}
