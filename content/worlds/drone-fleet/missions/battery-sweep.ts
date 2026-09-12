import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "battery-sweep",
  version: 1,
  worldId: "drone-fleet",
  order: 2,
  title: "Battery Sweep",
  codename: "DF-02",
  kind: "build",
  difficulty: 2,
  weight: 1,
  estimatedMinutes: 9,
  skills: [{ id: "for-loops", role: "primary" }],
  prerequisites: ["roll-call"],
  briefing:
    "A drone went down over the east perimeter last night with 4% battery, and nobody had noticed because the dashboard shows two hundred separate numbers and no summary. Before the next sortie the tower needs three answers from the roster: the single lowest battery reading in the fleet, the total flight minutes logged across every airframe, and the list of drone ids that must go to the chargers before they are allowed off the pad. The roster is a list of records, so a plain min() over it will not tell you the battery.",
  objective:
    "Write `lowest_battery(drones)` that returns the smallest \"battery\" value across the records, tracked inside a loop, and returns None for an empty roster. Write `total_flight_minutes(drones)` that returns the sum of every record's \"minutes\" (0 for an empty roster). Write `needs_charge(drones, threshold)` that returns a list of the ids whose \"battery\" is strictly below threshold, in roster order; a drone exactly at the threshold does not need charging.",
  predictPrompt:
    "Before you run: the starter batteries are 82, 15, 64, 47 and 91. With a threshold of 50, which ids should needs_charge return? Now change the threshold to 47: does d-04 still appear?",
  starterCode: `# Roster with telemetry. "minutes" is total flight time logged by that airframe.
drones = [
    {"id": "d-01", "online": True, "battery": 82, "minutes": 340},
    {"id": "d-02", "online": False, "battery": 15, "minutes": 1210},
    {"id": "d-03", "online": True, "battery": 64, "minutes": 95},
    {"id": "d-04", "online": True, "battery": 47, "minutes": 620},
    {"id": "d-05", "online": False, "battery": 91, "minutes": 0},
]

def lowest_battery(drones):
    # TODO: track the smallest "battery" seen so far while looping.
    # Return None if the roster is empty.
    ...

def total_flight_minutes(drones):
    # TODO: add every record's "minutes" into a running total
    ...

def needs_charge(drones, threshold):
    # TODO: collect the ids whose "battery" is below threshold, in roster order
    ...

print("lowest:", lowest_battery(drones))
print("minutes:", total_flight_minutes(drones))
print("to charge:", needs_charge(drones, 50))
`,
  referenceSolution: `drones = [
    {"id": "d-01", "online": True, "battery": 82, "minutes": 340},
    {"id": "d-02", "online": False, "battery": 15, "minutes": 1210},
    {"id": "d-03", "online": True, "battery": 64, "minutes": 95},
    {"id": "d-04", "online": True, "battery": 47, "minutes": 620},
    {"id": "d-05", "online": False, "battery": 91, "minutes": 0},
]

def lowest_battery(drones):
    lowest = None
    for drone in drones:
        if lowest is None or drone["battery"] < lowest:
            lowest = drone["battery"]
    return lowest

def total_flight_minutes(drones):
    total = 0
    for drone in drones:
        total = total + drone["minutes"]
    return total

def needs_charge(drones, threshold):
    flagged = []
    for drone in drones:
        if drone["battery"] < threshold:
            flagged.append(drone["id"])
    return flagged

print("lowest:", lowest_battery(drones))
print("minutes:", total_flight_minutes(drones))
print("to charge:", needs_charge(drones, 50))
`,
  tests: {
    visible: `
def test_lowest_battery():
    "lowest_battery finds the smallest reading wherever it sits in the roster"
    fleet = [
        {"id": "d-01", "online": True, "battery": 82, "minutes": 10},
        {"id": "d-02", "online": True, "battery": 15, "minutes": 10},
        {"id": "d-03", "online": True, "battery": 64, "minutes": 10},
    ]
    check(solution.lowest_battery(fleet) == 15, "The result should be the smallest battery value in the roster, not the first or last")

def test_total_minutes():
    "total_flight_minutes sums every record"
    fleet = [
        {"id": "d-01", "online": True, "battery": 82, "minutes": 340},
        {"id": "d-02", "online": False, "battery": 15, "minutes": 1210},
        {"id": "d-03", "online": True, "battery": 64, "minutes": 95},
    ]
    check(solution.total_flight_minutes(fleet) == 340 + 1210 + 95, "The total should be the sum of every record's minutes, online or not")

def test_needs_charge_below_threshold():
    "needs_charge lists ids strictly below the threshold, in roster order"
    fleet = [
        {"id": "d-01", "online": True, "battery": 82, "minutes": 0},
        {"id": "d-02", "online": False, "battery": 15, "minutes": 0},
        {"id": "d-03", "online": True, "battery": 64, "minutes": 0},
        {"id": "d-04", "online": True, "battery": 47, "minutes": 0},
    ]
    check(solution.needs_charge(fleet, 50) == ["d-02", "d-04"], "Every id with a battery below the threshold should be listed, in roster order, and nothing else")

def test_empty_roster():
    "An empty roster gives None, 0 and an empty list"
    check(solution.lowest_battery([]) is None, "With no drones there is no lowest battery, so the result should be None")
    check(solution.total_flight_minutes([]) == 0, "With no drones the total flight time should be zero")
    check(solution.needs_charge([], 50) == [], "With no drones nothing needs charging")
`,
    hidden: `
def test_threshold_boundary():
    fleet = [{"id": "d-04", "online": True, "battery": 47, "minutes": 0}]
    check(solution.needs_charge(fleet, 47) == [], "A drone exactly at the threshold does not need charging")
    check(solution.needs_charge(fleet, 48) == ["d-04"], "A drone one point below the threshold does need charging")

def test_lowest_with_ties_and_single():
    fleet = [{"id": "a", "online": True, "battery": 30, "minutes": 1}, {"id": "b", "online": True, "battery": 30, "minutes": 1}]
    check(solution.lowest_battery(fleet) == 30, "When several drones share the lowest reading, that reading should still be returned")
    check(solution.lowest_battery([{"id": "a", "online": True, "battery": 5, "minutes": 1}]) == 5, "A single-drone roster's lowest battery is that drone's battery")

def test_lowest_when_first_is_lowest():
    fleet = [{"id": "a", "online": True, "battery": 3, "minutes": 1}, {"id": "b", "online": True, "battery": 90, "minutes": 1}]
    check(solution.lowest_battery(fleet) == 3, "The lowest reading should be found even when it is the very first record")

def test_lowest_returns_number_not_record():
    fleet = [{"id": "a", "online": True, "battery": 12, "minutes": 1}]
    check(isinstance(solution.lowest_battery(fleet), int), "lowest_battery should return the battery number itself, not the whole record")

def test_total_scales():
    fleet = [{"id": "d-%03d" % i, "online": True, "battery": 50, "minutes": i} for i in range(1, 101)]
    check(solution.total_flight_minutes(fleet) == sum(range(1, 101)), "The total should be correct across a hundred records")

def test_needs_charge_ignores_online_flag():
    fleet = [{"id": "off", "online": False, "battery": 5, "minutes": 0}, {"id": "on", "online": True, "battery": 5, "minutes": 0}]
    check(solution.needs_charge(fleet, 10) == ["off", "on"], "needs_charge is about battery only; offline drones with low battery still need the charger")

def test_needs_charge_returns_list_of_ids():
    fleet = [{"id": "x", "online": True, "battery": 1, "minutes": 0}]
    out = solution.needs_charge(fleet, 10)
    check(isinstance(out, list) and out and isinstance(out[0], str), "needs_charge should return a list of id strings, not records")

def test_does_not_mutate():
    fleet = [{"id": "a", "online": True, "battery": 40, "minutes": 7}, {"id": "b", "online": True, "battery": 20, "minutes": 3}]
    solution.lowest_battery(fleet)
    solution.total_flight_minutes(fleet)
    solution.needs_charge(fleet, 30)
    check(len(fleet) == 2 and fleet[0]["battery"] == 40 and fleet[1]["minutes"] == 3, "The roster must not be modified by any of the sweeps")
`,
  },
  hints: [
    "All three answers are the same move: walk the roster once, and carry something with you as you go. What you carry differs: the smallest reading so far, a running total, or the ids collected so far.",
    "That carried value is an accumulator. Declare it before the for loop, update it inside the body, return it after the loop. For the lowest reading, start with None so that the first drone always replaces it; for the total, start with 0; for the ids, start with an empty list.",
    "Tiny example on unrelated data: smallest = None; for latency in [40, 12, 55]: if smallest is None or latency < smallest: smallest = latency. After the loop smallest is 12. And total = 0; for n in [1, 2, 3]: total = total + n gives 6.",
    "Shape for lowest_battery: lowest = None; for each drone, if lowest is None or drone[\"battery\"] < lowest, set lowest to drone[\"battery\"]; return lowest. Shape for total_flight_minutes: total = 0; add drone[\"minutes\"] each pass; return total. Shape for needs_charge: flagged = []; if drone[\"battery\"] < threshold, append drone[\"id\"]; return flagged.",
    `def lowest_battery(drones):
    lowest = None
    for drone in drones:
        if lowest is None or drone["battery"] < lowest:
            lowest = drone["battery"]
    return lowest

def total_flight_minutes(drones):
    total = 0
    for drone in drones:
        total = total + drone["minutes"]
    return total

# needs_charge: flagged = [], append drone["id"] when battery < threshold, return flagged`,
    "Full walkthrough: lowest_battery starts with lowest = None. On the first record the left side of the or is true, so lowest becomes that battery; on every later record only a strictly smaller reading replaces it. An empty roster never enters the loop and returns None as required. total_flight_minutes starts at 0 and adds drone[\"minutes\"] on every pass, so it is 0 for an empty roster and the full sum otherwise. needs_charge starts with an empty list and appends drone[\"id\"] only when drone[\"battery\"] < threshold; because < is strict, a drone exactly at the threshold is left alone, and because the loop follows roster order, so does the list.",
  ],
  errorExplanations: [
    {
      match: "'<' not supported between instances of 'dict' and",
      title: "Compared the whole record instead of its battery",
      explanation:
        "drone < lowest compares a dict to a number. Compare the field: drone[\"battery\"] < lowest.",
    },
    {
      match: "'<' not supported between instances of 'int' and 'NoneType'",
      title: "Compared against None on the first pass",
      explanation:
        "lowest starts as None, so drone[\"battery\"] < lowest fails on the first drone. Guard it: if lowest is None or drone[\"battery\"] < lowest.",
    },
    {
      match: "unsupported operand type\\(s\\) for \\+=?: 'int' and 'dict'",
      title: "Added the record instead of its minutes",
      explanation:
        "total + drone tries to add a dict to a number. Add the field you want: total = total + drone[\"minutes\"].",
    },
  ],
  anchors: ["for-loops", "dicts", "conditions"],
  explainWhy: {
    question: "Why does lowest_battery start with None rather than 0?",
    options: [
      "None is faster to compare than a number",
      "Starting at 0 would never be replaced, because every real battery reading is larger than 0, and an empty roster must report None anyway",
      "Python requires accumulators to start as None",
      "0 would make the loop run one extra time",
    ],
    correctIndex: 1,
    explanation:
      "An accumulator that tracks a minimum must start in a state that the first real value always beats. 0 is already below every battery, so the loop would return 0 for a fully charged fleet. None means 'nothing seen yet', and doubles as the correct answer for an empty roster.",
  },
  reviewVariant: {
    briefing:
      "The patch compliance scanner returns one record per host with the number of days since it was last patched. The change board wants the single worst case in the estate and the list of hostnames that have blown past the patching SLA.",
    objective:
      "Write `oldest_patch_age(hosts)` that returns the largest \"days_since_patch\" across the records, tracked inside a loop, or None for an empty list. Write `overdue_hosts(hosts, limit)` that returns a list of the \"hostname\" values whose \"days_since_patch\" is strictly greater than limit, in scan order.",
    starterCode: `# Scanner output. Each host looks like {"hostname": "web-01", "days_since_patch": 12}

def oldest_patch_age(hosts):
    # carry the largest days_since_patch seen so far; None if there are no hosts
    ...

def overdue_hosts(hosts, limit):
    # collect hostnames whose days_since_patch is greater than limit
    ...
`,
    referenceSolution: `def oldest_patch_age(hosts):
    oldest = None
    for host in hosts:
        if oldest is None or host["days_since_patch"] > oldest:
            oldest = host["days_since_patch"]
    return oldest

def overdue_hosts(hosts, limit):
    overdue = []
    for host in hosts:
        if host["days_since_patch"] > limit:
            overdue.append(host["hostname"])
    return overdue
`,
    tests: {
      visible: `
def test_oldest_patch_age():
    "oldest_patch_age returns the largest gap in the estate"
    estate = [
        {"hostname": "web-01", "days_since_patch": 12},
        {"hostname": "db-01", "days_since_patch": 61},
        {"hostname": "app-02", "days_since_patch": 30},
    ]
    check(solution.oldest_patch_age(estate) == 61, "The result should be the largest days_since_patch value, wherever it sits in the list")

def test_overdue_hosts():
    "overdue_hosts lists hostnames past the limit in scan order"
    estate = [
        {"hostname": "web-01", "days_since_patch": 12},
        {"hostname": "db-01", "days_since_patch": 61},
        {"hostname": "app-02", "days_since_patch": 30},
    ]
    check(solution.overdue_hosts(estate, 29) == ["db-01", "app-02"], "Every host strictly past the limit should be listed by hostname, in scan order")
`,
      hidden: `
def test_empty_estate():
    check(solution.oldest_patch_age([]) is None, "With no hosts there is no oldest patch age, so the result should be None")
    check(solution.overdue_hosts([], 30) == [], "With no hosts nothing is overdue")

def test_limit_boundary():
    estate = [{"hostname": "web-01", "days_since_patch": 30}]
    check(solution.overdue_hosts(estate, 30) == [], "A host exactly at the limit is not overdue")
    check(solution.overdue_hosts(estate, 29) == ["web-01"], "A host one day past the limit is overdue")

def test_oldest_is_number():
    estate = [{"hostname": "web-01", "days_since_patch": 3}]
    check(solution.oldest_patch_age(estate) == 3 and isinstance(solution.oldest_patch_age(estate), int), "oldest_patch_age should return the number of days, not the host record")
`,
    },
  },
  timeoutMs: 5000,
  onComplete: [
    { kind: "layer", layer: "pad-lights", level: 1 },
    { kind: "layer", layer: "hangar-bays", level: 2 },
    { kind: "stat", stat: "power", add: 20 },
  ],
  artifacts: [],
};

export default mission;
