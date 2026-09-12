import type { MissionInput } from "../../../schema";

/**
 * FD-04 — Signal Parsing. Index, slice and split fixed-format telemetry codes
 * into their fields. Two signals so the hidden tests can check the technique, not one literal.
 */
const mission: MissionInput = {
  id: "signal-parsing",
  version: 1,
  worldId: "foundation-district",
  order: 4,
  title: "Signal Parsing",
  codename: "FD-04",
  kind: "build",
  difficulty: 3,
  weight: 1,
  estimatedMinutes: 10,
  skills: [
    { id: "string-indexing", role: "primary" },
    { id: "strings", role: "secondary" },
  ],
  prerequisites: ["identity-badge"],
  briefing:
    "The comms tower is receiving, but every message is one packed code: SEC-042-CRIT, NET-117-WARN. Operators are reading the codes by eye and mis-routing alerts because a security code looked like a network one at a glance. The tower needs each code broken into its three fields, which system, which unit, how severe, so the right team is paged. The same three cuts must work on any code in this format.",
  objective:
    "From `signal` assign `system` (the 3 letters before the first dash), `unit` (the 3 characters between the dashes, kept as text), `severity` (everything after the last dash) and `code_length` (the total number of characters in `signal`). Do the same for `signal_b` into `system_b`, `unit_b` and `severity_b`. Print the fields of both signals.",
  predictPrompt:
    "Before you run: in \"SEC-042-CRIT\", which position does the 0 of 042 sit at? Positions start at 0, and the dash takes a slot of its own.",
  starterCode: `# Two telemetry codes from the comms tower.  Format: SYSTEM-UNIT-SEVERITY
signal = "SEC-042-CRIT"
signal_b = "NET-117-WARN"

# TODO: pull the three fields out of signal, and count its characters
system = ...
unit = ...
severity = ...
code_length = ...

# TODO: the same three fields from signal_b
system_b = ...
unit_b = ...
severity_b = ...

print(system, unit, severity, code_length)
print(system_b, unit_b, severity_b)
`,
  referenceSolution: `signal = "SEC-042-CRIT"
signal_b = "NET-117-WARN"

system = signal[:3]
unit = signal[4:7]
severity = signal.split("-")[2]
code_length = len(signal)

system_b = signal_b[:3]
unit_b = signal_b[4:7]
severity_b = signal_b.split("-")[2]

print(system, unit, severity, code_length)
print(system_b, unit_b, severity_b)
`,
  tests: {
    visible: `
def test_system_is_the_prefix():
    "system is the letters before the first dash"
    s = getattr(solution, "system", None)
    check(isinstance(s, str), "system should be text")
    check(s == solution.signal.split("-")[0], "system should be exactly the characters before the first dash, with no dash included")

def test_unit_is_the_middle_field():
    "unit is the field between the dashes"
    u = getattr(solution, "unit", None)
    check(isinstance(u, str), "unit should stay as text so a leading zero is not lost")
    check(u == solution.signal.split("-")[1], "unit should be exactly the characters between the two dashes")

def test_severity_is_the_suffix():
    "severity is everything after the last dash"
    sev = getattr(solution, "severity", None)
    check(isinstance(sev, str), "severity should be text")
    check(sev == solution.signal.split("-")[-1], "severity should be everything after the last dash")

def test_code_length_counts_characters():
    "code_length counts every character in the code"
    n = getattr(solution, "code_length", None)
    check(type(n) is int, "code_length should be a whole number")
    check(n == len(solution.signal), "code_length should count every character in the signal, dashes included")

def test_fields_are_reported():
    "The parsed fields are printed"
    out = solution_stdout
    check(solution.severity in out and solution.unit in out, "The parsed fields of the first signal should be printed")
`,
    hidden: `
def test_second_signal_system():
    check(solution.system_b == solution.signal_b.split("-")[0], "system_b should be the letters before the first dash of the second signal")

def test_second_signal_unit():
    check(solution.unit_b == solution.signal_b.split("-")[1], "unit_b should be the characters between the dashes of the second signal")

def test_second_signal_severity():
    check(solution.severity_b == solution.signal_b.split("-")[-1], "severity_b should be everything after the last dash of the second signal")

def test_no_dashes_leak_into_fields():
    for v in (solution.system, solution.unit, solution.severity, solution.system_b, solution.unit_b, solution.severity_b):
        check("-" not in v, "No field should contain a dash; the dashes are separators, not data")

def test_unit_keeps_leading_zero():
    check(solution.unit.startswith("0"), "unit should preserve its leading zero, which means it must stay text rather than be converted to a number")

def test_second_signal_reported():
    check(solution.severity_b in solution_stdout, "The parsed fields of the second signal should be printed")
`,
  },
  hints: [
    "The code has a fixed shape: three letters, a dash, three characters, a dash, then the severity. You can pull pieces out either by position or by cutting on the dashes.",
    "Strings can be sliced with text[start:stop], where stop is not included. They can also be broken on a separator with text.split(\"-\"), which gives you the pieces, and len(text) counts characters.",
    "Tiny unrelated example: code = \"AB-12\" then code[:2] is \"AB\", code[3:5] is \"12\", code.split(\"-\")[1] is \"12\" and len(code) is 5.",
    "Shape: system is the slice from the start up to (not including) position 3. unit is the slice from position 4 up to 7. severity is the last piece after splitting on the dash. code_length is len of the signal. Repeat the same three cuts on signal_b.",
    "system = signal[:3] and unit = signal[4:7] use slicing. severity can come from signal.split(\"-\")[2] or the slice signal[8:]. code_length = len(signal). Then the same expressions with signal_b.",
    "Full walkthrough: system = signal[:3] takes positions 0, 1, 2. unit = signal[4:7] skips the dash at position 3 and takes 4, 5, 6. severity = signal.split(\"-\")[2] splits into three pieces and takes the third. code_length = len(signal). For the second code: system_b = signal_b[:3], unit_b = signal_b[4:7], severity_b = signal_b.split(\"-\")[2].",
  ],
  errorExplanations: [
    {
      match: "string index out of range",
      title: "Position past the end of the code",
      explanation:
        "You indexed a single position that does not exist in this string. Positions run from 0 to len(signal) - 1. Slices are forgiving about the end, single indexes are not.",
    },
    {
      match: "list index out of range",
      title: "Fewer pieces than you asked for",
      explanation:
        "split(\"-\") gives three pieces for this format, at positions 0, 1 and 2. Asking for piece 3 is one too far; the last piece is at 2 (or -1).",
    },
    {
      match: "slice indices must be integers",
      title: "Slice positions must be whole numbers",
      explanation:
        "The numbers inside the square brackets must be ints, not text or decimals. Write signal[4:7], not signal[\"4\":\"7\"].",
    },
  ],
  anchors: ["string-indexing", "strings"],
  explainWhy: {
    question: "Why does signal[4:7] give the unit without a trailing dash?",
    options: [
      "Slices automatically remove dashes",
      "The stop position in a slice is exclusive, so 4:7 takes positions 4, 5 and 6 and stops before the dash at 7",
      "Python counts positions from 1, so 7 is the last character of the unit",
      "A slice always returns exactly three characters",
    ],
    correctIndex: 1,
    explanation:
      "text[start:stop] copies from start up to but not including stop. Positions 4, 5, 6 are the three unit characters; position 7 is the second dash and is left out.",
  },
  reviewVariant: {
    briefing:
      "The audit log stamps every event with one packed timestamp: 2026-09-12T14:05. The incident timeline needs the year, month, day and clock time as separate fields so events can be grouped by day and sorted by time, and the same cuts must work on every stamp in the log, not just the first one.",
    objective:
      "From `stamp` assign `year` (the 4 characters before the first dash), `month` (the 2 characters between the dashes), `day` (the 2 characters between the second dash and the T), `clock` (everything after the T) and `stamp_length` (the total number of characters in `stamp`). From `stamp_b` assign `year_b` and `clock_b` the same way. Keep every field as text. Print the fields of both stamps.",
    starterCode: `# Two audit-log timestamps.  Format: YYYY-MM-DDTHH:MM
stamp = "2026-09-12T14:05"
stamp_b = "2025-12-31T23:59"

# TODO: pull the fields out of stamp, and count its characters
year = ...
month = ...
day = ...
clock = ...
stamp_length = ...

# TODO: year and clock from stamp_b
year_b = ...
clock_b = ...

print(year, month, day, clock, stamp_length)
print(year_b, clock_b)
`,
    referenceSolution: `stamp = "2026-09-12T14:05"
stamp_b = "2025-12-31T23:59"

year = stamp[:4]
month = stamp[5:7]
day = stamp[8:10]
clock = stamp.split("T")[1]
stamp_length = len(stamp)

year_b = stamp_b[:4]
clock_b = stamp_b.split("T")[1]

print(year, month, day, clock, stamp_length)
print(year_b, clock_b)
`,
    tests: {
      visible: `
def test_year_is_the_prefix():
    "year is the characters before the first dash"
    y = getattr(solution, "year", None)
    check(isinstance(y, str), "year should stay as text")
    check(y == solution.stamp.split("-")[0], "year should be exactly the characters before the first dash")

def test_month_is_the_middle():
    "month is the field between the dashes"
    m = getattr(solution, "month", None)
    check(isinstance(m, str), "month should stay as text so a leading zero is kept")
    check(m == solution.stamp.split("-")[1], "month should be exactly the characters between the two dashes")

def test_day_is_before_the_t():
    "day is the field between the second dash and the T"
    d = getattr(solution, "day", None)
    check(d == solution.stamp.split("-")[2].split("T")[0], "day should be the two characters after the second dash, stopping before the T")

def test_clock_is_after_the_t():
    "clock is everything after the T"
    c = getattr(solution, "clock", None)
    check(c == solution.stamp.split("T")[1], "clock should be everything after the T")

def test_length_and_output():
    "stamp_length counts characters and fields are printed"
    n = getattr(solution, "stamp_length", None)
    check(type(n) is int and n == len(solution.stamp), "stamp_length should count every character in the stamp, separators included")
    check(solution.clock in solution_stdout and solution.month in solution_stdout, "The parsed fields of the first stamp should be printed")
`,
      hidden: `
def test_second_stamp_year():
    check(solution.year_b == solution.stamp_b.split("-")[0], "year_b should be the characters before the first dash of the second stamp")

def test_second_stamp_clock():
    check(solution.clock_b == solution.stamp_b.split("T")[1], "clock_b should be everything after the T in the second stamp")

def test_no_separators_leak():
    for v in (solution.year, solution.month, solution.day, solution.clock, solution.year_b, solution.clock_b):
        check("-" not in v and "T" not in v, "No field should contain a dash or the T; they are separators, not data")

def test_month_keeps_leading_zero():
    check(solution.month.startswith("0"), "month should keep its leading zero, so it must stay text rather than become a number")

def test_second_stamp_reported():
    check(solution.clock_b in solution_stdout, "The parsed fields of the second stamp should be printed")
`,
    },
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "comms-tower", level: 1 },
    { kind: "stat", stat: "systems_online", add: 1 },
  ],
  artifacts: [],
};

export default mission;
