/** Thin, typed data access. Route handlers call these; they never touch Drizzle directly. */
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb, type Db } from "./client";
import {
  LEARNER_ID,
  artifacts,
  codeAutosave,
  events,
  learnerProfile,
  missionAttempts,
  reviewItems,
  skillState,
  tutorInteractions,
  worldState,
  type LearnerProfileRow,
  type LearnerSettings,
  type MissionAttemptRow,
  type SkillStateRow,
} from "./schema";
import { newId, nowIso } from "@/lib/ids";

export const DEFAULT_SETTINGS: LearnerSettings = {
  domain: "security",
  defaultSessionMinutes: 15,
  theme: "dark",
  tutorEnabled: true,
  dailyTokenBudget: 200_000,
  notes: {},
  arrivedWorlds: [],
  onboarded: false,
};

export function ensureProfile(db: Db = getDb()): LearnerProfileRow {
  const existing = db.select().from(learnerProfile).where(eq(learnerProfile.id, LEARNER_ID)).get();
  if (existing) return existing;
  const row = { id: LEARNER_ID, displayName: "Architect", xp: 0, streakDays: 0, lastActiveAt: null, lastWorldId: null, createdAt: nowIso(), settings: DEFAULT_SETTINGS };
  db.insert(learnerProfile).values(row).run();
  return db.select().from(learnerProfile).where(eq(learnerProfile.id, LEARNER_ID)).get()!;
}

export function updateProfile(patch: Partial<Pick<LearnerProfileRow, "displayName" | "xp" | "streakDays" | "lastActiveAt" | "lastWorldId" | "settings">>, db: Db = getDb()) {
  db.update(learnerProfile).set(patch).where(eq(learnerProfile.id, LEARNER_ID)).run();
}

/** Soft streak: consecutive days with activity. Never punishes; a gap just restarts at 1. */
export function touchActivity(now: Date, db: Db = getDb()): LearnerProfileRow {
  const p = ensureProfile(db);
  const today = now.toISOString().slice(0, 10);
  const last = p.lastActiveAt?.slice(0, 10);
  let streak = p.streakDays;
  if (last !== today) {
    const yesterday = new Date(now.getTime() - 86_400_000).toISOString().slice(0, 10);
    streak = last === yesterday ? p.streakDays + 1 : 1;
  }
  updateProfile({ lastActiveAt: now.toISOString(), streakDays: streak }, db);
  return { ...p, lastActiveAt: now.toISOString(), streakDays: streak };
}

export function markArrived(worldId: string, db: Db = getDb()) {
  const p = ensureProfile(db);
  const arrived = new Set(p.settings.arrivedWorlds ?? []);
  if (arrived.has(worldId)) return;
  arrived.add(worldId);
  updateProfile({ settings: { ...p.settings, arrivedWorlds: [...arrived] } }, db);
  addEvent("arrival", `You entered a new district`, { worldId }, db);
}
export function hasArrived(worldId: string, db: Db = getDb()): boolean {
  return (ensureProfile(db).settings.arrivedWorlds ?? []).includes(worldId);
}

// Attempts -------------------------------------------------------------------
export function startAttempt(input: { missionId: string; missionVersion: number; mode?: "mission" | "review"; reviewItemId?: string }, db: Db = getDb()): MissionAttemptRow {
  const active = db
    .select()
    .from(missionAttempts)
    .where(and(eq(missionAttempts.learnerId, LEARNER_ID), eq(missionAttempts.missionId, input.missionId), eq(missionAttempts.status, "active"), eq(missionAttempts.mode, input.mode ?? "mission")))
    .orderBy(desc(missionAttempts.startedAt))
    .get();
  if (active) return active;
  const id = newId("att");
  db.insert(missionAttempts)
    .values({ id, learnerId: LEARNER_ID, missionId: input.missionId, missionVersion: input.missionVersion, mode: input.mode ?? "mission", reviewItemId: input.reviewItemId ?? null, status: "active", startedAt: nowIso() })
    .run();
  return db.select().from(missionAttempts).where(eq(missionAttempts.id, id)).get()!;
}

export function getAttempt(id: string, db: Db = getDb()): MissionAttemptRow | undefined {
  return db.select().from(missionAttempts).where(eq(missionAttempts.id, id)).get();
}

export function updateAttempt(id: string, patch: Partial<MissionAttemptRow>, db: Db = getDb()) {
  db.update(missionAttempts).set(patch).where(eq(missionAttempts.id, id)).run();
}

export function passedMissionIds(db: Db = getDb()): Set<string> {
  const rows = db
    .select({ missionId: missionAttempts.missionId })
    .from(missionAttempts)
    .where(and(eq(missionAttempts.learnerId, LEARNER_ID), eq(missionAttempts.status, "passed"), eq(missionAttempts.mode, "mission")))
    .all();
  return new Set(rows.map((r) => r.missionId));
}

export function attemptsForMission(missionId: string, db: Db = getDb()): MissionAttemptRow[] {
  return db.select().from(missionAttempts).where(and(eq(missionAttempts.learnerId, LEARNER_ID), eq(missionAttempts.missionId, missionId))).orderBy(desc(missionAttempts.startedAt)).all();
}

export function allPassedAttempts(db: Db = getDb()): MissionAttemptRow[] {
  return db.select().from(missionAttempts).where(and(eq(missionAttempts.learnerId, LEARNER_ID), eq(missionAttempts.status, "passed"))).orderBy(desc(missionAttempts.completedAt)).all();
}

// Autosave -------------------------------------------------------------------
export function saveCode(missionId: string, code: string, db: Db = getDb()) {
  db.insert(codeAutosave)
    .values({ learnerId: LEARNER_ID, missionId, code, updatedAt: nowIso() })
    .onConflictDoUpdate({ target: [codeAutosave.learnerId, codeAutosave.missionId], set: { code, updatedAt: nowIso() } })
    .run();
}
export function loadCode(missionId: string, db: Db = getDb()): string | undefined {
  return db.select().from(codeAutosave).where(and(eq(codeAutosave.learnerId, LEARNER_ID), eq(codeAutosave.missionId, missionId))).get()?.code;
}
export function clearCode(missionId: string, db: Db = getDb()) {
  db.delete(codeAutosave).where(and(eq(codeAutosave.learnerId, LEARNER_ID), eq(codeAutosave.missionId, missionId))).run();
}

// Skill state ----------------------------------------------------------------
export function allSkillStates(db: Db = getDb()): SkillStateRow[] {
  return db.select().from(skillState).where(eq(skillState.learnerId, LEARNER_ID)).all();
}
export function upsertSkillState(row: Omit<SkillStateRow, "learnerId">, db: Db = getDb()) {
  const { skillId, ...rest } = row;
  db.insert(skillState)
    .values({ learnerId: LEARNER_ID, skillId, ...rest })
    .onConflictDoUpdate({ target: [skillState.learnerId, skillState.skillId], set: rest })
    .run();
}

// World state (materialised cache) -------------------------------------------
export function upsertWorldState(row: { worldId: string; operationalPct: number; layers: Record<string, number>; stats: Record<string, number>; unlocked: boolean }, db: Db = getDb()) {
  const { worldId, ...rest } = row;
  db.insert(worldState)
    .values({ learnerId: LEARNER_ID, worldId, ...rest, updatedAt: nowIso() })
    .onConflictDoUpdate({ target: [worldState.learnerId, worldState.worldId], set: { ...rest, updatedAt: nowIso() } })
    .run();
}
export function allWorldStates(db: Db = getDb()) {
  return db.select().from(worldState).where(eq(worldState.learnerId, LEARNER_ID)).all();
}

// Artifacts ------------------------------------------------------------------
export function allArtifactRows(db: Db = getDb()) {
  return db.select().from(artifacts).where(eq(artifacts.learnerId, LEARNER_ID)).all();
}
export function unlockArtifact(row: { artifactId: string; worldId: string; sourceMissionId: string; code: Record<string, string> }, db: Db = getDb()) {
  db.insert(artifacts)
    .values({ learnerId: LEARNER_ID, ...row, unlockedAt: nowIso() })
    .onConflictDoNothing()
    .run();
}

// Reviews --------------------------------------------------------------------
export function allReviews(db: Db = getDb()) {
  return db.select().from(reviewItems).where(eq(reviewItems.learnerId, LEARNER_ID)).all();
}
export function getReview(id: string, db: Db = getDb()) {
  return db.select().from(reviewItems).where(eq(reviewItems.id, id)).get();
}
export function reviewForSkillMission(skillId: string, missionId: string, db: Db = getDb()) {
  return db.select().from(reviewItems).where(and(eq(reviewItems.learnerId, LEARNER_ID), eq(reviewItems.skillId, skillId), eq(reviewItems.missionId, missionId))).get();
}
export function createReview(row: { skillId: string; missionId: string; intervalIdx: number; nextReviewAt: string }, db: Db = getDb()) {
  const id = newId("rev");
  db.insert(reviewItems).values({ id, learnerId: LEARNER_ID, ...row, reviewsDone: 0, createdAt: nowIso() }).run();
  return id;
}
export function updateReview(id: string, patch: { intervalIdx?: number; nextReviewAt?: string; lastResult?: "pass" | "fail"; reviewsDone?: number }, db: Db = getDb()) {
  db.update(reviewItems).set(patch).where(eq(reviewItems.id, id)).run();
}
export function dueReviews(now: Date, db: Db = getDb()) {
  return db.select().from(reviewItems).where(and(eq(reviewItems.learnerId, LEARNER_ID), lte(reviewItems.nextReviewAt, now.toISOString()))).all();
}

// Tutor ----------------------------------------------------------------------
export function addTutorInteraction(row: { attemptId?: string | null; missionId?: string | null; role: "user" | "tutor"; mode: string; content: string; hintLevel?: number | null; provider: string; tokensIn?: number; tokensOut?: number }, db: Db = getDb()) {
  const id = newId("tut");
  db.insert(tutorInteractions).values({ id, learnerId: LEARNER_ID, createdAt: nowIso(), tokensIn: 0, tokensOut: 0, attemptId: null, missionId: null, hintLevel: null, ...row }).run();
  return id;
}
export function tutorHistory(attemptId: string | null | undefined, limit = 12, db: Db = getDb()) {
  if (!attemptId) return [];
  return db.select().from(tutorInteractions).where(eq(tutorInteractions.attemptId, attemptId)).orderBy(desc(tutorInteractions.createdAt)).limit(limit).all().reverse();
}
export function tutorTokensToday(now: Date, db: Db = getDb()): number {
  const start = now.toISOString().slice(0, 10) + "T00:00:00.000Z";
  const r = db
    .select({ total: sql<number>`coalesce(sum(${tutorInteractions.tokensIn} + ${tutorInteractions.tokensOut}), 0)` })
    .from(tutorInteractions)
    .where(and(eq(tutorInteractions.learnerId, LEARNER_ID), gte(tutorInteractions.createdAt, start)))
    .get();
  return Number(r?.total ?? 0);
}

// Events ---------------------------------------------------------------------
export function addEvent(type: string, title: string, payload: Record<string, unknown> = {}, db: Db = getDb()) {
  db.insert(events).values({ id: newId("evt"), learnerId: LEARNER_ID, type, title, payload, createdAt: nowIso() }).run();
}
export function recentEvents(limit = 8, db: Db = getDb()) {
  return db.select().from(events).where(eq(events.learnerId, LEARNER_ID)).orderBy(desc(events.createdAt)).limit(limit).all();
}

// Reset / export -------------------------------------------------------------
export function resetEverything(db: Db = getDb()) {
  for (const t of [events, tutorInteractions, reviewItems, artifacts, worldState, skillState, codeAutosave, missionAttempts]) db.delete(t).run();
  db.delete(learnerProfile).where(eq(learnerProfile.id, LEARNER_ID)).run();
}
export function resetMission(missionId: string, db: Db = getDb()) {
  db.delete(missionAttempts).where(and(eq(missionAttempts.learnerId, LEARNER_ID), eq(missionAttempts.missionId, missionId))).run();
  clearCode(missionId, db);
}
export function exportAll(db: Db = getDb()) {
  return {
    schemaVersion: 1,
    exportedAt: nowIso(),
    profile: ensureProfile(db),
    attempts: db.select().from(missionAttempts).where(eq(missionAttempts.learnerId, LEARNER_ID)).all(),
    autosave: db.select().from(codeAutosave).where(eq(codeAutosave.learnerId, LEARNER_ID)).all(),
    skills: allSkillStates(db),
    worlds: allWorldStates(db),
    artifacts: allArtifactRows(db),
    reviews: allReviews(db),
    events: db.select().from(events).where(eq(events.learnerId, LEARNER_ID)).all(),
  };
}
