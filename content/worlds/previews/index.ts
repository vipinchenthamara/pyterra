/**
 * Locked preview worlds 3–16 (PRD world sequence). Each pack carries authored world metadata
 * but no missions yet; the registry allows `locked-preview` worlds to have zero missions.
 * Artifacts are intentionally empty: an artifact must be unlocked by at least one mission.
 * When a world is authored, move it to its own folder and replace the entry here.
 */
import type { WorldPack } from "../../registry";
import type { WorldInput } from "../../schema";

const logicGate: WorldInput = {
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
  status: "locked-preview",
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
  artifacts: [],
};

const droneFleet: WorldInput = {
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
  status: "locked-preview",
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
  artifacts: [],
};

const automationFactory: WorldInput = {
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
  status: "locked-preview",
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
  artifacts: [],
};

const resilienceReactor: WorldInput = {
  id: "resilience-reactor",
  order: 6,
  name: "Resilience Reactor",
  codename: "W6",
  tagline: "Fail without going dark.",
  arrivalScene:
    "A sensor sent a blank reading at 02:14 and the entire reactor control loop crashed, taking the district lights with it. Bad input arrives constantly: malformed telemetry, negative capacities, a file that is half-written. The reactor has to reject what it cannot trust, recover from what breaks, and keep the core running through all of it.",
  builds: "A Resilient File Processor, part one: validated inputs and controlled failure handling that keep the reactor online.",
  quote: "The system that never fails is the one that planned to.",
  accent: "orange",
  status: "locked-preview",
  unlockedBy: ["automation-factory"],
  skillIds: ["exceptions", "validation"],
  scene: {
    layers: [
      { id: "reactor-vessel", kind: "building", label: "Reactor vessel", maxLevel: 2 },
      { id: "containment-shield", kind: "shield", label: "Containment shield", maxLevel: 2 },
      { id: "cooling-flow", kind: "dataflow", label: "Cooling flow", maxLevel: 2 },
      { id: "core-glow", kind: "light", label: "Core glow", maxLevel: 2 },
      { id: "safety-board", kind: "sign", label: "Safety board", maxLevel: 1 },
    ],
  },
  artifacts: [],
};

const archiveCore: WorldInput = {
  id: "archive-core",
  order: 7,
  name: "Archive Core",
  codename: "W7",
  tagline: "Remember across the restart.",
  arrivalScene:
    "Every night the district reboots and forgets: fleet assignments, access decisions, the reactor's last known state all vanish with the process. Operators rebuild it by hand each morning from screenshots and chat logs. The archive needs to write the world to disk in a shape that survives, and read it back exactly as it was left.",
  builds: "A Resilient File Processor, part two: world state persisted to files and JSON and restored across sessions.",
  quote: "Memory is the difference between a system and an incident.",
  accent: "sky",
  status: "locked-preview",
  unlockedBy: ["resilience-reactor"],
  skillIds: ["files", "json"],
  scene: {
    layers: [
      { id: "archive-vaults", kind: "building", label: "Archive vaults", maxLevel: 2 },
      { id: "record-stacks", kind: "building", label: "Record stacks", maxLevel: 2 },
      { id: "snapshot-stream", kind: "dataflow", label: "Snapshot stream", maxLevel: 2 },
      { id: "archive-lights", kind: "light", label: "Archive lighting", maxLevel: 1 },
      { id: "catalogue-sign", kind: "sign", label: "Catalogue sign", maxLevel: 1 },
    ],
  },
  artifacts: [],
};

const networkDistrict: WorldInput = {
  id: "network-district",
  order: 8,
  name: "Network District",
  codename: "W8",
  tagline: "Talk to the outside.",
  arrivalScene:
    "The district runs on its own data while the rest of the world moves on: weather feeds, threat intelligence, a partner city's drone registry, all one request away and none of them wired in. When someone did try, a slow endpoint hung the control room for an hour. The network has to send requests, read what comes back, and treat a 500 very differently from a 200.",
  builds: "An API Client: a hardened connector that pulls external feeds into the district and handles what goes wrong.",
  quote: "Every remote call is a question you might not get answered.",
  accent: "cyan",
  status: "locked-preview",
  unlockedBy: ["archive-core"],
  skillIds: ["http", "api-calls"],
  scene: {
    layers: [
      { id: "exchange-plaza", kind: "ground", label: "Exchange plaza", maxLevel: 1 },
      { id: "relay-towers", kind: "spire", label: "Relay towers", maxLevel: 2 },
      { id: "uplink-streams", kind: "dataflow", label: "Uplink streams", maxLevel: 2 },
      { id: "gateway-hall", kind: "building", label: "Gateway hall", maxLevel: 2 },
      { id: "status-lights", kind: "light", label: "Status lights", maxLevel: 2 },
      { id: "edge-shield", kind: "shield", label: "Edge shield", maxLevel: 1 },
    ],
  },
  artifacts: [],
};

const architectLab: WorldInput = {
  id: "architect-lab",
  order: 9,
  name: "Architect Lab",
  codename: "W9",
  tagline: "Model the world as objects.",
  arrivalScene:
    "The district's code now knows about drones, users, gates and reactors, but each one is a loose pile of dictionaries and helper functions that only the original author can keep straight. Adding a new drone type means touching eleven files. The lab needs blueprints: each thing in the world carrying its own state and behaviour, composed into larger systems that the tooling can check.",
  builds: "An Object Model: drones, users and systems as reusable, type-checked objects composed into a district model.",
  quote: "Name the thing, and the thing can be reasoned about.",
  accent: "violet",
  status: "locked-preview",
  unlockedBy: ["network-district"],
  skillIds: ["classes", "composition", "type-hints"],
  scene: {
    layers: [
      { id: "lab-campus", kind: "ground", label: "Lab campus", maxLevel: 1 },
      { id: "blueprint-hall", kind: "building", label: "Blueprint hall", maxLevel: 2 },
      { id: "prototype-drones", kind: "drone", label: "Prototype drones", maxLevel: 2 },
      { id: "design-spire", kind: "spire", label: "Design spire", maxLevel: 2 },
      { id: "lab-lights", kind: "light", label: "Lab lighting", maxLevel: 1 },
      { id: "schematic-board", kind: "sign", label: "Schematic board", maxLevel: 1 },
    ],
  },
  artifacts: [],
};

const runtimeGrid: WorldInput = {
  id: "runtime-grid",
  order: 10,
  name: "Runtime Grid",
  codename: "W10",
  tagline: "From script to project.",
  arrivalScene:
    "Everything the district runs lives in one 3,000-line file, works on one operator's laptop, and breaks on everyone else's because of a library version nobody wrote down. Secrets sit in the source. Before anything ships, the grid needs the code split into parts that import cleanly, an environment that can be rebuilt on demand, and configuration that stays out of the repository.",
  builds: "A maintainable project layout: modules, a reproducible environment and configuration pulled from the environment, not the source.",
  quote: "Works on my machine is not an architecture.",
  accent: "amber",
  status: "locked-preview",
  unlockedBy: ["architect-lab"],
  skillIds: ["modules", "environments"],
  scene: {
    layers: [
      { id: "grid-plane", kind: "ground", label: "Grid plane", maxLevel: 1 },
      { id: "module-blocks", kind: "building", label: "Module blocks", maxLevel: 2 },
      { id: "import-lines", kind: "dataflow", label: "Import lines", maxLevel: 2 },
      { id: "env-pylons", kind: "spire", label: "Environment pylons", maxLevel: 2 },
      { id: "grid-lights", kind: "light", label: "Grid lighting", maxLevel: 1 },
    ],
  },
  artifacts: [],
};

const concurrentCity: WorldInput = {
  id: "concurrent-city",
  order: 11,
  name: "Concurrent City",
  codename: "W11",
  tagline: "Wait on everything at once.",
  arrivalScene:
    "The API client works, but polling fifty partner endpoints one after another takes nine minutes, and the threat feed is stale by the time the last response lands. The CPU is idle the whole time; the city is simply waiting in line. The district needs to fire every request at once, do useful work while the network answers, and gather the results without losing one.",
  builds: "An Async API Worker: concurrent, network-bound tasks that finish in seconds instead of minutes.",
  quote: "Waiting is work only if you do nothing else.",
  accent: "emerald",
  status: "locked-preview",
  unlockedBy: ["runtime-grid"],
  skillIds: ["async"],
  scene: {
    layers: [
      { id: "city-grid", kind: "ground", label: "City grid", maxLevel: 1 },
      { id: "event-loop-ring", kind: "dataflow", label: "Event loop ring", maxLevel: 2 },
      { id: "task-towers", kind: "building", label: "Task towers", maxLevel: 2 },
      { id: "courier-drones", kind: "drone", label: "Courier drones", maxLevel: 2 },
      { id: "traffic-lights", kind: "light", label: "Traffic lights", maxLevel: 2 },
      { id: "dispatch-spire", kind: "spire", label: "Dispatch spire", maxLevel: 1 },
    ],
  },
  artifacts: [],
};

const serviceHub: WorldInput = {
  id: "service-hub",
  order: 12,
  name: "Service Hub",
  codename: "W12",
  tagline: "Expose it, safely.",
  arrivalScene:
    "Other teams want the district's access engine and fleet controls, and today that means asking an operator to run a script for them. The one time someone exposed it over the network, a malformed payload took it down and nobody could say what request did it. The hub needs routes that validate every input, log every decision, and prove with tests that they still behave after the next change.",
  builds: "A FastAPI Service: validated, logged and tested endpoints that expose the district's capabilities.",
  quote: "An API is a contract, and contracts get tested.",
  accent: "rose",
  status: "locked-preview",
  unlockedBy: ["concurrent-city"],
  skillIds: ["pydantic", "fastapi", "logging", "testing"],
  scene: {
    layers: [
      { id: "hub-terminal", kind: "building", label: "Hub terminal", maxLevel: 2 },
      { id: "route-channels", kind: "dataflow", label: "Route channels", maxLevel: 2 },
      { id: "validation-shield", kind: "shield", label: "Validation shield", maxLevel: 2 },
      { id: "log-spire", kind: "spire", label: "Log spire", maxLevel: 2 },
      { id: "service-lights", kind: "light", label: "Service lights", maxLevel: 1 },
      { id: "contract-board", kind: "sign", label: "Contract board", maxLevel: 1 },
    ],
  },
  artifacts: [],
};

const deploymentYard: WorldInput = {
  id: "deployment-yard",
  order: 13,
  name: "Deployment Yard",
  codename: "W13",
  tagline: "Ship it, and ship it again.",
  arrivalScene:
    "The service runs, but only on the machine it was written on, and last Tuesday's version is gone because someone saved over it. A second operator cannot stand it up without a two-hour call. The yard needs every change recorded as a named snapshot and the whole application boxed with its environment so it starts the same way on any host.",
  builds: "A Dockerized Service: a versioned, containerised build of the district's API that runs anywhere.",
  quote: "If it is not versioned, it did not happen.",
  accent: "orange",
  status: "locked-preview",
  unlockedBy: ["service-hub"],
  skillIds: ["git", "docker"],
  scene: {
    layers: [
      { id: "yard-deck", kind: "ground", label: "Yard deck", maxLevel: 1 },
      { id: "container-stacks", kind: "building", label: "Container stacks", maxLevel: 2 },
      { id: "loading-cranes", kind: "spire", label: "Loading cranes", maxLevel: 2 },
      { id: "cargo-drones", kind: "drone", label: "Cargo drones", maxLevel: 2 },
      { id: "yard-floodlights", kind: "light", label: "Yard floodlights", maxLevel: 1 },
      { id: "manifest-board", kind: "sign", label: "Manifest board", maxLevel: 1 },
    ],
  },
  artifacts: [],
};

const intelligenceCore: WorldInput = {
  id: "intelligence-core",
  order: 14,
  name: "Intelligence Core",
  codename: "W14",
  tagline: "Ask the model, check the answer.",
  arrivalScene:
    "Incident reports arrive as free text from forty sources, and an analyst spends the first hour of every shift turning them into fields the access engine can act on. The district can call a language model now, but a model that returns prose is another thing to parse and another thing to mistrust. The core needs prompts that produce structured output, and code that refuses anything that does not fit the shape.",
  builds: "An LLM-backed Assistant: model calls with structured, validated outputs wired into district operations.",
  quote: "The model proposes; the schema disposes.",
  accent: "sky",
  status: "locked-preview",
  unlockedBy: ["deployment-yard"],
  skillIds: ["llm-apis"],
  scene: {
    layers: [
      { id: "core-chamber", kind: "building", label: "Core chamber", maxLevel: 2 },
      { id: "inference-spire", kind: "spire", label: "Inference spire", maxLevel: 2 },
      { id: "prompt-streams", kind: "dataflow", label: "Prompt streams", maxLevel: 2 },
      { id: "neural-glow", kind: "light", label: "Neural glow", maxLevel: 2 },
      { id: "output-shield", kind: "shield", label: "Output shield", maxLevel: 1 },
    ],
  },
  artifacts: [],
};

const memoryEngine: WorldInput = {
  id: "memory-engine",
  order: 15,
  name: "Memory Engine",
  codename: "W15",
  tagline: "Ground the answer in the archive.",
  arrivalScene:
    "The assistant answers confidently about district policy, and about a third of what it says was never written anywhere. Operators cannot tell the invented runbook from the real one. The engine needs the archive chunked and indexed so the assistant retrieves the actual policy before it speaks, and cites the record it used, so every answer can be checked.",
  builds: "A RAG Knowledge Service: retrieval over district knowledge with cited, verifiable answers.",
  quote: "An answer without a source is a guess with good grammar.",
  accent: "cyan",
  status: "locked-preview",
  unlockedBy: ["intelligence-core"],
  skillIds: ["rag"],
  scene: {
    layers: [
      { id: "memory-halls", kind: "building", label: "Memory halls", maxLevel: 2 },
      { id: "index-columns", kind: "spire", label: "Index columns", maxLevel: 2 },
      { id: "retrieval-streams", kind: "dataflow", label: "Retrieval streams", maxLevel: 2 },
      { id: "citation-lights", kind: "light", label: "Citation lights", maxLevel: 1 },
      { id: "source-board", kind: "sign", label: "Source board", maxLevel: 1 },
      { id: "knowledge-shield", kind: "shield", label: "Knowledge shield", maxLevel: 1 },
    ],
  },
  artifacts: [],
};

const autonomousCommand: WorldInput = {
  id: "autonomous-command",
  order: 16,
  name: "Autonomous Command",
  codename: "W16",
  tagline: "Act, within limits.",
  arrivalScene:
    "The assistant can read the archive and reason about an incident, but every action still waits for a human to type the command, and at 03:00 there is nobody there. Giving it the fleet and the gates outright is how a city loses control of itself. Command needs an assistant that can plan, call the district's tools, verify each result, and stop the moment it steps outside what it was allowed to do.",
  builds: "The Final AI Security Assistant: a bounded agent that reasons, uses district tools and verifies its own actions.",
  quote: "Autonomy is a budget, not a permission.",
  accent: "violet",
  status: "locked-preview",
  unlockedBy: ["memory-engine"],
  skillIds: ["agents"],
  scene: {
    layers: [
      { id: "command-plaza", kind: "ground", label: "Command plaza", maxLevel: 1 },
      { id: "command-citadel", kind: "building", label: "Command citadel", maxLevel: 2 },
      { id: "sentinel-drones", kind: "drone", label: "Sentinel drones", maxLevel: 2 },
      { id: "tool-conduits", kind: "dataflow", label: "Tool conduits", maxLevel: 2 },
      { id: "guardrail-shield", kind: "shield", label: "Guardrail shield", maxLevel: 2 },
      { id: "beacon-spire", kind: "spire", label: "Beacon spire", maxLevel: 2 },
    ],
  },
  artifacts: [],
};

/** Worlds 3–16, in PRD order. Every pack is a locked preview with no missions yet. */
export const previewWorlds: WorldPack[] = [
  logicGate,
  droneFleet,
  automationFactory,
  resilienceReactor,
  archiveCore,
  networkDistrict,
  architectLab,
  runtimeGrid,
  concurrentCity,
  serviceHub,
  deploymentYard,
  intelligenceCore,
  memoryEngine,
  autonomousCommand,
].map((world) => ({ world, missions: [] }));
