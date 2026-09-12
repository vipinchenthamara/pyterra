import type { MissionInput } from "../../../schema";

/**
 * AF-BOSS — Automation Pipeline. Four composed machines with defaults replace six drifted runbooks:
 * normalise, filter, summarise, and a run_pipeline that wires them and supports a dry run.
 */
const mission: MissionInput = {
  id: "automation-pipeline",
  version: 1,
  worldId: "automation-factory",
  order: 6,
  title: "Automation Pipeline",
  codename: "AF-BOSS",
  kind: "boss",
  difficulty: 4,
  weight: 3,
  estimatedMinutes: 22,
  skills: [
    { id: "functions", role: "primary" },
    { id: "arguments", role: "primary" },
  ],
  prerequisites: ["first-machine", "parameters-and-defaults", "scope-incident", "return-contracts", "compose-machines"],
  briefing:
    "Six runbooks, six copies of the same alert triage, and last night's incident showed how far they have drifted: one lower-cases hostnames, two do not, and three of them treat a severity of \"4\" delivered as text as lower than 3. The factory's final line replaces all six with one pipeline: clean every alert, keep the ones that matter, summarise them for the on-call page, and offer a dry run that reports exactly what a real run would. A change to the threshold must land in one place.",
  objective:
    "Define `normalise(alert)` returning a new dict with \"host\" stripped and lower-cased and \"severity\" as an int even when it arrives as text; the original dict must not be changed. Define `filter_alerts(alerts, min_severity=3)` returning the normalised alerts whose severity is at or above min_severity, in their original order. Define `summarise(alerts)` returning `{\"count\": n, \"hosts\": sorted unique hosts, \"max_severity\": m}` where m is 0 when there are no alerts. Define `run_pipeline(raw_alerts, min_severity=3, dry_run=False)` that normalises every raw alert, filters with min_severity, and summarises; when dry_run is true the summary also carries `\"dry_run\": True`, otherwise it has no dry_run key.",
  predictPrompt:
    "Before you run: the raw feed has five alerts, and two of them share a host once cleaned. With the default threshold, how many alerts survive, and how many distinct hosts does the summary list?",
  starterCode: `# The last line in the factory. Six drifted runbooks become one pipeline.
raw_alerts = [
    {"host": "  EDGE-FW-01 ", "severity": "4"},
    {"host": "core-db-02", "severity": 2},
    {"host": "Edge-FW-01", "severity": 5},
    {"host": " vpn-gw-03", "severity": "3"},
    {"host": "siem-04 ", "severity": "1"},
]


def normalise(alert):
    # TODO: a NEW dict: host stripped and lower-cased, severity as an int. Do not modify alert.
    ...


def filter_alerts(alerts, min_severity=3):
    # TODO: normalised alerts with severity at or above min_severity, original order
    ...


def summarise(alerts):
    # TODO: {"count": ..., "hosts": sorted unique hosts, "max_severity": ... or 0 when empty}
    ...


def run_pipeline(raw_alerts, min_severity=3, dry_run=False):
    # TODO: normalise each, filter, summarise; add "dry_run": True only when dry_run is on
    ...


print(run_pipeline(raw_alerts))
print(run_pipeline(raw_alerts, min_severity=5, dry_run=True))
`,
  referenceSolution: `raw_alerts = [
    {"host": "  EDGE-FW-01 ", "severity": "4"},
    {"host": "core-db-02", "severity": 2},
    {"host": "Edge-FW-01", "severity": 5},
    {"host": " vpn-gw-03", "severity": "3"},
    {"host": "siem-04 ", "severity": "1"},
]


def normalise(alert):
    return {"host": alert["host"].strip().lower(), "severity": int(alert["severity"])}


def filter_alerts(alerts, min_severity=3):
    return [a for a in alerts if a["severity"] >= min_severity]


def summarise(alerts):
    hosts = sorted({a["host"] for a in alerts})
    severities = [a["severity"] for a in alerts]
    if severities:
        max_severity = max(severities)
    else:
        max_severity = 0
    return {"count": len(alerts), "hosts": hosts, "max_severity": max_severity}


def run_pipeline(raw_alerts, min_severity=3, dry_run=False):
    cleaned = [normalise(a) for a in raw_alerts]
    kept = filter_alerts(cleaned, min_severity=min_severity)
    summary = summarise(kept)
    if dry_run:
        summary["dry_run"] = True
    return summary


print(run_pipeline(raw_alerts))
print(run_pipeline(raw_alerts, min_severity=5, dry_run=True))
`,
  tests: {
    visible: `
RAW = [
    {"host": "  EDGE-FW-01 ", "severity": "4"},
    {"host": "core-db-02", "severity": 2},
    {"host": "Edge-FW-01", "severity": 5},
    {"host": " vpn-gw-03", "severity": "3"},
    {"host": "siem-04 ", "severity": "1"},
]

def test_normalise_cleans_host_and_severity():
    "normalise returns a clean copy"
    raw = {"host": "  EDGE-FW-01 ", "severity": "4"}
    out = solution.normalise(raw)
    check(out["host"] == "edge-fw-01", "The host should have no surrounding spaces and no capitals")
    check(out["severity"] == 4 and type(out["severity"]) is int, "A severity delivered as text should become a whole number")
    check(raw == {"host": "  EDGE-FW-01 ", "severity": "4"}, "The original alert must not be modified")

def test_pipeline_end_to_end_default():
    "run_pipeline with defaults keeps the default level and above"
    out = solution.run_pipeline(RAW)
    check(out["count"] == 3, "With the default threshold, only the alerts at or above it should be counted")
    check(out["hosts"] == ["edge-fw-01", "vpn-gw-03"], "hosts should list each surviving host once, cleaned and sorted")
    check(out["max_severity"] == 5, "max_severity should be the highest severity among the surviving alerts")
    check("dry_run" not in out, "A real run should not carry a dry_run marker")

def test_pipeline_keyword_overrides():
    "min_severity and dry_run can be overridden by name"
    out = solution.run_pipeline(RAW, min_severity=5, dry_run=True)
    check(out["count"] == 1 and out["hosts"] == ["edge-fw-01"], "Raising the threshold by keyword should keep only the most severe alerts")
    check(out.get("dry_run") is True, "A dry run should carry a dry_run marker set to True")
    check(out["max_severity"] == 5, "A dry run should still compute the same summary values")

def test_pipeline_empty_feed():
    "An empty feed gives an empty summary"
    out = solution.run_pipeline([])
    check(out["count"] == 0 and out["hosts"] == [], "No alerts means a zero count and no hosts")
    check(out["max_severity"] == 0, "With no alerts, max_severity should fall back to zero instead of crashing")
`,
    hidden: `
import copy

RAW = [
    {"host": "  EDGE-FW-01 ", "severity": "4"},
    {"host": "core-db-02", "severity": 2},
    {"host": "Edge-FW-01", "severity": 5},
    {"host": " vpn-gw-03", "severity": "3"},
    {"host": "siem-04 ", "severity": "1"},
]

def test_filter_alerts_default_and_override():
    cleaned = [solution.normalise(a) for a in RAW]
    kept = solution.filter_alerts(cleaned)
    check([a["severity"] for a in kept] == [4, 5, 3], "filter_alerts with no threshold given should keep the default level and above, in the original order")
    check(len(solution.filter_alerts(cleaned, 1)) == len(cleaned), "A threshold passed positionally at the lowest level should keep everything")
    check(solution.filter_alerts(cleaned, min_severity=9) == [], "A threshold above every alert should keep nothing")

def test_summarise_direct():
    out = solution.summarise([{"host": "b", "severity": 2}, {"host": "a", "severity": 7}, {"host": "b", "severity": 1}])
    check(out == {"count": 3, "hosts": ["a", "b"], "max_severity": 7}, "summarise should count every alert, list each host once in sorted order, and report the highest severity")

def test_summarise_empty():
    check(solution.summarise([]) == {"count": 0, "hosts": [], "max_severity": 0}, "summarise of nothing should be a zero count, no hosts, and a max of zero")

def test_normalise_int_severity_stays_int():
    out = solution.normalise({"host": "x", "severity": 2})
    check(out["severity"] == 2 and type(out["severity"]) is int, "A severity that already is a number should stay a number")

def test_pipeline_lowest_threshold():
    out = solution.run_pipeline(RAW, min_severity=1)
    check(out["count"] == len(RAW), "At the lowest threshold every alert should survive")
    check(out["hosts"] == sorted(set(solution.normalise(a)["host"] for a in RAW)), "hosts should be the sorted distinct cleaned hosts")

def test_pipeline_positional_call():
    out = solution.run_pipeline(RAW, 4, True)
    check(out["count"] == 2 and out.get("dry_run") is True, "Positional threshold and dry_run should be honoured in order")

def test_pipeline_does_not_modify_raw():
    before = copy.deepcopy(RAW)
    solution.run_pipeline(RAW)
    check(RAW == before, "The pipeline must not edit the raw feed it was given")

def test_pipeline_composes_summarise():
    original = solution.summarise
    sizes = []
    def spy(alerts):
        sizes.append(len(alerts))
        return original(alerts)
    solution.summarise = spy
    try:
        solution.run_pipeline(RAW)
    finally:
        solution.summarise = original
    check(sizes == [3], "run_pipeline should hand the filtered alerts to summarise rather than re-implementing the summary")
`,
  },
  hints: [
    "Four machines, one line. Before any code, write each machine's contract in one sentence: what goes in, what comes out, and what it must never touch.",
    "The pipeline is composition: each function's output is the next one's input. A single alert goes through normalise; the list of clean alerts goes through filter_alerts; the kept list goes through summarise. run_pipeline only wires them together and passes its own parameters through.",
    "Defaults belong on the outermost machine and on the one that needs them: run_pipeline(raw) must work with nothing else, and so must filter_alerts(alerts). A dry run does not change the numbers; it only labels the result, so the whole pipeline still runs.",
    "Shape: normalise builds a new dict literal from alert[\"host\"].strip().lower() and int(alert[\"severity\"]). filter_alerts is a comprehension with a condition on severity. summarise: count is len, hosts is sorted over a set of hosts, max_severity is max of the severities when there are any and 0 otherwise. run_pipeline: cleaned = a list of normalise(a); kept = filter_alerts(cleaned, min_severity=min_severity); summary = summarise(kept); if dry_run, add the key; return summary.",
    `def normalise(alert):
    return {"host": alert["host"].strip().lower(), "severity": int(alert["severity"])}


def filter_alerts(alerts, min_severity=3):
    return [a for a in alerts if a["severity"] >= min_severity]


def summarise(alerts):
    hosts = sorted({a["host"] for a in alerts})
    # max_severity = max of the severities, or 0 when alerts is empty
    # return {"count": len(alerts), "hosts": hosts, "max_severity": max_severity}


def run_pipeline(raw_alerts, min_severity=3, dry_run=False):
    cleaned = [normalise(a) for a in raw_alerts]
    kept = filter_alerts(cleaned, min_severity=min_severity)
    # summary = summarise(kept); add "dry_run": True if dry_run; return summary`,
    "Full walkthrough: normalise returns a fresh dict literal, so the caller's dict is untouched, and int() turns \"4\" into 4 so comparisons are numeric. filter_alerts keeps alerts whose severity >= min_severity; the default 3 makes filter_alerts(cleaned) the common case. summarise builds hosts with sorted over a set comprehension for uniqueness, uses len for count, and guards max with an if so an empty list yields 0 rather than a crash. run_pipeline composes them in order, forwards min_severity by keyword so the threshold lives in one place, and only when dry_run is true sets summary[\"dry_run\"] = True before returning the same summary.",
  ],
  errorExplanations: [
    {
      match: "not supported between instances of 'str' and 'int'",
      title: "A severity is still text",
      explanation:
        "Some alerts deliver severity as \"4\". Comparing text with a number is refused. Convert in normalise with int(alert[\"severity\"]) so every later machine sees whole numbers.",
    },
    {
      match: "max\\(\\) arg is an empty sequence",
      title: "max of nothing",
      explanation:
        "An empty feed reaches summarise with no severities, and max() cannot pick from nothing. Check whether the list is empty first and use 0 in that case.",
    },
    {
      match: "NoneType",
      title: "One machine handed the next one nothing",
      explanation:
        "A function on the line ended without a return statement, so the next stage received None instead of a dict or a list. Every one of the four functions must return its result.",
    },
  ],
  anchors: ["functions", "arguments"],
  explainWhy: {
    question: "Why does a dry run still compute the full summary instead of returning early?",
    options: [
      "Python cannot return from a function before its last line",
      "The point of a dry run is to show exactly what a real run would report, so it must take the same path and only add a marker",
      "Returning early would delete the raw alerts",
      "The dry_run parameter is ignored by run_pipeline",
    ],
    correctIndex: 1,
    explanation:
      "A dry run that skipped the work would report something different from the real run and be useless as a preview. Running the same pipeline and labelling the result keeps the two identical except for the marker.",
  },
  timeoutMs: 4000,
  onComplete: [
    { kind: "layer", layer: "factory-floor", level: 1 },
    { kind: "layer", layer: "assembly-halls", level: 2 },
    { kind: "layer", layer: "conveyor-lines", level: 2 },
    { kind: "layer", layer: "worker-drones", level: 2 },
    { kind: "layer", layer: "factory-stack", level: 1 },
    { kind: "layer", layer: "floor-lights", level: 2 },
    { kind: "stat", stat: "citizens", add: 1100 },
    { kind: "stat", stat: "systems_online", add: 2 },
  ],
  artifacts: ["automation-script"],
  reviewVariant: {
    briefing:
      "The identity export lists accounts with mixed-case emails and idle days delivered as text. The quarterly audit needs the accounts idle beyond a limit, summarised as a count and a sorted list of the distinct email domains, with a ninety-day default that one team wants to override.",
    objective:
      "Define `normalise_account(record)` returning a new dict with \"email\" stripped and lower-cased and \"idle_days\" as an int. Define `stale_accounts(accounts, max_idle=90)` returning the normalised accounts whose idle_days is above max_idle. Define `run_audit(raw_accounts, max_idle=90)` that normalises, filters and returns `{\"count\": n, \"domains\": sorted unique domains}`, where a domain is the part of the email after the @.",
    starterCode: `raw_accounts = [
    {"email": " Ana@Corp.example ", "idle_days": "120"},
    {"email": "bo@corp.example", "idle_days": 30},
    {"email": "CY@vendor.example", "idle_days": "95"},
    {"email": "di@corp.example ", "idle_days": "200"},
]


def normalise_account(record):
    # TODO: new dict, email stripped + lower-cased, idle_days as int
    ...


def stale_accounts(accounts, max_idle=90):
    # TODO: accounts with idle_days above max_idle
    ...


def run_audit(raw_accounts, max_idle=90):
    # TODO: normalise, filter, then {"count": n, "domains": sorted unique domains}
    ...
`,
    referenceSolution: `raw_accounts = [
    {"email": " Ana@Corp.example ", "idle_days": "120"},
    {"email": "bo@corp.example", "idle_days": 30},
    {"email": "CY@vendor.example", "idle_days": "95"},
    {"email": "di@corp.example ", "idle_days": "200"},
]


def normalise_account(record):
    return {"email": record["email"].strip().lower(), "idle_days": int(record["idle_days"])}


def stale_accounts(accounts, max_idle=90):
    return [a for a in accounts if a["idle_days"] > max_idle]


def run_audit(raw_accounts, max_idle=90):
    cleaned = [normalise_account(r) for r in raw_accounts]
    stale = stale_accounts(cleaned, max_idle=max_idle)
    domains = sorted({a["email"].split("@")[1] for a in stale})
    return {"count": len(stale), "domains": domains}
`,
    tests: {
      visible: `
def test_normalise_account():
    "normalise_account cleans email and idle_days"
    out = solution.normalise_account({"email": " Ana@Corp.example ", "idle_days": "120"})
    check(out["email"] == "ana@corp.example" and out["idle_days"] == 120, "The email should be trimmed and lower-cased and idle_days a whole number")

def test_run_audit_default():
    "run_audit with the default limit"
    out = solution.run_audit(solution.raw_accounts)
    check(out["count"] == 3, "With the default limit, only the accounts idle beyond it should be counted")
    check(out["domains"] == ["corp.example", "vendor.example"], "domains should list each distinct domain once, sorted")
`,
      hidden: `
def test_run_audit_override():
    out = solution.run_audit(solution.raw_accounts, max_idle=150)
    check(out["count"] == 1 and out["domains"] == ["corp.example"], "A higher limit passed by keyword should keep fewer accounts")

def test_run_audit_positional():
    check(solution.run_audit(solution.raw_accounts, 100)["count"] == 2, "A limit passed positionally should be honoured")

def test_run_audit_empty():
    check(solution.run_audit([]) == {"count": 0, "domains": []}, "No accounts should give a zero count and no domains")

def test_stale_accounts_default():
    cleaned = [solution.normalise_account(r) for r in solution.raw_accounts]
    check(len(solution.stale_accounts(cleaned)) == 3, "stale_accounts with no limit given should use the default")
`,
    },
  },
};

export default mission;
