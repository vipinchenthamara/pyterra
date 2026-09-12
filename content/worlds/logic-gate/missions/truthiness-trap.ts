import type { MissionInput } from "../../../schema";

/**
 * LG-04 — Truthiness Trap. Fix-bug: three helpers that run cleanly and answer wrongly because
 * they compare a list to True, a bool to the text "True", and use plain truthiness where 0 is valid.
 */
const mission: MissionInput = {
  id: "truthiness-trap",
  version: 1,
  worldId: "logic-gate",
  order: 4,
  title: "Truthiness Trap",
  codename: "LG-04",
  kind: "fix-bug",
  difficulty: 3,
  weight: 1,
  estimatedMinutes: 8,
  skills: [
    { id: "boolean-logic", role: "primary" },
    { id: "conditions", role: "secondary" },
  ],
  prerequisites: ["risk-score"],
  briefing:
    "Three gate helpers shipped last sprint and none of them crashes, which is exactly why nobody looked at them. Yet the ops wall showed \"no alerts\" while forty intrusion rows sat in the queue, the MFA feature flag stayed off for every tenant even after it was switched on, and every request with a clean risk score of 0 was thrown back into the review queue as if it had never been scored. All three helpers run to completion, and all three give the wrong answer.",
  objective:
    "Fix the three helpers without changing their names or signatures. `has_alerts(alerts)` takes a list and returns True when it holds at least one alert and False when it is empty. `is_enabled(flag)` takes a bool and returns that bool's value. `needs_review(score)` returns True only when score is None (never scored); a score of 0 is a real, clean result and returns False, as does any other number. Every helper returns a real boolean.",
  predictPrompt:
    "Before running: the starter prints three lines and raises nothing. For has_alerts([\"intrusion\", \"power\"]), what does the expression alerts == True evaluate to, and so what will the helper return?",
  starterCode: `# Gate helpers — they run, they finish, they are wrong.
open_alerts = ["intrusion", "power"]
mfa_flag = True
risk_score = 0        # 0 means scored and clean; None means never scored

def has_alerts(alerts):
    # symptom: reports no alerts even when the queue is full
    if alerts == True:
        return True
    return False

def is_enabled(flag):
    # symptom: reports disabled even after the flag is switched on
    if flag == "True":
        return True
    return False

def needs_review(score):
    # symptom: a clean score of 0 is sent back for review as if it were missing
    if score:
        return False
    return True

# TODO: fix each check so the helpers answer correctly
print("alerts:", has_alerts(open_alerts))
print("mfa:", is_enabled(mfa_flag))
print("review:", needs_review(risk_score))
`,
  referenceSolution: `open_alerts = ["intrusion", "power"]
mfa_flag = True
risk_score = 0

def has_alerts(alerts):
    if alerts:
        return True
    return False

def is_enabled(flag):
    if flag:
        return True
    return False

def needs_review(score):
    if score is None:
        return True
    return False

print("alerts:", has_alerts(open_alerts))
print("mfa:", is_enabled(mfa_flag))
print("review:", needs_review(risk_score))
`,
  tests: {
    visible: `
def test_has_alerts_sees_a_full_queue():
    "has_alerts reports True for a non-empty queue"
    check(solution.has_alerts(["intrusion", "power"]) is True, "A queue with alerts in it should be reported as having alerts")

def test_has_alerts_sees_an_empty_queue():
    "has_alerts reports False for an empty queue"
    check(solution.has_alerts([]) is False, "An empty queue should be reported as having no alerts")

def test_is_enabled_follows_the_flag():
    "is_enabled returns the flag's own value"
    check(solution.is_enabled(True) is True, "A flag that is switched on should be reported as enabled")
    check(solution.is_enabled(False) is False, "A flag that is switched off should be reported as disabled")

def test_needs_review_tells_zero_from_missing():
    "A score of 0 is a real result; None is missing"
    check(solution.needs_review(0) is False, "A clean score of zero has been scored and should not need review")
    check(solution.needs_review(None) is True, "A request that was never scored should need review")
`,
    hidden: `
def test_has_alerts_single_item():
    check(solution.has_alerts(["power"]) is True, "Even a single alert should count as having alerts")

def test_has_alerts_many_items():
    check(solution.has_alerts(["intrusion"] * 40) is True, "A queue with many alerts should be reported as having alerts")

def test_needs_review_positive_score():
    check(solution.needs_review(87) is False, "A request with a real score should not need review")

def test_needs_review_zero_float():
    check(solution.needs_review(0.0) is False, "A clean score of zero as a float has still been scored and should not need review")

def test_all_return_real_booleans():
    outs = [
        solution.has_alerts([]), solution.has_alerts(["x"]),
        solution.is_enabled(True), solution.is_enabled(False),
        solution.needs_review(None), solution.needs_review(0),
    ]
    for out in outs:
        check(out is True or out is False, "Every helper should return the boolean True or False, not a list, string, number or None")
`,
  },
  hints: [
    "None of the three checks crashes, so the bug is in what each comparison means. Ask of each one: what am I actually comparing against, and could that comparison ever be true for the kind of value this helper receives?",
    "Truthiness: an empty list, 0, an empty string and None are all falsy; a non-empty list and any other number are truthy, and `if x:` uses that directly. `==` compares values: a list is never equal to True and a bool is never equal to the text \"True\". To ask \"is this missing?\", test identity with `is None`, so a real 0 is not mistaken for missing.",
    "Tiny unrelated example: queue = [\"job\"]; queue == True is False, yet bool(queue) is True. And retries = 0: `if retries:` skips the branch, but `if retries is None:` correctly reports that 0 is a real value, not a missing one.",
    "Shape: has_alerts should branch on the list itself. is_enabled should branch on the flag itself. needs_review should branch on whether score is None and return True in that case only, False for everything else.",
    "if alerts:  — for the first helper. if flag:  — for the second. The third begins if score is None: and returns True inside that branch.",
    "Full walkthrough: if alerts: is True for any non-empty list, so a full queue reports True and an empty one falls through to False. if flag: uses the bool directly; a bool compared to the text \"True\" was never equal. if score is None: asks whether the score is missing by identity, so 0 and 0.0 fall through to False while None returns True. Each helper still returns only True or False.",
  ],
  errorExplanations: [
    {
      match: "'(<|>|<=|>=)' not supported between instances of 'NoneType' and",
      title: "Comparing None to a number",
      explanation:
        "score can be None, and None cannot be ordered against a number. Ask if score is None first; only a real number should ever reach a numeric comparison.",
    },
    {
      match: "\"is\" with .* literal|SyntaxWarning",
      title: "is checks identity, not value",
      explanation:
        "is asks whether two names point at the very same object. Use it only for None. To compare against a number or a string, use ==.",
    },
    {
      match: "object of type 'bool' has no len",
      title: "A bool has no length",
      explanation:
        "len() only works on collections such as lists. The flag is a bool, so test it directly with if flag: rather than measuring it.",
    },
  ],
  anchors: ["boolean-logic", "conditions"],
  explainWhy: {
    question: "Why does `if alerts:` work where `if alerts == True:` did not?",
    options: [
      "if converts the list to a number and checks whether it is above zero",
      "if asks for the truthiness of the list, and a non-empty list is truthy, whereas == asks whether the list is literally equal to the value True, which it never is",
      "== only works on strings, so the comparison was silently skipped",
      "if alerts: is shorthand for if alerts == True: and both behave the same",
    ],
    correctIndex: 1,
    explanation:
      "Truthiness and equality are different questions. Every Python value has a truth value (empty collections, 0, empty strings and None are falsy) and if uses that. == compares two values for equality, and a list can never equal the bool True.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "risk-shield", level: 1 },
    { kind: "stat", stat: "security", add: 10 },
  ],
  artifacts: [],
  reviewVariant: {
    briefing:
      "The service registry stores an owner email for each service and a request timeout in seconds. A timeout of 0 means \"no timeout\", a real and deliberate setting; a timeout of None means the field was never configured. Two helpers were written with the same shortcuts as the gate helpers, and both give wrong answers.",
    objective:
      "Fix `has_owner(owner)` so it returns True when owner is a non-empty string and False when it is an empty string or None, and fix `timeout_unset(timeout)` so it returns True only when timeout is None, and False for 0 or any other number. Return real booleans.",
    starterCode: `def has_owner(owner):
    # symptom: reports no owner even when an email is set
    if owner == True:
        return True
    return False

def timeout_unset(timeout):
    # symptom: a timeout of 0 is reported as never configured
    if not timeout:
        return True
    return False
`,
    referenceSolution: `def has_owner(owner):
    if owner:
        return True
    return False

def timeout_unset(timeout):
    if timeout is None:
        return True
    return False
`,
    tests: {
      visible: `
def test_has_owner_with_email():
    "A service with an owner email has an owner"
    check(solution.has_owner("ops@example.com") is True, "A non-empty owner email should be reported as an owner")

def test_has_owner_empty():
    "An empty owner field has no owner"
    check(solution.has_owner("") is False, "An empty owner field should be reported as having no owner")
`,
      hidden: `
def test_has_owner_none():
    check(solution.has_owner(None) is False, "A missing owner field should be reported as having no owner")

def test_timeout_zero_is_configured():
    check(solution.timeout_unset(0) is False, "A timeout of zero is a deliberate setting and should not count as unset")

def test_timeout_none_is_unset():
    check(solution.timeout_unset(None) is True, "A timeout that was never configured should be reported as unset")

def test_timeout_positive_is_configured():
    check(solution.timeout_unset(30) is False, "A configured timeout should not be reported as unset")
`,
    },
  },
};

export default mission;
