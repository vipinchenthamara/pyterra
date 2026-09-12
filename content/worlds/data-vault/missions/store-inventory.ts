import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "store-inventory",
  version: 1,
  worldId: "data-vault",
  order: 1,
  title: "Store the Inventory",
  codename: "DV-01",
  kind: "build",
  difficulty: 1,
  weight: 1,
  estimatedMinutes: 7,
  skills: [{ id: "lists", role: "primary" }],
  prerequisites: [],
  briefing:
    "Every device the district owns is supposed to be logged at the Vault intake desk, but the log is three sticky notes and an argument. A SIEM collector was racked this morning and nobody can say whether it was recorded, how many assets exist, or which one came in last. Operations needs a single ordered registry they can add to, count, slice and query in one line each.",
  objective:
    "Starting from the `assets` list, append \"siem-04\", then set five top-level variables: `first_asset` (the first registered id), `last_asset` (the final registered id), `core_assets` (a list holding exactly the second and third entries), `asset_count` (how many ids are registered) and `has_siem` (True or False: whether \"siem-04\" is registered).",
  predictPrompt:
    "Before running: after the SIEM collector is added, which position does it occupy, and what index reaches it without counting entries?",
  starterCode: `# Vault asset registry — the intake desk logs every device the district owns.
assets = ["fw-01", "vpn-02", "idp-03"]

# TODO 1: a new SIEM collector "siem-04" has just been racked. Add it to the END of the registry.
# TODO 2: first_asset = the first entry; last_asset = the final entry (whatever position it lands in)
# TODO 3: core_assets = a list of the second and third entries only (a slice)
# TODO 4: asset_count = how many assets are registered
# TODO 5: has_siem = True if "siem-04" is registered, False otherwise

print(assets)
`,
  referenceSolution: `assets = ["fw-01", "vpn-02", "idp-03"]

assets.append("siem-04")
first_asset = assets[0]
last_asset = assets[-1]
core_assets = assets[1:3]
asset_count = len(assets)
has_siem = "siem-04" in assets

print(assets)
print(f"{asset_count} assets, first {first_asset}, last {last_asset}, core {core_assets}, siem online: {has_siem}")
`,
  tests: {
    visible: `
_missing = object()

def _get(name):
    return getattr(solution, name, _missing)

def test_siem_appended():
    "The new SIEM collector is registered at the end"
    assets = _get("assets")
    check(isinstance(assets, list), "The registry should still be a list after registration")
    check(len(assets) > 3, "Registering the collector should grow the registry by one entry")
    check(assets[-1] == "siem-04", "The newly racked collector should sit at the end of the registry")

def test_first_and_last():
    "first_asset and last_asset read the two ends of the registry"
    first = _get("first_asset")
    last = _get("last_asset")
    check(first is not _missing and last is not _missing, "Both first_asset and last_asset should be defined at the top level")
    check(first == solution.assets[0], "first_asset should be whatever id sits at the front of the registry")
    check(last == solution.assets[-1], "last_asset should be whatever id sits at the back of the registry")

def test_core_slice():
    "core_assets holds exactly the second and third entries"
    core = _get("core_assets")
    check(isinstance(core, list), "core_assets should be a list (a slice of the registry)")
    check(core == solution.assets[1:3], "core_assets should contain the second and third registry entries, in order, and nothing else")

def test_count_and_membership():
    "asset_count and has_siem describe the registry"
    count = _get("asset_count")
    has = _get("has_siem")
    check(isinstance(count, int) and count == len(solution.assets), "asset_count should equal the number of ids currently in the registry")
    check(isinstance(has, bool), "has_siem should be a True/False answer, not a string or number")
    check(has is True, "has_siem should report that the SIEM collector is registered")
`,
    hidden: `
def test_original_order_kept():
    check(solution.assets[:3] == ["fw-01", "vpn-02", "idp-03"], "The three original assets should keep their positions")

def test_no_duplicate_registration():
    check(len(set(solution.assets)) == len(solution.assets), "Each asset should be registered exactly once")

def test_core_excludes_ends():
    check(solution.first_asset not in solution.core_assets and solution.last_asset not in solution.core_assets, "core_assets should exclude the first and last registry entries")

def test_last_is_text():
    check(isinstance(solution.last_asset, str), "last_asset should be a single id string, not a list")

def test_count_is_not_hardcoded_shape():
    check(solution.asset_count == len(solution.assets) and len(solution.core_assets) == 2, "asset_count should track the registry length and core_assets should hold two entries")
`,
  },
  hints: [
    "The registry is already an ordered sequence. Adding to the end, reading by position, counting, and asking whether something is present are all built-in abilities of that sequence.",
    "This is list work: .append() grows the list in place, [0] and [-1] read the two ends, [start:stop] copies a range, len() counts, and the word `in` answers a yes/no membership question.",
    "Tiny example with ports: ports = [22, 443]; ports.append(8080) makes [22, 443, 8080]; ports[-1] is 8080; ports[0:2] is [22, 443]; len(ports) is 3; 22 in ports is True.",
    "Shape: append the new id; first = assets at index 0; last = assets at index -1; core = assets sliced from 1 up to (not including) 3; count = len of assets; has_siem = the new id `in` assets.",
    `assets.append("siem-04")
first_asset = assets[0]
last_asset = assets[-1]
# now the slice [1:3], the len() count, and the membership test with in`,
    "Full walkthrough: assets.append(\"siem-04\") adds the collector as the fourth entry. first_asset = assets[0] and last_asset = assets[-1] read the ends; -1 always means the final item, however long the list grows. core_assets = assets[1:3] copies positions 1 and 2 (the stop index is exclusive). asset_count = len(assets) counts entries. has_siem = \"siem-04\" in assets evaluates to True because the id is present.",
  ],
  errorExplanations: [
    {
      match: "'list' object has no attribute 'add'",
      title: "Lists grow with append, not add",
      explanation:
        "add() belongs to sets. To put a new asset at the end of the registry list, call assets.append(\"siem-04\").",
    },
    {
      match: "list index out of range",
      title: "Asked for a position the registry does not have",
      explanation:
        "Positions start at 0, so a four-entry list has indexes 0 to 3. Use assets[-1] for the final entry instead of guessing its number.",
    },
    {
      match: "'list' object is not callable",
      title: "Round brackets where square ones belong",
      explanation:
        "assets(0) tries to call the list like a function. Reading by position uses square brackets: assets[0].",
    },
  ],
  anchors: ["lists"],
  explainWhy: {
    question: "Why does assets[-1] return the SIEM collector even though you never wrote down its position?",
    options: [
      "Python remembers the last item that was appended",
      "Negative indexes count from the end, so -1 is always the final entry regardless of length",
      "-1 is a special alias for the string \"siem-04\"",
      "Lists are sorted, so the newest entry is always last",
    ],
    correctIndex: 1,
    explanation:
      "A negative index is counted from the end of the sequence: -1 is the last entry, -2 the one before it. The registry can grow to a thousand assets and assets[-1] still reads the newest one.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "vault-shell", level: 1 },
    { kind: "layer", layer: "storage-racks", level: 1 },
    { kind: "stat", stat: "structures", add: 2 },
  ],
  artifacts: ["inventory-registry"],
};

export default mission;
