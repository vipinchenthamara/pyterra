import type { WorldInput } from "../../schema";

export const world: WorldInput = {
  id: "foundation-district",
  order: 1,
  name: "Foundation District",
  codename: "W1",
  tagline: "Give the world a state.",
  arrivalScene:
    "The district is dark. Nothing has a name, nothing has a number, and the power core cannot report its own level. Before anything can be built, the world needs values it can refer to: a name, a population, a power reading. Every system that follows will read from what you define here.",
  builds: "A live district state: name, population, power, security and resources, reported in plain text.",
  quote: "Every world starts with a variable.",
  accent: "cyan",
  status: "authored",
  unlockedBy: [],
  skillIds: ["variables", "numeric-types", "operators", "strings", "f-strings", "string-indexing", "type-conversion"],
  scene: {
    layers: [
      { id: "ground-grid", kind: "ground", label: "District grid", maxLevel: 1 },
      { id: "power-core", kind: "building", label: "Power core", maxLevel: 2 },
      { id: "core-lights", kind: "light", label: "Core lighting", maxLevel: 2 },
      { id: "hab-blocks", kind: "building", label: "Habitation blocks", maxLevel: 2 },
      { id: "district-sign", kind: "sign", label: "District sign", maxLevel: 1 },
      { id: "comms-tower", kind: "spire", label: "Comms tower", maxLevel: 2 },
    ],
  },
  artifacts: [
    {
      id: "world-state-console",
      name: "World State Console",
      description: "Parses raw telemetry and prints a formatted district status report.",
      icon: "terminal",
      unlockedBy: ["district-status-report"],
      architectureNotes:
        "Plain variables hold district state. Strings are parsed with split() and slicing, numbers are converted with int()/float(), and an f-string report is assembled. This is the seed of every later dashboard.",
    },
  ],
};
