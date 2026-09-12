import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "roll-call",
  version: 1,
  worldId: "drone-fleet",
  order: 1,
  title: "Roll Call",
  codename: "DF-01",
  kind: "build",
  difficulty: 1,
  weight: 1,
  estimatedMinutes: 7,
  skills: [{ id: "for-loops", role: "primary" }],
  prerequisites: [],
  briefing:
    "Two hundred drones sit on the pads and the shift lead needs one number before dawn: how many of them are actually online. Right now an operator opens each drone's record, ticks a tally sheet, and loses count somewhere around forty. The launch queue has the same problem from the other side: it needs every drone id in pad order so it can call them up one at a time, and nobody wants to type two hundred ids by hand.",
  objective:
    "Write `count_online(drones)` that takes a list of drone records (dicts with \"id\", \"online\" and \"battery\") and returns how many records have \"online\" set to True. Write `ids_of(drones)` that returns a list of every record's \"id\" in the same order as the roster. Both must work for an empty roster.",
  predictPrompt:
    "Before you run anything: the starter roster has five drones and two of them are offline. What should count_online return, and how many ids should ids_of list?",
  starterCode: `# Pad roster pulled from the fleet controller. One record per drone.
drones = [
    {"id": "d-01", "online": True, "battery": 82},
    {"id": "d-02", "online": False, "battery": 15},
    {"id": "d-03", "online": True, "battery": 64},
    {"id": "d-04", "online": True, "battery": 47},
    {"id": "d-05", "online": False, "battery": 91},
]

def count_online(drones):
    # TODO: visit every record and count the ones whose "online" is True
    ...

def ids_of(drones):
    # TODO: build a list of every "id", in pad order
    ...

print("online:", count_online(drones))
print("ids:", ids_of(drones))
`,
  referenceSolution: `drones = [
    {"id": "d-01", "online": True, "battery": 82},
    {"id": "d-02", "online": False, "battery": 15},
    {"id": "d-03", "online": True, "battery": 64},
    {"id": "d-04", "online": True, "battery": 47},
    {"id": "d-05", "online": False, "battery": 91},
]

def count_online(drones):
    total = 0
    for drone in drones:
        if drone["online"]:
            total = total + 1
    return total

def ids_of(drones):
    ids = []
    for drone in drones:
        ids.append(drone["id"])
    return ids

print("online:", count_online(drones))
print("ids:", ids_of(drones))
`,
  tests: {
    visible: `
def test_counts_online_in_mixed_roster():
    "count_online counts only the drones that are online"
    fleet = [
        {"id": "d-01", "online": True, "battery": 82},
        {"id": "d-02", "online": False, "battery": 15},
        {"id": "d-03", "online": True, "battery": 64},
    ]
    check(solution.count_online(fleet) == 2, "Only drones whose online flag is True should be counted")

def test_ids_in_pad_order():
    "ids_of returns every id in the same order as the roster"
    fleet = [
        {"id": "d-07", "online": True, "battery": 50},
        {"id": "d-02", "online": False, "battery": 20},
        {"id": "d-09", "online": True, "battery": 70},
    ]
    check(solution.ids_of(fleet) == ["d-07", "d-02", "d-09"], "ids_of should list each id once, in roster order, whether or not the drone is online")

def test_empty_roster():
    "Both functions handle an empty pad"
    check(solution.count_online([]) == 0, "An empty roster has zero online drones")
    check(solution.ids_of([]) == [], "An empty roster has no ids to list")
`,
    hidden: `
def test_single_online():
    check(solution.count_online([{"id": "d-01", "online": True, "battery": 5}]) == 1, "A roster with one online drone should count exactly that drone")

def test_single_offline():
    check(solution.count_online([{"id": "d-01", "online": False, "battery": 99}]) == 0, "Battery level must not affect the online count; an offline drone counts for nothing")

def test_many_drones():
    fleet = [{"id": "d-%02d" % i, "online": i % 3 != 0, "battery": 50} for i in range(1, 61)]
    expected = sum(1 for d in fleet if d["online"])
    check(solution.count_online(fleet) == expected, "The count should scale to a roster of sixty without losing track")
    check(solution.ids_of(fleet) == [d["id"] for d in fleet], "ids_of should return all sixty ids in roster order")

def test_count_is_int():
    check(isinstance(solution.count_online([{"id": "a", "online": True, "battery": 1}]), int), "count_online should return a whole number")

def test_ids_is_list():
    check(isinstance(solution.ids_of([{"id": "a", "online": True, "battery": 1}]), list), "ids_of should return a list the launch queue can index")

def test_does_not_mutate():
    fleet = [{"id": "a", "online": True, "battery": 1}, {"id": "b", "online": False, "battery": 2}]
    solution.count_online(fleet)
    solution.ids_of(fleet)
    check(len(fleet) == 2 and fleet[0]["id"] == "a" and fleet[1]["online"] is False, "The roster must not be modified by counting or listing")
`,
  },
  hints: [
    "You cannot count what you have not visited. The roster is a list, and the same question, 'is this one online?', has to be asked of every record in it, however long the list gets.",
    "A for loop visits each item of a list once: for drone in drones: ... . Inside the body, drone is one dict. Pair the loop with a counter that starts at 0, or an empty list you fill as you go; that running value is called an accumulator.",
    "Tiny example on unrelated data: total = 0, then for port in [22, 80, 443]: total = total + 1, leaves total at 3. And names = [], then for p in [22, 80]: names.append(str(p)), leaves names as ['22', '80'].",
    "Shape for count_online: start a counter at 0; for each drone, if drone[\"online\"] is true, add 1 to the counter; after the loop ends, return the counter. Shape for ids_of: start with an empty list; for each drone, append drone[\"id\"]; return the list after the loop.",
    `def count_online(drones):
    total = 0
    for drone in drones:
        if drone["online"]:
            total = total + 1
    return total

# ids_of follows the same pattern: an empty list, .append inside the loop, return after it`,
    "Full walkthrough: count_online sets total = 0 before the loop so there is something to add to. for drone in drones runs the body once per record; drone[\"online\"] is True only for online drones, so total = total + 1 fires only for them. return total sits after the loop, at the function's indentation, so it runs once everything has been counted. ids_of starts with ids = [], appends drone[\"id\"] on every pass (online or not), and returns the list. Both return sensible values for an empty roster because the loop body simply never runs.",
  ],
  errorExplanations: [
    {
      match: "list indices must be integers or slices, not str",
      title: "Indexed the roster by key instead of the record",
      explanation:
        "drones[\"online\"] asks the whole list for a key. The key belongs to one record: loop with for drone in drones and read drone[\"online\"] inside the body.",
    },
    {
      match: "'dict' object has no attribute 'online'",
      title: "Dict values are read with square brackets",
      explanation:
        "drone.online is attribute syntax; a dict is read by key. Write drone[\"online\"] and drone[\"id\"].",
    },
    {
      match: "expected an indented block|IndentationError",
      title: "The loop body must be indented",
      explanation:
        "Every line that belongs to the for loop (and to the if inside it) must sit one level further right than the line that ends with a colon. The return usually belongs back at the function's level, after the loop.",
    },
  ],
  anchors: ["for-loops", "lists", "dicts"],
  explainWhy: {
    question: "Why does total end up equal to the number of online drones?",
    options: [
      "The for loop counts the list's length and stores it in total",
      "The loop body runs once per record, and total only grows on the passes where the online flag is True",
      "Python adds 1 to any variable named total automatically at the end of a loop",
      "The if statement removes offline drones from the roster before counting",
    ],
    correctIndex: 1,
    explanation:
      "for drone in drones executes the body exactly once for each record. The if gate means the addition happens only for online records, so the accumulator ends at the online count and nothing else.",
  },
  reviewVariant: {
    briefing:
      "The perimeter firewall exports its decisions as a list of records, one per connection. The SOC wants two things from each export: how many connections were denied, and every source address in arrival order so an analyst can replay the sequence.",
    objective:
      "Write `count_denied(entries)` that returns how many records have \"action\" equal to \"deny\", and `sources_of(entries)` that returns a list of every record's \"src\" in arrival order. Each entry is a dict with \"src\" and \"action\".",
    starterCode: `# Firewall decision export. Each entry looks like {"src": "10.0.0.4", "action": "allow"}

def count_denied(entries):
    # loop over entries and count the ones whose action is "deny"
    ...

def sources_of(entries):
    # loop over entries and collect each "src" in order
    ...
`,
    referenceSolution: `def count_denied(entries):
    denied = 0
    for entry in entries:
        if entry["action"] == "deny":
            denied = denied + 1
    return denied

def sources_of(entries):
    sources = []
    for entry in entries:
        sources.append(entry["src"])
    return sources
`,
    tests: {
      visible: `
def test_count_denied():
    "count_denied counts only the deny decisions"
    export = [
        {"src": "10.0.0.4", "action": "allow"},
        {"src": "10.0.0.9", "action": "deny"},
        {"src": "10.0.0.4", "action": "deny"},
    ]
    check(solution.count_denied(export) == 2, "Only entries whose action is deny should be counted")

def test_sources_in_order():
    "sources_of lists every source in arrival order"
    export = [
        {"src": "10.0.0.4", "action": "allow"},
        {"src": "10.0.0.9", "action": "deny"},
    ]
    check(solution.sources_of(export) == ["10.0.0.4", "10.0.0.9"], "Every source should appear in the order it arrived, allowed or denied")
`,
      hidden: `
def test_empty_export():
    check(solution.count_denied([]) == 0, "An empty export has no denied connections")
    check(solution.sources_of([]) == [], "An empty export has no sources")

def test_all_allowed():
    export = [{"src": "10.0.0.1", "action": "allow"}, {"src": "10.0.0.2", "action": "allow"}]
    check(solution.count_denied(export) == 0, "An export with no deny decisions should count zero")

def test_repeated_sources_kept():
    export = [{"src": "10.0.0.1", "action": "deny"}, {"src": "10.0.0.1", "action": "deny"}]
    check(solution.sources_of(export) == ["10.0.0.1", "10.0.0.1"], "A source that connects twice should be listed twice, once per entry")
    check(isinstance(solution.sources_of(export), list), "sources_of should return a list")
`,
    },
  },
  timeoutMs: 5000,
  onComplete: [
    { kind: "layer", layer: "launch-pads", level: 1 },
    { kind: "layer", layer: "hangar-bays", level: 1 },
    { kind: "stat", stat: "structures", add: 2 },
  ],
  artifacts: ["fleet-batch-processor"],
};

export default mission;
