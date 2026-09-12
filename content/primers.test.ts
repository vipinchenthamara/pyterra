/** Every primer note must run in Pyodide and print exactly its declared output. */
import { beforeAll, describe, expect, it } from "vitest";
import { loadHarness, type HarnessRunner } from "@/engine/runner/nodeHarness";
import { primers } from "./primers";

let run: HarnessRunner;
beforeAll(async () => {
  run = await loadHarness();
});

describe.each(Object.entries(primers))("primer %s", (_id, p) => {
  it("has 2–5 notes, an intro and a takeaway", () => {
    expect(p.notes.length).toBeGreaterThanOrEqual(2);
    expect(p.notes.length).toBeLessThanOrEqual(5);
    expect(p.intro.length).toBeGreaterThan(40);
    expect(p.takeaway.length).toBeGreaterThan(10);
  });
  it.each(p.notes.map((n) => [n.title, n] as const))("note %s runs and prints its declared output", (_t, n) => {
    const r = run(n.code, { visible: "", hidden: "" });
    expect(r.executed, r.error ?? "").toBe(true);
    expect(r.solutionStdout.trim()).toBe(n.output.trim());
    expect(n.code.split("\n").length).toBeLessThanOrEqual(5);
  });
});
