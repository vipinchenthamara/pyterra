import type { MissionInput } from "../../../schema";

/**
 * LG-BOSS — Gate Decision Engine. Boss: an ordered policy over a request dict, combining
 * comparisons, and / or / not, first-match-wins ordering and a tolerant .get() for a missing key.
 */
const mission: MissionInput = {
  id: "gate-decision-engine",
  version: 1,
  worldId: "logic-gate",
  order: 6,
  title: "Gate Decision Engine",
  codename: "LG-BOSS",
  kind: "boss",
  difficulty: 4,
  weight: 3,
  estimatedMinutes: 20,
  skills: [
    { id: "conditions", role: "primary" },
    { id: "boolean-logic", role: "primary" },
  ],
  prerequisites: ["threshold-alarm", "badge-check", "risk-score", "truthiness-trap", "gate-order"],
  briefing:
    "Every gate in the district now has a rule or two, each written by a different team. The plaza needs one engine that takes a request record and returns a single decision: allow, deny or step-up. Security wrote the policy as an ordered list, and the order is the policy: a burst of failed logins is denied before anyone looks at the role, guests are denied outright, contractors are denied outside business hours, admins without MFA are challenged, and anyone from an unknown region without MFA is challenged too. Some older clients never send the mfa field at all; the engine must treat a missing field as MFA off, not crash.",
  objective:
    "Write `decide(request)` where request is a dict with keys role (\"admin\", \"operator\", \"contractor\" or \"guest\"), hour (int 0 to 23), region_known (bool), failed_logins (int) and optionally mfa (bool; a missing key means False). Apply the rules in this order and return the first that matches: failed_logins of 5 or more gives \"deny\"; role guest gives \"deny\"; role contractor with hour below 8 or 18 and above gives \"deny\"; role admin without mfa gives \"step-up\"; region_known False with mfa off gives \"step-up\"; otherwise \"allow\". Read mfa with request.get(\"mfa\", False).",
  predictPrompt:
    "Before writing anything: an admin with MFA on, from an unknown region, arriving with five failed logins. Which rule fires first, and what does the engine return? Now the same admin with two failed logins: what changes?",
  starterCode: `# Gate requests as the arch delivers them. Some older clients omit the "mfa" field.
request_a = {"role": "operator", "hour": 10, "region_known": True, "mfa": True, "failed_logins": 0}
request_b = {"role": "contractor", "hour": 22, "region_known": True, "mfa": True, "failed_logins": 1}
request_c = {"role": "admin", "hour": 9, "region_known": False, "failed_logins": 0}

def decide(request):
    # TODO: apply the policy in order and return "deny", "step-up" or "allow"
    return "allow"

print(decide(request_a))
print(decide(request_b))
print(decide(request_c))
`,
  referenceSolution: `request_a = {"role": "operator", "hour": 10, "region_known": True, "mfa": True, "failed_logins": 0}
request_b = {"role": "contractor", "hour": 22, "region_known": True, "mfa": True, "failed_logins": 1}
request_c = {"role": "admin", "hour": 9, "region_known": False, "failed_logins": 0}

def decide(request):
    role = request["role"]
    hour = request["hour"]
    mfa = request.get("mfa", False)
    if request["failed_logins"] >= 5:
        return "deny"
    if role == "guest":
        return "deny"
    if role == "contractor" and (hour < 8 or hour >= 18):
        return "deny"
    if role == "admin" and not mfa:
        return "step-up"
    if not request["region_known"] and not mfa:
        return "step-up"
    return "allow"

print(decide(request_a))
print(decide(request_b))
print(decide(request_c))
`,
  tests: {
    visible: `
def req(role, hour, region_known, failed_logins, mfa=None):
    r = {"role": role, "hour": hour, "region_known": region_known, "failed_logins": failed_logins}
    if mfa is not None:
        r["mfa"] = mfa
    return r

def test_clean_operator_allowed():
    "A known operator with MFA in business hours is allowed"
    check(solution.decide(req("operator", 10, True, 0, True)) == "allow", "An operator with MFA from a known region and no failed logins should be allowed")

def test_failed_login_burst_denied():
    "Five or more failed logins are denied before anything else"
    check(solution.decide(req("operator", 10, True, 5, True)) == "deny", "A burst of failed logins should be denied even for an otherwise clean request")

def test_guest_denied():
    "Guests are always denied"
    check(solution.decide(req("guest", 10, True, 0, True)) == "deny", "A guest should be denied even with MFA in business hours")

def test_contractor_after_hours_denied():
    "Contractors outside business hours are denied"
    check(solution.decide(req("contractor", 22, True, 0, True)) == "deny", "A contractor outside business hours should be denied")

def test_admin_without_mfa_challenged():
    "Admins without MFA get a step-up challenge"
    check(solution.decide(req("admin", 9, True, 0, False)) == "step-up", "An admin without MFA should be challenged, neither allowed nor denied")

def test_unknown_region_without_mfa_challenged():
    "Unknown region without MFA gets a step-up challenge"
    check(solution.decide(req("operator", 9, False, 0, False)) == "step-up", "A request from an unknown region without MFA should be challenged")
`,
    hidden: `
def req(role, hour, region_known, failed_logins, mfa=None):
    r = {"role": role, "hour": hour, "region_known": region_known, "failed_logins": failed_logins}
    if mfa is not None:
        r["mfa"] = mfa
    return r

def test_admin_with_burst_is_denied_not_challenged():
    check(solution.decide(req("admin", 9, True, 5, False)) == "deny", "The failed-login rule should outrank the admin step-up rule")

def test_guest_with_burst_is_denied():
    check(solution.decide(req("guest", 9, True, 9, True)) == "deny", "A guest with a burst of failed logins should be denied")

def test_contractor_business_hours_boundaries():
    check(solution.decide(req("contractor", 8, True, 0, True)) == "allow", "A contractor at the opening hour should be inside business hours")
    check(solution.decide(req("contractor", 17, True, 0, True)) == "allow", "A contractor in the last business hour should be allowed")
    check(solution.decide(req("contractor", 18, True, 0, True)) == "deny", "A contractor at the closing hour should already be outside business hours")
    check(solution.decide(req("contractor", 7, True, 0, True)) == "deny", "A contractor before the opening hour should be denied")

def test_contractor_after_hours_with_mfa_still_denied():
    check(solution.decide(req("contractor", 3, False, 0, True)) == "deny", "The contractor hours rule should outrank the MFA and region checks")

def test_missing_mfa_key_treated_as_off():
    check(solution.decide(req("admin", 9, True, 0)) == "step-up", "An admin whose request has no mfa field should be treated as MFA off and challenged")
    check(solution.decide(req("operator", 9, False, 0)) == "step-up", "An unknown-region request with no mfa field should be treated as MFA off and challenged")
    check(solution.decide(req("operator", 9, True, 0)) == "allow", "A known-region operator with no mfa field should still be allowed")

def test_admin_with_mfa_unknown_region_allowed():
    check(solution.decide(req("admin", 9, False, 0, True)) == "allow", "An admin with MFA from an unknown region has satisfied both challenge rules and should be allowed")

def test_operator_known_region_no_mfa_allowed():
    check(solution.decide(req("operator", 9, True, 2, False)) == "allow", "A known-region operator without MFA and only a couple of failed logins should be allowed")

def test_four_failed_logins_is_not_a_burst():
    check(solution.decide(req("operator", 9, True, 4, True)) == "allow", "Failed logins below the burst threshold should not trigger the deny rule")

def test_contractor_in_hours_unknown_region_no_mfa_challenged():
    check(solution.decide(req("contractor", 10, False, 0, False)) == "step-up", "A contractor inside business hours from an unknown region without MFA should be challenged, not denied")

def test_returns_exact_decision_strings():
    for r in (req("guest", 9, True, 0, True), req("admin", 9, True, 0, False), req("operator", 9, True, 0, True)):
        check(solution.decide(r) in ("allow", "deny", "step-up"), "The engine should return exactly one of the three lower-case decision strings")
`,
  },
  hints: [
    "The policy is an ordered list, and the order is the meaning: a request that matches an early rule never reaches a later one. Before writing code, list the six rules top to bottom and note which fields each one needs from the record.",
    "Each rule is a condition on one or two fields, and the decision is the first rule whose condition holds. Because every rule returns, a series of plain if statements, each with its own return, reads exactly like the written policy. and / or / not combine fields inside a single rule.",
    "Some records lack a field. A dictionary's .get(key, default) returns the default instead of raising, so the value can be read once at the top and reused by every rule. Reading the fields into named variables first keeps each rule to a single readable line.",
    "Shape: read role, hour, mfa (via .get with a False default) and failed_logins from the record. Then: if failed_logins is at least 5, return deny; if role is guest, return deny; if role is contractor and the hour is below 8 or at least 18, return deny; if role is admin and not mfa, return step-up; if not region_known and not mfa, return step-up; finally return allow.",
    `def decide(request):
    role = request["role"]
    hour = request["hour"]
    mfa = request.get("mfa", False)
    if request["failed_logins"] >= 5:
        return "deny"
    if role == "guest":
        return "deny"
    # contractor hours, admin MFA, unknown region, then allow`,
    "Full walkthrough: read role, hour and failed_logins with [] because they are always present, and mfa with request.get(\"mfa\", False) because it may be missing. Rule 1: if request[\"failed_logins\"] >= 5: return \"deny\". Rule 2: if role == \"guest\": return \"deny\". Rule 3: if role == \"contractor\" and (hour < 8 or hour >= 18): return \"deny\", with parentheses so the or is grouped before the and. Rule 4: if role == \"admin\" and not mfa: return \"step-up\". Rule 5: if not request[\"region_known\"] and not mfa: return \"step-up\". Last line: return \"allow\". Each return ends the function, so the first matching rule is the decision.",
  ],
  errorExplanations: [
    {
      match: "KeyError: 'mfa'",
      title: "The mfa field is not always there",
      explanation:
        "request[\"mfa\"] raises when the key is missing, and older clients omit it. Read it with request.get(\"mfa\", False) so a missing field counts as MFA off.",
    },
    {
      match: "'>=' not supported between instances of 'NoneType' and|'<' not supported between instances of 'NoneType' and",
      title: "A .get() without a default returned None",
      explanation:
        "request.get(\"failed_logins\") returns None when the key is absent, and None cannot be compared to a number. failed_logins is always present, so read it with request[\"failed_logins\"], or give .get a numeric default such as 0.",
    },
    {
      match: "'dict' object has no attribute",
      title: "Dictionary fields are read with brackets",
      explanation:
        "request.role looks for an attribute, which a dict does not have. Read a field by key: request[\"role\"], or request.get(\"mfa\", False) when it might be missing.",
    },
  ],
  anchors: ["conditions", "boolean-logic"],
  explainWhy: {
    question: "Why must the failed_logins check be the first rule rather than anywhere in the chain?",
    options: [
      "Numeric comparisons must always be evaluated before string comparisons",
      "The first matching rule returns and ends the function, so a later deny can never override an earlier step-up or allow; the most severe outcome has to be asked first to guarantee it wins",
      "Python evaluates all the rules and picks the most severe result automatically",
      "failed_logins is the only integer field, so it has to be handled separately",
    ],
    correctIndex: 1,
    explanation:
      "A chain of returning if statements is first-match-wins. Placing the burst rule first means an admin with MFA and a clean region is still denied when the failed-login count is high, which is what the policy demands.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "gate-plaza", level: 1 },
    { kind: "layer", layer: "checkpoint-arch", level: 2 },
    { kind: "layer", layer: "decision-beacons", level: 2 },
    { kind: "layer", layer: "policy-board", level: 1 },
    { kind: "layer", layer: "risk-shield", level: 2 },
    { kind: "stat", stat: "security", add: 30 },
    { kind: "stat", stat: "citizens", add: 600 },
  ],
  artifacts: ["access-control-engine"],
  reviewVariant: {
    briefing:
      "The support router receives ticket records with a severity (1 is the worst, 4 the mildest), a customer tier, and sometimes an sla_breached flag that older intake forms omit. The policy, in order: a breached SLA escalates; severity 1 escalates; free-tier tickets go to self-service; enterprise tickets go to the priority queue; everything else goes to the standard queue.",
    objective:
      "Write `route(ticket)` for a dict with keys severity (int), tier (\"enterprise\", \"standard\" or \"free\") and optionally sla_breached (bool; a missing key means False). Return the first matching rule: sla_breached True gives \"escalate\"; severity 1 gives \"escalate\"; tier free gives \"self-service\"; tier enterprise gives \"priority\"; otherwise \"standard\".",
    starterCode: `def route(ticket):
    # rules in order: SLA breached -> escalate; severity 1 -> escalate;
    # free tier -> self-service; enterprise -> priority; else standard
    # sla_breached may be missing: treat missing as False
    return "standard"
`,
    referenceSolution: `def route(ticket):
    if ticket.get("sla_breached", False):
        return "escalate"
    if ticket["severity"] == 1:
        return "escalate"
    if ticket["tier"] == "free":
        return "self-service"
    if ticket["tier"] == "enterprise":
        return "priority"
    return "standard"
`,
    tests: {
      visible: `
def test_enterprise_goes_to_priority():
    "A routine enterprise ticket lands in the priority queue"
    check(solution.route({"severity": 3, "tier": "enterprise", "sla_breached": False}) == "priority", "A routine enterprise ticket should go to the priority queue")

def test_free_tier_self_service():
    "A routine free-tier ticket goes to self-service"
    check(solution.route({"severity": 2, "tier": "free", "sla_breached": False}) == "self-service", "A routine free-tier ticket should go to self-service")
`,
      hidden: `
def test_breached_sla_outranks_tier():
    check(solution.route({"severity": 4, "tier": "free", "sla_breached": True}) == "escalate", "A breached SLA should escalate even for a free-tier ticket")

def test_severity_one_outranks_tier():
    check(solution.route({"severity": 1, "tier": "free", "sla_breached": False}) == "escalate", "The worst severity should escalate regardless of tier")

def test_missing_flag_treated_as_not_breached():
    check(solution.route({"severity": 3, "tier": "standard"}) == "standard", "A ticket with no sla_breached field should be routed as not breached")
    check(solution.route({"severity": 2, "tier": "enterprise"}) == "priority", "An enterprise ticket with no sla_breached field should still reach the priority queue")
`,
    },
  },
};

export default mission;
