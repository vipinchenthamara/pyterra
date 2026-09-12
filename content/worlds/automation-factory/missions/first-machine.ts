import type { MissionInput } from "../../../schema";

/**
 * AF-01 — First Machine. Refactor: the same four-line hostname clean-up is pasted three times.
 * The learner builds one function that RETURNS the cleaned value and calls it three times.
 */
const mission: MissionInput = {
  id: "first-machine",
  version: 1,
  worldId: "automation-factory",
  order: 1,
  title: "First Machine",
  codename: "AF-01",
  kind: "refactor",
  difficulty: 1,
  weight: 1,
  estimatedMinutes: 8,
  skills: [{ id: "functions", role: "primary" }],
  prerequisites: [],
  briefing:
    "Three inventory feeds deliver hostnames in three different shapes: stray spaces, capital letters, words separated by blanks. The runbook cleans each one with the same four lines, pasted three times. Last week someone fixed the separator in one copy and the other two kept producing hosts the SIEM could not match. The clean-up must live in exactly one place and hand its result back to whoever asks for it.",
  objective:
    "Define a function `normalise_host(raw)` that returns the hostname with surrounding whitespace removed, in lower case, with every space replaced by a hyphen. Then set `host_a`, `host_b` and `host_c` by calling it on `raw_a`, `raw_b` and `raw_c`. The function must return the value, not print it.",
  predictPrompt:
    "Before you run anything: once the clean-up lives in one function, how many lines need to change when the separator becomes an underscore instead of a hyphen?",
  starterCode: `# Three inventory feeds, three shapes of the same kind of value.
raw_a = "  Edge Firewall 01 "
raw_b = "VPN Gateway"
raw_c = " siem collector "

# The same four-line clean-up, pasted three times. Fix one copy, forget the other two.
cleaned = raw_a.strip()
cleaned = cleaned.lower()
cleaned = cleaned.replace(" ", "-")
host_a = cleaned

cleaned = raw_b.strip()
cleaned = cleaned.lower()
cleaned = cleaned.replace(" ", "-")
host_b = cleaned

cleaned = raw_c.strip()
cleaned = cleaned.lower()
cleaned = cleaned.replace(" ", "-")
host_c = cleaned

# TODO: define normalise_host(raw) that does the clean-up once and RETURNS the result,
# then replace the three pasted blocks with three calls: host_a = normalise_host(raw_a) ...

print(host_a, host_b, host_c)
`,
  referenceSolution: `raw_a = "  Edge Firewall 01 "
raw_b = "VPN Gateway"
raw_c = " siem collector "


def normalise_host(raw):
    cleaned = raw.strip()
    cleaned = cleaned.lower()
    return cleaned.replace(" ", "-")


host_a = normalise_host(raw_a)
host_b = normalise_host(raw_b)
host_c = normalise_host(raw_c)

print(host_a, host_b, host_c)
`,
  tests: {
    visible: `
def test_function_cleans_a_messy_host():
    "normalise_host strips, lower-cases and hyphenates"
    fn = getattr(solution, "normalise_host", None)
    check(callable(fn), "There should be a function named normalise_host")
    out = fn("  Core Router 02 ")
    check(out == "core-router-02", "The result should have no surrounding spaces, no capitals, and hyphens instead of spaces")

def test_three_hosts_come_from_the_function():
    "host_a, host_b and host_c are produced by normalise_host"
    check(solution.host_a == solution.normalise_host(solution.raw_a), "host_a should be exactly what normalise_host returns for raw_a")
    check(solution.host_b == solution.normalise_host(solution.raw_b), "host_b should be exactly what normalise_host returns for raw_b")
    check(solution.host_c == solution.normalise_host(solution.raw_c), "host_c should be exactly what normalise_host returns for raw_c")
`,
    hidden: `
import io
import contextlib

def test_returns_rather_than_prints():
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        out = solution.normalise_host(" A B ")
    check(isinstance(out, str), "normalise_host should hand back a string with return, not just print it")
    check(buf.getvalue() == "", "normalise_host should not print; the caller decides what to do with the value")

def test_already_clean_host_is_unchanged():
    check(solution.normalise_host("fw-01") == "fw-01", "A host that is already clean should come back unchanged")

def test_every_space_is_replaced():
    out = solution.normalise_host("a b c d")
    check(" " not in out and out.count("-") == 3, "Every space should become a hyphen, not just the first one")

def test_uppercase_input_is_lowered():
    check(solution.normalise_host("SIEM") == "siem", "Capital letters should be lowered")

def test_hosts_match_the_cleaned_feeds():
    check(solution.host_a == "edge-firewall-01", "host_a should be the cleaned form of raw_a")
    check(solution.host_b == "vpn-gateway", "host_b should be the cleaned form of raw_b")
    check(solution.host_c == "siem-collector", "host_c should be the cleaned form of raw_c")
`,
  },
  hints: [
    "Three copies of the same steps is one machine waiting to be built. Ask what goes in (a raw name) and what must come out (a clean one).",
    "The tool is a function: def gives it a name and a parameter, the body does the work, and return hands the result back to the line that called it.",
    "Tiny unrelated example: def double(n): return n * 2 — then x = double(4) puts 8 into x. A call is an expression with a value, so it can sit on the right of an equals sign.",
    "Shape: def normalise_host(raw): then inside, strip, then lower, then replace, then return the final string. Below the def, host_a = normalise_host(raw_a) and the same for b and c. Delete the pasted blocks.",
    `def normalise_host(raw):
    cleaned = raw.strip()
    cleaned = cleaned.lower()
    return cleaned.replace(" ", "-")

host_a = normalise_host(raw_a)
# now host_b and host_c the same way`,
    "Full walkthrough: def normalise_host(raw): declares a machine with one input named raw. Inside, raw.strip() drops the outer spaces, .lower() removes capitals, .replace(\" \", \"-\") swaps every remaining space, and return sends that final string back. host_a = normalise_host(raw_a) runs the machine on raw_a and stores what it returned; b and c reuse the same machine, so a change to the separator now lands in one line.",
  ],
  errorExplanations: [
    {
      match: "name 'normalise_host' is not defined",
      title: "The machine is used before it is built",
      explanation:
        "Python reads top to bottom. The def normalise_host(raw): block must appear above the lines that call it, or the name does not exist yet when host_a is assigned.",
    },
    {
      match: "'NoneType' object has no attribute",
      title: "The function printed instead of returning",
      explanation:
        "A function that only prints hands back None, so host_a became None and the next step could not work with it. Replace the print inside normalise_host with return.",
    },
    {
      match: "missing 1 required positional argument",
      title: "The call has nothing inside the parentheses",
      explanation:
        "normalise_host needs the raw name as its input: normalise_host(raw_a), not normalise_host(). The value inside the parentheses becomes the parameter raw.",
    },
  ],
  anchors: ["functions", "strings"],
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "factory-floor", level: 1 },
    { kind: "layer", layer: "assembly-halls", level: 1 },
    { kind: "stat", stat: "structures", add: 2 },
  ],
  artifacts: ["automation-script"],
  reviewVariant: {
    briefing:
      "Three cloud accounts each carry a region label typed by a different team, and the tagging policy wants one shape: upper case, underscores instead of spaces or hyphens, prefixed with RG_. The same block is pasted once per account and they have already drifted apart.",
    objective:
      "Write `region_tag(label)` that returns the label stripped of surrounding whitespace, upper-cased, with every space and hyphen turned into an underscore, and prefixed with \"RG_\". Set `tag_eu`, `tag_us` and `tag_ap` by calling it on `label_eu`, `label_us` and `label_ap`.",
    starterCode: `label_eu = "eu-west-1 "
label_us = " US-EAST-2"
label_ap = "ap South 1"


def region_tag(label):
    # TODO: strip, upper-case, replace " " and "-" with "_", prefix with "RG_", and RETURN it
    ...


# TODO: tag_eu, tag_us and tag_ap via region_tag
`,
    referenceSolution: `label_eu = "eu-west-1 "
label_us = " US-EAST-2"
label_ap = "ap South 1"


def region_tag(label):
    tag = label.strip().upper()
    tag = tag.replace(" ", "_").replace("-", "_")
    return "RG_" + tag


tag_eu = region_tag(label_eu)
tag_us = region_tag(label_us)
tag_ap = region_tag(label_ap)
`,
    tests: {
      visible: `
def test_region_tag_shapes_a_label():
    "region_tag returns the policy shape"
    check(solution.region_tag(" eu-west-1 ") == "RG_EU_WEST_1", "The tag should be upper case, underscores only, with the RG_ prefix")

def test_tags_come_from_the_function():
    "The three tags are produced by region_tag"
    check(solution.tag_eu == solution.region_tag(solution.label_eu), "tag_eu should be what region_tag returns for label_eu")
    check(solution.tag_us == solution.region_tag(solution.label_us), "tag_us should be what region_tag returns for label_us")
    check(solution.tag_ap == solution.region_tag(solution.label_ap), "tag_ap should be what region_tag returns for label_ap")
`,
      hidden: `
def test_returns_a_string():
    check(isinstance(solution.region_tag("x"), str), "region_tag should return text, not print it")

def test_spaces_and_hyphens_both_replaced():
    out = solution.region_tag("ap South-1")
    check(" " not in out and "-" not in out, "Both spaces and hyphens should become underscores")

def test_prefix_present_once():
    out = solution.region_tag("RG_done")
    check(out.startswith("RG_"), "Every tag should start with the RG_ prefix")

def test_ap_tag_shape():
    check(solution.tag_ap == "RG_AP_SOUTH_1", "tag_ap should be the policy shape of label_ap")
`,
    },
  },
};

export default mission;
