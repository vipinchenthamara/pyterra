/** Spaced review scheduling (PRD §11): 1, 3, 7, 14, 30 days, adapted by performance and mastery. */
import { clamp } from "./mastery";

export const LADDER_DAYS = [1, 3, 7, 14, 30] as const;

export interface ReviewOutcome {
  passed: boolean;
  hintsUsed: number;
}

/** Next ladder index after a review outcome. */
export function nextIntervalIdx(current: number, outcome: ReviewOutcome): number {
  if (!outcome.passed) return Math.max(0, current - 1);
  if (outcome.hintsUsed <= 1) return Math.min(LADDER_DAYS.length - 1, current + 1);
  return current;
}

/** Ease multiplier from mastery: 0.7 (weak) .. 1.5 (strong). */
export function easeFor(masteryScore: number): number {
  return clamp(1 + (masteryScore - 50) / 100, 0.7, 1.5);
}

export function scheduleReview(now: Date, intervalIdx: number, masteryScore: number): Date {
  const days = LADDER_DAYS[clamp(intervalIdx, 0, LADDER_DAYS.length - 1)] * easeFor(masteryScore);
  return new Date(now.getTime() + days * 86_400_000);
}

export function isDue(nextReviewAt: string | null | undefined, now: Date): boolean {
  return !!nextReviewAt && new Date(nextReviewAt).getTime() <= now.getTime();
}

export function daysOverdue(nextReviewAt: string | null | undefined, now: Date): number {
  if (!nextReviewAt) return 0;
  return Math.max(0, (now.getTime() - new Date(nextReviewAt).getTime()) / 86_400_000);
}
