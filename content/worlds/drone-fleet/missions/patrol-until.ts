import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "patrol-until",
  version: 1,
  worldId: "drone-fleet",
  order: 3,
  title: "Patrol Until",
  codename: "DF-03",
  kind: "build",
  difficulty: 3,
  weight: 1,
  estimatedMinutes: 10,
  skills: [
    { id: "while-loops", role: "primary" },
    { id: "for-loops", role: "secondary" },
  ],
  prerequisites: ["battery-sweep"],
  briefing:
    "A patrol drone does not need to look at every sector; it needs to stop at the first one that shows a threat and report where it was. The current sweep flies the whole route regardless, which last week meant a drone was still photographing an empty quarry while an intrusion in sector three went unreported for eleven minutes. Separately, the tower has been guessing how many patrol cycles a battery can sustain before it hits the 10% reserve, and one bad guess already cost an airframe. Both answers depend on repeating something until a condition changes, not on visiting a fixed list.",
  objective:
    "Write `scan_until_threat(sectors)` that walks the list with an index and a while loop and returns the index of the first sector whose \"threat\" is True, or -1 if no sector is threatened. Write `drain(battery, per_cycle)` that returns how many patrol cycles run before the battery falls below 10: a cycle starts only while the battery is at least 10, and each cycle subtracts per_cycle. If per_cycle is 0 or negative, return 0 immediately rather than looping.",
  predictPrompt:
    "Before you run: picture a while loop whose condition is index < len(sectors) and whose body reads sectors[index] but never changes index. How many times does the body run, and what would the fleet controller see?",
  starterCode: `# Patrol sweep. Sectors arrive in the order the drone flies them.
sectors = [
    {"name": "north-1", "threat": False},
    {"name": "north-2", "threat": False},
    {"name": "east-1", "threat": True},
    {"name": "east-2", "threat": False},
]

def scan_until_threat(sectors):
    # TODO: walk the list with an index and a while loop.
    # Stop at the first sector whose "threat" is True and return its index.
    # Return -1 if the whole route is clear.
    index = 0
    ...

def drain(battery, per_cycle):
    # TODO: count patrol cycles while the battery is at least 10.
    # Each cycle subtracts per_cycle. Guard per_cycle <= 0 by returning 0.
    cycles = 0
    ...

print("first threat at:", scan_until_threat(sectors))
print("cycles on a full battery:", drain(100, 30))
`,
  referenceSolution: `sectors = [
    {"name": "north-1", "threat": False},
    {"name": "north-2", "threat": False},
    {"name": "east-1", "threat": True},
    {"name": "east-2", "threat": False},
]

def scan_until_threat(sectors):
    index = 0
    while index < len(sectors):
        if sectors[index]["threat"]:
            return index
        index = index + 1
    return -1

def drain(battery, per_cycle):
    if per_cycle <= 0:
        return 0
    cycles = 0
    while battery >= 10:
        battery = battery - per_cycle
        cycles = cycles + 1
    return cycles

print("first threat at:", scan_until_threat(sectors))
print("cycles on a full battery:", drain(100, 30))
`,
  tests: {
    visible: `
def test_finds_first_threat():
    "scan_until_threat returns the position of the first threatened sector"
    route = [
        {"name": "n-1", "threat": False},
        {"name": "n-2", "threat": False},
        {"name": "e-1", "threat": True},
        {"name": "e-2", "threat": True},
    ]
    check(solution.scan_until_threat(route) == 2, "The result should be the index of the first threatened sector, not a later one")

def test_clear_route():
    "A route with no threat reports -1"
    route = [{"name": "n-1", "threat": False}, {"name": "n-2", "threat": False}]
    check(solution.scan_until_threat(route) == -1, "When no sector is threatened the scan should report the not-found marker")

def test_drain_counts_cycles():
    "drain counts cycles until the battery falls below the reserve"
    check(solution.drain(100, 30) == 4, "A full battery losing 30 per cycle should run a cycle at every reading of 10 or more")

def test_drain_guards_zero_rate():
    "drain returns 0 when per_cycle is zero or negative"
    check(solution.drain(100, 0) == 0, "A per_cycle of zero can never drain the battery, so the answer must be zero rather than an endless loop")
    check(solution.drain(100, -5) == 0, "A negative per_cycle must be rejected with zero")
`,
    hidden: `
def test_threat_at_start():
    route = [{"name": "n-1", "threat": True}, {"name": "n-2", "threat": True}]
    check(solution.scan_until_threat(route) == 0, "A threat in the very first sector should be reported at position zero")

def test_threat_at_end():
    route = [{"name": "n-1", "threat": False}, {"name": "n-2", "threat": False}, {"name": "n-3", "threat": True}]
    check(solution.scan_until_threat(route) == 2, "A threat in the final sector should still be found")

def test_empty_route():
    check(solution.scan_until_threat([]) == -1, "An empty route has no threats and should report the not-found marker")

def test_scan_returns_int():
    check(isinstance(solution.scan_until_threat([{"name": "x", "threat": True}]), int), "scan_until_threat should return a position number")

def test_drain_reserve_boundary():
    check(solution.drain(10, 5) == 1, "A battery exactly at the reserve still starts one more cycle")
    check(solution.drain(9, 5) == 0, "A battery already below the reserve runs no cycles")

def test_drain_large_rate():
    check(solution.drain(100, 200) == 1, "When one cycle drains everything, exactly one cycle runs")

def test_drain_matches_simulation():
    for battery, rate in [(40, 10), (55, 7), (10, 10), (0, 3), (100, 1)]:
        b = battery
        expected = 0
        while b >= 10:
            b = b - rate
            expected = expected + 1
        check(solution.drain(battery, rate) == expected, "drain should count exactly the cycles a step-by-step simulation would run")
`,
  },
  hints: [
    "A for loop promises to visit everything. Neither job here wants that: the scan should stop early, and the drain does not have a list at all, only a number that keeps shrinking. You need a loop that runs as long as some condition holds.",
    "That is the while loop: while condition: body. For the scan, the condition is that the index is still inside the list, and the body checks the current sector and moves the index on. For the drain, the condition is that the battery is still at or above 10, and the body subtracts per_cycle and counts one cycle.",
    "Tiny example on unrelated data: i = 0; while i < len(hosts): if hosts[i] == \"bad\": return i; i = i + 1; return -1. And retries = 0; budget = 50; while budget >= 5: budget = budget - 12; retries = retries + 1 leaves retries at 4.",
    "Shape for scan_until_threat: index = 0; while index < len(sectors): if sectors[index][\"threat\"] is true, return index; otherwise index = index + 1; after the loop return -1. Shape for drain: if per_cycle <= 0 return 0 first; cycles = 0; while battery >= 10: battery = battery - per_cycle; cycles = cycles + 1; return cycles.",
    `def scan_until_threat(sectors):
    index = 0
    while index < len(sectors):
        if sectors[index]["threat"]:
            return index
        index = index + 1
    return -1

# drain: guard per_cycle <= 0, then while battery >= 10 subtract and count`,
    "Full walkthrough: scan_until_threat keeps index inside the list with index < len(sectors), so the last valid position is len(sectors) - 1 and an empty list skips the loop entirely. Inside, a threatened sector returns immediately, which is the early stop; otherwise index = index + 1 moves on, and forgetting that line is what makes a while loop run forever. Falling out of the loop means nothing was found, so -1 is returned. drain first rejects per_cycle <= 0, because subtracting zero or a negative number never lowers the battery and the loop would never end. Then while battery >= 10 keeps running cycles, each one subtracting per_cycle and adding one to the count, until the battery drops under the reserve.",
  ],
  errorExplanations: [
    {
      match: "did not finish in time|TimeoutError",
      title: "The loop never finished",
      explanation:
        "Execution was halted at the time limit. A while loop only ends when its condition becomes false. In the scan, make sure index = index + 1 runs on every pass that does not return. In drain, make sure the battery actually decreases each cycle and that per_cycle <= 0 is rejected before the loop starts.",
    },
    {
      match: "list index out of range",
      title: "The index walked off the end of the route",
      explanation:
        "sectors[index] was asked for a position that does not exist. Valid positions run from 0 to len(sectors) - 1, so the condition must be index < len(sectors), not <=.",
    },
    {
      match: "list indices must be integers or slices, not dict",
      title: "Used the sector record as the index",
      explanation:
        "sectors[sector] passes a whole dict where a position is expected. In a while loop the position is the integer index: read sectors[index][\"threat\"].",
    },
  ],
  anchors: ["while-loops", "for-loops", "conditions"],
  explainWhy: {
    question: "Why is the scan's condition index < len(sectors) rather than index <= len(sectors)?",
    options: [
      "Because <= is not allowed in a while condition",
      "Because list positions run from 0 to len minus 1, so allowing index to equal len would read past the last sector",
      "Because < makes the loop run one extra time to be safe",
      "Because len(sectors) changes while the loop runs",
    ],
    correctIndex: 1,
    explanation:
      "A list of four sectors has positions 0, 1, 2 and 3. When index reaches 4 there is nothing there, and sectors[4] raises IndexError. The strict comparison stops the loop exactly when the positions run out.",
  },
  reviewVariant: {
    briefing:
      "The deployment gate runs its health checks in order and should stop at the first one that fails, reporting its position to the release notes. The retry client, meanwhile, doubles its delay after every failed call and must know how many doublings it takes to hit the configured cap.",
    objective:
      "Write `first_failure(checks)` that uses an index and a while loop to return the index of the first check whose \"ok\" is False, or -1 if all pass. Write `backoff_steps(delay, cap)` that returns how many times delay doubles before it is at least cap; if delay is 0 or negative, return 0 rather than looping.",
    starterCode: `# checks look like {"name": "db", "ok": True}

def first_failure(checks):
    # while the index is inside the list, return it at the first failing check
    i = 0
    ...

def backoff_steps(delay, cap):
    # guard delay <= 0, then double delay and count until delay >= cap
    steps = 0
    ...
`,
    referenceSolution: `def first_failure(checks):
    i = 0
    while i < len(checks):
        if not checks[i]["ok"]:
            return i
        i = i + 1
    return -1

def backoff_steps(delay, cap):
    if delay <= 0:
        return 0
    steps = 0
    while delay < cap:
        delay = delay * 2
        steps = steps + 1
    return steps
`,
    tests: {
      visible: `
def test_first_failure():
    "first_failure reports the position of the first failing check"
    checks = [{"name": "dns", "ok": True}, {"name": "db", "ok": False}, {"name": "cache", "ok": False}]
    check(solution.first_failure(checks) == 1, "The result should be the index of the first check that is not ok")

def test_backoff_steps():
    "backoff_steps counts doublings until the cap is reached"
    check(solution.backoff_steps(1, 16) == 4, "Starting at one second, the delay should double until it reaches the cap")
`,
      hidden: `
def test_all_pass_and_empty():
    check(solution.first_failure([{"name": "a", "ok": True}]) == -1, "When every check passes the not-found marker should be returned")
    check(solution.first_failure([]) == -1, "With no checks there is no failure to report")

def test_backoff_guard():
    check(solution.backoff_steps(0, 16) == 0, "A zero delay can never reach the cap and must be rejected with zero")
    check(solution.backoff_steps(-2, 16) == 0, "A negative delay must be rejected with zero")

def test_backoff_already_at_cap():
    check(solution.backoff_steps(16, 16) == 0, "A delay already at the cap needs no doublings")
    check(solution.backoff_steps(3, 20) == 3, "The count should include the doubling that first reaches or passes the cap")
`,
    },
  },
  timeoutMs: 5000,
  onComplete: [
    { kind: "layer", layer: "control-tower", level: 1 },
    { kind: "layer", layer: "patrol-lanes", level: 1 },
    { kind: "stat", stat: "systems_online", add: 1 },
  ],
  artifacts: ["fleet-batch-processor"],
};

export default mission;
