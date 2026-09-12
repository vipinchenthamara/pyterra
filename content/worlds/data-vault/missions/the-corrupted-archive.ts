import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "the-corrupted-archive",
  version: 1,
  worldId: "data-vault",
  order: 6,
  title: "The Corrupted Archive",
  codename: "DV-BOSS",
  kind: "boss",
  difficulty: 4,
  weight: 3,
  estimatedMinutes: 22,
  skills: [
    { id: "sets", role: "primary" },
    { id: "dicts", role: "primary" },
    { id: "collections-ops", role: "primary" },
    { id: "lists", role: "secondary" },
    { id: "tuples", role: "secondary" },
  ],
  prerequisites: ["store-inventory", "duplicate-incident", "build-lookup-logic", "immutable-coordinates", "vault-query"],
  briefing:
    "A power event mid-write left the Vault archive in pieces. The id feed replayed itself, so assets appear two or three times; the name index stopped receiving entries after the third asset; and the archive's location record was left in an editable list that someone has already fiddled with. The district's whole inventory depends on this archive. Rebuild it: one clean id list, a lookup that never crashes, a precise set of the ids that lost their names, a location record nobody can edit, and one summary the dashboard can read.",
  objective:
    "From the starter data produce: `clean_ids`, a sorted list with each id exactly once; `lookup(asset_id)`, which returns the registered name or the string \"unregistered\" and never raises; `missing_ids`, a set of the ids in clean_ids that have no entry in raw_names; `location`, the same hall and level as an immutable record; and `archive`, a dict with keys \"count\" (number of clean ids), \"missing\" (the missing set) and \"location\" (the record). Print one summary line that includes the count.",
  predictPrompt:
    "Before running: raw_ids has six entries. How many distinct assets does that represent, and how many of them have no name in raw_names?",
  starterCode: `# Archive salvage: the raw pieces recovered after the power event.
raw_ids = ["fw-01", "vpn-02", "fw-01", "idp-03", "vpn-02", "siem-04"]
raw_names = {
    "fw-01": "Perimeter firewall",
    "vpn-02": "Remote access VPN",
    "idp-03": "Identity provider",
}
location = ["vault", 3]   # hall, level. TODO 4: this record must become impossible to edit.

# TODO 1: clean_ids = every id exactly once, sorted alphabetically, as a list

def lookup(asset_id):
    # TODO 2: the registered name, or "unregistered". Must never raise.
    ...

# TODO 3: missing_ids = a set of the ids in clean_ids that have no name in raw_names
# TODO 5: archive = a dict with keys "count", "missing" and "location"
# TODO 6: print one summary line that includes the count
`,
  referenceSolution: `raw_ids = ["fw-01", "vpn-02", "fw-01", "idp-03", "vpn-02", "siem-04"]
raw_names = {
    "fw-01": "Perimeter firewall",
    "vpn-02": "Remote access VPN",
    "idp-03": "Identity provider",
}

clean_ids = sorted(set(raw_ids))

def lookup(asset_id):
    return raw_names.get(asset_id, "unregistered")

missing_ids = set(clean_ids) - set(raw_names)
location = ("vault", 3)

archive = {
    "count": len(clean_ids),
    "missing": missing_ids,
    "location": location,
}

print(f"Archive rebuilt: {archive['count']} assets, {len(missing_ids)} unnamed, stored at {location[0]} level {location[1]}")
`,
  tests: {
    visible: `
def test_clean_ids_sorted_unique():
    "clean_ids lists each asset once, in alphabetical order"
    ids = getattr(solution, "clean_ids", None)
    check(isinstance(ids, list), "clean_ids should be a list so the dashboard can index it")
    check(len(ids) == len(set(ids)), "clean_ids should contain no duplicate ids")
    check(set(ids) == set(solution.raw_ids), "clean_ids should contain every distinct id from the raw feed and nothing else")
    check(ids == sorted(ids), "clean_ids should be in alphabetical order")

def test_lookup_known_and_unknown():
    "lookup returns the registered name, or unregistered without crashing"
    check(solution.lookup("fw-01") == solution.raw_names["fw-01"], "lookup of a registered id should return its stored name")
    try:
        out = solution.lookup("siem-04")
    except KeyError:
        check(False, "lookup of an id with no name must not raise KeyError")
    check(out == "unregistered", "lookup of an id with no name should return the unregistered marker text")

def test_missing_ids():
    "missing_ids holds exactly the ids that lost their names"
    missing = getattr(solution, "missing_ids", None)
    check(isinstance(missing, set), "missing_ids should be a set")
    check(missing == set(solution.clean_ids) - set(solution.raw_names), "missing_ids should contain exactly the clean ids that have no entry in raw_names")

def test_location_is_immutable():
    "location is a record that cannot be edited"
    check(isinstance(solution.location, tuple), "location should be an immutable record type")
    check(list(solution.location) == ["vault", 3], "location should keep the same hall and level as before the rebuild")

def test_archive_summary():
    "archive dict reports count, missing and location"
    archive = getattr(solution, "archive", None)
    check(isinstance(archive, dict), "archive should be a dictionary")
    check(archive.get("count") == len(solution.clean_ids), "archive count should equal the number of clean ids")
    check(archive.get("missing") == solution.missing_ids, "archive missing should be the missing_ids set")
    check(isinstance(archive.get("location"), tuple), "archive location should be the immutable location record")
`,
    hidden: `
def test_summary_printed():
    check(str(len(solution.clean_ids)) in solution_stdout, "The printed summary should include the clean asset count")

def test_lookup_every_clean_id():
    for aid in solution.clean_ids:
        try:
            out = solution.lookup(aid)
        except KeyError:
            check(False, "lookup must never raise for any id in the clean list")
        check(isinstance(out, str) and out != "", "lookup should always return non-empty text")

def test_lookup_reads_live_names():
    solution.raw_names["siem-04"] = "Security event collector"
    try:
        check(solution.lookup("siem-04") == "Security event collector", "lookup should read from raw_names rather than return a hard-coded answer")
    finally:
        del solution.raw_names["siem-04"]

def test_missing_are_all_unnamed():
    for aid in solution.missing_ids:
        check(aid not in solution.raw_names, "Every id in missing_ids should be absent from raw_names")
    check(len(solution.missing_ids) >= 1, "At least one id lost its name in this recovery and should be reported")

def test_raw_feed_left_as_evidence():
    check(len(solution.raw_ids) == 6, "The raw feed should be left intact as evidence, not deduplicated in place")

def test_location_write_fails():
    try:
        solution.location[1] = 9
    except TypeError:
        return
    check(False, "Writing into the location record should raise instead of changing it")
`,
  },
  hints: [
    "Five sub-problems, five structures. Ask of each one: does order matter, are duplicates lies, do I look up by key, must it never change?",
    "Duplicates lie: set. Sorted and indexable: list. Name by id with a safe fallback: dict .get. A record that must not change: tuple. Ids in one group but not another: set difference with the minus sign. A summary of named parts: dict.",
    "Tiny example on unrelated data: ports = sorted(set([80, 80, 443])) gives [80, 443]; set([80, 443]) - set([80]) gives {443}; cfg = {\"n\": len(ports), \"where\": (\"rack\", 1)}.",
    "Shape: clean_ids = sorted(set(raw_ids)); lookup returns raw_names.get(id, fallback text); missing_ids = set(clean_ids) minus set(raw_names); location = a tuple of the hall and level; archive = a dict literal with the three keys; print an f-string that includes archive[\"count\"].",
    `clean_ids = sorted(set(raw_ids))

def lookup(asset_id):
    return raw_names.get(asset_id, "unregistered")

missing_ids = set(clean_ids) - set(raw_names)
# location as a tuple, archive as a dict, then the print remain`,
    "Full walkthrough: set(raw_ids) collapses the replayed feed to four distinct ids and sorted() turns that set into an alphabetical list. lookup uses raw_names.get(asset_id, \"unregistered\") so a missing key returns the marker instead of raising. set(clean_ids) - set(raw_names) keeps every clean id that is not a key of raw_names; set() on a dict takes its keys. location = (\"vault\", 3) makes the record read-only. archive = {\"count\": len(clean_ids), \"missing\": missing_ids, \"location\": location} bundles the parts under names, and the print reads archive[\"count\"] into an f-string.",
  ],
  errorExplanations: [
    {
      match: "unsupported operand type\\(s\\) for -: 'list' and 'list'",
      title: "Lists cannot be subtracted",
      explanation:
        "The minus sign only computes a difference between sets. Convert both sides first: set(clean_ids) - set(raw_names).",
    },
    {
      match: "KeyError",
      title: "lookup asked for a name the index does not have",
      explanation:
        "raw_names[asset_id] with square brackets raises when the key is missing, and siem-04 is missing by design. Use raw_names.get(asset_id, \"unregistered\").",
    },
    {
      match: "'set' object is not subscriptable",
      title: "A set has no positions",
      explanation:
        "clean_ids must be a list so it can be indexed and sorted. Wrap the set: sorted(set(raw_ids)) gives an ordered list back.",
    },
  ],
  anchors: ["sets", "dicts", "tuples", "collections-ops"],
  explainWhy: {
    question: "Why does set(clean_ids) - set(raw_names) give exactly the ids that lost their names?",
    options: [
      "Subtraction removes the last item from the list",
      "Set difference keeps every member of the left set that is absent from the right set, and set() on a dict takes its keys",
      "It compares the lengths of the two collections",
      "It sorts both collections and drops whatever is out of order",
    ],
    correctIndex: 1,
    explanation:
      "The left set is every clean id; the right set is every id that has a name. Set difference removes the named ones, leaving precisely the ids the name index never received.",
  },
  reviewVariant: {
    briefing:
      "The identity provider went down mid-sync and the access review has to be rebuilt from what survived: a login feed that replayed itself, so users appear several times; a role table that stopped receiving entries partway through; and a review window record left in an editable list that someone has already nudged. Rebuild it: one clean user list, a role lookup that never crashes, a precise set of the users who have no role, a window nobody can edit, and one summary the audit dashboard can read.",
    objective:
      "From the starter data produce: `reviewed_users`, a sorted list with each username exactly once; `role_of(user)`, which returns the assigned role or the string \"no-role\" and never raises; `unassigned`, a set of the users in reviewed_users that have no entry in roles; `window`, the same day and hours as an immutable record; and `review`, a dict with keys \"users\" (number of reviewed users), \"unassigned\" (the set) and \"window\" (the record). Print one summary line that includes the number of reviewed users.",
    starterCode: `# Access review after the identity-provider outage: the raw pieces that survived.
raw_logins = ["ana", "bo", "ana", "chen", "dee", "bo", "ana"]
roles = {
    "ana": "admin",
    "bo": "analyst",
    "chen": "analyst",
}
window = ["2026-09-12", 24]   # day, hours. TODO 4: this record must become impossible to edit.

# TODO 1: reviewed_users = every username exactly once, sorted alphabetically, as a list

def role_of(user):
    # TODO 2: the assigned role, or "no-role". Must never raise.
    ...

# TODO 3: unassigned = a set of the users in reviewed_users that have no entry in roles
# TODO 5: review = a dict with keys "users", "unassigned" and "window"
# TODO 6: print one summary line that includes the number of reviewed users
`,
    referenceSolution: `raw_logins = ["ana", "bo", "ana", "chen", "dee", "bo", "ana"]
roles = {
    "ana": "admin",
    "bo": "analyst",
    "chen": "analyst",
}

reviewed_users = sorted(set(raw_logins))

def role_of(user):
    return roles.get(user, "no-role")

unassigned = set(reviewed_users) - set(roles)
window = ("2026-09-12", 24)

review = {
    "users": len(reviewed_users),
    "unassigned": unassigned,
    "window": window,
}

print(f"Access review: {review['users']} users, {len(unassigned)} without a role, window {window[0]} for {window[1]} hours")
`,
    tests: {
      visible: `
def test_reviewed_users_sorted_unique():
    "reviewed_users lists each user once, in alphabetical order"
    u = getattr(solution, "reviewed_users", None)
    check(isinstance(u, list), "reviewed_users should be a list")
    check(len(u) == len(set(u)) and set(u) == set(solution.raw_logins), "reviewed_users should contain every distinct username from the login feed, each exactly once")
    check(u == sorted(u), "reviewed_users should be in alphabetical order")

def test_role_of_known_and_unknown():
    "role_of returns the assigned role, or no-role without crashing"
    check(solution.role_of("ana") == solution.roles["ana"], "role_of a user with an entry should return that stored role")
    try:
        out = solution.role_of("dee")
    except KeyError:
        check(False, "role_of a user with no entry must not raise KeyError")
    check(out == "no-role", "role_of a user with no entry should return the no-role marker text")

def test_unassigned():
    "unassigned holds exactly the reviewed users with no role"
    s = getattr(solution, "unassigned", None)
    check(isinstance(s, set), "unassigned should be a set")
    check(s == set(solution.reviewed_users) - set(solution.roles), "unassigned should contain exactly the reviewed users that have no entry in roles")

def test_window_is_immutable():
    "window is a record that cannot be edited"
    check(isinstance(solution.window, tuple), "window should be an immutable record type")
    check(list(solution.window) == ["2026-09-12", 24], "window should keep the same day and hours as before the rebuild")

def test_review_summary():
    "review dict reports users, unassigned and window"
    r = getattr(solution, "review", None)
    check(isinstance(r, dict), "review should be a dictionary")
    check(r.get("users") == len(solution.reviewed_users), "review users should equal the number of reviewed users")
    check(r.get("unassigned") == solution.unassigned, "review unassigned should be the unassigned set")
    check(isinstance(r.get("window"), tuple), "review window should be the immutable window record")
`,
      hidden: `
def test_summary_printed():
    check(str(len(solution.reviewed_users)) in solution_stdout, "The printed summary should include the number of reviewed users")

def test_role_of_every_reviewed_user():
    for u in solution.reviewed_users:
        try:
            out = solution.role_of(u)
        except KeyError:
            check(False, "role_of must never raise for any reviewed user")
        check(isinstance(out, str) and out != "", "role_of should always return non-empty text")

def test_role_of_reads_live_roles():
    solution.roles["dee"] = "auditor"
    try:
        check(solution.role_of("dee") == "auditor", "role_of should read from roles rather than return a hard-coded answer")
    finally:
        del solution.roles["dee"]

def test_unassigned_have_no_role():
    for u in solution.unassigned:
        check(u not in solution.roles, "Every user in unassigned should be absent from roles")
    check(len(solution.unassigned) >= 1, "At least one user has no role in this review and should be reported")

def test_raw_feed_left_as_evidence():
    check(len(solution.raw_logins) == 7, "The raw login feed should be left intact as evidence, not deduplicated in place")

def test_window_write_fails():
    try:
        solution.window[1] = 8
    except TypeError:
        return
    check(False, "Writing into the window record should raise instead of changing it")
`,
    },
  },
  timeoutMs: 4000,
  onComplete: [
    { kind: "layer", layer: "vault-shell", level: 2 },
    { kind: "layer", layer: "storage-racks", level: 2 },
    { kind: "layer", layer: "alert-bus", level: 2 },
    { kind: "layer", layer: "index-spire", level: 2 },
    { kind: "layer", layer: "vault-lights", level: 2 },
    { kind: "layer", layer: "citizen-flow", level: 2 },
    { kind: "layer", layer: "vault-shield", level: 1 },
    { kind: "stat", stat: "data_integrity", add: 30 },
    { kind: "stat", stat: "citizens", add: 800 },
  ],
  artifacts: ["inventory-registry"],
};

export default mission;
