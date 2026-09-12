import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "vault-query",
  version: 1,
  worldId: "data-vault",
  order: 5,
  title: "Vault Query",
  codename: "DV-05",
  kind: "refactor",
  difficulty: 3,
  weight: 1,
  estimatedMinutes: 12,
  skills: [
    { id: "collections-ops", role: "primary" },
    { id: "dicts", role: "secondary" },
    { id: "sets", role: "secondary" },
  ],
  prerequisites: ["duplicate-incident", "build-lookup-logic"],
  briefing:
    "The query desk answers two questions all day: \"is this asset registered?\" and \"how many are online?\". The code that answers them works, and it is a wall of `or` comparisons plus a hand-added count that grows a line every time an asset is racked. Last week a new id was added to the records but not to the comparison chain, and the desk reported it as unknown for three days. The Vault needs the same answers from code that stays one line long no matter how many assets exist.",
  objective:
    "Keep the behaviour, change the structure. Build `known_ids` as a set from `id_list`. Rewrite `is_known(asset_id)` so it returns True or False by testing membership in `known_ids`. Replace the hand-count so `online_count` equals the number of entries in `statuses` that read \"online\", computed with a single list method. Set `first_record` to the first entry of `records` and `first_status` to that record's status value.",
  predictPrompt:
    "Before editing: the starter's chain of `or` comparisons and a set-based membership test give the same answer for \"vpn-02\" today. Which of the two is still right after a fourth id is added to id_list, and why?",
  starterCode: `# Vault status records and the raw feeds behind them.
records = [
    {"id": "fw-01", "status": "online"},
    {"id": "vpn-02", "status": "offline"},
    {"id": "idp-03", "status": "online"},
]
id_list = ["fw-01", "vpn-02", "idp-03"]
statuses = ["online", "offline", "online"]

# TODO 1: known_ids = a set holding every id from id_list

# --- Today's query desk. It works. It grows one line per asset. ---
def is_known(asset_id):
    # TODO 2: replace the chain below with a membership test against known_ids
    return asset_id == "fw-01" or asset_id == "vpn-02" or asset_id == "idp-03"

# TODO 3: replace the hand-count below with one list method call
online_count = int(statuses[0] == "online") + int(statuses[1] == "online") + int(statuses[2] == "online")

# TODO 4: first_record = the first record; first_status = that record's "status" value

print("vpn-02 known:", is_known("vpn-02"))
print("online:", online_count)
`,
  referenceSolution: `records = [
    {"id": "fw-01", "status": "online"},
    {"id": "vpn-02", "status": "offline"},
    {"id": "idp-03", "status": "online"},
]
id_list = ["fw-01", "vpn-02", "idp-03"]
statuses = ["online", "offline", "online"]

known_ids = set(id_list)

def is_known(asset_id):
    return asset_id in known_ids

online_count = statuses.count("online")

first_record = records[0]
first_status = first_record["status"]

print("vpn-02 known:", is_known("vpn-02"))
print("online:", online_count)
print("first:", first_record["id"], first_status)
`,
  tests: {
    visible: `
def test_known_ids_is_a_set():
    "known_ids is a set holding every registered id"
    ids = getattr(solution, "known_ids", None)
    check(isinstance(ids, set), "known_ids should be a set, so membership is a single hashed lookup")
    check(ids == set(solution.id_list), "known_ids should contain exactly the ids from id_list")

def test_is_known_member_and_non_member():
    "is_known answers True for registered ids and False otherwise"
    check(solution.is_known("fw-01") is True, "A registered id should be reported as known with a True")
    check(solution.is_known("ghost-99") is False, "An unregistered id should be reported with a False")

def test_online_count():
    "online_count matches how many statuses read online"
    check(solution.online_count == solution.statuses.count("online"), "online_count should equal the number of entries in statuses that are online")

def test_first_record_and_status():
    "first_record and first_status read the head of the records list"
    check(getattr(solution, "first_record", None) == solution.records[0], "first_record should be the first entry in records")
    check(getattr(solution, "first_status", None) == solution.records[0]["status"], "first_status should be the status value of that first record")
`,
    hidden: `
def test_is_known_reads_the_set():
    solution.known_ids.add("probe-77")
    try:
        check(solution.is_known("probe-77") is True, "is_known should consult known_ids, so an id added to the set becomes known without editing code")
    finally:
        solution.known_ids.discard("probe-77")

def test_is_known_returns_bool():
    check(isinstance(solution.is_known("fw-01"), bool) and isinstance(solution.is_known("nope"), bool), "is_known should return a plain True or False")

def test_first_record_is_dict():
    check(isinstance(solution.first_record, dict) and "status" in solution.first_record, "first_record should be a single record dictionary with a status key")

def test_online_count_is_int():
    check(isinstance(solution.online_count, int), "online_count should be a whole number")

def test_records_untouched():
    check(len(solution.records) == 3 and len(solution.statuses) == 3, "The source records and statuses should not be modified by the refactor")
`,
  },
  hints: [
    "Every `or` in that chain is a membership test written out by hand. Python has a one-word membership test and a collection built to answer it instantly.",
    "Use a set for known_ids: `in` on a set is a single hashed lookup, and set(some_list) builds one. For counting a value in a list, lists have a .count() method. A list of dicts is read by position, then by key: records[0][\"status\"].",
    "Tiny example: ports = set([22, 443]); 22 in ports gives True; [\"up\", \"down\", \"up\"].count(\"up\") gives 2; rows = [{\"h\": \"a\"}]; rows[0][\"h\"] gives \"a\".",
    "Shape: known_ids = set built from id_list; is_known returns the expression asset_id in known_ids; online_count = statuses.count of the online text; first_record = records at index 0; first_status = first_record at key \"status\".",
    `known_ids = set(id_list)

def is_known(asset_id):
    return asset_id in known_ids

online_count = statuses.count("online")
# now first_record = records[0] and first_status from it`,
    "Full walkthrough: known_ids = set(id_list) hashes every id once. is_known returns asset_id in known_ids, a True/False that reads from the data, so the fourth asset is known the moment it is in the set. statuses.count(\"online\") walks the list for you and returns how many entries match. first_record = records[0] picks the first dictionary and first_record[\"status\"] reads its status by key. Four short lines replace the growing wall.",
  ],
  errorExplanations: [
    {
      match: "'set' object is not subscriptable",
      title: "Sets have no positions",
      explanation:
        "known_ids[0] has no meaning because a set is unordered. Use `in` to ask whether an id is present; use the records list when you need the first entry.",
    },
    {
      match: "list indices must be integers or slices, not str",
      title: "Indexed the list by key instead of position",
      explanation:
        "records[\"status\"] asks a list for a key. Pick the record by position first, then the key: records[0][\"status\"].",
    },
    {
      match: "'set' object has no attribute 'count'",
      title: "count() belongs to lists",
      explanation:
        "A set holds each value once, so counting inside it is meaningless. Call .count(\"online\") on the statuses list, not on known_ids.",
    },
  ],
  anchors: ["collections-ops", "sets", "dicts"],
  explainWhy: {
    question: "Both versions of is_known return the same answer today. Why is `asset_id in known_ids` the better one?",
    options: [
      "The chain of or comparisons is slower to type",
      "The set version reads from the data, so a new id in the registry is known without editing code, and the lookup stays constant-time",
      "Sets sort the ids alphabetically before checking",
      "or only works with exactly two comparisons",
    ],
    correctIndex: 1,
    explanation:
      "The chain hard-codes the registry inside the logic, which is why last week's asset went missing for three days. Membership in a set is driven by the data itself and costs the same whether there are three ids or three thousand.",
  },
  reviewVariant: {
    briefing:
      "The perimeter gateway answers one question per packet: \"is this source address on the allowlist?\". The code that answers it is a chain of `or` comparisons, and the deny tally beside it is a hand-written sum that grows a term for every verdict. Last week a new address was added to the allowlist file but not to the chain, and a partner integration was blocked for a day. The gateway needs the same answers from code that stays one line long however many addresses exist.",
    objective:
      "Keep the behaviour, change the structure. Build `allowed` as a set from `allow_list`. Rewrite `is_allowed(ip)` so it returns True or False by testing membership in `allowed`. Replace the hand-count so `deny_count` equals the number of entries in `verdicts` that read \"deny\", computed with a single list method. Set `last_event` to the final entry of `events` and `last_verdict` to that event's verdict value.",
    starterCode: `# Perimeter allowlist and the last few decisions the gateway made.
events = [
    {"ip": "10.0.0.7", "verdict": "deny"},
    {"ip": "10.0.0.2", "verdict": "allow"},
    {"ip": "10.0.0.9", "verdict": "deny"},
]
allow_list = ["10.0.0.1", "10.0.0.2", "10.0.0.3"]
verdicts = ["deny", "allow", "deny"]

# TODO 1: allowed = a set holding every address from allow_list

# --- Today's gateway check. It works. It grows one line per address. ---
def is_allowed(ip):
    # TODO 2: replace the chain below with a membership test against allowed
    return ip == "10.0.0.1" or ip == "10.0.0.2" or ip == "10.0.0.3"

# TODO 3: replace the hand-count below with one list method call
deny_count = int(verdicts[0] == "deny") + int(verdicts[1] == "deny") + int(verdicts[2] == "deny")

# TODO 4: last_event = the final event; last_verdict = that event's "verdict" value

print("10.0.0.2 allowed:", is_allowed("10.0.0.2"))
print("denied:", deny_count)
`,
    referenceSolution: `events = [
    {"ip": "10.0.0.7", "verdict": "deny"},
    {"ip": "10.0.0.2", "verdict": "allow"},
    {"ip": "10.0.0.9", "verdict": "deny"},
]
allow_list = ["10.0.0.1", "10.0.0.2", "10.0.0.3"]
verdicts = ["deny", "allow", "deny"]

allowed = set(allow_list)

def is_allowed(ip):
    return ip in allowed

deny_count = verdicts.count("deny")

last_event = events[-1]
last_verdict = last_event["verdict"]

print("10.0.0.2 allowed:", is_allowed("10.0.0.2"))
print("denied:", deny_count)
print("last:", last_event["ip"], last_verdict)
`,
    tests: {
      visible: `
def test_allowed_is_a_set():
    "allowed is a set holding every allowlisted address"
    a = getattr(solution, "allowed", None)
    check(isinstance(a, set), "allowed should be a set, so membership is a single hashed lookup")
    check(a == set(solution.allow_list), "allowed should contain exactly the addresses from allow_list")

def test_is_allowed_member_and_non_member():
    "is_allowed answers True for allowlisted addresses and False otherwise"
    check(solution.is_allowed("10.0.0.1") is True, "An allowlisted address should be reported with a True")
    check(solution.is_allowed("192.168.1.1") is False, "An address outside the allowlist should be reported with a False")

def test_deny_count():
    "deny_count matches how many verdicts read deny"
    check(solution.deny_count == solution.verdicts.count("deny"), "deny_count should equal the number of entries in verdicts that are deny")

def test_last_event_and_verdict():
    "last_event and last_verdict read the tail of the events list"
    check(getattr(solution, "last_event", None) == solution.events[-1], "last_event should be the final entry in events")
    check(getattr(solution, "last_verdict", None) == solution.events[-1]["verdict"], "last_verdict should be the verdict value of that final event")
`,
      hidden: `
def test_is_allowed_reads_the_set():
    solution.allowed.add("10.0.0.42")
    try:
        check(solution.is_allowed("10.0.0.42") is True, "is_allowed should consult the allowed set, so an address added to the set is allowed without editing code")
    finally:
        solution.allowed.discard("10.0.0.42")

def test_is_allowed_returns_bool():
    check(isinstance(solution.is_allowed("10.0.0.1"), bool) and isinstance(solution.is_allowed("nope"), bool), "is_allowed should return a plain True or False")

def test_last_event_is_dict():
    check(isinstance(solution.last_event, dict) and "verdict" in solution.last_event, "last_event should be a single event dictionary with a verdict key")

def test_deny_count_is_int():
    check(isinstance(solution.deny_count, int), "deny_count should be a whole number")

def test_sources_untouched():
    check(len(solution.events) == 3 and len(solution.verdicts) == 3 and len(solution.allow_list) == 3, "The source events, verdicts and allow_list should not be modified by the refactor")
`,
    },
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "citizen-flow", level: 1 },
    { kind: "layer", layer: "index-spire", level: 2 },
    { kind: "stat", stat: "data_integrity", add: 15 },
  ],
  artifacts: [],
};

export default mission;
