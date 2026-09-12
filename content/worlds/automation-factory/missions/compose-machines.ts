import type { MissionInput } from "../../../schema";

/**
 * AF-05 — Compose Machines. Build: small single-purpose functions composed into a summary, plus a
 * light *args function that adds any number of counts.
 */
const mission: MissionInput = {
  id: "compose-machines",
  version: 1,
  worldId: "automation-factory",
  order: 5,
  title: "Compose Machines",
  codename: "AF-05",
  kind: "build",
  difficulty: 3,
  weight: 1,
  estimatedMinutes: 10,
  skills: [
    { id: "functions", role: "primary" },
    { id: "arguments", role: "primary" },
  ],
  prerequisites: ["return-contracts"],
  briefing:
    "The asset census has to say how many hosts are internal and how many are external, and every feed spells hostnames differently: capitals, stray spaces, all of it. Two earlier scripts each re-implemented the clean-up inside the count and disagreed by three hosts. The count should not know how to clean a name. It should ask a smaller machine that does only that, and another that only decides internal or not. And the dashboard wants to add the counts from any number of regions in one call.",
  objective:
    "Define `clean(raw)` returning the string stripped of surrounding whitespace and lower-cased. Define `is_internal(host)` returning True when the host ends with \".corp\" and False otherwise. Define `summarise(hosts)` that cleans every raw host, classifies it with is_internal, and returns `{\"internal\": n, \"external\": m}`. Define `total(*counts)` that returns the sum of any number of ints, and 0 when given none.",
  starterCode: `# Asset census: small machines, composed.
raw_hosts = ["  EDGE-FW-01.corp", "vpn-gw-03.CORP ", "cdn-edge.example.net", " Core-DB-02.corp"]


def clean(raw):
    # TODO: strip surrounding whitespace, lower-case, return it
    ...


def is_internal(host):
    # TODO: True when the host ends with ".corp"
    ...


def summarise(hosts):
    # TODO: clean each host, classify it with is_internal, return {"internal": n, "external": m}
    ...


def total(*counts):
    # TODO: add up any number of ints; no arguments means 0
    ...


print(summarise(raw_hosts))
print(total(3, 1, 4))
`,
  referenceSolution: `raw_hosts = ["  EDGE-FW-01.corp", "vpn-gw-03.CORP ", "cdn-edge.example.net", " Core-DB-02.corp"]


def clean(raw):
    return raw.strip().lower()


def is_internal(host):
    return host.endswith(".corp")


def summarise(hosts):
    internal = 0
    external = 0
    for raw in hosts:
        if is_internal(clean(raw)):
            internal += 1
        else:
            external += 1
    return {"internal": internal, "external": external}


def total(*counts):
    result = 0
    for c in counts:
        result += c
    return result


print(summarise(raw_hosts))
print(total(3, 1, 4))
`,
  tests: {
    visible: `
def test_clean_and_is_internal():
    "clean normalises and is_internal classifies"
    check(solution.clean("  VPN-GW-03.CORP ") == "vpn-gw-03.corp", "clean should drop surrounding spaces and lower the case")
    check(solution.is_internal("vpn-gw-03.corp") is True, "A host ending in .corp is internal")
    check(solution.is_internal("cdn.example.net") is False, "A host not ending in .corp is external")

def test_summarise_composes_the_two():
    "summarise agrees with clean followed by is_internal"
    hosts = ["  EDGE-FW-01.corp", "vpn-gw-03.CORP ", "cdn-edge.example.net", " Core-DB-02.corp"]
    expected_internal = sum(1 for h in hosts if solution.is_internal(solution.clean(h)))
    out = solution.summarise(hosts)
    check(out == {"internal": expected_internal, "external": len(hosts) - expected_internal}, "summarise should count exactly what clean followed by is_internal decides for every host")

def test_total_any_number_of_counts():
    "total adds zero, one or many counts"
    check(solution.total() == 0, "No counts at all should total to zero")
    check(solution.total(7) == 7, "A single count should come back unchanged")
    check(solution.total(1, 2, 3, 4) == 10, "Several counts should be added together")
`,
    hidden: `
def test_summarise_empty():
    check(solution.summarise([]) == {"internal": 0, "external": 0}, "An empty feed should give zero internal and zero external")

def test_summarise_messy_internal_hosts():
    out = solution.summarise([" A.CORP", "b.corp ", "  C.Corp  "])
    check(out["internal"] == 3 and out["external"] == 0, "Messy spellings of .corp hosts should all count as internal once cleaned")

def test_is_internal_is_suffix_only():
    check(solution.is_internal("evil.corp.attacker.io") is False, "Only a host that ends with .corp is internal; .corp in the middle does not count")
    check(solution.is_internal("corp") is False, "The bare word corp is not a .corp host")

def test_summarise_does_not_modify_input():
    hosts = ["  X.CORP", "y.net"]
    solution.summarise(hosts)
    check(hosts == ["  X.CORP", "y.net"], "summarise should not edit the raw feed it was given")

def test_total_many():
    check(solution.total(*([2] * 25)) == 50, "total should accept a long series of counts")

def test_total_zero_and_negative():
    check(solution.total(5, -2, 0) == 3, "total should add whatever whole numbers it is given, including zero and negatives")

def test_summarise_uses_is_internal():
    original = solution.is_internal
    seen = []
    def spy(host):
        seen.append(host)
        return original(host)
    solution.is_internal = spy
    try:
        solution.summarise(["  Q.CORP "])
    finally:
        solution.is_internal = original
    check(seen == ["q.corp"], "summarise should pass each cleaned host to is_internal rather than re-implementing the check")
`,
  },
  hints: [
    "Do not write the count first. Write the two smallest machines first, one that cleans and one that decides, then let the count ask them. The dashboard's adder is a machine that does not know how many inputs it will get.",
    "Functions calling functions: is_internal(clean(raw)) feeds the output of one machine straight into the next. For any number of inputs, def total(*counts): collects every positional argument into a tuple named counts.",
    "Tiny unrelated example: def trim(s): return s.strip(); def is_tls(p): return p == 443; then is_tls(int(trim(\" 443 \"))). And def biggest(*nums): loops over nums, which is a tuple even when empty.",
    "Shape: clean returns raw.strip().lower(). is_internal returns host.endswith(\".corp\"). summarise keeps two counters, loops over hosts, and for each one asks is_internal(clean(raw)) to decide which counter to bump, then returns a dict literal. total starts at 0, adds every item in counts, returns it.",
    `def clean(raw):
    return raw.strip().lower()


def is_internal(host):
    return host.endswith(".corp")


def summarise(hosts):
    internal = 0
    external = 0
    for raw in hosts:
        if is_internal(clean(raw)):
            internal += 1
        # else external += 1
    # return the dict


def total(*counts):
    result = 0
    # add each count, then return result`,
    "Full walkthrough: clean is one line, strip then lower, returned. is_internal returns the bool that endswith already produces. summarise never repeats those rules: for each raw host it calls clean, hands the result to is_internal, and increments internal or external; the dict literal at the end is the contract. total(*counts) receives all its arguments as a tuple named counts; a loop adds them to result, which starts at 0, so total() with no arguments returns 0 and total(1, 2, 3, 4) returns 10.",
  ],
  errorExplanations: [
    {
      match: "total\\(\\) takes \\d+ positional argument",
      title: "total needs to accept any number of arguments",
      explanation:
        "A fixed parameter list rejects extra values. Declare def total(*counts): and Python gathers every positional argument into the tuple counts.",
    },
    {
      match: "'NoneType' object is not subscriptable|argument of type 'NoneType'",
      title: "A machine returned nothing",
      explanation:
        "summarise or clean ended without a return statement, so the next step received None. Every function on this line must return its result.",
    },
    {
      match: "'list' object has no attribute 'strip'",
      title: "clean was given the whole list",
      explanation:
        "clean works on one hostname at a time. Call it inside the loop in summarise, on each raw host, not on the list.",
    },
  ],
  anchors: ["functions", "arguments"],
  explainWhy: {
    question: "Why should summarise call clean and is_internal instead of doing strip, lower and endswith itself?",
    options: [
      "Calling functions is faster than running the same code inline",
      "So the count and the helpers can never disagree: the rule lives in one place, and a change to it reaches every caller",
      "Python forbids string methods inside a loop",
      "Because summarise is not allowed to contain an if statement",
    ],
    correctIndex: 1,
    explanation:
      "Two scripts that each re-implemented the clean-up disagreed by three hosts. When summarise delegates, there is exactly one definition of clean and one of internal, so the count is correct by construction.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "worker-drones", level: 2 },
    { kind: "layer", layer: "factory-stack", level: 1 },
    { kind: "stat", stat: "structures", add: 1 },
  ],
  artifacts: [],
  reviewVariant: {
    briefing:
      "The firewall export lists ports as text with stray spaces. The audit needs how many are privileged (below 1024) versus everything else, and the report wants one call that takes any number of service names and returns the longest, to size a column.",
    objective:
      "Define `parse_port(raw)` returning the port as an int from text like \" 443 \". Define `is_privileged(port)` returning True when the port is below 1024. Define `count_privileged(raw_ports)` that uses both and returns a tuple `(privileged, other)`. Define `longest(*names)` returning the longest name, or an empty string when given none.",
    starterCode: `def parse_port(raw):
    # TODO: strip, convert with int(), return
    ...


def is_privileged(port):
    # TODO: True below 1024
    ...


def count_privileged(raw_ports):
    # TODO: use parse_port and is_privileged; return (privileged, other)
    ...


def longest(*names):
    # TODO: the longest name, or "" when there are none
    ...
`,
    referenceSolution: `def parse_port(raw):
    return int(raw.strip())


def is_privileged(port):
    return port < 1024


def count_privileged(raw_ports):
    privileged = 0
    other = 0
    for raw in raw_ports:
        if is_privileged(parse_port(raw)):
            privileged += 1
        else:
            other += 1
    return (privileged, other)


def longest(*names):
    best = ""
    for name in names:
        if len(name) > len(best):
            best = name
    return best
`,
    tests: {
      visible: `
def test_small_machines():
    "parse_port and is_privileged"
    check(solution.parse_port(" 443 ") == 443, "parse_port should return the number without surrounding spaces")
    check(solution.is_privileged(80) is True and solution.is_privileged(8080) is False, "Ports below 1024 are privileged, the rest are not")

def test_count_privileged_composes():
    "count_privileged agrees with the two helpers"
    raw = [" 22", "443 ", "8443", "3306"]
    expected = sum(1 for r in raw if solution.is_privileged(solution.parse_port(r)))
    check(solution.count_privileged(raw) == (expected, len(raw) - expected), "count_privileged should return exactly the pair the helpers imply")

def test_longest_any_count():
    "longest with none, one or many names"
    check(solution.longest() == "", "No names should give an empty string")
    check(solution.longest("ssh", "https", "dns") == "https", "The longest of several names should be returned")
`,
      hidden: `
def test_count_privileged_empty():
    check(solution.count_privileged([]) == (0, 0), "No ports should give a pair of zeros")

def test_boundary():
    check(solution.is_privileged(1023) is True and solution.is_privileged(1024) is False, "The boundary sits just below 1024")

def test_longest_single():
    check(solution.longest("ntp") == "ntp", "A single name is the longest by default")

def test_count_uses_is_privileged():
    original = solution.is_privileged
    seen = []
    def spy(port):
        seen.append(port)
        return original(port)
    solution.is_privileged = spy
    try:
        solution.count_privileged([" 53 "])
    finally:
        solution.is_privileged = original
    check(seen == [53], "count_privileged should pass each parsed port to is_privileged")
`,
    },
  },
};

export default mission;
