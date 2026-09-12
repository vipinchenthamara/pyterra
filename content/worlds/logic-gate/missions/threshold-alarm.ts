import type { MissionInput } from "../../../schema";

/**
 * LG-01 — Threshold Alarm. Build: turn a raw CPU percentage into one of three alarm labels
 * with an if / elif / else chain and inclusive >= thresholds.
 */
const mission: MissionInput = {
  id: "threshold-alarm",
  version: 1,
  worldId: "logic-gate",
  order: 1,
  title: "Threshold Alarm",
  codename: "LG-01",
  kind: "build",
  difficulty: 1,
  weight: 1,
  estimatedMinutes: 7,
  skills: [{ id: "conditions", role: "primary" }],
  prerequisites: [],
  briefing:
    "The checkpoint's compute node pushes a raw CPU percentage to the ops wall every five seconds. The wall just shows the number, and last night a reading of 97 sat there for forty minutes because nobody happened to be looking. The gate controller needs every reading turned into one of the three words the on-call rota already acts on: CRITICAL, WARNING or OK, with the lines drawn at 90 and 70.",
  objective:
    "Write a function `alarm_level(cpu_pct)` that takes a CPU percentage (int or float) and returns the string \"CRITICAL\" when cpu_pct is 90 or above, \"WARNING\" when it is 70 or above but below 90, and \"OK\" otherwise. Both thresholds are inclusive: exactly 90 is CRITICAL and exactly 70 is WARNING.",
  predictPrompt:
    "Before you run anything: the starter answers OK for every reading. If you wrote the warning check as cpu_pct > 70 instead of >= 70, what would a reading of exactly 70 become, and is that what the rota expects?",
  starterCode: `# Compute node telemetry — one raw CPU percentage per sample
cpu_pct = 82.5

def alarm_level(cpu_pct):
    # TODO: return "CRITICAL" at 90 or above, "WARNING" at 70 or above, otherwise "OK"
    return "OK"

print(alarm_level(cpu_pct))
`,
  referenceSolution: `cpu_pct = 82.5

def alarm_level(cpu_pct):
    if cpu_pct >= 90:
        return "CRITICAL"
    elif cpu_pct >= 70:
        return "WARNING"
    else:
        return "OK"

print(alarm_level(cpu_pct))
`,
  tests: {
    visible: `
def test_critical_band():
    "Readings at or above the critical line are CRITICAL"
    check(solution.alarm_level(95) == "CRITICAL", "A reading well above the critical line should be reported as CRITICAL")
    check(solution.alarm_level(90) == "CRITICAL", "A reading exactly on the critical line should already count as CRITICAL")

def test_warning_band():
    "Readings from the warning line up to the critical line are WARNING"
    check(solution.alarm_level(80) == "WARNING", "A reading between the two lines should be reported as WARNING")
    check(solution.alarm_level(70) == "WARNING", "A reading exactly on the warning line should already count as WARNING")

def test_ok_band():
    "Readings below the warning line are OK"
    check(solution.alarm_level(45) == "OK", "A reading below the warning line should be reported as OK")
`,
    hidden: `
def test_just_below_warning():
    check(solution.alarm_level(69.9) == "OK", "A reading a fraction below the warning line should still be OK, not WARNING")

def test_just_below_critical():
    check(solution.alarm_level(89.9) == "WARNING", "A reading a fraction below the critical line should be WARNING, not CRITICAL")

def test_idle_node():
    check(solution.alarm_level(0) == "OK", "An idle node should be reported as OK")

def test_saturated_node():
    check(solution.alarm_level(100) == "CRITICAL", "A fully saturated node should be reported as CRITICAL")

def test_returns_exact_labels():
    for v in (0, 70, 90):
        out = solution.alarm_level(v)
        check(isinstance(out, str) and out in ("OK", "WARNING", "CRITICAL"), "The function should return exactly one of the three upper-case labels, spelled as the rota spells them")
`,
  },
  hints: [
    "One number has to become one of three words. The answer depends on where the number sits relative to two fixed lines, 90 and 70, so the code has to ask a question about the number and act differently depending on the answer.",
    "This is an if / elif / else chain built on comparison operators. `>=` asks \"at or above\". Each branch returns its own label, and the else branch catches every reading the first two questions did not claim.",
    "Tiny unrelated example: def disk_state(free_gb): if free_gb < 5: return \"FULL\" elif free_gb < 20: return \"LOW\" else: return \"FINE\". The first comparison that is true wins, the function returns at once, and the remaining branches are never looked at.",
    "Shape: if cpu_pct is at or above 90, return the CRITICAL label; elif it is at or above 70, return WARNING; else return OK. Ask about the highest line first so the warning question never swallows a critical reading.",
    `if cpu_pct >= 90:
    return "CRITICAL"
elif cpu_pct >= 70:
    ...  # the WARNING label goes here
else:
    ...  # and OK here`,
    "Full walkthrough: cpu_pct >= 90 is asked first; if it holds, the function returns \"CRITICAL\" and nothing else runs. Otherwise elif cpu_pct >= 70 is asked; a reading of 70 satisfies it and returns \"WARNING\". Anything that reached the else branch failed both questions, so it returns \"OK\". Because >= includes the boundary, 90 and 70 land in the upper band, exactly as the rota expects.",
  ],
  errorExplanations: [
    {
      match: "'>=' not supported between instances of 'str' and|'<' not supported between instances of 'str' and",
      title: "Comparing text to a number",
      explanation:
        "One side of the comparison is text, such as \"90\" in quotes, and the other is a number. Comparison needs both sides to be numbers: write the threshold as 90, not \"90\".",
    },
    {
      match: "name '(CRITICAL|WARNING|OK)' is not defined",
      title: "Labels need quotes",
      explanation:
        "Written bare, CRITICAL looks like a variable name to Python and there is no such variable. The label is text, so return it in quotes: \"CRITICAL\".",
    },
    {
      match: "expected ':'|invalid syntax",
      title: "Every if, elif and else line ends with a colon",
      explanation:
        "The line that asks the question, if cpu_pct >= 90:, must end with a colon, and the lines under it must be indented. Check the colon and the indentation on each branch.",
    },
  ],
  anchors: ["conditions"],
  explainWhy: {
    question: "Why must the >= 90 question come before the >= 70 question?",
    options: [
      "Python evaluates the largest number first regardless of order",
      "A reading of 95 also satisfies >= 70, and the chain stops at the first true branch, so asking 70 first would label every critical reading WARNING",
      "elif only works with descending numbers",
      "The order does not matter because both branches return a string",
    ],
    correctIndex: 1,
    explanation:
      "An if / elif / else chain answers the first question that is true and ignores the rest. Overlapping questions must be asked from most specific to least specific, which for thresholds means highest first.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "gate-plaza", level: 1 },
    { kind: "layer", layer: "checkpoint-arch", level: 1 },
    { kind: "stat", stat: "systems_online", add: 1 },
  ],
  artifacts: [],
  reviewVariant: {
    briefing:
      "The API gateway reports the p95 latency of every route in milliseconds. The SRE runbook speaks in three words: BREACH at 500 ms or more, DEGRADED at 200 ms or more, NOMINAL below that. The number has to become the word.",
    objective:
      "Write a function `latency_state(p95_ms)` that returns \"BREACH\" when p95_ms is 500 or above, \"DEGRADED\" when it is 200 or above but below 500, and \"NOMINAL\" otherwise.",
    starterCode: `def latency_state(p95_ms):
    # return "BREACH" (500 or more), "DEGRADED" (200 or more), otherwise "NOMINAL"
    ...
`,
    referenceSolution: `def latency_state(p95_ms):
    if p95_ms >= 500:
        return "BREACH"
    elif p95_ms >= 200:
        return "DEGRADED"
    else:
        return "NOMINAL"
`,
    tests: {
      visible: `
def test_three_bands():
    "Each latency band maps to its runbook word"
    check(solution.latency_state(800) == "BREACH", "A latency far above the breach line should be reported as BREACH")
    check(solution.latency_state(350) == "DEGRADED", "A latency between the two lines should be reported as DEGRADED")
    check(solution.latency_state(40) == "NOMINAL", "A latency below the degraded line should be reported as NOMINAL")
`,
      hidden: `
def test_breach_boundary():
    check(solution.latency_state(500) == "BREACH", "A latency exactly on the breach line should already count as BREACH")

def test_degraded_boundary():
    check(solution.latency_state(200) == "DEGRADED", "A latency exactly on the degraded line should already count as DEGRADED")

def test_just_under_degraded():
    check(solution.latency_state(199.9) == "NOMINAL", "A latency a fraction under the degraded line should still be NOMINAL")

def test_zero_latency():
    check(solution.latency_state(0) == "NOMINAL", "A route with no measurable latency should be NOMINAL")
`,
    },
  },
};

export default mission;
