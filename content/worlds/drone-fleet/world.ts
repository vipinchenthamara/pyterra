import type { WorldInput } from "../../schema";

export const world: WorldInput = {
  id: "drone-fleet",
  order: 4,
  name: "Drone Fleet",
  codename: "W4",
  tagline: "Repeat it without the toil.",
  arrivalScene:
    "Two hundred patrol drones sit on the pads, and every one of them needs a battery check, a firmware audit and a route assignment before dawn. Right now an operator does it by hand, one drone at a time, and gives up around number forty. The fleet only flies if the same operation can run across all of them and keep running until the last pad is clear.",
  builds: "Automated fleet operations: batch battery audits, firmware sweeps and route assignment across the whole fleet.",
  quote: "If you did it twice, the machine should do it the third time.",
  accent: "emerald",
  status: "authored",
  unlockedBy: ["logic-gate"],
  skillIds: ["for-loops", "while-loops", "comprehensions"],
  scene: {
    layers: [
      { id: "launch-pads", kind: "ground", label: "Launch pads", maxLevel: 1 },
      { id: "hangar-bays", kind: "building", label: "Hangar bays", maxLevel: 2 },
      { id: "drone-swarm", kind: "drone", label: "Drone swarm", maxLevel: 2 },
      { id: "control-tower", kind: "spire", label: "Control tower", maxLevel: 2 },
      { id: "patrol-lanes", kind: "dataflow", label: "Patrol lanes", maxLevel: 2 },
      { id: "pad-lights", kind: "light", label: "Pad lighting", maxLevel: 1 },
    ],
  },
  artifacts: [
    {
      id: "fleet-batch-processor",
      name: "Fleet Batch Processor",
      description: "Audits every drone in the fleet in one pass and reports the ones that need attention.",
      icon: "plane",
      unlockedBy: ["roll-call", "patrol-until", "fleet-dispatch"],
      architectureNotes: "for loops walk a collection once; while loops run until a condition changes; break and continue steer the loop; comprehensions build the filtered collection in one expression.",
    },
  ],
};
