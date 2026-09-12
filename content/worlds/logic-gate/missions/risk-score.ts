import type { MissionInput } from "../../../schema";

/**
 * LG-03 — Risk Score. Fill-gap: complete two boolean expressions that combine sign-in
 * signals with and / or, where operator precedence decides the tier.
 */
const mission: MissionInput = {
  id: "risk-score",
  version: 1,
  worldId: "logic-gate",
  order: 3,
  title: "Risk Score",
  codename: "LG-03",
  kind: "fill-gap",
  difficulty: 2,
  weight: 1,
  estimatedMinutes: 9,
  skills: [
    { id: "boolean-logic", role: "primary" },
    { id: "conditions", role: "secondary" },
  ],
  prerequisites: ["badge-check"],
  briefing:
    "The identity provider tags every sign-in with four signals: a new device, an unusual region for the account, the number of failed logins just before this one, and whether the account is an admin. The SOC wants each sign-in placed in one of three tiers. A new device and an unusual region together is the classic account-takeover pattern, and so is a burst of five or more failed logins; any single signal on its own is worth a closer look, and admin accounts always get at least a closer look. The tier function is half written: the two decision lines are missing.",
  objective:
    "Fill the two gaps in `risk_tier(new_device, unusual_region, failed_logins, is_admin)` so it returns \"high\" when new_device and unusual_region are both True, or when failed_logins is 5 or more; otherwise \"elevated\" when new_device is True, or unusual_region is True, or failed_logins is above 0, or is_admin is True; otherwise \"low\". Combine the signals with and / or inside the two existing conditions.",
  predictPrompt:
    "Before filling anything in: Python reads a and b or c as (a and b) or c, never as a and (b or c). For a sign-in from a known device in a known region with five failed logins, which of those two readings lands it in the high tier, and which one quietly drops it to elevated?",
  starterCode: `# Sign-in risk signals from the identity provider
new_device = True
unusual_region = False
failed_logins = 5
is_admin = False

def risk_tier(new_device, unusual_region, failed_logins, is_admin):
    # TODO gap 1: "high" when BOTH new_device and unusual_region, OR failed_logins is 5 or more
    if ____:
        return "high"
    # TODO gap 2: "elevated" when ANY single signal is present (new device, unusual region,
    #             at least one failed login) OR the account is an admin
    elif ____:
        return "elevated"
    else:
        return "low"

print(risk_tier(new_device, unusual_region, failed_logins, is_admin))
`,
  referenceSolution: `new_device = True
unusual_region = False
failed_logins = 5
is_admin = False

def risk_tier(new_device, unusual_region, failed_logins, is_admin):
    if (new_device and unusual_region) or failed_logins >= 5:
        return "high"
    elif new_device or unusual_region or failed_logins > 0 or is_admin:
        return "elevated"
    else:
        return "low"

print(risk_tier(new_device, unusual_region, failed_logins, is_admin))
`,
  tests: {
    visible: `
def test_takeover_pattern_is_high():
    "New device AND unusual region together is high"
    check(solution.risk_tier(True, True, 0, False) == "high", "A new device combined with an unusual region should be the top tier")

def test_single_signal_is_elevated():
    "One signal on its own is elevated, not high"
    check(solution.risk_tier(True, False, 0, False) == "elevated", "A new device on its own should be a closer look, not the top tier")
    check(solution.risk_tier(False, True, 0, False) == "elevated", "An unusual region on its own should be a closer look, not the top tier")

def test_clean_sign_in_is_low():
    "No signals and not an admin: low"
    check(solution.risk_tier(False, False, 0, False) == "low", "A sign-in with no signals from a non-admin should be the lowest tier")

def test_admin_is_at_least_elevated():
    "Admin accounts never sit in the low tier"
    check(solution.risk_tier(False, False, 0, True) == "elevated", "An admin with no other signals should still get a closer look")
`,
    hidden: `
def test_failed_login_burst_alone_reaches_high():
    # Fails for new_device and (unusual_region or failed_logins >= 5): the burst must stand on its own.
    check(solution.risk_tier(False, False, 5, False) == "high", "Five failed logins should reach the top tier on their own, even from a known device in a known region")

def test_burst_with_unusual_region_only():
    check(solution.risk_tier(False, True, 7, False) == "high", "A burst of failed logins should be the top tier regardless of the device signal")

def test_four_failed_logins_is_elevated():
    check(solution.risk_tier(False, False, 4, False) == "elevated", "Failed logins below the burst threshold should be a closer look, not the top tier")

def test_one_failed_login_is_elevated():
    check(solution.risk_tier(False, False, 1, False) == "elevated", "A single failed login is a signal and should lift the sign-in above the lowest tier")

def test_admin_with_takeover_pattern_is_high():
    check(solution.risk_tier(True, True, 0, True) == "high", "The takeover pattern should outrank the admin rule")

def test_new_device_with_a_few_failures_stays_elevated():
    check(solution.risk_tier(True, False, 3, False) == "elevated", "A new device with a few failed logins is still a closer look, not the top tier, unless the region is also unusual")
`,
  },
  hints: [
    "Two of the signals only matter when they appear together, one matters on its own once it passes a threshold, and any single signal is worth a closer look. Each gap is one yes/no expression built from the four inputs.",
    "`and` is true only when both sides are true; `or` is true when either side is. `and` binds tighter than `or`, so parentheses around the pair make the grouping visible: (a and b) or c.",
    "Tiny unrelated example: (is_prod and customer_facing) or error_rate >= 25 is true for a production customer-facing service, or for any service whose error rate reached 25, whatever the other two say.",
    "Shape for gap 1: (new_device and unusual_region) or failed_logins at least 5. Shape for gap 2: new_device or unusual_region or failed_logins above zero or is_admin.",
    "if (new_device and unusual_region) or failed_logins >= 5:  — that is gap 1. Gap 2 is a chain of four signals joined by or, where the failed-logins signal is a comparison against zero.",
    "Full walkthrough: gap 1 is (new_device and unusual_region) or failed_logins >= 5. The parentheses group the pair; the or lets the burst reach high by itself. Gap 2 is new_device or unusual_region or failed_logins > 0 or is_admin: any one true signal makes the whole or true. Because the elif only runs when gap 1 was false, a sign-in that reaches it is guaranteed not to be high, so the chain hands out exactly one tier.",
  ],
  errorExplanations: [
    {
      match: "name '____' is not defined",
      title: "A gap is still empty",
      explanation:
        "The four underscores are a placeholder, not Python. Replace each ____ with a boolean expression built from the four signals before running.",
    },
    {
      match: "name '(true|false)' is not defined",
      title: "Python capitalises its booleans",
      explanation:
        "true and false in lower case are unknown names. The two boolean values are spelled True and False. In this mission you rarely need them at all: the signals are already booleans.",
    },
    {
      match: "invalid syntax",
      title: "Check the operators",
      explanation:
        "Python has no && or ||; combine conditions with the words and and or. Also check that at-least-five is written failed_logins >= 5, with the > before the =.",
    },
  ],
  anchors: ["boolean-logic", "conditions"],
  explainWhy: {
    question: "Why does new_device and unusual_region or failed_logins >= 5 already mean the right thing even without parentheses?",
    options: [
      "Python evaluates boolean operators strictly left to right",
      "and has higher precedence than or, so Python groups it as (new_device and unusual_region) or (failed_logins >= 5)",
      "or is ignored when and is present on the same line",
      "Comparisons like >= 5 are always evaluated last, after and and or",
    ],
    correctIndex: 1,
    explanation:
      "Comparisons bind tightest, then not, then and, then or. The pair is grouped by and before the or is applied, so the burst can reach high on its own. Parentheses do not change the meaning here; they make it obvious to the next reader.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "decision-beacons", level: 2 },
    { kind: "layer", layer: "policy-board", level: 1 },
    { kind: "stat", stat: "security", add: 10 },
  ],
  artifacts: ["access-control-engine"],
  reviewVariant: {
    briefing:
      "The incident router reads three facts from every alert: whether the service is in production, whether it is customer-facing, and its error rate as a percentage. The on-call is paged for a production customer-facing service, or for any service whose error rate reaches 25. Any single one of those facts opens a ticket instead. Everything else is just logged.",
    objective:
      "Write a function `escalation(is_prod, customer_facing, error_rate)` that returns \"page\" when is_prod and customer_facing are both True, or when error_rate is 25 or more; otherwise \"ticket\" when is_prod is True, or customer_facing is True, or error_rate is above 0; otherwise \"log\".",
    starterCode: `def escalation(is_prod, customer_facing, error_rate):
    # "page" for (prod AND customer-facing) OR error_rate of 25 or more
    # "ticket" for any single one of those facts
    # "log" otherwise
    ...
`,
    referenceSolution: `def escalation(is_prod, customer_facing, error_rate):
    if (is_prod and customer_facing) or error_rate >= 25:
        return "page"
    elif is_prod or customer_facing or error_rate > 0:
        return "ticket"
    else:
        return "log"
`,
    tests: {
      visible: `
def test_prod_customer_facing_pages():
    "Production and customer-facing together pages"
    check(solution.escalation(True, True, 0) == "page", "A production customer-facing alert should page the on-call")

def test_quiet_internal_service_logs():
    "No facts present: just log it"
    check(solution.escalation(False, False, 0) == "log", "An alert with no escalation facts should only be logged")
`,
      hidden: `
def test_high_error_rate_pages_on_its_own():
    check(solution.escalation(False, False, 30) == "page", "An error rate at or above the paging line should page even for a non-production internal service")

def test_prod_alone_is_a_ticket():
    check(solution.escalation(True, False, 0) == "ticket", "Production on its own should open a ticket, not a page")

def test_small_error_rate_is_a_ticket():
    check(solution.escalation(False, False, 5) == "ticket", "A non-zero error rate below the paging line should open a ticket")

def test_paging_line_is_inclusive():
    check(solution.escalation(False, False, 25) == "page", "An error rate exactly on the paging line should page")
`,
    },
  },
};

export default mission;
