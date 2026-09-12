import type { WorldInput } from "../../schema";

export const world: WorldInput = {
  id: "data-vault",
  order: 2,
  name: "Data Vault",
  codename: "W2",
  tagline: "From chaos to clarity.",
  arrivalScene:
    "The Vault holds every asset, alert and citizen record the world produces, and right now it is a pile. Records repeat, lookups take a full scan, and nobody can say how many sensors are online. The district needs storage that fits the question being asked: ordered when order matters, unique when duplicates lie, keyed when speed matters.",
  builds: "An inventory and data registry: deduplicated alert feeds, keyed asset lookups and a rebuilt archive.",
  quote: "Data is the raw material of opportunity.",
  accent: "violet",
  status: "authored",
  unlockedBy: ["foundation-district"],
  skillIds: ["lists", "sets", "dicts", "tuples", "collections-ops"],
  scene: {
    layers: [
      { id: "vault-shell", kind: "building", label: "Vault shell", maxLevel: 2 },
      { id: "storage-racks", kind: "building", label: "Storage racks", maxLevel: 2 },
      { id: "alert-bus", kind: "dataflow", label: "Alert bus", maxLevel: 2 },
      { id: "index-spire", kind: "spire", label: "Index spire", maxLevel: 2 },
      { id: "vault-lights", kind: "light", label: "Vault lighting", maxLevel: 2 },
      { id: "citizen-flow", kind: "drone", label: "Citizen flow", maxLevel: 2 },
      { id: "vault-shield", kind: "shield", label: "Integrity shield", maxLevel: 1 },
    ],
  },
  artifacts: [
    {
      id: "alert-dedup-analyzer",
      name: "Alert Deduplication Analyzer",
      description: "Collapses a noisy alert feed to its unique alert types.",
      icon: "filter",
      unlockedBy: ["duplicate-incident"],
      architectureNotes: "A set removes duplicates by hashing each item. Converting back to a list restores the sequence type the rest of the system expects.",
    },
    {
      id: "inventory-registry",
      name: "Inventory / Data Registry",
      description: "Keyed asset registry with fast lookups and a rebuilt, deduplicated archive.",
      icon: "database",
      unlockedBy: ["store-inventory", "build-lookup-logic", "the-corrupted-archive"],
      architectureNotes: "Lists hold ordered asset records, a dictionary indexes them by id for O(1) lookup, tuples pin immutable coordinates, and sets guarantee uniqueness during the rebuild.",
    },
  ],
};
