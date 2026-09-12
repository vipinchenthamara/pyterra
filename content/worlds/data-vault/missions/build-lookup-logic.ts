import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "build-lookup-logic",
  version: 1,
  worldId: "data-vault",
  order: 3,
  title: "Build the Lookup Logic",
  codename: "DV-03",
  kind: "build",
  difficulty: 2,
  weight: 1,
  estimatedMinutes: 10,
  skills: [
    { id: "dicts", role: "primary" },
    { id: "lists", role: "secondary" },
  ],
  prerequisites: ["store-inventory"],
  briefing:
    "The registry from DV-01 can answer \"is it there?\", but the console operators keep asking \"what is fw-01?\" and every answer today is a full scan of the list plus somebody's memory. Worse: when an operator types an id that was never registered, the lookup console crashes and takes the shift log down with it. The Vault needs a keyed index: type an id, get its description instantly, and get a calm \"unknown asset\" instead of a crash when the id does not exist.",
  objective:
    "Add \"idp-03\" with the description \"Identity provider\" to the `registry` dictionary. Complete `describe(asset_id)` so it returns the registered description, or the string \"unknown asset\" when the id is not registered; it must never raise. Then set `known_ids` to a sorted list of every registered id and `asset_total` to the number of registered assets.",
  predictPrompt:
    "Run the starter exactly as it is first. What happens on the line that describes \"ghost-99\"? Which error type do you expect, and which line will the traceback point to?",
  starterCode: `# Vault lookup console — descriptions indexed by asset id.
registry = {
    "fw-01": "Perimeter firewall",
    "vpn-02": "Remote access VPN",
}

# TODO 1: register the identity provider under the id "idp-03" with the description "Identity provider"

def describe(asset_id):
    # TODO 2: return the description for asset_id, or "unknown asset" when the id is not registered.
    #         The console must never crash on an unknown id.
    return registry[asset_id]

# TODO 3: known_ids = every registered id, as a list in alphabetical order
# TODO 4: asset_total = how many assets are registered

print(describe("fw-01"))
print(describe("ghost-99"))
`,
  referenceSolution: `registry = {
    "fw-01": "Perimeter firewall",
    "vpn-02": "Remote access VPN",
}

registry["idp-03"] = "Identity provider"

def describe(asset_id):
    return registry.get(asset_id, "unknown asset")

known_ids = sorted(registry.keys())
asset_total = len(registry)

print(describe("fw-01"))
print(describe("ghost-99"))
print(f"{asset_total} assets indexed: {known_ids}")
`,
  tests: {
    visible: `
def test_known_lookup():
    "describe returns the registered description for a known id"
    check(solution.describe("fw-01") == solution.registry["fw-01"], "describe should return exactly the description stored for a registered id")

def test_identity_provider_registered():
    "The identity provider is now in the registry"
    check("idp-03" in solution.registry, "The identity provider should be registered under its id")
    check(solution.describe("idp-03") == "Identity provider", "describe should return the description that was registered for the identity provider")

def test_unknown_does_not_crash():
    "An unregistered id returns a calm fallback instead of crashing"
    try:
        out = solution.describe("ghost-99")
    except KeyError:
        check(False, "Looking up an unregistered id must not raise KeyError; the console has to stay up")
    check(isinstance(out, str) and "unknown" in out.lower(), "An unregistered id should return short text saying the asset is unknown")

def test_known_ids_and_total():
    "known_ids lists every registered id in order; asset_total counts them"
    ids = getattr(solution, "known_ids", None)
    check(isinstance(ids, list), "known_ids should be a list")
    check(sorted(ids) == sorted(solution.registry), "known_ids should contain every registered id and nothing else")
    check(ids == sorted(ids), "known_ids should be in alphabetical order")
    check(getattr(solution, "asset_total", None) == len(solution.registry), "asset_total should equal the number of registered assets")
`,
    hidden: `
def test_many_unknowns():
    for aid in ["", "FW-01", "fw-1", "siem-04"]:
        try:
            out = solution.describe(aid)
        except KeyError:
            check(False, "Unregistered ids of any shape must return the fallback, never raise")
        check(isinstance(out, str) and "unknown" in out.lower(), "Every unregistered id should produce the unknown-asset text")

def test_every_known_id_describes():
    for aid in solution.registry:
        check(solution.describe(aid) == solution.registry[aid], "Every registered id should describe to its own stored description")

def test_lookup_reflects_registry_changes():
    solution.registry["tmp-99"] = "Temporary probe"
    try:
        check(solution.describe("tmp-99") == "Temporary probe", "describe should read live from the registry rather than return a hard-coded answer")
    finally:
        del solution.registry["tmp-99"]

def test_total_is_int():
    check(isinstance(solution.asset_total, int), "asset_total should be a whole number")

def test_registry_still_dict():
    check(isinstance(solution.registry, dict) and len(solution.registry) >= 3, "The registry should remain a dictionary and now hold the identity provider too")
`,
  },
  hints: [
    "A list answers \"is this id present?\" by scanning every entry. You want a structure where the id itself is the address of the description, plus a safe way to ask for an address that might not exist.",
    "That structure is the dictionary. registry[key] = value stores an entry; registry.get(key, fallback) reads without crashing when the key is absent; registry.keys() lists every key; len(registry) counts entries.",
    "Tiny example: ports = {\"ssh\": 22}; ports[\"https\"] = 443 adds an entry; ports.get(\"ftp\", 0) gives 0 instead of a KeyError; sorted(ports.keys()) gives [\"https\", \"ssh\"].",
    "Shape: assign the new key with square brackets; inside describe, return the dictionary's .get of asset_id with the fallback text as the second argument; known_ids = sorted(the keys); asset_total = len(the dictionary).",
    `registry["idp-03"] = "Identity provider"

def describe(asset_id):
    return registry.get(asset_id, ...)  # fill in the fallback text

known_ids = sorted(registry.keys())
# asset_total is one len() call away`,
    "Full walkthrough: registry[\"idp-03\"] = \"Identity provider\" writes a new key/value pair. Inside describe, registry.get(asset_id, \"unknown asset\") looks the key up by hash; if it is missing it returns the fallback instead of raising, which is why the ghost-99 line now prints calmly. sorted(registry.keys()) turns the keys view into an alphabetical list, and len(registry) counts entries.",
  ],
  errorExplanations: [
    {
      match: "KeyError",
      title: "Looked up an id the registry does not have",
      explanation:
        "registry[asset_id] with square brackets demands that the key exist. Use registry.get(asset_id, \"unknown asset\") so a missing id returns the fallback instead of crashing the console.",
    },
    {
      match: "'dict' object has no attribute 'append'",
      title: "Dictionaries are keyed, not appended",
      explanation:
        "append belongs to lists. To add an entry to the registry, assign by key: registry[\"idp-03\"] = \"Identity provider\".",
    },
    {
      match: "'dict_keys' object is not subscriptable",
      title: "keys() is a view, not a list",
      explanation:
        "registry.keys() gives a live view you cannot index. Wrap it: sorted(registry.keys()) or list(registry.keys()) produces a real list.",
    },
  ],
  anchors: ["dicts", "lists"],
  explainWhy: {
    question: "Why does registry.get(asset_id, \"unknown asset\") avoid the crash that registry[asset_id] causes?",
    options: [
      "get() searches the values as well as the keys",
      "get() returns the second argument when the key is absent instead of raising KeyError",
      "get() adds the missing key to the registry automatically",
      "Square brackets only work on lists, not dictionaries",
    ],
    correctIndex: 1,
    explanation:
      "Square-bracket lookup is strict: a missing key raises KeyError. get() performs the same hashed lookup but hands back the fallback you supplied when nothing is found, so the caller always receives a value.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "index-spire", level: 1 },
    { kind: "layer", layer: "storage-racks", level: 2 },
    { kind: "stat", stat: "systems_online", add: 1 },
  ],
  artifacts: ["inventory-registry"],
};

export default mission;
