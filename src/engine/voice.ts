/** Product wording (PRD Appendix B): measurable, world-framed, never generic praise. */
import type { SkillHealth } from "./mastery";

export function operationalLine(pct: number): string {
  return `Your world is ${pct}% operational.`;
}

export function unlockLine(worldName: string, minutes: number, missionTitle: string): string {
  return `About ${minutes} minutes to unlock ${worldName}: ${missionTitle}.`;
}

export function completionStatement(opts: { hintsUsed: number; skillName: string; health: SkillHealth; runs: number }): string {
  const { hintsUsed, skillName, health, runs } = opts;
  const how = hintsUsed === 0 ? "without hints" : hintsUsed === 1 ? "with one hint" : `with ${hintsUsed} hints`;
  const runsText = runs === 1 ? "on the first run" : `in ${runs} runs`;
  const label = health === "fragile" ? "still fragile" : health === "developing" ? "developing" : health === "stable" ? "stable" : health === "mastered" ? "mastered" : "introduced";
  return `Solved ${how} ${runsText}. ${skillName} is now ${label}.`;
}

export function repairLine(worldName: string, skillName: string, minutes: number): string {
  return `${worldName} is degrading. A ${minutes}-minute repair will restore ${skillName.toLowerCase()} recall.`;
}

export function tensionLine(missionTitle: string, unlocks: string): string {
  return `One mission unlocks ${unlocks}: ${missionTitle}.`;
}
