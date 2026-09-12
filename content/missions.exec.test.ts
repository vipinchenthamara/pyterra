/**
 * Executes every authored mission in Pyodide:
 *  - starter code must load without a syntax error (runtime errors are allowed: fix-bug missions)
 *  - the reference solution must pass every visible and hidden test
 *  - the starter code must NOT already pass (otherwise the mission teaches nothing)
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadHarness, type HarnessRunner } from "@/engine/runner/nodeHarness";
import { missions } from "./registry";

let run: HarnessRunner;
beforeAll(async () => {
  run = await loadHarness();
});

describe.each(missions.map((m) => [m.id, m] as const))("mission %s", (_id, m) => {
  it("starter code has no syntax error", () => {
    const r = run(m.starterCode, m.tests);
    expect(r.errorType, r.error ?? "").not.toBe("SyntaxError");
  });
  it("starter code does not already pass", () => {
    const r = run(m.starterCode, m.tests);
    expect(r.passed).toBe(false);
  });
  it("reference solution passes all tests", () => {
    const r = run(m.referenceSolution, m.tests);
    const failures = [...r.visible.filter((t) => t.status !== "pass").map((t) => `${t.id}: ${t.message}`)];
    if (r.hidden.firstFailure) failures.push(`hidden: ${r.hidden.firstFailure}`);
    expect(r.executed, r.error ?? "").toBe(true);
    expect(failures, failures.join("\n")).toEqual([]);
    expect(r.passed).toBe(true);
  });
  it("review variant reference solution passes its own tests", () => {
    if (!m.reviewVariant) return;
    const r = run(m.reviewVariant.referenceSolution, m.reviewVariant.tests);
    expect(r.passed, r.hidden.firstFailure ?? r.error ?? "").toBe(true);
    expect(run(m.reviewVariant.starterCode, m.reviewVariant.tests).passed).toBe(false);
  });
  it("hint ladder and tests describe behaviour, not literal answers", () => {
    expect(m.hints.length).toBe(6);
    for (const [i, h] of m.hints.entries()) expect(h.length, `hint ${i + 1}`).toBeGreaterThan(20);
    expect(m.tests.visible).toMatch(/def test_/);
    expect(m.tests.hidden).toMatch(/def test_/);
  });
});
