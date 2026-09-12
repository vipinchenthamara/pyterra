import { describe, expect, it } from "vitest";
import { bossForWorld, missions, missionsForWorld, skills, validateRegistry, worlds } from "./registry";

describe("content registry", () => {
  it("validates without errors", () => {
    expect(() => validateRegistry()).not.toThrow();
  });
  it("has 16 worlds in order with worlds 1–5 authored", () => {
    expect(worlds.map((w) => w.order)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
    for (let i = 0; i < 5; i++) expect(worlds[i].status, worlds[i].id).toBe("authored");
    for (let i = 5; i < 16; i++) expect(worlds[i].status, worlds[i].id).toBe("locked-preview");
  });
  it("every authored mission has a review variant", () => {
    for (const m of missions) expect(m.reviewVariant, `${m.id} lacks reviewVariant`).toBeDefined();
  });
  it("authored worlds have 5 missions and a boss", () => {
    for (const w of worlds.filter((w) => w.status === "authored")) {
      const ms = missionsForWorld(w.id);
      expect(ms.length, w.id).toBe(6);
      expect(bossForWorld(w.id), w.id).toBeDefined();
    }
  });
  it("every skill used by a mission exists", () => {
    const ids = new Set(skills.map((s) => s.id));
    for (const m of missions) for (const s of m.skills) expect(ids.has(s.id), `${m.id}:${s.id}`).toBe(true);
  });
});
