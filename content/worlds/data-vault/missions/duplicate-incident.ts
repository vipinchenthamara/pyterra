import type { MissionInput } from "../../../schema";

/**
 * Canonical mission example. Copy its structure when authoring new missions.
 * Voice: problem first, no definitions up front, security/ops framing, measurable outcomes.
 */
const mission: MissionInput = {
  id: "duplicate-incident",
  version: 1,
  worldId: "data-vault",
  order: 2,
  title: "Duplicate Incident",
  codename: "DV-02",
  kind: "build",
  difficulty: 2,
  weight: 1,
  estimatedMinutes: 8,
  skills: [
    { id: "sets", role: "primary" },
    { id: "lists", role: "secondary" },
  ],
  prerequisites: ["store-inventory"],
  briefing:
    "The Vault's alert bus is replaying itself. Operations sees forty \"intrusion\" rows where there should be one, and the on-call engineer has started ignoring the feed entirely. The warehouse needs a view that shows each alert type exactly once, so a real new alert stands out.",
  objective:
    "Write a function `unique_alerts(alerts)` that takes a list of alert type strings and returns a list containing each alert type exactly once. Order does not matter. The original list must not be modified.",
  predictPrompt:
    "Before you run anything: if the feed is [\"intrusion\", \"power\", \"intrusion\", \"network\"], how many items should the cleaned view contain?",
  starterCode: `# Warehouse alert feed — the same alert types keep repeating.
alerts = [
    "intrusion",
    "power",
    "intrusion",
    "network",
    "power",
    "temperature",
    "network",
]

def unique_alerts(alerts):
    # TODO: return a list with each alert type exactly once
    ...

print(unique_alerts(alerts))
`,
  referenceSolution: `alerts = [
    "intrusion",
    "power",
    "intrusion",
    "network",
    "power",
    "temperature",
    "network",
]

def unique_alerts(alerts):
    return list(set(alerts))

print(unique_alerts(alerts))
`,
  tests: {
    visible: `
def test_removes_duplicates():
    "Each alert type appears exactly once"
    out = solution.unique_alerts(["intrusion", "power", "intrusion", "network"])
    check(sorted(out) == ["intrusion", "network", "power"], "Each alert type should appear exactly once in the result")

def test_returns_a_list():
    "Returns a list, not another collection type"
    check(isinstance(solution.unique_alerts(["power"]), list), "The result should be a list so the rest of the system can index it")
`,
    hidden: `
def test_empty_feed():
    check(solution.unique_alerts([]) == [], "An empty feed should produce an empty view")

def test_forty_identical():
    check(len(solution.unique_alerts(["intrusion"] * 40)) == 1, "Forty identical alerts should collapse to a single entry")

def test_does_not_mutate_input():
    feed = ["a", "a", "b"]
    solution.unique_alerts(feed)
    check(feed == ["a", "a", "b"], "The original feed must not be modified")

def test_no_extra_items():
    out = solution.unique_alerts(["cpu", "disk"])
    check(sorted(out) == ["cpu", "disk"], "The view should contain only alert types that were in the feed")
`,
  },
  hints: [
    "You need a version of the feed where every alert type is kept only once. Think about which collection refuses to hold the same value twice.",
    "Python has a built-in collection that cannot contain duplicates: the set. Building one from a list drops repeats automatically.",
    "Tiny example: set([1, 1, 2]) gives {1, 2}. Notice the braces: that is a set, not a list.",
    "Shape: convert the list to a set, then convert that set back into a list, then return it.",
    "return list(set(alerts))  — the tests expect a list, so do not return the set itself.",
    "Full walkthrough: set(alerts) hashes every item and keeps one copy of each. list(...) turns it back into a list because the caller expects to index the result. Order is not guaranteed, which is why the tests sort before comparing.",
  ],
  errorExplanations: [
    {
      match: "'set' object is not subscriptable",
      title: "Sets cannot be indexed",
      explanation:
        "A set has no positions, so alerts_set[0] has no meaning. If you need a list back, wrap it: list(alerts_set).",
    },
    {
      match: "unhashable type: 'list'",
      title: "Sets can only hold hashable items",
      explanation:
        "You tried to put a list inside a set. Sets need items that never change (strings, numbers, tuples). Put the strings in the set, not the whole list.",
    },
  ],
  anchors: ["sets", "lists"],
  explainWhy: {
    question: "Why does converting to a set remove the duplicates?",
    options: [
      "Sets sort their items, and sorting removes repeats",
      "Sets store items by hash, so a second identical item lands in the same slot and is discarded",
      "Sets only keep the first four items",
      "Lists remove duplicates when passed to a function",
    ],
    correctIndex: 1,
    explanation:
      "A set stores each item by its hash. Adding an item whose hash and value already exist changes nothing, so duplicates vanish for free.",
  },
  reviewVariant: {
    briefing:
      "The perimeter scanner logs every port it sees probed, and a single scanner sweep hits the same port dozens of times. The SOC does not care how many times port 22 was knocked on; they want to know which distinct ports were probed at all, so the exposed surface can be read at a glance.",
    objective:
      "Write a function `probed_ports(hits)` that takes a list of port numbers and returns a set containing each probed port exactly once. The original list must not be modified.",
    starterCode: `# Perimeter scan log. The same ports keep getting probed.
hits = [22, 443, 22, 8080, 443, 22, 3389]

def probed_ports(hits):
    # TODO: return a SET holding each probed port once
    ...

print(probed_ports(hits))
`,
    referenceSolution: `hits = [22, 443, 22, 8080, 443, 22, 3389]

def probed_ports(hits):
    return set(hits)

print(probed_ports(hits))
`,
    tests: {
      visible: `
def test_each_port_once():
    "Each probed port appears exactly once"
    out = solution.probed_ports([22, 443, 22, 8080])
    check(out == {22, 443, 8080}, "Each port should appear exactly once, however many times it was probed")

def test_returns_a_set():
    "Returns a set"
    check(isinstance(solution.probed_ports([22]), set), "The result should be a set, the collection that refuses duplicates")
`,
      hidden: `
def test_empty_log():
    check(solution.probed_ports([]) == set(), "An empty scan log should produce no ports")

def test_thirty_identical():
    check(len(solution.probed_ports([3389] * 30)) == 1, "Thirty probes of the same port should collapse to a single entry")

def test_log_not_modified():
    log = [80, 80, 443]
    solution.probed_ports(log)
    check(log == [80, 80, 443], "The original scan log must not be modified")

def test_only_ports_from_the_log():
    check(solution.probed_ports([53, 25]) == {25, 53}, "The result should contain only ports that were actually probed")
`,
    },
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "alert-bus", level: 2 },
    { kind: "layer", layer: "vault-lights", level: 1 },
    { kind: "stat", stat: "data_integrity", add: 20 },
  ],
  artifacts: ["alert-dedup-analyzer"],
};

export default mission;
