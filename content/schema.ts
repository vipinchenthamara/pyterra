/**
 * Content schema — the single source of truth for worlds, missions, skills and artifacts.
 * Everything in `content/` is validated against these schemas at import time (see registry.ts).
 * Adding a mission = one new file + one line in its world's index.ts. No app code changes.
 */
import { z } from "zod";

export const Id = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, "ids are lowercase kebab-case");

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------
export const SkillDomain = z.enum([
  "core",
  "data",
  "control",
  "functions",
  "errors",
  "files",
  "network",
  "oop",
  "runtime",
  "async",
  "services",
  "deploy",
  "ai",
]);

export const SkillSchema = z.object({
  id: Id,
  name: z.string().min(1),
  domain: SkillDomain,
  /** One-line mental model, e.g. "Set = uniqueness". Shown as a memory anchor. */
  anchor: z.string().min(1),
  description: z.string().min(1),
  prerequisites: z.array(Id).default([]),
});

// ---------------------------------------------------------------------------
// World scene (procedural SVG layers)
// ---------------------------------------------------------------------------
export const SceneLayerKind = z.enum([
  "ground",
  "building",
  "light",
  "drone",
  "dataflow",
  "sign",
  "spire",
  "shield",
]);

export const SceneLayerSchema = z.object({
  id: Id,
  kind: SceneLayerKind,
  /** Human label used in the "what you will build" ghost preview. */
  label: z.string().min(1),
  maxLevel: z.number().int().min(1).default(1),
});

// ---------------------------------------------------------------------------
// Artifacts (persistent builds shown in the Builds gallery)
// ---------------------------------------------------------------------------
export const ArtifactDefSchema = z.object({
  id: Id,
  name: z.string().min(1),
  description: z.string().min(1),
  /** lucide icon name, e.g. "database" */
  icon: z.string().min(1),
  /** Mission ids that must all be passed for this artifact to unlock. */
  unlockedBy: z.array(Id).min(1),
  architectureNotes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Worlds
// ---------------------------------------------------------------------------
export const WorldAccent = z.enum([
  "cyan",
  "violet",
  "amber",
  "emerald",
  "rose",
  "orange",
  "sky",
]);

export const WorldSchema = z.object({
  id: Id,
  order: z.number().int().min(1),
  name: z.string().min(1),
  /** Short code shown on the map, e.g. "W2". */
  codename: z.string().min(1),
  tagline: z.string().min(1),
  /** Why this world needs the capability. Shown on arrival. 2–4 sentences. */
  arrivalScene: z.string().min(1),
  /** One line: what the learner builds here. */
  builds: z.string().min(1),
  quote: z.string().optional(),
  accent: WorldAccent,
  status: z.enum(["authored", "locked-preview"]),
  /** World ids that must be 100% operational before this world unlocks. */
  unlockedBy: z.array(Id).default([]),
  skillIds: z.array(Id).min(1),
  scene: z.object({ layers: z.array(SceneLayerSchema).min(1) }),
  artifacts: z.array(ArtifactDefSchema).default([]),
});

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------
export const MissionKind = z.enum([
  "build",
  "fix-bug",
  "predict",
  "fill-gap",
  "choose-tool",
  "refactor",
  "boss",
]);

export const WorldStateDeltaSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("layer"), layer: Id, level: z.number().int().min(1) }),
  z.object({ kind: z.literal("stat"), stat: z.string().min(1), add: z.number() }),
]);

/** Six-level hint ladder (PRD §10). Level 6 is only revealed after explicit confirmation. */
export const HintLadderSchema = z.tuple([
  z.string().min(1), // 1 conceptual nudge
  z.string().min(1), // 2 point to concept / data structure
  z.string().min(1), // 3 tiny unrelated example
  z.string().min(1), // 4 shape / pseudocode
  z.string().min(1), // 5 partial code
  z.string().min(1), // 6 complete walkthrough
]);

export const TestSuiteSchema = z.object({
  /** Python source. Defines test_* functions using `solution.<name>` and `check(cond, message)`. */
  visible: z.string().min(1),
  hidden: z.string().min(1),
});

export const ErrorExplanationSchema = z.object({
  /** Regex source matched against the traceback text. */
  match: z.string().min(1),
  title: z.string().min(1),
  explanation: z.string().min(1),
});

/** A fresh-context re-run of the mission used by spaced review (PRD §11: reuse the concept, not the question). */
export const ReviewVariantSchema = z.object({
  briefing: z.string().min(1),
  objective: z.string().min(1),
  starterCode: z.string().min(1),
  /** Tutor-only. Never sent to the browser. */
  referenceSolution: z.string().min(1),
  tests: TestSuiteSchema,
});

export const ExplainWhySchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(4),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
});

export const MissionSchema = z.object({
  id: Id,
  version: z.number().int().min(1),
  worldId: Id,
  order: z.number().int().min(1),
  title: z.string().min(1),
  /** e.g. "DV-02" */
  codename: z.string().min(1),
  kind: MissionKind,
  difficulty: z.number().int().min(1).max(5),
  /** Contribution to the world's operational %. Bosses usually weigh more. */
  weight: z.number().positive().default(1),
  estimatedMinutes: z.number().int().min(1),
  skills: z
    .array(z.object({ id: Id, role: z.enum(["primary", "secondary"]) }))
    .min(1),
  /** Mission ids that must be passed first. */
  prerequisites: z.array(Id).default([]),
  /** The world problem, in narrative form. 2–5 sentences. Never starts with a definition. */
  briefing: z.string().min(1),
  /** Precise statement of what the code must do. */
  objective: z.string().min(1),
  /** Optional PREDICT step shown before the first run. */
  predictPrompt: z.string().optional(),
  starterCode: z.string().min(1),
  /** Tutor-only. Never sent to the browser. */
  referenceSolution: z.string().min(1),
  tests: TestSuiteSchema,
  hints: HintLadderSchema,
  errorExplanations: z.array(ErrorExplanationSchema).default([]),
  /** Skill ids whose anchors are shown in the Concept card. */
  anchors: z.array(Id).default([]),
  explainWhy: ExplainWhySchema.optional(),
  reviewVariant: ReviewVariantSchema.optional(),
  timeoutMs: z.number().int().min(500).max(30000).default(5000),
  onComplete: z.array(WorldStateDeltaSchema).min(1),
  /** Artifact ids (declared on the world) this mission contributes to. */
  artifacts: z.array(Id).default([]),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type Skill = z.infer<typeof SkillSchema>;
export type SkillInput = z.input<typeof SkillSchema>;
export type SceneLayer = z.infer<typeof SceneLayerSchema>;
export type ArtifactDef = z.infer<typeof ArtifactDefSchema>;
export type World = z.infer<typeof WorldSchema>;
export type WorldInput = z.input<typeof WorldSchema>;
export type Mission = z.infer<typeof MissionSchema>;
export type MissionInput = z.input<typeof MissionSchema>;
export type MissionKindT = z.infer<typeof MissionKind>;
export type WorldStateDelta = z.infer<typeof WorldStateDeltaSchema>;
export type HintLadder = z.infer<typeof HintLadderSchema>;
export type ErrorExplanation = z.infer<typeof ErrorExplanationSchema>;
export type ReviewVariant = z.infer<typeof ReviewVariantSchema>;

/** Mission shape that is safe to send to the browser (no reference solutions). */
export type ClientMission = Omit<Mission, "referenceSolution" | "reviewVariant"> & { hasReviewVariant: boolean };

export function toClientMission(m: Mission): ClientMission {
  const { referenceSolution: _omit, reviewVariant, ...rest } = m;
  void _omit;
  return { ...rest, hasReviewVariant: !!reviewVariant };
}

/** The mission as the learner sees it during a review: variant fields swapped in when authored. */
export function toReviewMission(m: Mission): Mission {
  if (!m.reviewVariant) return m;
  const v = m.reviewVariant;
  return { ...m, briefing: v.briefing, objective: v.objective, starterCode: v.starterCode, referenceSolution: v.referenceSolution, tests: v.tests };
}
