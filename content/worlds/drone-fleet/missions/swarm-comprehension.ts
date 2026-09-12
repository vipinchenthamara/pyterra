import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "swarm-comprehension",
  version: 1,
  worldId: "drone-fleet",
  order: 5,
  title: "Swarm Comprehension",
  codename: "DF-05",
  kind: "refactor",
  difficulty: 3,
  weight: 1,
  estimatedMinutes: 10,
  skills: [
    { id: "comprehensions", role: "primary" },
    { id: "for-loops", role: "secondary" },
  ],
  prerequisites: ["skip-and-continue"],
  briefing:
    "The swarm controller rebuilds three views of the fleet every second: which ids are online, which regions the swarm covers, and each drone's battery by id. The code that does it is twelve lines of empty-list-then-append, and the regions view is a list that removes duplicates by hand, which is why the dispatcher crashed last night when it tried to call .add() on it. The views are correct today. They are also three times longer than they need to be, and the wrong type in one place.",
  objective:
    "Keep the three results, change how they are built. `online_ids` must be a list of the ids of drones whose \"online\" is True, in roster order, built with a list comprehension. `regions` must be a set of every distinct \"region\", built with a set comprehension (a real set, not a deduplicated list). `battery_by_id` must be a dict mapping each drone's \"id\" to its \"battery\", built with a dict comprehension. All three read from `drones`; each should be a single expression.",
  predictPrompt:
    "Before editing: the starter's regions block already removes duplicates. What type is regions when that block finishes, and why does a dispatcher that calls regions.add(\"west\") crash?",
  starterCode: `# Swarm telemetry snapshot. One record per drone.
drones = [
    {"id": "d-01", "online": True, "battery": 82, "region": "north"},
    {"id": "d-02", "online": False, "battery": 15, "region": "east"},
    {"id": "d-03", "online": True, "battery": 64, "region": "north"},
    {"id": "d-04", "online": True, "battery": 47, "region": "south"},
    {"id": "d-05", "online": False, "battery": 91, "region": "east"},
]

# --- Block 1: ids of the online drones. Works. Four lines for one idea. ---
online_ids = []
for d in drones:
    if d["online"]:
        online_ids.append(d["id"])

# --- Block 2: the regions the swarm covers. Works, but it is a list that
# dedups by hand. The dispatcher needs a SET. ---
regions = []
for d in drones:
    if d["region"] not in regions:
        regions.append(d["region"])

# --- Block 3: battery by id. Works. ---
battery_by_id = {}
for d in drones:
    battery_by_id[d["id"]] = d["battery"]

# TODO: rewrite each block as one comprehension:
#   online_ids    -> a list comprehension with a filter
#   regions       -> a set comprehension
#   battery_by_id -> a dict comprehension

print(online_ids)
print(regions)
print(battery_by_id)
`,
  referenceSolution: `drones = [
    {"id": "d-01", "online": True, "battery": 82, "region": "north"},
    {"id": "d-02", "online": False, "battery": 15, "region": "east"},
    {"id": "d-03", "online": True, "battery": 64, "region": "north"},
    {"id": "d-04", "online": True, "battery": 47, "region": "south"},
    {"id": "d-05", "online": False, "battery": 91, "region": "east"},
]

online_ids = [d["id"] for d in drones if d["online"]]
regions = {d["region"] for d in drones}
battery_by_id = {d["id"]: d["battery"] for d in drones}

print(online_ids)
print(regions)
print(battery_by_id)
`,
  tests: {
    visible: `
def test_online_ids_is_filtered_list():
    "online_ids is a list of the online ids in roster order"
    ids = getattr(solution, "online_ids", None)
    check(isinstance(ids, list), "online_ids should be a list so the dispatcher can index it")
    expected = [d["id"] for d in solution.drones if d["online"]]
    check(ids == expected, "online_ids should hold exactly the ids whose online flag is True, in roster order")

def test_regions_is_a_set():
    "regions is a set of the distinct regions"
    regions = getattr(solution, "regions", None)
    check(isinstance(regions, set), "regions should be a real set, so .add and membership work the way the dispatcher expects")
    check(regions == {d["region"] for d in solution.drones}, "regions should contain each region covered by the swarm exactly once")

def test_battery_by_id_is_dict():
    "battery_by_id maps every id to its battery"
    table = getattr(solution, "battery_by_id", None)
    check(isinstance(table, dict), "battery_by_id should be a dictionary keyed by id")
    check(table == {d["id"]: d["battery"] for d in solution.drones}, "battery_by_id should map every drone id to that drone's battery and nothing else")
`,
    hidden: `
def test_online_ids_are_all_online():
    by_id = {d["id"]: d for d in solution.drones}
    for i in solution.online_ids:
        check(i in by_id and by_id[i]["online"] is True, "Every id in online_ids should belong to an online drone")

def test_offline_ids_excluded():
    for d in solution.drones:
        if not d["online"]:
            check(d["id"] not in solution.online_ids, "Offline drones must not appear in online_ids")

def test_regions_has_no_extras():
    all_regions = set(d["region"] for d in solution.drones)
    check(len(solution.regions) == len(all_regions), "regions should hold each region once and nothing that is not in the roster")
    check(all(isinstance(r, str) for r in solution.regions), "regions should hold region names, not whole records")

def test_battery_by_id_covers_every_drone():
    check(set(solution.battery_by_id) == set(d["id"] for d in solution.drones), "battery_by_id should have one key per drone, online or not")
    for d in solution.drones:
        check(solution.battery_by_id[d["id"]] == d["battery"], "Each id should map to that drone's own battery reading")

def test_roster_untouched():
    check(len(solution.drones) == 5, "The roster must not be modified while building the views")
`,
  },
  hints: [
    "Each block does one thing: take every record, maybe keep only some, and pull out one value per record into a new collection. Python has a single-expression form for exactly that pattern, and the brackets you open decide which collection you get.",
    "A comprehension: [expr for item in items if cond] builds a list; {expr for item in items} builds a set; {key: value for item in items} builds a dict. The loop and the append disappear into the brackets.",
    "Tiny example on unrelated data: open_ports = [p[\"port\"] for p in scan if p[\"open\"]]; families = {p[\"proto\"] for p in scan}; state_by_port = {p[\"port\"]: p[\"state\"] for p in scan}.",
    "Shape: online_ids = [ the id of d, for each d in drones, if d is online ]. regions = { the region of d, for each d in drones } with curly braces and no colon. battery_by_id = { the id of d : the battery of d, for each d in drones } with a colon between key and value.",
    `online_ids = [d["id"] for d in drones if d["online"]]
regions = {d["region"] for d in drones}
# battery_by_id: same as regions but with d["id"]: d["battery"] before the for`,
    "Full walkthrough: online_ids = [d[\"id\"] for d in drones if d[\"online\"]] reads left to right as 'the id of d, for every d in drones, if d is online': the if is the filter that the old block expressed with an indented if. regions = {d[\"region\"] for d in drones} uses curly braces with a single expression, so it is a set comprehension; the set itself refuses duplicates, which is why the hand-written not in check is no longer needed and why .add works afterwards. battery_by_id = {d[\"id\"]: d[\"battery\"] for d in drones} uses curly braces with a colon, so it is a dict comprehension, one key-value pair per record. Twelve lines become three, and the regions view finally has the right type.",
  ],
  errorExplanations: [
    {
      match: "'list' object has no attribute 'add'",
      title: "regions is still a list",
      explanation:
        "The dispatcher calls .add(), which only sets have. Build regions with curly braces and no colon: {d[\"region\"] for d in drones}.",
    },
    {
      match: "unhashable type: 'dict'",
      title: "Put whole records into the set",
      explanation:
        "{d for d in drones} tries to store each dict in a set, and dicts cannot be hashed. Store the value you want: {d[\"region\"] for d in drones}.",
    },
    {
      match: "invalid syntax",
      title: "Comprehension parts are out of order",
      explanation:
        "The order inside the brackets is fixed: the expression first, then for item in items, then an optional if condition at the end. For a dict, the expression is key: value.",
    },
  ],
  anchors: ["comprehensions", "for-loops", "sets", "dicts"],
  explainWhy: {
    question: "Why is a set comprehension the right tool for regions rather than the hand-deduplicated list?",
    options: [
      "Sets keep the regions in alphabetical order",
      "A set enforces uniqueness itself, so the not in check disappears, and the result has the type the dispatcher actually needs",
      "Set comprehensions run in parallel across the roster",
      "Lists cannot hold strings that repeat",
    ],
    correctIndex: 1,
    explanation:
      "The old block re-walked the growing list on every record to avoid duplicates, and still ended up with a list. A set comprehension hands uniqueness to the set, costs one hashed insert per record, and produces the collection with .add and fast membership that the caller expected all along.",
  },
  reviewVariant: {
    briefing:
      "The endpoint inventory arrives as a list of host records. The patch team wants the hostnames that are still unpatched, the security lead wants the distinct operating system families in the estate, and the capacity planner wants a lookup of CPU count by hostname. Each view is one collection built from the same list.",
    objective:
      "From `hosts`, build `unpatched` as a list of the \"hostname\" values whose \"patched\" is False, in inventory order, with a list comprehension; `os_families` as a set of every distinct \"os\" with a set comprehension; and `cpu_by_host` as a dict mapping each \"hostname\" to its \"cpu\" with a dict comprehension.",
    starterCode: `hosts = [
    {"hostname": "web-01", "os": "linux", "patched": True, "cpu": 4},
    {"hostname": "db-01", "os": "linux", "patched": False, "cpu": 16},
    {"hostname": "ad-01", "os": "windows", "patched": False, "cpu": 8},
    {"hostname": "app-02", "os": "linux", "patched": True, "cpu": 4},
]

# unpatched = a list comprehension: hostnames where patched is False
# os_families = a set comprehension of the os values
# cpu_by_host = a dict comprehension: hostname -> cpu
`,
    referenceSolution: `hosts = [
    {"hostname": "web-01", "os": "linux", "patched": True, "cpu": 4},
    {"hostname": "db-01", "os": "linux", "patched": False, "cpu": 16},
    {"hostname": "ad-01", "os": "windows", "patched": False, "cpu": 8},
    {"hostname": "app-02", "os": "linux", "patched": True, "cpu": 4},
]

unpatched = [h["hostname"] for h in hosts if not h["patched"]]
os_families = {h["os"] for h in hosts}
cpu_by_host = {h["hostname"]: h["cpu"] for h in hosts}
`,
    tests: {
      visible: `
def test_unpatched_list():
    "unpatched lists the unpatched hostnames in inventory order"
    out = getattr(solution, "unpatched", None)
    check(isinstance(out, list), "unpatched should be a list")
    check(out == [h["hostname"] for h in solution.hosts if not h["patched"]], "unpatched should hold exactly the hostnames whose patched flag is False, in order")

def test_os_families_set():
    "os_families is a set of distinct operating systems"
    out = getattr(solution, "os_families", None)
    check(isinstance(out, set), "os_families should be a set")
    check(out == {h["os"] for h in solution.hosts}, "os_families should contain each operating system once")

def test_cpu_by_host_dict():
    "cpu_by_host maps every hostname to its cpu count"
    out = getattr(solution, "cpu_by_host", None)
    check(isinstance(out, dict), "cpu_by_host should be a dictionary")
    check(out == {h["hostname"]: h["cpu"] for h in solution.hosts}, "cpu_by_host should map each hostname to that host's cpu count")
`,
      hidden: `
def test_patched_hosts_excluded():
    for h in solution.hosts:
        if h["patched"]:
            check(h["hostname"] not in solution.unpatched, "Patched hosts must not appear in unpatched")

def test_os_families_strings():
    check(all(isinstance(o, str) for o in solution.os_families), "os_families should hold operating system names, not records")

def test_cpu_lookup_every_host():
    for h in solution.hosts:
        check(solution.cpu_by_host.get(h["hostname"]) == h["cpu"], "Every host should be present in cpu_by_host with its own cpu count")
`,
    },
  },
  timeoutMs: 5000,
  onComplete: [
    { kind: "layer", layer: "drone-swarm", level: 2 },
    { kind: "layer", layer: "pad-lights", level: 1 },
    { kind: "stat", stat: "structures", add: 1 },
  ],
  artifacts: [],
};

export default mission;
