/**
 * SQLite schema (Drizzle). Single learner today, but every table carries learner_id so nothing
 * needs rewriting later. Timestamps are ISO strings. JSON columns use text with mode "json".
 */
import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const LEARNER_ID = "me";

export interface LearnerSettings {
  domain: "security" | "cloud" | "ai" | "general";
  defaultSessionMinutes: 5 | 15 | 0; // 0 = deep
  theme: "dark";
  tutorEnabled: boolean;
  dailyTokenBudget: number;
  notes: Record<string, string>; // skillId -> personal note
  predictedOutputs?: Record<string, string>;
}

export const learnerProfile = sqliteTable("learner_profile", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  xp: integer("xp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastActiveAt: text("last_active_at"),
  lastWorldId: text("last_world_id"),
  createdAt: text("created_at").notNull(),
  settings: text("settings", { mode: "json" }).$type<LearnerSettings>().notNull(),
});

export const missionAttempts = sqliteTable(
  "mission_attempts",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    missionId: text("mission_id").notNull(),
    missionVersion: integer("mission_version").notNull(),
    /** "review" attempts re-run a passed mission from the review queue. */
    mode: text("mode").$type<"mission" | "review">().notNull().default("mission"),
    reviewItemId: text("review_item_id"),
    status: text("status").$type<"active" | "passed" | "failed" | "abandoned">().notNull().default("active"),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    runs: integer("runs").notNull().default(0),
    hintsUsed: integer("hints_used").notNull().default(0),
    maxHintLevel: integer("max_hint_level").notNull().default(0),
    durationMs: integer("duration_ms").notNull().default(0),
    finalCode: text("final_code"),
    predicted: text("predicted"),
    explainWhyCorrect: integer("explain_why_correct", { mode: "boolean" }),
    testSummary: text("test_summary", { mode: "json" }).$type<{ visiblePassed: number; visibleTotal: number; hiddenPassed: number; hiddenTotal: number }>(),
  },
  (t) => [index("attempts_mission_idx").on(t.learnerId, t.missionId), index("attempts_status_idx").on(t.learnerId, t.status)],
);

export const codeAutosave = sqliteTable(
  "code_autosave",
  {
    learnerId: text("learner_id").notNull(),
    missionId: text("mission_id").notNull(),
    code: text("code").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.learnerId, t.missionId] })],
);

export const skillState = sqliteTable(
  "skill_state",
  {
    learnerId: text("learner_id").notNull(),
    skillId: text("skill_id").notNull(),
    understanding: real("understanding").notNull().default(0),
    recall: real("recall").notNull().default(0),
    application: real("application").notNull().default(0),
    independence: real("independence").notNull().default(0),
    timesPracticed: integer("times_practiced").notNull().default(0),
    reviewsDone: integer("reviews_done").notNull().default(0),
    intervalIdx: integer("interval_idx").notNull().default(0),
    lastPracticedAt: text("last_practiced_at"),
    nextReviewAt: text("next_review_at"),
  },
  (t) => [primaryKey({ columns: [t.learnerId, t.skillId] })],
);

export const worldState = sqliteTable(
  "world_state",
  {
    learnerId: text("learner_id").notNull(),
    worldId: text("world_id").notNull(),
    operationalPct: integer("operational_pct").notNull().default(0),
    layers: text("layers", { mode: "json" }).$type<Record<string, number>>().notNull(),
    stats: text("stats", { mode: "json" }).$type<Record<string, number>>().notNull(),
    unlocked: integer("unlocked", { mode: "boolean" }).notNull().default(false),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.learnerId, t.worldId] })],
);

export const artifacts = sqliteTable(
  "artifacts",
  {
    learnerId: text("learner_id").notNull(),
    artifactId: text("artifact_id").notNull(),
    worldId: text("world_id").notNull(),
    unlockedAt: text("unlocked_at").notNull(),
    sourceMissionId: text("source_mission_id").notNull(),
    /** Learner code snapshots keyed by mission id, captured at unlock time. */
    code: text("code", { mode: "json" }).$type<Record<string, string>>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.learnerId, t.artifactId] })],
);

export const reviewItems = sqliteTable(
  "review_items",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    skillId: text("skill_id").notNull(),
    missionId: text("mission_id").notNull(),
    intervalIdx: integer("interval_idx").notNull().default(0),
    nextReviewAt: text("next_review_at").notNull(),
    lastResult: text("last_result").$type<"pass" | "fail">(),
    reviewsDone: integer("reviews_done").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("review_due_idx").on(t.learnerId, t.nextReviewAt)],
);

export const tutorInteractions = sqliteTable(
  "tutor_interactions",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    attemptId: text("attempt_id"),
    missionId: text("mission_id"),
    role: text("role").$type<"user" | "tutor">().notNull(),
    mode: text("mode").notNull(),
    content: text("content").notNull(),
    hintLevel: integer("hint_level"),
    provider: text("provider").notNull(),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("tutor_attempt_idx").on(t.attemptId), index("tutor_day_idx").on(t.learnerId, t.createdAt)],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    learnerId: text("learner_id").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    payload: text("payload", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("events_time_idx").on(t.learnerId, t.createdAt)],
);

export type LearnerProfileRow = typeof learnerProfile.$inferSelect;
export type MissionAttemptRow = typeof missionAttempts.$inferSelect;
export type SkillStateRow = typeof skillState.$inferSelect;
export type WorldStateRow = typeof worldState.$inferSelect;
export type ArtifactRow = typeof artifacts.$inferSelect;
export type ReviewItemRow = typeof reviewItems.$inferSelect;
export type TutorInteractionRow = typeof tutorInteractions.$inferSelect;
export type EventRow = typeof events.$inferSelect;
