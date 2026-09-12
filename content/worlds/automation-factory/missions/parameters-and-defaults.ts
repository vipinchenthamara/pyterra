import type { MissionInput } from "../../../schema";

/**
 * AF-02 — Parameters and Defaults. Build: one alert machine that takes the common case with no
 * extra input and accepts overrides positionally or by keyword.
 */
const mission: MissionInput = {
  id: "parameters-and-defaults",
  version: 1,
  worldId: "automation-factory",
  order: 2,
  title: "Parameters and Defaults",
  codename: "AF-02",
  kind: "build",
  difficulty: 2,
  weight: 1,
  estimatedMinutes: 9,
  skills: [
    { id: "arguments", role: "primary" },
    { id: "functions", role: "secondary" },
  ],
  prerequisites: ["first-machine"],
  briefing:
    "Six teams run the same CPU alert runbook and every one of them has hand-edited a copy. Platform wants the alarm at 70 percent, not 85. Security wants a dry run that evaluates but never fires. Ops wants the alert text tagged critical instead of warning. Six copies means six places to break. One machine should handle the common case with nothing but a reading, and accept an override only when a team asks for one.",
  objective:
    "Define `should_alert(cpu_pct, threshold=85, dry_run=False)`: it returns False whenever dry_run is true, otherwise True when cpu_pct is at or above threshold and False below it. Define `describe_alert(host, level=\"warning\")` returning the level in upper case, a colon and a space, then the host (for example WARNING: edge-fw-01). Both must work when called with only their required argument, positionally, or with keyword overrides.",
  starterCode: `# Six hand-edited copies of the CPU alert runbook, collapsed into one machine.
# Teams call it with just a reading, or override the threshold, or ask for a dry run.


def should_alert(cpu_pct):
    # TODO: add threshold (default 85) and dry_run (default False) parameters.
    # Return False when dry_run is on, otherwise True when cpu_pct is at or above threshold.
    ...


def describe_alert(host):
    # TODO: add a level parameter that defaults to "warning".
    # Return the level in upper case, then ": ", then the host.
    ...


print(should_alert(92))
print(describe_alert("edge-fw-01"))
`,
  referenceSolution: `def should_alert(cpu_pct, threshold=85, dry_run=False):
    if dry_run:
        return False
    return cpu_pct >= threshold


def describe_alert(host, level="warning"):
    return f"{level.upper()}: {host}"


print(should_alert(92))
print(describe_alert("edge-fw-01"))
`,
  tests: {
    visible: `
def test_positional_call():
    "should_alert works with all three arguments given in order"
    check(solution.should_alert(90, 85, False) is True, "A reading above the threshold with dry_run off should alert")
    check(solution.should_alert(50, 85, False) is False, "A reading below the threshold should not alert")

def test_keyword_override():
    "A team can tighten the threshold by name"
    check(solution.should_alert(75, threshold=70) is True, "A reading above a lowered threshold should alert")
    check(solution.should_alert(65, threshold=70) is False, "A reading below a lowered threshold should not alert")

def test_dry_run_never_fires():
    "dry_run evaluates but never alerts"
    check(solution.should_alert(99, dry_run=True) is False, "With dry_run on, even an extreme reading must not alert")

def test_describe_alert_default_and_override():
    "describe_alert uses warning unless a level is given"
    check(solution.describe_alert("edge-fw-01") == "WARNING: edge-fw-01", "With no level given the text should be the upper-case default level, a colon and a space, then the host")
    check(solution.describe_alert("edge-fw-01", level="critical") == "CRITICAL: edge-fw-01", "A level passed by keyword should appear upper-cased in front of the host")
`,
    hidden: `
import inspect

def test_defaults_are_declared():
    params = inspect.signature(solution.should_alert).parameters
    check("threshold" in params and params["threshold"].default is not inspect.Parameter.empty, "threshold should have a default so callers can omit it")
    check("dry_run" in params and params["dry_run"].default is not inspect.Parameter.empty, "dry_run should have a default so callers can omit it")
    check(not params["dry_run"].default, "dry_run should be off unless a caller turns it on")

def test_required_only_call_uses_defaults():
    check(solution.should_alert(85) is True, "A reading exactly at the default threshold should alert")
    check(solution.should_alert(84) is False, "A reading just under the default threshold should not alert")

def test_returns_a_bool_not_none():
    check(solution.should_alert(10) is False, "A quiet reading should return False, not None or nothing")
    check(solution.should_alert(100) is True, "A saturated reading should return True, not a number")

def test_dry_run_positional():
    check(solution.should_alert(99, 85, True) is False, "dry_run passed positionally should also suppress the alert")

def test_describe_level_positional():
    check(solution.describe_alert("core-db-02", "info") == "INFO: core-db-02", "A level passed positionally should be upper-cased in front of the host")

def test_describe_default_level_declared():
    params = inspect.signature(solution.describe_alert).parameters
    check("level" in params and params["level"].default is not inspect.Parameter.empty, "level should have a default so most callers never pass it")
`,
  },
  hints: [
    "Six copies differ in only two or three values. Those values are inputs the machine should accept, with a sensible answer built in for when nobody supplies them.",
    "Default parameter values: def f(x, limit=85) means limit is 85 unless the caller passes something else. Callers can also name the argument, f(3, limit=70), so they never have to remember the order.",
    "Tiny unrelated example: def retry(attempts=3, delay=1): return attempts * delay. Then retry() gives 3, retry(delay=5) gives 15, and retry(2, 2) gives 4.",
    "Shape: should_alert takes cpu_pct, then threshold=85, then dry_run=False. First check dry_run and return False. Otherwise return the comparison cpu_pct >= threshold, which is already a bool. describe_alert takes host, then level=\"warning\", and returns an f-string with level.upper().",
    `def should_alert(cpu_pct, threshold=85, dry_run=False):
    if dry_run:
        return False
    # return whether cpu_pct is at or above threshold


def describe_alert(host, level="warning"):
    # return f"{level.upper()}: {host}"`,
    "Full walkthrough: def should_alert(cpu_pct, threshold=85, dry_run=False): declares one required input and two with defaults, so should_alert(92) fills in 85 and False by itself. if dry_run: return False leaves early before any comparison. return cpu_pct >= threshold hands back True or False directly. describe_alert(host, level=\"warning\") returns f\"{level.upper()}: {host}\", so the default gives WARNING and level=\"critical\" gives CRITICAL.",
  ],
  errorExplanations: [
    {
      match: "unexpected keyword argument",
      title: "The caller used a name the function does not declare",
      explanation:
        "A keyword argument must match a parameter name exactly. The tests call with threshold=, dry_run= and level=, so those must be the names in your def lines.",
    },
    {
      match: "missing \\d+ required positional argument",
      title: "A parameter has no default",
      explanation:
        "Callers pass only the reading, or only the host, and expect the rest to be filled in. Give threshold, dry_run and level a default value in the def line: threshold=85, dry_run=False, level=\"warning\".",
    },
    {
      match: "non-default argument follows default argument|parameter without a default follows parameter with a default",
      title: "Required parameters come first",
      explanation:
        "Once a parameter has a default, every parameter after it must have one too. Put cpu_pct (and host) first, then the defaulted ones.",
    },
  ],
  anchors: ["arguments", "functions"],
  explainWhy: {
    question: "Why can should_alert(75, threshold=70) skip dry_run entirely?",
    options: [
      "Python guesses dry_run from the value of threshold",
      "dry_run has a default, so Python fills it in; naming threshold means the caller can override one parameter without touching the others",
      "Keyword arguments switch off every other parameter",
      "Any argument after the first one is optional in Python",
    ],
    correctIndex: 1,
    explanation:
      "Every parameter with a default is optional. Passing threshold by name overrides just that one; dry_run keeps its default False. That is what lets six teams share one machine.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "conveyor-lines", level: 1 },
    { kind: "layer", layer: "floor-lights", level: 1 },
    { kind: "stat", stat: "systems_online", add: 1 },
  ],
  artifacts: ["automation-script"],
  reviewVariant: {
    briefing:
      "Every data store applies the same retention rule with hand-typed numbers: thirty days unless told otherwise, three times as long for records classified restricted, and a legal hold that freezes everything at 3650 days regardless of classification. Four scripts, four slightly different copies of that rule.",
    objective:
      "Write `retention_days(classification, base=30, legal_hold=False)`. When legal_hold is true it returns 3650. Otherwise it returns base times 3 when classification is \"restricted\", and base for any other classification. It must work with only the classification given, with positional overrides, and with keyword overrides.",
    starterCode: `def retention_days(classification):
    # TODO: add base=30 and legal_hold=False, then implement the rule:
    # legal hold wins with 3650; restricted is base * 3; everything else is base
    ...
`,
    referenceSolution: `def retention_days(classification, base=30, legal_hold=False):
    if legal_hold:
        return 3650
    if classification == "restricted":
        return base * 3
    return base
`,
    tests: {
      visible: `
def test_defaults_only():
    "Only the classification is required"
    check(solution.retention_days("public") == 30, "A plain classification with no overrides should use the default base")
    check(solution.retention_days("restricted") == 90, "A restricted record should keep three times the default base")

def test_keyword_overrides():
    "base and legal_hold can be given by name"
    check(solution.retention_days("public", base=10) == 10, "A base passed by keyword should replace the default")
    check(solution.retention_days("public", legal_hold=True) == 3650, "A legal hold should freeze retention regardless of classification")
`,
      hidden: `
import inspect

def test_positional_call():
    check(solution.retention_days("restricted", 7, False) == 21, "Positional base and legal_hold should be honoured in order")

def test_legal_hold_beats_restricted():
    check(solution.retention_days("restricted", base=5, legal_hold=True) == 3650, "Legal hold should win even for restricted records with a custom base")

def test_keyword_base_with_restricted():
    check(solution.retention_days("restricted", base=10) == 30, "A restricted record should keep three times whatever base is given")

def test_defaults_declared():
    params = inspect.signature(solution.retention_days).parameters
    check(params["base"].default is not inspect.Parameter.empty, "base should have a default")
    check(params["legal_hold"].default is not inspect.Parameter.empty and not params["legal_hold"].default, "legal_hold should default to off")
`,
    },
  },
};

export default mission;
