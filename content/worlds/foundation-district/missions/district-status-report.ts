import type { MissionInput } from "../../../schema";

/**
 * FD-BOSS — District Status Report. Every World 1 skill at once: parse raw telemetry
 * strings with split()/slicing, convert with int()/float(), compute utilisation, and
 * assemble a multi-line f-string report. Unlocks the World State Console artifact.
 */
const mission: MissionInput = {
  id: "district-status-report",
  version: 1,
  worldId: "foundation-district",
  order: 6,
  title: "District Status Report",
  codename: "FD-BOSS",
  kind: "boss",
  difficulty: 4,
  weight: 3,
  estimatedMinutes: 20,
  skills: [
    { id: "string-indexing", role: "primary" },
    { id: "type-conversion", role: "primary" },
    { id: "f-strings", role: "primary" },
    { id: "variables", role: "secondary" },
    { id: "operators", role: "secondary" },
    { id: "strings", role: "secondary" },
  ],
  prerequisites: ["power-on", "capacity-math", "identity-badge", "signal-parsing", "type-boundary"],
  briefing:
    "The tower is receiving raw telemetry from every subsystem, one packed line each: the power core sends capacity and demand jammed together with colons, the census sends a citizen count, the alert bus sends a signal code. None of it is numbers yet, it is all text, and the control room console is blank because nobody has turned those lines into a report. Produce the first District Status Report: name in capitals, power utilisation to one decimal place, citizen count, alert severity. When this report prints, the console lights up.",
  objective:
    "Parse the three telemetry lines. From `line_1` assign `capacity_mw` and `demand_mw` as ints. From `line_2` assign `citizens` as an int. From `line_3` assign `severity` (the token after the last dash). Compute `utilisation_pct` as demand divided by capacity times 100 (a float). Build `report`, a multi-line string spanning at least three lines, that contains the district name in upper case, the utilisation formatted with exactly one decimal place followed by a percent sign, the citizen count as digits, and the severity token. Print `report`.",
  predictPrompt:
    "Before you run: line_1.split(\":\") gives you three pieces. Which piece is capacity, which is demand, and are they numbers yet, or still text?",
  starterCode: `# Raw telemetry, one line per subsystem, exactly as the tower received it
line_1 = "power:640:415"       # power:CAPACITY_MW:DEMAND_MW
line_2 = "citizens:1240"       # citizens:COUNT
line_3 = "signal:SEC-042-CRIT" # signal:SYSTEM-UNIT-SEVERITY
district_name = "foundation district"

# TODO: parse line_1 into capacity_mw and demand_mw (whole numbers)

# TODO: parse line_2 into citizens (a whole number)

# TODO: parse line_3 into severity (the token after the last dash)

# TODO: utilisation_pct = demand as a percentage of capacity (a decimal)

# TODO: build report as a multi-line f-string, then print it
report = ...
print(report)
`,
  referenceSolution: `line_1 = "power:640:415"
line_2 = "citizens:1240"
line_3 = "signal:SEC-042-CRIT"
district_name = "foundation district"

capacity_mw = int(line_1.split(":")[1])
demand_mw = int(line_1.split(":")[2])
citizens = int(line_2.split(":")[1])
severity = line_3.split("-")[2]
utilisation_pct = demand_mw / capacity_mw * 100

report = f"""=== {district_name.upper()} STATUS ===
Power: {demand_mw}/{capacity_mw} MW ({utilisation_pct:.1f}%)
Citizens: {citizens}
Alert: {severity}"""
print(report)
`,
  tests: {
    visible: `
import re

def test_report_names_the_district_in_capitals():
    "The report names the district in capitals"
    report = getattr(solution, "report", None)
    check(isinstance(report, str), "report should be a string")
    check(solution.district_name.upper() in report, "The report should show the district name converted to upper case")

def test_report_shows_utilisation_with_one_decimal():
    "Utilisation appears as a percentage with one decimal place"
    check(re.search(r"\\d+\\.\\d%", solution.report) is not None, "The report should show utilisation as a number with exactly one digit after the decimal point, immediately followed by a percent sign")

def test_report_shows_severity():
    "The alert severity appears in the report"
    token = solution.line_3.split("-")[-1]
    check(token in solution.report, "The severity token (the last part of the signal line) should appear in the report")

def test_report_shows_citizen_count():
    "The citizen count appears as digits"
    digits = solution.line_2.split(":")[1]
    check(digits in solution.report, "The citizen count should appear in the report as plain digits")

def test_report_spans_multiple_lines():
    "The report is multi-line"
    check(solution.report.count("\\n") >= 2, "The report should span at least three lines")

def test_report_is_printed():
    "The report is printed to the console"
    check(solution.report.strip() in solution_stdout, "The report should be printed exactly as built")
`,
    hidden: `
def test_citizens_is_an_int():
    c = getattr(solution, "citizens", None)
    check(type(c) is int, "citizens should be a whole number, converted from the text in the census line")
    check(c == int(solution.line_2.split(":")[1]), "citizens should match the count carried in the census line")

def test_capacity_and_demand_are_ints():
    cap = getattr(solution, "capacity_mw", None)
    dem = getattr(solution, "demand_mw", None)
    check(type(cap) is int and type(dem) is int, "capacity_mw and demand_mw should both be whole numbers converted from the power line")
    parts = solution.line_1.split(":")
    check(cap == int(parts[1]) and dem == int(parts[2]), "capacity_mw should be the first number in the power line and demand_mw the second")

def test_utilisation_matches_the_telemetry():
    u = getattr(solution, "utilisation_pct", None)
    check(isinstance(u, float), "utilisation_pct should be a decimal (float)")
    parts = solution.line_1.split(":")
    expected = int(parts[2]) / int(parts[1]) * 100
    check(abs(u - expected) < 0.01, "utilisation_pct should be demand divided by capacity, scaled to a percentage")

def test_severity_is_the_last_token():
    sev = getattr(solution, "severity", None)
    check(sev == solution.line_3.split("-")[-1], "severity should be exactly the token after the last dash in the signal line")
    check("-" not in sev and ":" not in sev, "severity should not carry any separator characters")

def test_report_has_no_placeholders():
    check("Ellipsis" not in solution.report and "TODO" not in solution.report, "The report should be fully assembled, with no placeholders left in it")

def test_report_percentage_is_the_computed_value():
    formatted = format(solution.utilisation_pct, ".1f") + "%"
    check(formatted in solution.report, "The percentage in the report should be the computed utilisation rounded to one decimal place")
`,
  },
  hints: [
    "Everything the tower received is text. Before any maths can happen, each line has to be cut into its pieces, and the pieces that are numbers have to be turned into numbers. Only then can the report be assembled.",
    "Every line uses a separator. The power and census lines are split on a colon; the signal code is split on a dash. The pieces are still text, so the counts need int() before dividing.",
    "Tiny unrelated example: rec = \"disk:512:384\" then rec.split(\":\")[1] is the text \"512\" and int(rec.split(\":\")[1]) is the number 512. And f\"{0.75 * 100:.1f}%\" renders as 75.0%.",
    "Shape: split line_1 on the colon, take piece 1 and piece 2, convert each with int(). Split line_2 on the colon, convert piece 1. Split line_3 on the dash, take the last piece. Divide demand by capacity and multiply by 100. Then an f-string across several lines with the name uppercased and the percentage formatted with :.1f.",
    "capacity_mw = int(line_1.split(\":\")[1]), demand_mw = int(line_1.split(\":\")[2]), citizens = int(line_2.split(\":\")[1]), severity = line_3.split(\"-\")[2], utilisation_pct = demand_mw / capacity_mw * 100. For the report, a triple-quoted f-string f\"\"\"...\"\"\" can span lines; put {district_name.upper()} and {utilisation_pct:.1f}% inside it.",
    "Full walkthrough: line_1.split(\":\") gives three pieces; int() on pieces 1 and 2 gives capacity_mw and demand_mw. int(line_2.split(\":\")[1]) gives citizens. line_3.split(\"-\")[2] gives severity. utilisation_pct = demand_mw / capacity_mw * 100 keeps a decimal. report = f\"\"\"=== {district_name.upper()} STATUS ===, then a line with {demand_mw}/{capacity_mw} MW ({utilisation_pct:.1f}%), then Citizens: {citizens}, then Alert: {severity}\"\"\". print(report) lights the console.",
  ],
  errorExplanations: [
    {
      match: "invalid literal for int",
      title: "int() was given the wrong piece",
      explanation:
        "int() can only read text that is purely a whole number. If it saw \"power\" or \"citizens:1240\", you converted the whole line or the label piece instead of the number piece. Split first, then convert only the numeric piece.",
    },
    {
      match: "unsupported operand type|can only concatenate str",
      title: "Still text when the maths starts",
      explanation:
        "Dividing or adding a piece straight out of split() fails because it is still text. Wrap the numeric pieces in int() before computing utilisation.",
    },
    {
      match: "list index out of range",
      title: "Asked for a piece that does not exist",
      explanation:
        "The power line splits into three pieces (0, 1, 2), the census line into two (0, 1), and the signal code into three. Check which line you are splitting and how many pieces it yields.",
    },
  ],
  anchors: ["string-indexing", "type-conversion", "f-strings", "operators"],
  explainWhy: {
    question: "Why is int() needed on the pieces from split() before computing utilisation?",
    options: [
      "split() returns numbers, but they are negative until int() fixes them",
      "split() returns pieces of text, and dividing text by text has no meaning, so each numeric piece must become an int first",
      "int() is what removes the colons from the line",
      "Without int() the f-string cannot display the value",
    ],
    correctIndex: 1,
    explanation:
      "Everything cut out of a string is still a string. \"415\" / \"640\" is not arithmetic. int() turns each numeric piece into a real number, and only then does demand / capacity produce a value you can scale to a percentage.",
  },
  reviewVariant: {
    briefing:
      "The edge gateway streams its health as two packed lines: the CPU line carries core count and busy cores jammed together with semicolons, the patch line carries a knowledge-base id with the priority hanging off the end. The fleet console shows a grey tile for the node because nobody has turned those lines into a health report. Produce it: node name in capitals, idle CPU to one decimal place, core count, patch priority.",
    objective:
      "Parse the two telemetry lines. From `line_1` assign `cores` and `busy` as ints. From `line_2` assign `priority` (the token after the last dash). Compute `idle_pct` as the idle cores (cores minus busy) divided by cores times 100 (a float). Build `report`, a string spanning at least two lines, that contains the node name in upper case, the idle percentage formatted with exactly one decimal place followed by a percent sign, the core count as digits, and the priority token. Print `report`.",
    starterCode: `# Raw node telemetry, one packed line per subsystem
line_1 = "cpu;8;6"              # cpu;CORES;BUSY_CORES
line_2 = "patch;KB-5031-HIGH"   # patch;ID-NUMBER-PRIORITY
node_name = "edge gateway"

# TODO: parse line_1 into cores and busy (whole numbers)

# TODO: parse line_2 into priority (the token after the last dash)

# TODO: idle_pct = idle cores as a percentage of all cores (a decimal)

# TODO: build report as a multi-line f-string, then print it
report = ...
print(report)
`,
    referenceSolution: `line_1 = "cpu;8;6"
line_2 = "patch;KB-5031-HIGH"
node_name = "edge gateway"

cores = int(line_1.split(";")[1])
busy = int(line_1.split(";")[2])
priority = line_2.split("-")[2]
idle_pct = (cores - busy) / cores * 100

report = f"""=== {node_name.upper()} HEALTH ===
CPU: {busy}/{cores} cores busy ({idle_pct:.1f}% idle)
Patch: {priority}"""
print(report)
`,
    tests: {
      visible: `
import re

def test_report_names_node_in_capitals():
    "The report names the node in capitals"
    report = getattr(solution, "report", None)
    check(isinstance(report, str), "report should be a string")
    check(solution.node_name.upper() in report, "The report should show the node name converted to upper case")

def test_report_shows_idle_with_one_decimal():
    "Idle share appears as a percentage with one decimal place"
    check(re.search(r"\\d+\\.\\d%", solution.report) is not None, "The report should show the idle share as a number with exactly one digit after the decimal point, immediately followed by a percent sign")

def test_report_shows_priority():
    "The patch priority appears in the report"
    check(solution.line_2.split("-")[-1] in solution.report, "The priority token (the last part of the patch line) should appear in the report")

def test_report_shows_core_count():
    "The core count appears as digits"
    check(solution.line_1.split(";")[1] in solution.report, "The total core count should appear in the report as plain digits")

def test_report_multiline_and_printed():
    "The report spans lines and is printed"
    check(solution.report.count("\\n") >= 1, "The report should span at least two lines")
    check(solution.report.strip() in solution_stdout, "The report should be printed exactly as built")
`,
      hidden: `
def test_cores_and_busy_are_ints():
    c = getattr(solution, "cores", None)
    b = getattr(solution, "busy", None)
    check(type(c) is int and type(b) is int, "cores and busy should both be whole numbers converted from the cpu line")
    parts = solution.line_1.split(";")
    check(c == int(parts[1]) and b == int(parts[2]), "cores should be the first number in the cpu line and busy the second")

def test_idle_pct_matches_telemetry():
    u = getattr(solution, "idle_pct", None)
    check(isinstance(u, float), "idle_pct should be a decimal (float)")
    parts = solution.line_1.split(";")
    expected = (int(parts[1]) - int(parts[2])) / int(parts[1]) * 100
    check(abs(u - expected) < 0.01, "idle_pct should be the idle cores divided by all cores, scaled to a percentage")

def test_priority_is_last_token():
    p = getattr(solution, "priority", None)
    check(p == solution.line_2.split("-")[-1], "priority should be exactly the token after the last dash in the patch line")
    check("-" not in p and ";" not in p, "priority should not carry any separator characters")

def test_report_has_no_placeholders():
    check("Ellipsis" not in solution.report and "TODO" not in solution.report, "The report should be fully assembled, with no placeholders left in it")

def test_report_percentage_is_computed_value():
    check(format(solution.idle_pct, ".1f") + "%" in solution.report, "The percentage in the report should be the computed idle share rounded to one decimal place")
`,
    },
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "hab-blocks", level: 2 },
    { kind: "layer", layer: "district-sign", level: 1 },
    { kind: "layer", layer: "comms-tower", level: 2 },
    { kind: "layer", layer: "core-lights", level: 2 },
    { kind: "layer", layer: "power-core", level: 2 },
    { kind: "stat", stat: "security", add: 20 },
    { kind: "stat", stat: "citizens", add: 1240 },
  ],
  artifacts: ["world-state-console"],
};

export default mission;
