import { describe, expect, it } from "vitest";
import { applyCompletion, applyReview, effectiveSkill, emptySkillState, health, mastery } from "./mastery";
import { easeFor, nextIntervalIdx, scheduleReview, isDue } from "./spaced";
import { computeAllWorlds, computeWorld, overallOperational, visualState } from "./worldState";
import { buildBriefing, candidateMissions, learnerLevel, nextMission } from "./recommend";
import { coachError } from "./errorCoach";
import { MissionSchema, WorldSchema, type Mission, type World } from "@content/schema";

const now = new Date("2026-09-12T10:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

describe("mastery", () => {
  it("rewards independent success more than hint-heavy success", () => {
    const clean = applyCompletion(emptySkillState("sets"), { hintsUsed: 0, runs: 1, role: "primary" }, now);
    const hinted = applyCompletion(emptySkillState("sets"), { hintsUsed: 5, runs: 8, role: "primary" }, now);
    expect(mastery(clean)).toBeGreaterThan(mastery(hinted));
    expect(clean.independence).toBeGreaterThan(hinted.independence);
    expect(clean.timesPracticed).toBe(1);
    expect(clean.recall).toBeGreaterThan(0);
  });
  it("gives secondary skills half the delta", () => {
    const p = applyCompletion(emptySkillState("a"), { hintsUsed: 0, runs: 1, role: "primary" }, now);
    const s = applyCompletion(emptySkillState("a"), { hintsUsed: 0, runs: 1, role: "secondary" }, now);
    expect(s.application).toBeCloseTo(p.application / 2, 5);
  });
  it("decays recall after three idle days, computed on read", () => {
    const st = { ...applyCompletion(emptySkillState("a"), { hintsUsed: 0, runs: 1, role: "primary" }, now), recall: 50 };
    expect(effectiveSkill(st, days(2)).recall).toBe(50);
    expect(effectiveSkill(st, days(10)).recall).toBe(43);
    expect(st.recall).toBe(50);
  });
  it("labels health", () => {
    expect(health(emptySkillState("a"), now)).toBe("dormant");
    const weak = applyCompletion(emptySkillState("a"), { hintsUsed: 6, runs: 9, role: "primary" }, now);
    expect(health(weak, now)).toBe("fragile");
    const strong = { ...emptySkillState("a"), understanding: 90, recall: 90, application: 90, independence: 90, timesPracticed: 5, reviewsDone: 3, intervalIdx: 3 };
    expect(health(strong, now)).toBe("mastered");
    expect(health({ ...strong, reviewsDone: 1 }, now)).toBe("stable");
    expect(health({ ...strong, nextReviewAt: days(-8).toISOString() }, now)).toBe("fragile");
  });
  it("reviews move recall", () => {
    const st = { ...emptySkillState("a"), recall: 40, timesPracticed: 1 };
    expect(applyReview(st, { passed: true, hintsUsed: 0 }, now).recall).toBe(55);
    expect(applyReview(st, { passed: false, hintsUsed: 0 }, now).recall).toBe(25);
  });
});

describe("spaced", () => {
  it("moves along the ladder by outcome", () => {
    expect(nextIntervalIdx(0, { passed: true, hintsUsed: 0 })).toBe(1);
    expect(nextIntervalIdx(2, { passed: true, hintsUsed: 3 })).toBe(2);
    expect(nextIntervalIdx(2, { passed: false, hintsUsed: 0 })).toBe(1);
    expect(nextIntervalIdx(4, { passed: true, hintsUsed: 0 })).toBe(4);
  });
  it("scales by ease", () => {
    expect(easeFor(50)).toBe(1);
    expect(easeFor(0)).toBe(0.7);
    expect(easeFor(100)).toBe(1.5);
    const d = scheduleReview(now, 0, 50);
    expect(d.getTime() - now.getTime()).toBe(86_400_000);
    expect(isDue(d.toISOString(), days(2))).toBe(true);
    expect(isDue(d.toISOString(), now)).toBe(false);
  });
});

const world: World = WorldSchema.parse({
  id: "w", order: 1, name: "W", codename: "W1", tagline: "t", arrivalScene: "a", builds: "b", accent: "cyan", status: "authored",
  skillIds: ["variables"], scene: { layers: [{ id: "l1", kind: "building", label: "L1", maxLevel: 2 }, { id: "l2", kind: "light", label: "L2" }] },
});
const world2: World = WorldSchema.parse({ ...world, id: "w2", order: 2, unlockedBy: ["w"] });
const mk = (id: string, extra: Partial<Mission> = {}): Mission =>
  MissionSchema.parse({
    id, version: 1, worldId: "w", order: 1, title: id, codename: id, kind: "build", difficulty: 1, estimatedMinutes: 5,
    skills: [{ id: "variables", role: "primary" }], briefing: "b", objective: "o", starterCode: "x", referenceSolution: "y",
    tests: { visible: "def test_a(): pass", hidden: "def test_b(): pass" }, hints: ["1".repeat(21), "2".repeat(21), "3".repeat(21), "4".repeat(21), "5".repeat(21), "6".repeat(21)],
    onComplete: [{ kind: "layer", layer: "l1", level: 1 }], ...extra,
  });
const m1 = mk("m1");
const m2 = mk("m2", { order: 2, prerequisites: ["m1"], onComplete: [{ kind: "layer", layer: "l1", level: 2 }, { kind: "stat", stat: "power", add: 10 }] });
const boss = mk("boss", { order: 3, kind: "boss", weight: 3, prerequisites: ["m1", "m2"], onComplete: [{ kind: "layer", layer: "l2", level: 1 }] });
const m3 = mk("m3", { worldId: "w2" });
const missions = [m1, m2, boss, m3];
const missionsFor = (id: string) => missions.filter((m) => m.worldId === id);

describe("worldState", () => {
  it("derives layers, stats and weighted percent", () => {
    const c = computeWorld(world, missionsFor("w"), new Set(["m1", "m2"]), true);
    expect(c.operationalPct).toBe(40);
    expect(c.layers).toEqual({ l1: 2, l2: 0 });
    expect(c.stats).toEqual({ power: 10 });
    expect(c.bossPassed).toBe(false);
    const done = computeWorld(world, missionsFor("w"), new Set(["m1", "m2", "boss"]), true);
    expect(done.operationalPct).toBe(100);
    expect(done.bossPassed).toBe(true);
  });
  it("unlocks dependent worlds only at 100%", () => {
    const partial = computeAllWorlds([world, world2], missionsFor, new Set(["m1"]));
    expect(partial.get("w2")!.unlocked).toBe(false);
    const full = computeAllWorlds([world, world2], missionsFor, new Set(["m1", "m2", "boss"]));
    expect(full.get("w2")!.unlocked).toBe(true);
    expect(overallOperational(full.values())).toBe(50);
    expect(visualState(full.get("w")!, false, false)).toBe("complete");
    expect(visualState(full.get("w")!, true, false)).toBe("unstable");
    expect(visualState(partial.get("w2")!, false, false)).toBe("locked");
  });
});

describe("recommend", () => {
  const base = () => ({
    now, worlds: [world, world2], missions, computed: computeAllWorlds([world, world2], missionsFor, new Set(["m1"])),
    passedIds: new Set(["m1"]), skillStates: new Map(), reviews: [], lastWorldId: "w",
  });
  it("recommends the next unlocked, unpassed mission", () => {
    const n = nextMission(base());
    expect(n?.mission.id).toBe("m2");
    expect(candidateMissions(base()).map((c) => c.mission.id)).toEqual(["m2"]);
  });
  it("respects the session length filter", () => {
    expect(nextMission({ ...base(), sessionMinutes: 4 })).toBeUndefined();
  });
  it("builds a briefing with reviews first", () => {
    const st = applyCompletion(emptySkillState("variables"), { hintsUsed: 6, runs: 9, role: "primary" }, now);
    const cards = buildBriefing({
      ...base(), streakDays: 3, artifacts: [{ id: "art", worldId: "w", unlockedBy: ["m1", "m2"] }], unlockedArtifactIds: new Set(),
      skillStates: new Map([["variables", st]]),
      reviews: [{ id: "r1", skillId: "variables", missionId: "m1", nextReviewAt: days(-2).toISOString() }],
    });
    expect(cards.map((c) => c.kind)).toEqual(["review", "mission", "fragile", "artifact", "streak"]);
    expect(cards[0]).toMatchObject({ kind: "review", overdueDays: 2 });
    expect(cards[3]).toMatchObject({ kind: "artifact", missionId: "m2" });
  });
  it("derives learner level", () => {
    expect(learnerLevel([], now)).toBe(1);
    expect(learnerLevel([{ ...emptySkillState("a"), understanding: 80, recall: 80, application: 80, independence: 80, timesPracticed: 1 }], now)).toBe(4);
  });
});

describe("errorCoach", () => {
  it("prefers mission rules, falls back to generic, then to a default", () => {
    const tb = 'Traceback (most recent call last):\n  File "<solution>", line 2, in <module>\nTypeError: can only concatenate str (not "int") to str';
    const m = coachError(tb, "TypeError", 2, [{ match: "can only concatenate str", title: "Custom", explanation: "custom" }]);
    expect(m.source).toBe("mission");
    const g = coachError(tb, "TypeError", 2, []);
    expect(g.source).toBe("generic");
    expect(g.title).toMatch(/Text and numbers/);
    const d = coachError("WeirdError: nope", "WeirdError", 1, []);
    expect(d.title).toContain("WeirdError");
    expect(coachError(null, null, null).source).toBe("none");
  });
});
