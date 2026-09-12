import type { MissionInput } from "../../../schema";

/**
 * AF-04 — Return Contracts. Build: a function that returns a fixed record (tuple), one that returns
 * two lists as a pair, and one that returns a dict or an explicit None.
 */
const mission: MissionInput = {
  id: "return-contracts",
  version: 1,
  worldId: "automation-factory",
  order: 4,
  title: "Return Contracts",
  codename: "AF-04",
  kind: "build",
  difficulty: 3,
  weight: 1,
  estimatedMinutes: 9,
  skills: [{ id: "functions", role: "primary" }],
  prerequisites: ["scope-incident"],
  briefing:
    "The signal desk receives codes like SEC-042-CRIT and three different scripts split them three different ways. The capacity planner needs one list of readings under a limit and one at or above it, and today it makes two passes that drift out of sync. And the host lookup returns an empty string when nothing matches, which one caller treats as a real host named nothing. Every machine on this line needs a written contract for what it hands back: a fixed record, a pair of lists, or an explicit nothing.",
  objective:
    "Define `parse_signal(signal)` returning a tuple `(system, unit, severity)` from a code like \"SEC-042-CRIT\": system is the first part, unit is the middle part converted to an int, severity is the last part. Define `split_threshold(values, limit)` returning a tuple of two lists `(below, at_or_above)` that keeps the original order. Define `find_host(hosts, name)` that returns the dict whose \"name\" matches, or None when nothing matches, with an explicit `return None`.",
  predictPrompt:
    "Before you run: the starter prints what parse_signal gives back today. Its body has no return statement. What does the caller receive from a function that never returns anything?",
  starterCode: `# Signal desk contracts: every function must state exactly what it hands back.
hosts = [
    {"name": "edge-fw-01", "zone": "dmz"},
    {"name": "core-db-02", "zone": "internal"},
    {"name": "vpn-gw-03", "zone": "dmz"},
]


def parse_signal(signal):
    # TODO: "SEC-042-CRIT" -> the tuple ("SEC", 42, "CRIT"); split on "-", convert the unit with int()
    ...


def split_threshold(values, limit):
    # TODO: return two lists as one tuple: (below, at_or_above), original order kept
    ...


def find_host(hosts, name):
    # TODO: return the matching dict, or None (write the return None explicitly)
    ...


print(parse_signal("SEC-042-CRIT"))
`,
  referenceSolution: `hosts = [
    {"name": "edge-fw-01", "zone": "dmz"},
    {"name": "core-db-02", "zone": "internal"},
    {"name": "vpn-gw-03", "zone": "dmz"},
]


def parse_signal(signal):
    system, unit, severity = signal.split("-")
    return (system, int(unit), severity)


def split_threshold(values, limit):
    below = [v for v in values if v < limit]
    at_or_above = [v for v in values if v >= limit]
    return (below, at_or_above)


def find_host(hosts, name):
    for host in hosts:
        if host["name"] == name:
            return host
    return None


print(parse_signal("SEC-042-CRIT"))
`,
  tests: {
    visible: `
def test_parse_signal_unpacks_into_three_parts():
    "parse_signal returns a record you can unpack"
    system, unit, severity = solution.parse_signal("SEC-042-CRIT")
    check(system == "SEC", "The first part should be the system code")
    check(unit == 42, "The middle part should be the unit as a whole number, leading zeros dropped")
    check(severity == "CRIT", "The last part should be the severity")

def test_split_threshold_returns_two_lists():
    "split_threshold hands back below and at-or-above together"
    below, above = solution.split_threshold([40, 85, 60, 90], 85)
    check(below == [40, 60], "The first list should hold the readings under the limit, in their original order")
    check(above == [85, 90], "The second list should hold the readings at or above the limit, in their original order")

def test_find_host_hit_and_miss():
    "find_host returns the record or None"
    hit = solution.find_host(solution.hosts, "core-db-02")
    check(isinstance(hit, dict) and hit.get("name") == "core-db-02", "A matching name should return that host's record")
    check(solution.find_host(solution.hosts, "ghost-99") is None, "A name with no match should return None, not an empty value")
`,
    hidden: `
def test_parse_signal_is_a_tuple():
    out = solution.parse_signal("NET-007-WARN")
    check(isinstance(out, tuple) and len(out) == 3, "parse_signal should return a tuple with exactly three parts")
    check(type(out[1]) is int, "The unit should be converted to a whole number")
    check(out[0] == "NET" and out[2] == "WARN", "The system and severity parts should be returned as text")

def test_split_threshold_is_tuple_of_lists():
    out = solution.split_threshold([1, 2, 3], 2)
    check(isinstance(out, tuple) and len(out) == 2, "split_threshold should return exactly two lists as one tuple")
    check(isinstance(out[0], list) and isinstance(out[1], list), "Both parts should be lists")

def test_split_threshold_empty():
    below, above = solution.split_threshold([], 50)
    check(below == [] and above == [], "No readings means two empty lists, not None")

def test_split_threshold_boundary():
    below, above = solution.split_threshold([50, 49], 50)
    check(below == [49] and above == [50], "A reading equal to the limit belongs in the at-or-above list")

def test_find_host_returns_same_object():
    hit = solution.find_host(solution.hosts, "vpn-gw-03")
    check(hit is solution.hosts[2], "find_host should return the actual record from the list, not a copy")

def test_find_host_empty_list():
    check(solution.find_host([], "edge-fw-01") is None, "Searching an empty list should return None")

def test_find_host_miss_is_exactly_none():
    miss = solution.find_host(solution.hosts, "nope")
    check(miss is None, "A miss should be exactly None, not False, an empty string or an empty dict")
`,
  },
  hints: [
    "Before writing any body, write each function's contract as a sentence: this takes X and always gives back Y. The tests are those sentences.",
    "A function can return more than one value by returning a tuple; the caller unpacks it: a, b = f(). A function that reaches the end of its body without a return hands back None, and return None says the same thing on purpose.",
    "Tiny unrelated example: def split_cidr(text): net, bits = text.split(\"/\"); return (net, int(bits)). Then net, bits = split_cidr(\"10.0.0.0/24\"). And a search loop that ends with return None makes the miss explicit.",
    "Shape: parse_signal splits on the hyphen into three names and returns them as a tuple with int() around the middle one. split_threshold builds two lists (a comprehension each, or one loop with an if) and returns them as a pair. find_host loops over hosts, returns the dict whose name matches, and after the loop returns None.",
    `def parse_signal(signal):
    system, unit, severity = signal.split("-")
    return (system, int(unit), severity)


def split_threshold(values, limit):
    below = [v for v in values if v < limit]
    # at_or_above the same way with >=, then return (below, at_or_above)


def find_host(hosts, name):
    for host in hosts:
        # if host["name"] == name: return host
    return None`,
    "Full walkthrough: signal.split(\"-\") gives three strings, unpacked into system, unit and severity; return (system, int(unit), severity) packs them into one tuple so the caller can unpack them again. split_threshold makes below from values under the limit and at_or_above from the rest, preserving order because comprehensions walk the list in order, and returns the pair. find_host returns the first dict whose \"name\" equals name from inside the loop; if the loop finishes, return None states the miss explicitly so the caller can test with is None.",
  ],
  errorExplanations: [
    {
      match: "cannot unpack non-iterable NoneType",
      title: "The function returned nothing to unpack",
      explanation:
        "The caller tried a, b, c = ... but the function ended without returning a tuple, so it gave back None. Add return (system, int(unit), severity), or return (below, at_or_above).",
    },
    {
      match: "not enough values to unpack|too many values to unpack",
      title: "The tuple has the wrong number of parts",
      explanation:
        "The caller expects exactly three parts from parse_signal and exactly two from split_threshold. Check that you split on the hyphen and that you return every part, and nothing extra.",
    },
    {
      match: "invalid literal for int",
      title: "int() was given the wrong part",
      explanation:
        "Only the middle part of the signal is a number. int(\"SEC\") or int(\"CRIT\") cannot work. Convert just the unit.",
    },
  ],
  anchors: ["functions", "tuples"],
  explainWhy: {
    question: "Why write return None at the end of find_host when falling off the end already returns None?",
    options: [
      "Falling off the end of a function returns False, not None",
      "The value is the same, but the explicit return states the contract: None is a deliberate outcome, not a forgotten return",
      "Python raises an error if a function has no return statement",
      "return None makes the loop stop earlier",
    ],
    correctIndex: 1,
    explanation:
      "Both paths hand back None. The explicit line tells the next reader, and the caller, that a miss is part of the design, and it is the reason callers can safely write if result is None.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "floor-lights", level: 2 },
    { kind: "layer", layer: "conveyor-lines", level: 2 },
    { kind: "stat", stat: "power", add: 15 },
  ],
  artifacts: [],
  reviewVariant: {
    briefing:
      "The certificate monitor receives endpoints as api.example.com:443 and the renewal bot needs the host and port apart, plus the record for one domain, or a clear nothing when that domain is not monitored at all.",
    objective:
      "Define `split_endpoint(endpoint)` returning a tuple `(host, port)` from text like \"api.example.com:443\" with port as an int. Define `find_cert(certs, domain)` returning the dict whose \"domain\" matches, or None when nothing matches.",
    starterCode: `certs = [
    {"domain": "api.example.com", "days_left": 12},
    {"domain": "vpn.example.com", "days_left": 80},
]


def split_endpoint(endpoint):
    # TODO: return (host, port) with port as an int
    ...


def find_cert(certs, domain):
    # TODO: return the matching dict or None
    ...
`,
    referenceSolution: `certs = [
    {"domain": "api.example.com", "days_left": 12},
    {"domain": "vpn.example.com", "days_left": 80},
]


def split_endpoint(endpoint):
    host, port = endpoint.split(":")
    return (host, int(port))


def find_cert(certs, domain):
    for cert in certs:
        if cert["domain"] == domain:
            return cert
    return None
`,
    tests: {
      visible: `
def test_split_endpoint_unpacks():
    "split_endpoint returns host and port together"
    host, port = solution.split_endpoint("api.example.com:443")
    check(host == "api.example.com" and port == 443, "The host should be the text before the colon and the port the number after it")

def test_find_cert_hit_and_miss():
    "find_cert returns the record or None"
    check(solution.find_cert(solution.certs, "vpn.example.com") is solution.certs[1], "A monitored domain should return its own record")
    check(solution.find_cert(solution.certs, "old.example.com") is None, "An unmonitored domain should return None")
`,
      hidden: `
def test_port_is_int():
    out = solution.split_endpoint("db:5432")
    check(isinstance(out, tuple) and type(out[1]) is int, "The port should be a whole number inside a tuple")

def test_find_cert_empty():
    check(solution.find_cert([], "x") is None, "Searching nothing should return None")

def test_miss_is_none_not_falsy():
    check(solution.find_cert(solution.certs, "nope") is None, "A miss should be exactly None")
`,
    },
  },
};

export default mission;
