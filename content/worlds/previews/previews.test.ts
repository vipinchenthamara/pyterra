import { describe, expect, it } from "vitest";
import { WorldSchema, type World } from "../../schema";
import { skills } from "../../skills";
import { previewWorlds } from "./index";

const AUTHORED_WORLD_IDS = ["foundation-district", "data-vault"];
const EXPECTED_ORDERS = Array.from({ length: 11 }, (_, i) => i + 6);

const parsed: World[] = previewWorlds.map((p) => WorldSchema.parse(p.world));
const previewIds = new Set(parsed.map((w) => w.id));
const skillIds = new Set(skills.map((s) => s.id));

describe("preview worlds (6–16)", () => {
  it("contains 14 packs, each locked-preview with no missions and no artifacts", () => {
    expect(previewWorlds).toHaveLength(11);
    for (const p of previewWorlds) {
      expect(p.missions).toEqual([]);
      expect(p.world.status).toBe("locked-preview");
      expect(p.world.artifacts ?? []).toEqual([]);
    }
  });

  it("every world parses with WorldSchema", () => {
    for (const p of previewWorlds) {
      const r = WorldSchema.safeParse(p.world);
      expect(r.success, `world "${p.world.id}": ${JSON.stringify(r.success ? null : r.error.issues)}`).toBe(true);
    }
    expect(parsed).toHaveLength(11);
  });

  it("orders are exactly 6..16 in sequence", () => {
    expect(parsed.map((w) => w.order)).toEqual(EXPECTED_ORDERS);
  });

  it("world ids and codenames are unique and codenames match order", () => {
    expect(previewIds.size).toBe(11);
    expect(new Set(parsed.map((w) => w.codename)).size).toBe(11);
    for (const w of parsed) expect(w.codename).toBe(`W${w.order}`);
  });

  it("scene layer ids are unique within each world and layer counts are 4–6", () => {
    for (const w of parsed) {
      const ids = w.scene.layers.map((l) => l.id);
      expect(new Set(ids).size, `duplicate layer id in "${w.id}"`).toBe(ids.length);
      expect(ids.length, `layer count in "${w.id}"`).toBeGreaterThanOrEqual(4);
      expect(ids.length, `layer count in "${w.id}"`).toBeLessThanOrEqual(6);
      for (const l of w.scene.layers) expect(l.maxLevel, `${w.id}.${l.id} maxLevel`).toBeLessThanOrEqual(2);
    }
  });

  it("every skill id exists in content/skills.ts", () => {
    for (const w of parsed) {
      for (const sid of w.skillIds) expect(skillIds.has(sid), `world "${w.id}" skill "${sid}"`).toBe(true);
    }
  });

  it("every unlockedBy id is an authored world or another preview world", () => {
    for (const w of parsed) {
      expect(w.unlockedBy.length, `world "${w.id}" has no unlockedBy`).toBeGreaterThan(0);
      for (const u of w.unlockedBy) {
        const ok = AUTHORED_WORLD_IDS.includes(u) || previewIds.has(u);
        expect(ok, `world "${w.id}" unlockedBy "${u}"`).toBe(true);
        expect(u, `world "${w.id}" unlocks itself`).not.toBe(w.id);
      }
    }
  });

  it("unlock chain is linear: world N is unlocked by world N-1", () => {
    const byOrder = new Map(parsed.map((w) => [w.order, w]));
    expect(byOrder.get(6)?.unlockedBy).toEqual(["automation-factory"]);
    for (let order = 7; order <= 16; order++) {
      expect(byOrder.get(order)?.unlockedBy).toEqual([byOrder.get(order - 1)?.id]);
    }
  });

  it("neighbouring worlds use different accents", () => {
    for (let i = 1; i < parsed.length; i++) {
      expect(parsed[i].accent, `${parsed[i - 1].id} -> ${parsed[i].id}`).not.toBe(parsed[i - 1].accent);
    }
  });

  it("taglines are distinct and arrival scenes are prose, not definitions", () => {
    expect(new Set(parsed.map((w) => w.tagline)).size).toBe(11);
    for (const w of parsed) {
      expect(w.tagline.split(/\s+/).length, `tagline length in "${w.id}"`).toBeLessThanOrEqual(6);
      expect(w.arrivalScene.split(/[.!?]\s/).length, `arrivalScene sentences in "${w.id}"`).toBeGreaterThanOrEqual(2);
    }
  });
});
