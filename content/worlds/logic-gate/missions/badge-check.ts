import type { MissionInput } from "../../../schema";

/**
 * LG-02 — Badge Check. Build: combine three independent facts with and / not and a
 * chained range comparison into a single boolean gate decision.
 */
const mission: MissionInput = {
  id: "badge-check",
  version: 1,
  worldId: "logic-gate",
  order: 2,
  title: "Badge Check",
  codename: "LG-02",
  kind: "build",
  difficulty: 2,
  weight: 1,
  estimatedMinutes: 9,
  skills: [
    { id: "conditions", role: "primary" },
    { id: "boolean-logic", role: "primary" },
  ],
  prerequisites: ["threshold-alarm"],
  briefing:
    "The checkpoint arch has a card reader, a watchlist feed and a clock, and today it believes whichever one it happens to consult. A revoked badge got through at 02:14 because the reader only looked at the hour, and a watchlisted contractor walked in at noon because the reader only looked at the badge. Physical security wants one decision that needs all three facts to line up: a valid badge, a holder who is not on the watchlist, and an hour inside the 06:00 to 22:00 access window.",
  objective:
    "Write a function `can_enter(badge_valid, on_watchlist, hour)` that returns the boolean True only when badge_valid is True, on_watchlist is False, and hour is at least 6 and below 22. In every other case it returns False. Return the actual values True and False, not strings, numbers or None.",
  predictPrompt:
    "Before running: a valid badge, not on the watchlist, presented at hour 22 exactly. Does the gate open? What about the same badge at hour 6?",
  starterCode: `# Checkpoint arch inputs — the reader, the watchlist feed and the clock
badge_valid = True
on_watchlist = False
hour = 14

def can_enter(badge_valid, on_watchlist, hour):
    # TODO: True only when the badge is valid AND the holder is not on the watchlist
    #       AND the hour is inside the 6 to 22 window (22 itself is closed)
    return True

print(can_enter(badge_valid, on_watchlist, hour))
`,
  referenceSolution: `badge_valid = True
on_watchlist = False
hour = 14

def can_enter(badge_valid, on_watchlist, hour):
    return badge_valid and not on_watchlist and 6 <= hour < 22

print(can_enter(badge_valid, on_watchlist, hour))
`,
  tests: {
    visible: `
def test_all_rules_satisfied():
    "Valid badge, clean record, inside the window: the gate opens"
    check(solution.can_enter(True, False, 14) is True, "When every rule is satisfied the gate should open with a True")

def test_invalid_badge_alone_blocks():
    "An invalid badge blocks entry on its own"
    check(solution.can_enter(False, False, 14) is False, "An invalid badge should block entry even inside the window with a clean record")

def test_watchlist_alone_blocks():
    "A watchlisted holder is blocked even with a valid badge"
    check(solution.can_enter(True, True, 14) is False, "A watchlisted holder should be blocked even with a valid badge inside the window")

def test_outside_window_blocks():
    "A request outside the access window is blocked"
    check(solution.can_enter(True, False, 3) is False, "A clean, valid badge outside the access window should still be blocked")
`,
    hidden: `
def test_window_opens_at_six():
    check(solution.can_enter(True, False, 6) is True, "The opening hour of the window should already be inside it")

def test_window_closed_at_twenty_two():
    check(solution.can_enter(True, False, 22) is False, "The closing hour is exclusive: the window should already be shut at that hour")

def test_last_hour_inside_window():
    check(solution.can_enter(True, False, 21) is True, "The hour just before closing should still be inside the window")

def test_midnight_blocked():
    check(solution.can_enter(True, False, 0) is False, "Midnight is outside the window and should be blocked")

def test_returns_real_booleans():
    for args in ((True, False, 10), (False, False, 10), (True, True, 10), (True, False, 23)):
        out = solution.can_enter(*args)
        check(out is True or out is False, "The gate should return the boolean True or False, not a string, a number or None")

def test_everything_wrong():
    check(solution.can_enter(False, True, 2) is False, "When every rule fails the gate must stay shut")
`,
  },
  hints: [
    "Three separate facts each have the power to keep the gate shut, and the gate may only open when none of them objects. Think about how three yes/no answers combine into one yes/no answer.",
    "Boolean operators combine conditions: `and` is true only when both sides are true, `not` flips a value, and a chained comparison such as 6 <= hour < 22 checks a range in one expression. The whole expression is already a bool, so it can be returned directly.",
    "Tiny unrelated example: def can_deploy(tests_green, freeze): return tests_green and not freeze. This is True only when the tests are green and no change freeze is active, and False in every other combination.",
    "Shape: the badge must be valid, AND the holder must NOT be on the watchlist, AND the hour must be at least 6 AND below 22. Either return that combined expression, or write an if that returns True when it holds and False otherwise.",
    "return badge_valid and not on_watchlist and ...  — finish the line with the hour range check, written as a chained comparison between 6 and 22.",
    "Full walkthrough: return badge_valid and not on_watchlist and 6 <= hour < 22. badge_valid must be True; not on_watchlist turns a False watchlist flag into True; 6 <= hour < 22 is True for hours 6 through 21. and joins the three so the result is True only when all three hold, and the result of and on booleans is itself a boolean, which is why the tests accept it with `is True`.",
  ],
  errorExplanations: [
    {
      match: "name '(true|false)' is not defined",
      title: "Python capitalises its booleans",
      explanation:
        "true and false in lower case are unknown names. The two boolean values are spelled True and False with a capital letter.",
    },
    {
      match: "invalid syntax",
      title: "Check the operators",
      explanation:
        "Python has no && or ||. Combine conditions with the words and, or and not. If the operators look right, check that the if line ends with a colon.",
    },
    {
      match: "'<=' not supported between instances of 'str' and|'<' not supported between instances of 'int' and 'str'",
      title: "Comparing the hour to text",
      explanation:
        "One side of the comparison is a quoted number such as \"22\". The hour is an int, so compare it to bare numbers: 6 <= hour < 22.",
    },
  ],
  anchors: ["boolean-logic", "conditions"],
  explainWhy: {
    question: "Why does `6 <= hour < 22` work as a single expression?",
    options: [
      "Python evaluates it as 6 <= hour and then ignores the second comparison",
      "Python chains comparisons, so it means 6 <= hour and hour < 22, with hour tested against both ends",
      "It only works because 6 is smaller than 22",
      "The expression returns the hour itself, which is then treated as True",
    ],
    correctIndex: 1,
    explanation:
      "A chained comparison is shorthand for two comparisons joined with and, sharing the middle value. It reads like the range it describes and produces a plain boolean.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "decision-beacons", level: 1 },
    { kind: "layer", layer: "checkpoint-arch", level: 2 },
    { kind: "stat", stat: "security", add: 15 },
  ],
  artifacts: ["access-control-engine"],
  reviewVariant: {
    briefing:
      "The deployment pipeline should push to production only when three facts line up: the test suite passed, no change freeze is active, and the change record carries at least two approvals. Today it pushes whenever any single one of those looks fine.",
    objective:
      "Write a function `can_deploy(tests_passed, freeze_active, approvals)` that returns True only when tests_passed is True, freeze_active is False, and approvals is 2 or more; otherwise it returns False. Return real booleans.",
    starterCode: `def can_deploy(tests_passed, freeze_active, approvals):
    # True only when tests passed AND no freeze AND at least 2 approvals
    ...
`,
    referenceSolution: `def can_deploy(tests_passed, freeze_active, approvals):
    return tests_passed and not freeze_active and approvals >= 2
`,
    tests: {
      visible: `
def test_all_clear_deploys():
    "Green tests, no freeze, enough approvals: deploy"
    check(solution.can_deploy(True, False, 2) is True, "When every gate is satisfied the pipeline should deploy with a True")

def test_freeze_blocks():
    "An active change freeze blocks the deploy"
    check(solution.can_deploy(True, True, 3) is False, "A change freeze should block the deploy even with green tests and approvals")
`,
      hidden: `
def test_failed_tests_block():
    check(solution.can_deploy(False, False, 3) is False, "Failed tests should block the deploy on their own")

def test_one_approval_is_not_enough():
    check(solution.can_deploy(True, False, 1) is False, "A single approval should not be enough to deploy")

def test_returns_real_booleans():
    for args in ((True, False, 2), (False, False, 2), (True, True, 2), (True, False, 0)):
        out = solution.can_deploy(*args)
        check(out is True or out is False, "The pipeline gate should return the boolean True or False")
`,
    },
  },
};

export default mission;
