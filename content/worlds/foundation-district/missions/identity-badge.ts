import type { MissionInput } from "../../../schema";

/**
 * FD-03 — Identity Badge. Fill-gap: clean messy registry strings with strip()/upper()
 * and assemble a banner with an f-string.
 */
const mission: MissionInput = {
  id: "identity-badge",
  version: 1,
  worldId: "foundation-district",
  order: 3,
  title: "Identity Badge",
  codename: "FD-03",
  kind: "fill-gap",
  difficulty: 2,
  weight: 1,
  estimatedMinutes: 8,
  skills: [
    { id: "strings", role: "primary" },
    { id: "f-strings", role: "primary" },
  ],
  prerequisites: ["capacity-math"],
  briefing:
    "The district sign is wired up, but the registry export feeding it is a mess: the name arrives with stray spaces on both ends and in lower case, the sector code is lower case too, and the status flag is whatever someone typed years ago. The sign must show one clean banner, three fields in capitals separated by \" | \", with no leading or trailing junk. Every downstream display will copy this banner, so it has to be right the first time.",
  objective:
    "Fill each gap. `district_name` is `raw_name` with surrounding whitespace removed and converted to upper case. `sector` is `raw_sector` in upper case. `state` is `status` in upper case. `badge` is a single f-string of the three cleaned fields separated by \" | \" (space, bar, space). Print `badge`. Do not change the raw inputs.",
  starterCode: `# Registry export — fields arrive exactly as the old system stored them
raw_name = "  foundation district "
raw_sector = "sec-7"
status = "online"

# TODO: clean each field (fill the gaps)
district_name = ____   # raw_name with surrounding spaces removed, in UPPER CASE
sector = ____          # raw_sector in UPPER CASE
state = ____           # status in UPPER CASE

# TODO: one f-string with the three fields separated by " | "
badge = ____

print(badge)
`,
  referenceSolution: `raw_name = "  foundation district "
raw_sector = "sec-7"
status = "online"

district_name = raw_name.strip().upper()
sector = raw_sector.upper()
state = status.upper()

badge = f"{district_name} | {sector} | {state}"

print(badge)
`,
  tests: {
    visible: `
def test_badge_is_clean_text():
    "The badge is text with no stray whitespace"
    badge = getattr(solution, "badge", None)
    check(isinstance(badge, str), "badge should be a string")
    check(badge == badge.strip(), "badge should have no leading or trailing spaces")

def test_badge_is_upper_case():
    "The badge is entirely in capitals"
    badge = solution.badge
    check(badge == badge.upper(), "Every letter in the badge should be upper case")

def test_badge_has_three_fields():
    "Three fields separated by a bar"
    badge = solution.badge
    check(" | " in badge, "Fields in the badge should be separated by a space, a bar and a space")
    check(badge.count(" | ") == 2, "The badge should contain exactly three fields, so exactly two separators")

def test_badge_starts_with_the_cleaned_name():
    "The badge opens with the cleaned district name"
    expected_name = solution.raw_name.strip().upper()
    check(solution.badge.startswith(expected_name), "The badge should begin with the district name, stripped of spaces and in capitals")

def test_badge_is_displayed():
    "The badge is printed"
    check(solution.badge in solution_stdout, "The finished badge should be printed for the sign")
`,
    hidden: `
def test_district_name_cleaned():
    check(solution.district_name == solution.raw_name.strip().upper(), "district_name should be the raw name with surrounding spaces removed and letters capitalised")

def test_sector_cleaned():
    check(solution.sector == solution.raw_sector.upper(), "sector should be the raw sector code in capitals")

def test_state_cleaned():
    check(solution.state == solution.status.upper(), "state should be the status flag in capitals")

def test_badge_fields_are_the_cleaned_values():
    parts = solution.badge.split(" | ")
    check(parts == [solution.district_name, solution.sector, solution.state], "The badge should be the three cleaned fields, in order: name, sector, state")

def test_badge_has_no_double_spaces():
    check("  " not in solution.badge, "The badge should not contain runs of spaces left over from the raw export")

def test_raw_inputs_untouched():
    check(solution.raw_name == "  foundation district " and solution.raw_sector == "sec-7", "The raw export values should be left as they arrived; build cleaned copies instead")
`,
  },
  hints: [
    "Each raw field needs two kinds of clean-up: get rid of the spaces hugging the name, and make the letters shout. Then the three clean pieces need to be glued into one line with a separator between them.",
    "Strings carry their own tools as methods called with a dot: .strip() removes whitespace at both ends and .upper() capitalises every letter. For gluing values into a line, an f-string lets you drop variables straight into text with braces.",
    "Tiny unrelated example: host = \"  api-gw  \" then host.strip().upper() gives \"API-GW\". And f\"{host} ready\" builds text with the variable baked in.",
    "Shape: district_name = raw_name, stripped, then uppered. sector = raw_sector uppered. state = status uppered. badge = f-string with the three names in braces and \" | \" between each pair.",
    "district_name = raw_name.strip().upper() chains the two methods. The other two only need .upper(). The badge starts like f\"{district_name} | ...\" and continues with the remaining two fields.",
    "Full walkthrough: district_name = raw_name.strip().upper() removes the outer spaces and capitalises. sector = raw_sector.upper() and state = status.upper() capitalise the other two. badge = f\"{district_name} | {sector} | {state}\" places each value into the banner with a space-bar-space separator. print(badge) sends it to the sign.",
  ],
  errorExplanations: [
    {
      match: "name '____' is not defined",
      title: "A gap is still empty",
      explanation:
        "The four underscores are a placeholder, not Python. Replace every ____ with a real expression before running.",
    },
    {
      match: "'str' object has no attribute",
      title: "That is not a string method",
      explanation:
        "The method name after the dot does not exist on strings. The ones you need are spelled strip() and upper(), all lower case with parentheses.",
    },
    {
      match: "name '(strip|upper|title)' is not defined",
      title: "String methods hang off the string",
      explanation:
        "strip and upper are not standalone functions; they belong to the string. Write raw_name.strip() with the variable in front and a dot, not strip(raw_name).",
    },
  ],
  anchors: ["strings", "f-strings"],
  explainWhy: {
    question: "Why does raw_name.strip().upper() work as a single chain?",
    options: [
      "Python runs both methods at the same time on the original string",
      ".strip() returns a new string, and .upper() is then called on that new string, so each method hands its result to the next",
      "strip and upper are the same method with two names",
      "The chain only works because raw_name is short",
    ],
    correctIndex: 1,
    explanation:
      "Each string method returns a fresh string and leaves the original untouched. raw_name.strip() produces the trimmed copy, and .upper() is called on that copy, so the chain reads left to right as a pipeline.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "district-sign", level: 1 },
    { kind: "stat", stat: "structures", add: 1 },
  ],
  artifacts: [],
};

export default mission;
