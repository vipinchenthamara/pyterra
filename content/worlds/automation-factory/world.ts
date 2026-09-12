import type { WorldInput } from "../../schema";

export const world: WorldInput = {
  id: "automation-factory",
  order: 5,
  name: "Automation Factory",
  codename: "W5",
  tagline: "Build the machine once.",
  arrivalScene:
    "The fleet scripts work, but the same forty lines are pasted into six different runbooks, and last week someone fixed a threshold in five of them. Every team asks for a slightly different version: another region, a stricter limit, a dry run. The factory needs machines that take inputs, do one job well, and hand back a result anyone can reuse.",
  builds: "An Automation Script: reusable, parameterised machines that replace copy-pasted operational runbooks.",
  quote: "Copy-paste is a promise you will forget to keep.",
  accent: "rose",
  status: "authored",
  unlockedBy: ["drone-fleet"],
  skillIds: ["functions", "arguments"],
  scene: {
    layers: [
      { id: "factory-floor", kind: "ground", label: "Factory floor", maxLevel: 1 },
      { id: "assembly-halls", kind: "building", label: "Assembly halls", maxLevel: 2 },
      { id: "conveyor-lines", kind: "dataflow", label: "Conveyor lines", maxLevel: 2 },
      { id: "worker-drones", kind: "drone", label: "Worker drones", maxLevel: 2 },
      { id: "factory-stack", kind: "spire", label: "Factory stack", maxLevel: 1 },
      { id: "floor-lights", kind: "light", label: "Floor lighting", maxLevel: 2 },
    ],
  },
  artifacts: [
    {
      id: "automation-script",
      name: "Automation Script",
      description: "A parameterised pipeline of reusable functions that replaces six copy-pasted runbooks.",
      icon: "cog",
      unlockedBy: ["first-machine", "parameters-and-defaults", "automation-pipeline"],
      architectureNotes: "Each function does one job and returns a value; defaults make the common case one call; the pipeline composes them so a change lands in exactly one place.",
    },
  ],
};
