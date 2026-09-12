import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "fleet-dispatch",
  version: 1,
  worldId: "drone-fleet",
  order: 6,
  title: "Fleet Dispatch",
  codename: "DF-BOSS",
  kind: "boss",
  difficulty: 4,
  weight: 3,
  estimatedMinutes: 22,
  skills: [
    { id: "for-loops", role: "primary" },
    { id: "while-loops", role: "primary" },
    { id: "comprehensions", role: "primary" },
  ],
  prerequisites: ["roll-call", "battery-sweep", "patrol-until", "skip-and-continue", "swarm-comprehension"],
  briefing:
    "Dawn. Five sectors are reporting threats at once and the tower is assigning drones by shouting ids across the room. Two sectors got the same drone, one got a drone with 15% battery that turned back over the fence, and the south sector got nobody because its only drone was offline and nobody checked. The controller needs one dispatch pass that walks the threatened sectors in order, gives each the first eligible drone from its own region, never hands out the same drone twice, and reports both the sectors it could not cover and the drones that are grounded so the crews know where to start.",
  objective:
    "Write `dispatch(drones, sectors)`. Each drone is a dict with \"id\", \"online\", \"battery\" and \"region\"; each sector is a dict with \"name\", \"region\" and \"threat\". Return a dict with three keys. \"assigned\": a dict mapping each threatened sector's \"name\" to the \"id\" of the first drone in roster order that is online, has battery >= 40, is in the same region, and has not already been assigned; process sectors in list order and leave a sector out of \"assigned\" when no such drone exists. \"unassigned\": a list of the threatened sector names that got no drone, in sector order. \"grounded\": a sorted list of the ids of every drone that is offline or has battery below 40. Sectors with \"threat\" False are ignored entirely.",
  predictPrompt:
    "Before you run: the starter has three threatened north sectors and two eligible north drones. Which sector ends up unassigned, and why does south-1 join it even though a south drone exists?",
  starterCode: `# Dispatch inputs as the controller reports them.
drones = [
    {"id": "d-01", "online": True, "battery": 82, "region": "north"},
    {"id": "d-02", "online": False, "battery": 15, "region": "east"},
    {"id": "d-03", "online": True, "battery": 64, "region": "north"},
    {"id": "d-04", "online": True, "battery": 33, "region": "south"},
    {"id": "d-05", "online": True, "battery": 91, "region": "east"},
]
sectors = [
    {"name": "north-1", "region": "north", "threat": True},
    {"name": "north-2", "region": "north", "threat": True},
    {"name": "east-1", "region": "east", "threat": False},
    {"name": "south-1", "region": "south", "threat": True},
    {"name": "north-3", "region": "north", "threat": True},
]

def dispatch(drones, sectors):
    # TODO: return {"assigned": {...}, "unassigned": [...], "grounded": [...]}
    # - walk threatened sectors in order; skip sectors whose threat is False
    # - for each, find the first online drone in the same region with battery >= 40
    #   that has not been used yet; stop searching as soon as one is found
    # - a drone is used at most once
    # - grounded = sorted ids of drones that are offline or below 40
    ...

print(dispatch(drones, sectors))
`,
  referenceSolution: `drones = [
    {"id": "d-01", "online": True, "battery": 82, "region": "north"},
    {"id": "d-02", "online": False, "battery": 15, "region": "east"},
    {"id": "d-03", "online": True, "battery": 64, "region": "north"},
    {"id": "d-04", "online": True, "battery": 33, "region": "south"},
    {"id": "d-05", "online": True, "battery": 91, "region": "east"},
]
sectors = [
    {"name": "north-1", "region": "north", "threat": True},
    {"name": "north-2", "region": "north", "threat": True},
    {"name": "east-1", "region": "east", "threat": False},
    {"name": "south-1", "region": "south", "threat": True},
    {"name": "north-3", "region": "north", "threat": True},
]

def dispatch(drones, sectors):
    used = set()
    assigned = {}
    unassigned = []
    for sector in sectors:
        if not sector["threat"]:
            continue
        chosen = None
        i = 0
        while i < len(drones) and chosen is None:
            drone = drones[i]
            i = i + 1
            if drone["id"] in used:
                continue
            if not drone["online"] or drone["battery"] < 40:
                continue
            if drone["region"] != sector["region"]:
                continue
            chosen = drone["id"]
        if chosen is None:
            unassigned.append(sector["name"])
        else:
            assigned[sector["name"]] = chosen
            used.add(chosen)
    grounded = sorted([d["id"] for d in drones if not d["online"] or d["battery"] < 40])
    return {"assigned": assigned, "unassigned": unassigned, "grounded": grounded}

print(dispatch(drones, sectors))
`,
  tests: {
    visible: `
FLEET = [
    {"id": "d-01", "online": True, "battery": 82, "region": "north"},
    {"id": "d-02", "online": False, "battery": 15, "region": "east"},
    {"id": "d-03", "online": True, "battery": 64, "region": "north"},
    {"id": "d-04", "online": True, "battery": 33, "region": "south"},
    {"id": "d-05", "online": True, "battery": 91, "region": "east"},
]
SECTORS = [
    {"name": "north-1", "region": "north", "threat": True},
    {"name": "north-2", "region": "north", "threat": True},
    {"name": "east-1", "region": "east", "threat": False},
    {"name": "south-1", "region": "south", "threat": True},
    {"name": "north-3", "region": "north", "threat": True},
]

def test_exact_assignment():
    "assigned maps each covered sector to the first eligible drone in its region"
    out = solution.dispatch(FLEET, SECTORS)
    check(isinstance(out, dict) and isinstance(out.get("assigned"), dict), "dispatch should return a dict whose assigned entry is a dict")
    check(out["assigned"] == {"north-1": "d-01", "north-2": "d-03"}, "Each threatened sector should get the first still-free online drone in its region with enough battery; sectors with no candidate must be left out")

def test_unassigned_in_sector_order():
    "unassigned lists the threatened sectors nobody could cover"
    out = solution.dispatch(FLEET, SECTORS)
    check(out.get("unassigned") == ["south-1", "north-3"], "Every threatened sector without an eligible drone should be listed, in sector order, and calm sectors must not appear")

def test_grounded_sorted():
    "grounded lists offline or low-battery drones in sorted order"
    out = solution.dispatch(FLEET, SECTORS)
    check(out.get("grounded") == ["d-02", "d-04"], "grounded should hold exactly the ids that are offline or below the battery floor, sorted")

def test_drone_reuse_prevented():
    "a drone is assigned to at most one sector"
    fleet = [{"id": "d-09", "online": True, "battery": 70, "region": "west"}]
    sectors = [
        {"name": "west-1", "region": "west", "threat": True},
        {"name": "west-2", "region": "west", "threat": True},
    ]
    out = solution.dispatch(fleet, sectors)
    check(out["assigned"] == {"west-1": "d-09"}, "The single eligible drone should go to the first sector only")
    check(out["unassigned"] == ["west-2"], "The second sector in the same region should be reported as uncovered once the drone is taken")

def test_empty_inputs():
    "empty fleets and sector lists produce empty results"
    out = solution.dispatch([], [])
    check(out == {"assigned": {}, "unassigned": [], "grounded": []}, "With nothing to dispatch every part of the result should be empty")
    out = solution.dispatch([], [{"name": "n-1", "region": "north", "threat": True}])
    check(out["assigned"] == {} and out["unassigned"] == ["n-1"], "A threatened sector with no fleet at all is uncovered")
`,
    hidden: `
def test_battery_floor_inclusive():
    fleet = [{"id": "d-40", "online": True, "battery": 40, "region": "n"}, {"id": "d-39", "online": True, "battery": 39, "region": "n"}]
    sectors = [{"name": "n-1", "region": "n", "threat": True}]
    out = solution.dispatch(fleet, sectors)
    check(out["assigned"] == {"n-1": "d-40"}, "A drone exactly at the battery floor is eligible")
    check(out["grounded"] == ["d-39"], "A drone one point below the floor is grounded, and one at the floor is not")

def test_offline_never_assigned():
    fleet = [{"id": "d-off", "online": False, "battery": 100, "region": "n"}, {"id": "d-on", "online": True, "battery": 50, "region": "n"}]
    sectors = [{"name": "n-1", "region": "n", "threat": True}]
    out = solution.dispatch(fleet, sectors)
    check(out["assigned"] == {"n-1": "d-on"}, "An offline drone is never assigned, however full its battery")
    check(out["grounded"] == ["d-off"], "An offline drone is grounded")

def test_region_must_match():
    fleet = [{"id": "d-e", "online": True, "battery": 90, "region": "east"}]
    sectors = [{"name": "n-1", "region": "north", "threat": True}]
    out = solution.dispatch(fleet, sectors)
    check(out["assigned"] == {} and out["unassigned"] == ["n-1"], "A drone from another region must not be assigned")

def test_calm_sectors_ignored():
    fleet = [{"id": "d-1", "online": True, "battery": 90, "region": "n"}]
    sectors = [{"name": "calm", "region": "n", "threat": False}, {"name": "hot", "region": "n", "threat": True}]
    out = solution.dispatch(fleet, sectors)
    check("calm" not in out["assigned"] and "calm" not in out["unassigned"], "A sector with no threat must appear in neither assigned nor unassigned")
    check(out["assigned"] == {"hot": "d-1"}, "The drone should go to the threatened sector, not be consumed by the calm one")

def test_first_in_roster_order():
    fleet = [
        {"id": "d-b", "online": True, "battery": 45, "region": "n"},
        {"id": "d-a", "online": True, "battery": 99, "region": "n"},
    ]
    sectors = [{"name": "n-1", "region": "n", "threat": True}]
    out = solution.dispatch(fleet, sectors)
    check(out["assigned"] == {"n-1": "d-b"}, "The first eligible drone in roster order wins, not the one with the most battery")

def test_grounded_is_sorted_and_complete():
    fleet = [
        {"id": "d-z", "online": False, "battery": 90, "region": "n"},
        {"id": "d-m", "online": True, "battery": 10, "region": "n"},
        {"id": "d-a", "online": True, "battery": 80, "region": "n"},
    ]
    out = solution.dispatch(fleet, [])
    check(out["grounded"] == ["d-m", "d-z"], "grounded should list every offline or low drone exactly once, in sorted order, even with no sectors")
    check(isinstance(out["grounded"], list), "grounded should be a list")

def test_result_keys_exact():
    out = solution.dispatch([], [])
    check(set(out) == {"assigned", "unassigned", "grounded"}, "The result should have exactly the three documented keys")

def test_inputs_not_mutated():
    fleet = [{"id": "d-1", "online": True, "battery": 90, "region": "n"}, {"id": "d-2", "online": False, "battery": 5, "region": "n"}]
    sectors = [{"name": "n-1", "region": "n", "threat": True}, {"name": "n-2", "region": "n", "threat": False}]
    solution.dispatch(fleet, sectors)
    check(len(fleet) == 2 and len(sectors) == 2 and fleet[0]["online"] is True and sectors[1]["threat"] is False, "dispatch must not modify the fleet or the sector list")

def test_scales_to_many():
    fleet = [{"id": "d-%03d" % i, "online": i % 5 != 0, "battery": 30 + (i % 7) * 10, "region": "r%d" % (i % 3)} for i in range(60)]
    sectors = [{"name": "s-%02d" % j, "region": "r%d" % (j % 3), "threat": j % 4 != 0} for j in range(24)]
    out = solution.dispatch(fleet, sectors)
    ids = list(out["assigned"].values())
    check(len(ids) == len(set(ids)), "No drone should be assigned twice even across a large dispatch")
    check(all(name not in out["assigned"] for name in out["unassigned"]), "A sector cannot be both assigned and unassigned")
    by_id = {d["id"]: d for d in fleet}
    for name, did in out["assigned"].items():
        d = by_id[did]
        check(d["online"] and d["battery"] >= 40, "Every assigned drone should be online with enough battery")
`,
  },
  hints: [
    "Break the pass into its three outputs and ask what each one is: a lookup you fill sector by sector, a list you append to when a search comes up empty, and a filtered, sorted list you can build in one expression. Then ask what you must remember between sectors so no drone is handed out twice.",
    "The outer walk is a for over sectors, skipping calm ones with continue. Inside it, the search for a drone is a loop that stops at the first match: a while with an index, or a for with break. A set of used ids remembers what has already been dispatched. grounded is a comprehension with a filter, wrapped in sorted().",
    "Tiny example on unrelated data: taken = set(); for ticket in tickets: pick = None; for eng in engineers: if eng not in taken and eng[\"team\"] == ticket[\"team\"]: pick = eng[\"name\"]; break. Then if pick is None, append the ticket to a queue; otherwise record it and add pick to taken. Separately: busy = sorted([e[\"name\"] for e in engineers if e[\"load\"] > 5]).",
    "Shape: used = set(); assigned = {}; unassigned = []. For each sector: if not threatened, continue. chosen = None; loop over drones and stop at the first one that is not in used, is online, has battery >= 40 and matches the region; set chosen to its id. If chosen is None, append sector name to unassigned; otherwise assigned[name] = chosen and add chosen to used. After the sector loop: grounded = sorted([d[\"id\"] for d in drones if not d[\"online\"] or d[\"battery\"] < 40]). Return the dict with the three keys.",
    `def dispatch(drones, sectors):
    used = set()
    assigned = {}
    unassigned = []
    for sector in sectors:
        if not sector["threat"]:
            continue
        chosen = None
        for drone in drones:
            if drone["id"] in used:
                continue
            if drone["online"] and drone["battery"] >= 40 and drone["region"] == sector["region"]:
                chosen = drone["id"]
                break
        # record chosen in assigned + used, or sector name in unassigned
    # grounded = sorted comprehension over drones; return the three-key dict`,
    "Full walkthrough: used starts as an empty set so membership checks are cheap. The for over sectors uses continue to ignore calm sectors before any work happens. For each threatened sector, chosen starts as None and the inner search walks drones in roster order; a drone already in used is skipped with continue, and the first drone that is online, at or above 40 and in the sector's region becomes chosen, after which break (or a while condition that includes chosen is None) ends the search so a later drone cannot replace it. If chosen is still None the sector name is appended to unassigned, otherwise assigned[sector name] = chosen and used.add(chosen) prevents reuse. After all sectors, grounded = sorted([d[\"id\"] for d in drones if not d[\"online\"] or d[\"battery\"] < 40]) filters and orders in one expression. The function returns {\"assigned\": assigned, \"unassigned\": unassigned, \"grounded\": grounded}, and empty inputs fall through every loop to give empty parts.",
  ],
  errorExplanations: [
    {
      match: "KeyError: '(threat|region|online|battery|id|name)'",
      title: "Read a key from the wrong record",
      explanation:
        "Sectors carry name, region and threat; drones carry id, online, battery and region. Check which loop variable you are reading: sector[\"threat\"] and drone[\"battery\"], never the other way round.",
    },
    {
      match: "'dict' object has no attribute 'append'",
      title: "assigned is a dict, not a list",
      explanation:
        "assigned maps sector name to drone id, so it is filled with assigned[sector[\"name\"]] = chosen. Only unassigned is a list that takes .append.",
    },
    {
      match: "unhashable type: 'dict'",
      title: "Added a whole drone record to the used set",
      explanation:
        "used.add(drone) tries to store a dict in a set. Store the id: used.add(drone[\"id\"]) and test drone[\"id\"] in used.",
    },
  ],
  anchors: ["for-loops", "while-loops", "comprehensions", "sets", "dicts"],
  explainWhy: {
    question: "Why must the inner search stop (break, or a while condition) as soon as it finds an eligible drone?",
    options: [
      "Because Python loops cannot run more than once per sector",
      "Because continuing would let a later eligible drone overwrite chosen, so the sector would get the last candidate instead of the first, and the roster order guarantee would break",
      "Because break is required before used.add will work",
      "Because the sorted grounded list depends on the search ending early",
    ],
    correctIndex: 1,
    explanation:
      "The contract says the first eligible drone in roster order. Without an early stop, every eligible drone after the first would reassign chosen, and the sector would receive whichever came last. Stopping at the first match is the same fix that repaired first_low in the previous mission.",
  },
  reviewVariant: {
    briefing:
      "The SOC routes open alerts to analysts by team. Each open alert should go to the first available analyst on the same team who is not already holding a routed alert from this pass; alerts nobody can take go to the queue.",
    objective:
      "Write `route_alerts(alerts, analysts)`. Alerts are dicts with \"id\", \"team\" and \"open\"; analysts are dicts with \"name\", \"team\" and \"available\". Return a dict with \"routed\": a dict mapping each open alert's id to the name of the first available analyst on the same team not yet used in this pass, and \"queued\": a list of the open alert ids that got nobody, in alert order. Closed alerts are ignored.",
    starterCode: `def route_alerts(alerts, analysts):
    # used = set(); routed = {}; queued = []
    # for each open alert: search analysts in order, stop at the first available
    # same-team analyst not in used; record or queue; return the two-key dict
    ...
`,
    referenceSolution: `def route_alerts(alerts, analysts):
    used = set()
    routed = {}
    queued = []
    for alert in alerts:
        if not alert["open"]:
            continue
        pick = None
        for analyst in analysts:
            if analyst["name"] in used or not analyst["available"]:
                continue
            if analyst["team"] == alert["team"]:
                pick = analyst["name"]
                break
        if pick is None:
            queued.append(alert["id"])
        else:
            routed[alert["id"]] = pick
            used.add(pick)
    return {"routed": routed, "queued": queued}
`,
    tests: {
      visible: `
def test_routes_by_team_without_reuse():
    "route_alerts gives each open alert the first free same-team analyst"
    alerts = [
        {"id": "a-1", "team": "net", "open": True},
        {"id": "a-2", "team": "net", "open": True},
        {"id": "a-3", "team": "idp", "open": False},
        {"id": "a-4", "team": "idp", "open": True},
    ]
    analysts = [
        {"name": "ana", "team": "net", "available": True},
        {"name": "bo", "team": "idp", "available": False},
        {"name": "cy", "team": "idp", "available": True},
    ]
    out = solution.route_alerts(alerts, analysts)
    check(out["routed"] == {"a-1": "ana", "a-4": "cy"}, "Each open alert should get the first available same-team analyst, and an analyst should not be used twice")
    check(out["queued"] == ["a-2"], "Open alerts with nobody free should be queued in order, and closed alerts ignored")
`,
      hidden: `
def test_empty_routing():
    check(solution.route_alerts([], []) == {"routed": {}, "queued": []}, "With nothing to route both parts should be empty")

def test_unavailable_never_routed():
    alerts = [{"id": "a-1", "team": "net", "open": True}]
    analysts = [{"name": "ana", "team": "net", "available": False}]
    out = solution.route_alerts(alerts, analysts)
    check(out["routed"] == {} and out["queued"] == ["a-1"], "An unavailable analyst must not receive an alert")

def test_first_analyst_in_order():
    alerts = [{"id": "a-1", "team": "net", "open": True}]
    analysts = [{"name": "zed", "team": "net", "available": True}, {"name": "amy", "team": "net", "available": True}]
    check(solution.route_alerts(alerts, analysts)["routed"] == {"a-1": "zed"}, "The first matching analyst in list order should be chosen")
`,
    },
  },
  timeoutMs: 5000,
  onComplete: [
    { kind: "layer", layer: "launch-pads", level: 1 },
    { kind: "layer", layer: "hangar-bays", level: 2 },
    { kind: "layer", layer: "drone-swarm", level: 2 },
    { kind: "layer", layer: "control-tower", level: 2 },
    { kind: "layer", layer: "patrol-lanes", level: 2 },
    { kind: "layer", layer: "pad-lights", level: 1 },
    { kind: "stat", stat: "citizens", add: 900 },
    { kind: "stat", stat: "systems_online", add: 2 },
  ],
  artifacts: ["fleet-batch-processor"],
};

export default mission;
