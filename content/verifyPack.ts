/**
 * Shared vitest helper so each world pack can be verified in isolation
 * (before the global registry can load every world).
 * Usage in content/worlds/<world>/pack.test.ts:
 *   import { describePack } from "../../verifyPack"; import { foundationDistrict } from "./index";
 *   describePack(foundationDistrict);
 */
import { beforeAll, describe, expect, it } from "vitest";
import { loadHarness, type HarnessRunner } from "@/engine/runner/nodeHarness";
import { MissionSchema, WorldSchema, type Mission, type World } from "./schema";
import type { WorldPack } from "./registry";
import { skills as skillInputs } from "./skills";

export function describePack(pack: WorldPack) {
  const worldParsed = WorldSchema.safeParse(pack.world);
  const world: World | undefined = worldParsed.success ? worldParsed.data : undefined;
  const skillIds = new Set(skillInputs.map((s) => s.id));

  describe(`world ${pack.world.id}`, () => {
    it("world definition is valid", () => {
      expect(worldParsed.success, JSON.stringify(worldParsed.error?.issues, null, 2)).toBe(true);
    });
    it("world skills exist", () => {
      for (const s of pack.world.skillIds) expect(skillIds.has(s), s).toBe(true);
    });

    let run: HarnessRunner;
    beforeAll(async () => {
      run = await loadHarness();
    });

    const parsed = pack.missions.map((m) => [m.id, MissionSchema.safeParse(m)] as const);
    it("mission orders are unique and prerequisites resolve", () => {
      const ids = new Set(pack.missions.map((m) => m.id));
      const orders = pack.missions.map((m) => m.order);
      expect(new Set(orders).size).toBe(orders.length);
      for (const m of pack.missions) for (const p of m.prerequisites ?? []) expect(ids.has(p), `${m.id} -> ${p}`).toBe(true);
    });

    describe.each(parsed)("mission %s", (id, result) => {
      it("matches the schema", () => {
        expect(result.success, JSON.stringify(result.error?.issues, null, 2)).toBe(true);
      });
      const m: Mission | undefined = result.success ? result.data : undefined;
      it("references world layers, artifacts and skills correctly", () => {
        if (!m || !world) return;
        expect(m.worldId).toBe(world.id);
        const layers = new Map(world.scene.layers.map((l) => [l.id, l.maxLevel]));
        for (const d of m.onComplete) if (d.kind === "layer") {
          expect(layers.has(d.layer), `${id} layer ${d.layer}`).toBe(true);
          expect(d.level).toBeLessThanOrEqual(layers.get(d.layer) ?? 1);
        }
        for (const s of m.skills) expect(world.skillIds.includes(s.id), `${id} skill ${s.id}`).toBe(true);
        for (const a of m.anchors) expect(skillIds.has(a), `${id} anchor ${a}`).toBe(true);
        for (const a of m.artifacts) {
          const art = world.artifacts.find((x) => x.id === a);
          expect(art, `${id} artifact ${a}`).toBeDefined();
          expect(art?.unlockedBy.includes(m.id), `${id} not in ${a}.unlockedBy`).toBe(true);
        }
      });
      it("starter code has no syntax error and does not already pass", () => {
        if (!m) return;
        const r = run(m.starterCode, m.tests);
        expect(r.errorType, r.error ?? "").not.toBe("SyntaxError");
        expect(r.passed, "starter code must not already pass").toBe(false);
      });
      it("reference solution passes every test", () => {
        if (!m) return;
        const r = run(m.referenceSolution, m.tests);
        const failures = r.visible.filter((t) => t.status !== "pass").map((t) => `${t.id}: ${t.message}`);
        if (r.hidden.firstFailure) failures.push(`hidden: ${r.hidden.firstFailure}`);
        expect(r.executed, r.error ?? "").toBe(true);
        expect(failures, failures.join("\n")).toEqual([]);
      });
      it("tests never leak literal expected values in their messages", () => {
        if (!m) return;
        expect(m.hints.length).toBe(6);
        for (const [i, h] of m.hints.entries()) expect(h.length, `hint ${i + 1} too short`).toBeGreaterThan(20);
        expect(m.tests.visible).toMatch(/def test_/);
        expect(m.tests.hidden).toMatch(/def test_/);
      });
    });
  });
}
