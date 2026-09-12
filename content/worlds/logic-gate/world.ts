import type { WorldInput } from "../../schema";

export const world: WorldInput = {
  id: "logic-gate",
  order: 3,
  name: "Logic Gate",
  codename: "W3",
  tagline: "Decide who gets through.",
  arrivalScene:
    "The Vault is full of records, but the gates in front of it open for anyone who asks. A contractor badge and an admin badge get the same answer, and a request at 03:00 from an unknown region looks identical to one from the ops floor. The district needs rules that weigh role, time, risk and location before a single door moves.",
  builds: "An Access Control Engine: access-control rules and risk decisions for every gate in the district.",
  quote: "A gate without a rule is just a hole in the wall.",
  accent: "amber",
  status: "authored",
  unlockedBy: ["data-vault"],
  skillIds: ["conditions", "boolean-logic"],
  scene: {
    layers: [
      { id: "gate-plaza", kind: "ground", label: "Gate plaza", maxLevel: 1 },
      { id: "checkpoint-arch", kind: "building", label: "Checkpoint arch", maxLevel: 2 },
      { id: "decision-beacons", kind: "light", label: "Decision beacons", maxLevel: 2 },
      { id: "policy-board", kind: "sign", label: "Policy board", maxLevel: 1 },
      { id: "risk-shield", kind: "shield", label: "Risk shield", maxLevel: 2 },
    ],
  },
  artifacts: [
    {
      id: "access-control-engine",
      name: "Access Control Engine",
      description: "Decides allow, deny or step-up for every gate request from role, time, risk and location.",
      icon: "shield-check",
      unlockedBy: ["badge-check", "risk-score", "gate-decision-engine"],
      architectureNotes: "Comparison operators produce booleans; and / or / not combine them; if / elif / else order the checks from most to least specific so the first matching rule wins.",
    },
  ],
};
