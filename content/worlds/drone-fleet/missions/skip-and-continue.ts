import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "skip-and-continue",
  version: 1,
  worldId: "drone-fleet",
  order: 4,
  title: "Skip and Continue",
  codename: "DF-04",
  kind: "fix-bug",
  difficulty: 3,
  weight: 1,
  estimatedMinutes: 8,
  skills: [
    { id: "for-loops", role: "primary" },
    { id: "while-loops", role: "secondary" },
  ],
  prerequisites: ["patrol-until"],
  briefing:
    "The overnight battery audit came back clean, which is impossible: three online drones are sitting at 12%. Someone read the code and found the audit loop hits an offline drone in pad two and simply stops, so everything after it is never inspected. The second tool in the same file is meant to name the first drone that needs a charger so the crew can start there; it names the last one instead, and the crew has been walking to the wrong end of the hangar all week. Both loops run without error. Both lie.",
  objective:
    "Fix `audit(drones)` so it returns the ids of the ONLINE drones whose \"battery\" is below 30, in roster order, skipping offline drones without ending the audit. Fix `first_low(drones)` so it returns the id of the FIRST drone in roster order whose \"battery\" is below 30, whatever its online state, or None if there is none. Change only what is wrong; both functions already have the right shape.",
  predictPrompt:
    "Before you run: the starter audit loop meets an offline drone at position 2 of 5. Which drones does it inspect after that, and what does that do to the result?",
  starterCode: `# Overnight audit. Every loop here runs without raising. Every result is wrong.
drones = [
    {"id": "d-01", "online": True, "battery": 12},
    {"id": "d-02", "online": False, "battery": 8},
    {"id": "d-03", "online": True, "battery": 64},
    {"id": "d-04", "online": True, "battery": 21},
    {"id": "d-05", "online": True, "battery": 29},
]

def audit(drones):
    flagged = []
    for drone in drones:
        if not drone["online"]:
            break          # TODO: an offline drone on pad two hides every drone after it
        if drone["battery"] < 30:
            flagged.append(drone["id"])
    return flagged

def first_low(drones):
    found = None
    for drone in drones:
        if drone["battery"] < 30:
            found = drone["id"]   # TODO: the crew is sent to the LAST low drone, not the first
    return found

print("audit:", audit(drones))
print("start with:", first_low(drones))
`,
  referenceSolution: `drones = [
    {"id": "d-01", "online": True, "battery": 12},
    {"id": "d-02", "online": False, "battery": 8},
    {"id": "d-03", "online": True, "battery": 64},
    {"id": "d-04", "online": True, "battery": 21},
    {"id": "d-05", "online": True, "battery": 29},
]

def audit(drones):
    flagged = []
    for drone in drones:
        if not drone["online"]:
            continue
        if drone["battery"] < 30:
            flagged.append(drone["id"])
    return flagged

def first_low(drones):
    found = None
    for drone in drones:
        if drone["battery"] < 30:
            found = drone["id"]
            break
    return found

print("audit:", audit(drones))
print("start with:", first_low(drones))
`,
  tests: {
    visible: `
def test_audit_continues_past_offline():
    "audit keeps inspecting after an offline drone"
    fleet = [
        {"id": "d-01", "online": False, "battery": 8},
        {"id": "d-02", "online": True, "battery": 12},
        {"id": "d-03", "online": True, "battery": 64},
        {"id": "d-04", "online": True, "battery": 21},
    ]
    check(solution.audit(fleet) == ["d-02", "d-04"], "Every online drone below the limit should be flagged, even the ones that come after an offline drone")

def test_audit_excludes_offline_low():
    "audit does not flag offline drones, however low their battery"
    fleet = [
        {"id": "d-01", "online": True, "battery": 12},
        {"id": "d-02", "online": False, "battery": 3},
    ]
    check(solution.audit(fleet) == ["d-01"], "An offline drone is skipped, not flagged, even with a very low battery")

def test_first_low_is_the_first():
    "first_low names the first low drone in roster order"
    fleet = [
        {"id": "d-01", "online": True, "battery": 30},
        {"id": "d-02", "online": True, "battery": 12},
        {"id": "d-03", "online": True, "battery": 5},
    ]
    check(solution.first_low(fleet) == "d-02", "The result should be the earliest drone below the limit, not a later one")

def test_first_low_none():
    "first_low returns None when no drone is low"
    fleet = [{"id": "d-01", "online": True, "battery": 30}, {"id": "d-02", "online": True, "battery": 80}]
    check(solution.first_low(fleet) is None, "When no drone is below the limit there is nothing to start with, so None is expected")
`,
    hidden: `
def test_audit_empty_and_all_offline():
    check(solution.audit([]) == [], "An empty roster produces an empty audit")
    fleet = [{"id": "a", "online": False, "battery": 1}, {"id": "b", "online": False, "battery": 2}]
    check(solution.audit(fleet) == [], "A roster of offline drones produces an empty audit rather than an error")

def test_audit_boundary():
    fleet = [{"id": "a", "online": True, "battery": 30}, {"id": "b", "online": True, "battery": 29}]
    check(solution.audit(fleet) == ["b"], "A drone exactly at the limit is not flagged; one below it is")

def test_audit_order_and_type():
    fleet = [{"id": "z", "online": True, "battery": 1}, {"id": "m", "online": False, "battery": 1}, {"id": "a", "online": True, "battery": 2}]
    out = solution.audit(fleet)
    check(isinstance(out, list) and out == ["z", "a"], "audit should return a list of ids in roster order")

def test_first_low_counts_offline_drones():
    fleet = [{"id": "off", "online": False, "battery": 4}, {"id": "on", "online": True, "battery": 4}]
    check(solution.first_low(fleet) == "off", "first_low is about battery only; an offline low drone still comes first")

def test_first_low_first_position():
    fleet = [{"id": "a", "online": True, "battery": 2}, {"id": "b", "online": True, "battery": 1}]
    check(solution.first_low(fleet) == "a", "When the first drone is low it should be named even if a later one is lower")

def test_first_low_empty():
    check(solution.first_low([]) is None, "An empty roster has no low drone")

def test_first_low_not_overwritten():
    fleet = [{"id": "d-%d" % i, "online": True, "battery": battery} for i, battery in enumerate([50, 10, 10, 10])]
    check(solution.first_low(fleet) == "d-1", "first_low should report the earliest low drone without being overwritten by later ones")
`,
  },
  hints: [
    "Two loops, two opposite wishes. The audit wants to ignore one record and keep going. The search wants to accept one record and stop. Look at what each loop does the moment it finds what it was looking for.",
    "Python gives a loop two steering words. continue abandons the rest of this pass and jumps to the next item. break leaves the loop entirely. The audit is using break where it means continue; the search never uses break at all, so every later match overwrites found.",
    "Tiny example on unrelated data: for host in hosts: if host is None: continue; print(host) prints all the real hosts. And for port in [22, 80, 443]: if port > 50: winner = port; break leaves winner at 80, not 443.",
    "Shape for audit: inside the loop, if the drone is not online, continue (skip to the next drone); then the battery check and append as before. Shape for first_low: when a drone is below 30, record its id and immediately break so nothing later can overwrite it.",
    `def audit(drones):
    flagged = []
    for drone in drones:
        if not drone["online"]:
            continue
        if drone["battery"] < 30:
            flagged.append(drone["id"])
    return flagged

# first_low: after found = drone["id"], add break on the next line`,
    "Full walkthrough: in audit, break ends the whole for loop the moment an offline drone appears, so everything after pad two is never inspected and the audit looks clean. continue instead skips only that one drone and lets the loop move to the next record, so every online low drone is flagged and offline ones are never appended. In first_low, the loop assigns found on every low drone it meets, so the last one wins. Adding break right after the assignment stops the loop at the first match; found keeps that id and return found delivers it. An empty roster or a roster with no low drone never assigns found, so None comes back as required.",
  ],
  errorExplanations: [
    {
      match: "'break' outside loop",
      title: "break must sit inside the loop body",
      explanation:
        "Python only understands break while it is indented inside a for or while. Check that the break line is indented under the if that is itself inside the loop.",
    },
    {
      match: "'continue' not properly in loop",
      title: "continue must sit inside the loop body",
      explanation:
        "continue only means something inside a for or while body. Indent it under the if not drone[\"online\"] check that lives inside the loop.",
    },
    {
      match: "expected an indented block|IndentationError|unindent does not match",
      title: "Indentation changed the loop's shape",
      explanation:
        "Every line of the loop body must line up. After editing, make sure continue and break sit one level inside their if, and that return is back at the function's level after the loop.",
    },
  ],
  anchors: ["for-loops", "while-loops", "conditions"],
  explainWhy: {
    question: "Why does replacing break with continue fix the audit?",
    options: [
      "continue restarts the loop from the first drone",
      "continue skips only the current record and moves to the next one, while break ends the entire loop",
      "continue marks the drone as online so it can be audited",
      "break and continue do the same thing, so the fix is really the extra if",
    ],
    correctIndex: 1,
    explanation:
      "break is a full stop for the loop: the moment it runs, no further records are seen. continue is a skip: it abandons the rest of this pass and lets the for loop pick up the next record, which is exactly what an offline drone in the middle of the roster calls for.",
  },
  reviewVariant: {
    briefing:
      "The firewall rule review needs the ports that are actively blocked, which means deny rules that are enabled; disabled rules must be passed over without stopping the review. The alert triage desk needs the id of the first critical alert in the feed so the on-call engineer can open it immediately.",
    objective:
      "Write `enabled_deny_ports(rules)` that returns a list of the \"port\" values of rules whose \"enabled\" is True and \"action\" is \"deny\", in rule order, skipping disabled rules. Write `first_critical(alerts)` that returns the \"id\" of the first alert whose \"severity\" is \"critical\", stopping as soon as it is found, or None if there is none.",
    starterCode: `# rules look like {"port": 22, "action": "deny", "enabled": True}
# alerts look like {"id": "a-1", "severity": "critical"}

def enabled_deny_ports(rules):
    # loop over rules; skip disabled ones with continue; collect deny ports
    ...

def first_critical(alerts):
    # loop over alerts; stop with break at the first critical one
    ...
`,
    referenceSolution: `def enabled_deny_ports(rules):
    ports = []
    for rule in rules:
        if not rule["enabled"]:
            continue
        if rule["action"] == "deny":
            ports.append(rule["port"])
    return ports

def first_critical(alerts):
    found = None
    for alert in alerts:
        if alert["severity"] == "critical":
            found = alert["id"]
            break
    return found
`,
    tests: {
      visible: `
def test_enabled_deny_ports():
    "enabled_deny_ports skips disabled rules and keeps going"
    rules = [
        {"port": 22, "action": "deny", "enabled": False},
        {"port": 23, "action": "deny", "enabled": True},
        {"port": 80, "action": "allow", "enabled": True},
        {"port": 3389, "action": "deny", "enabled": True},
    ]
    check(solution.enabled_deny_ports(rules) == [23, 3389], "Only enabled deny rules should contribute their port, and a disabled rule must not end the review")

def test_first_critical():
    "first_critical names the earliest critical alert"
    alerts = [{"id": "a-1", "severity": "low"}, {"id": "a-2", "severity": "critical"}, {"id": "a-3", "severity": "critical"}]
    check(solution.first_critical(alerts) == "a-2", "The earliest critical alert should be returned, not a later one")
`,
      hidden: `
def test_no_rules_no_alerts():
    check(solution.enabled_deny_ports([]) == [], "With no rules nothing is blocked")
    check(solution.first_critical([]) is None, "With no alerts there is no critical one")

def test_disabled_deny_not_listed():
    rules = [{"port": 445, "action": "deny", "enabled": False}]
    check(solution.enabled_deny_ports(rules) == [], "A disabled deny rule does not block its port")

def test_first_critical_none_when_absent():
    alerts = [{"id": "a-1", "severity": "low"}, {"id": "a-2", "severity": "high"}]
    check(solution.first_critical(alerts) is None, "When no alert is critical the result should be None")
`,
    },
  },
  timeoutMs: 5000,
  onComplete: [
    { kind: "layer", layer: "patrol-lanes", level: 2 },
    { kind: "layer", layer: "drone-swarm", level: 1 },
    { kind: "stat", stat: "systems_online", add: 1 },
  ],
  artifacts: [],
};

export default mission;
