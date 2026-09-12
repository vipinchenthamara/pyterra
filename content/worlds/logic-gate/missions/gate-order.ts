import type { MissionInput } from "../../../schema";

/**
 * LG-05 — Gate Order. Predict: an if / elif chain whose thresholds are in ascending order
 * answers the first true question, so higher bands are never reached. Reorder it.
 */
const mission: MissionInput = {
  id: "gate-order",
  version: 1,
  worldId: "logic-gate",
  order: 5,
  title: "Gate Order",
  codename: "LG-05",
  kind: "predict",
  difficulty: 3,
  weight: 1,
  estimatedMinutes: 8,
  skills: [{ id: "conditions", role: "primary" }],
  prerequisites: ["truthiness-trap"],
  briefing:
    "The risk beacons on the plaza take a 0 to 100 risk score and light one of four colours: critical at 90 and above, high at 70, medium at 50, low below that. Someone tidied the classifier so the thresholds read in ascending order, and since then no beacon has shown high or critical. A 94 that should have paged the on-call sat in the medium queue all night. Nothing crashed; the chain simply answers the first question it is asked.",
  objective:
    "Rewrite `classify(score)` so it returns \"critical\" when score is 90 or above, \"high\" when it is 70 or above but below 90, \"medium\" when it is 50 or above but below 70, and \"low\" otherwise. Keep the top-level `print(classify(75))` so the beacon test can see the printed label.",
  predictPrompt:
    "Before running: read the starter's chain top to bottom for a score of 75. Which branch is the first whose condition is true, and so what will print(classify(75)) show?",
  starterCode: `# Beacon classifier — "tidied" so the thresholds read in ascending order
def classify(score):
    if score >= 50:
        return "medium"
    elif score >= 70:
        return "high"
    elif score >= 90:
        return "critical"
    else:
        return "low"

# TODO: fix the chain so the most specific (highest) threshold is asked first
print(classify(75))
`,
  referenceSolution: `def classify(score):
    if score >= 90:
        return "critical"
    elif score >= 70:
        return "high"
    elif score >= 50:
        return "medium"
    else:
        return "low"

print(classify(75))
`,
  tests: {
    visible: `
def test_high_band():
    "Scores in the high band come back as high"
    check(solution.classify(75) == "high", "A score in the high band should be labelled high, not swallowed by the medium check")

def test_critical_band():
    "Scores at the top of the scale come back as critical"
    check(solution.classify(94) == "critical", "A score at the top of the scale should be labelled critical")

def test_printed_label():
    "The printed line shows the correct label for 75"
    check("high" in solution_stdout.split(), "The top-level print of classify(75) should show the high label")
`,
    hidden: `
def test_boundaries_belong_to_the_upper_band():
    check(solution.classify(90) == "critical", "A score exactly on the critical threshold should be critical")
    check(solution.classify(70) == "high", "A score exactly on the high threshold should be high")
    check(solution.classify(50) == "medium", "A score exactly on the medium threshold should be medium")

def test_just_below_each_boundary():
    check(solution.classify(89) == "high", "A score just below the critical threshold should be high")
    check(solution.classify(69) == "medium", "A score just below the high threshold should be medium")
    check(solution.classify(49) == "low", "A score just below the medium threshold should be low")

def test_extremes():
    check(solution.classify(0) == "low", "The lowest possible score should be low")
    check(solution.classify(100) == "critical", "The highest possible score should be critical")

def test_returns_exact_labels():
    for v in (0, 50, 70, 90):
        check(solution.classify(v) in ("low", "medium", "high", "critical"), "The classifier should return exactly one of the four lower-case labels")
`,
  },
  hints: [
    "Nothing in the chain is false for 75; the problem is which true condition is met first. A chain stops at the first branch whose condition holds, so the order of the questions is the logic.",
    "In an if / elif / else chain, once a branch matches the rest are never evaluated. When conditions overlap (every critical score is also at least 50), the most specific question must be asked first.",
    "Tiny unrelated example: def patch_priority(cvss): if cvss >= 9: return \"p1\" elif cvss >= 7: return \"p2\" else: return \"p3\". A 9.8 meets the strictest line first and never reaches the p2 branch.",
    "Shape: ask >= 90 first and return critical; then >= 70 for high; then >= 50 for medium; else low. Same four branches, opposite order.",
    `if score >= 90:
    return "critical"
elif score >= 70:
    ...  # high
elif ...:
    ...  # medium
else:
    ...  # low`,
    "Full walkthrough: with the thresholds descending, a 94 meets score >= 90 first and returns \"critical\". A 75 fails that, meets score >= 70 and returns \"high\". A 55 fails both, meets score >= 50 and returns \"medium\". Anything under 50 reaches else and returns \"low\". Each branch is reachable because every score that could satisfy it has already failed every stricter question above it.",
  ],
  errorExplanations: [
    {
      match: "invalid syntax",
      title: "elif, not else if",
      explanation:
        "Python spells the middle branches elif, and else must be the final branch with no condition. Check that every branch line ends with a colon and that no elif appears after the else.",
    },
    {
      match: "IndentationError|unexpected indent|expected an indented block",
      title: "Each branch body must be indented",
      explanation:
        "The return under each if, elif and else must be indented one level deeper than the keyword, and every branch must use the same indentation.",
    },
    {
      match: "name 'classify' is not defined",
      title: "The beacon calls it classify",
      explanation:
        "The function was renamed or its def line was removed. The plaza and the tests call classify(score), so keep that exact name.",
    },
  ],
  anchors: ["conditions"],
  explainWhy: {
    question: "Why did the ascending chain label a 75 as medium?",
    options: [
      "75 is closer to 50 than to 90, so Python picks the nearest threshold",
      "score >= 50 is true for 75, the chain returns at the first true branch, and the >= 70 branch is never reached",
      "elif branches are only checked when the score is a multiple of ten",
      "The medium label is the default for any score with no exact match",
    ],
    correctIndex: 1,
    explanation:
      "A chain has no notion of best match. It walks top to bottom and returns at the first condition that holds. Overlapping thresholds must therefore be ordered from strictest to loosest.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "policy-board", level: 1 },
    { kind: "layer", layer: "decision-beacons", level: 2 },
    { kind: "stat", stat: "systems_online", add: 1 },
  ],
  artifacts: [],
  reviewVariant: {
    briefing:
      "The vulnerability tracker sorts findings by CVSS score: p1 at 9.0 and above, p2 at 7.0, p3 at 4.0, p4 below that. The classifier was written with the lowest threshold first, and every finding above 4.0 is currently filed as a p3.",
    objective:
      "Fix `patch_priority(cvss)` so it returns \"p1\" for 9.0 and above, \"p2\" for 7.0 up to but not including 9.0, \"p3\" for 4.0 up to but not including 7.0, and \"p4\" below 4.0.",
    starterCode: `def patch_priority(cvss):
    # the thresholds are in the wrong order — reorder the chain
    if cvss >= 4.0:
        return "p3"
    elif cvss >= 7.0:
        return "p2"
    elif cvss >= 9.0:
        return "p1"
    else:
        return "p4"
`,
    referenceSolution: `def patch_priority(cvss):
    if cvss >= 9.0:
        return "p1"
    elif cvss >= 7.0:
        return "p2"
    elif cvss >= 4.0:
        return "p3"
    else:
        return "p4"
`,
    tests: {
      visible: `
def test_top_bands_are_reachable():
    "Critical and high findings get their own priority"
    check(solution.patch_priority(9.8) == "p1", "A finding near the top of the scale should be the top priority")
    check(solution.patch_priority(7.5) == "p2", "A high finding should be the second priority, not filed as a p3")
`,
      hidden: `
def test_boundaries():
    check(solution.patch_priority(9.0) == "p1", "A finding exactly on the p1 line should be p1")
    check(solution.patch_priority(7.0) == "p2", "A finding exactly on the p2 line should be p2")
    check(solution.patch_priority(4.0) == "p3", "A finding exactly on the p3 line should be p3")

def test_low_findings():
    check(solution.patch_priority(3.9) == "p4", "A finding just under the p3 line should be p4")
    check(solution.patch_priority(0.0) == "p4", "A finding with no score should be the lowest priority")
`,
    },
  },
};

export default mission;
