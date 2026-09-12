/**
 * Skill mastery in four dimensions (PRD §11). Pure functions; the DB layer persists the results.
 * All dimensions are 0–100. Missions move understanding/application/independence; reviews move recall.
 */

export interface SkillDims {
  understanding: number;
  recall: number;
  application: number;
  independence: number;
}

export interface SkillStateLike extends SkillDims {
  skillId: string;
  timesPracticed: number;
  reviewsDone: number;
  intervalIdx: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
}

export type SkillHealth = "dormant" | "fragile" | "developing" | "stable" | "mastered";

export const EMPTY_DIMS: SkillDims = { understanding: 0, recall: 0, application: 0, independence: 0 };

export function emptySkillState(skillId: string): SkillStateLike {
  return { skillId, ...EMPTY_DIMS, timesPracticed: 0, reviewsDone: 0, intervalIdx: 0, lastPracticedAt: null, nextReviewAt: null };
}

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export interface CompletionSignal {
  hintsUsed: number;
  runs: number;
  role: "primary" | "secondary";
  /** Difficulty 1–5 scales gains slightly (harder = more evidence). */
  difficulty?: number;
}

/** Dimension deltas for one mission completion. Secondary skills receive half. */
export function completionDeltas(sig: CompletionSignal): SkillDims {
  const p = clamp(1 - 0.15 * sig.hintsUsed, 0.1, 1);
  const diff = 0.85 + 0.15 * clamp(sig.difficulty ?? 2, 1, 5) / 2; // 0.93 .. 1.23
  const independence = sig.hintsUsed === 0 ? 20 : sig.hintsUsed <= 2 ? 8 : sig.hintsUsed <= 4 ? 0 : -5;
  const understanding = 10 * p + (sig.runs <= 3 ? 5 : 0);
  const application = 20 * p;
  const scale = (sig.role === "secondary" ? 0.5 : 1) * diff;
  return {
    understanding: understanding * scale,
    recall: 0,
    application: application * scale,
    independence: independence * scale,
  };
}

export function applyCompletion(state: SkillStateLike, sig: CompletionSignal, now: Date): SkillStateLike {
  const d = completionDeltas(sig);
  return {
    ...state,
    understanding: clamp(state.understanding + d.understanding),
    application: clamp(state.application + d.application),
    independence: clamp(state.independence + d.independence),
    // First demonstration seeds recall so the skill is not "dormant" for review purposes.
    recall: state.timesPracticed === 0 ? clamp(Math.max(state.recall, 30)) : state.recall,
    timesPracticed: state.timesPracticed + 1,
    lastPracticedAt: now.toISOString(),
  };
}

export interface ReviewSignal {
  passed: boolean;
  hintsUsed: number;
}

export function applyReview(state: SkillStateLike, sig: ReviewSignal, now: Date): SkillStateLike {
  const delta = !sig.passed ? -15 : sig.hintsUsed === 0 ? 15 : 5;
  return {
    ...state,
    recall: clamp(state.recall + delta),
    independence: clamp(state.independence + (sig.passed && sig.hintsUsed === 0 ? 4 : sig.passed ? 0 : -4)),
    reviewsDone: state.reviewsDone + 1,
    timesPracticed: state.timesPracticed + 1,
    lastPracticedAt: now.toISOString(),
  };
}

const DAY_MS = 86_400_000;

/** Recall decays 1 point/day after 3 idle days. Computed on read, never stored. */
export function effectiveSkill(state: SkillStateLike, now: Date): SkillStateLike {
  if (!state.lastPracticedAt) return state;
  const idleDays = (now.getTime() - new Date(state.lastPracticedAt).getTime()) / DAY_MS;
  const decay = Math.max(0, Math.floor(idleDays - 3));
  return decay > 0 ? { ...state, recall: clamp(state.recall - decay) } : state;
}

export function mastery(d: SkillDims): number {
  return Math.round(0.3 * d.understanding + 0.2 * d.recall + 0.3 * d.application + 0.2 * d.independence);
}

export function health(stateRaw: SkillStateLike, now: Date): SkillHealth {
  const state = effectiveSkill(stateRaw, now);
  if (state.timesPracticed === 0) return "dormant";
  const m = mastery(state);
  const overdueDays = state.nextReviewAt ? (now.getTime() - new Date(state.nextReviewAt).getTime()) / DAY_MS : 0;
  // Fragile = demonstrated more than once and still weak, or a repair is badly overdue.
  // A single clean first demonstration is "developing", never "fragile".
  if (overdueDays > 7) return "fragile";
  if (m < 40 && state.timesPracticed >= 2) return "fragile";
  if (m > 85 && state.reviewsDone >= 3 && state.intervalIdx >= 3) return "mastered";
  if (m >= 70) return "stable";
  return "developing";
}

export const HEALTH_LABEL: Record<SkillHealth, string> = {
  dormant: "Locked",
  fragile: "Needs practice",
  developing: "Developing",
  stable: "Stable",
  mastered: "Mastered",
};
