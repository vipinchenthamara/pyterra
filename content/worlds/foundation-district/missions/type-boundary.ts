import type { MissionInput } from "../../../schema";

/**
 * FD-05 — Type Boundary. Fix-bug: a sensor delivers a number as text, the code adds an int
 * to it and crashes. The learner converts on the way in (int) and on the way out (str / f-string).
 */
const mission: MissionInput = {
  id: "type-boundary",
  version: 1,
  worldId: "foundation-district",
  order: 5,
  title: "Type Boundary",
  codename: "FD-05",
  kind: "fix-bug",
  difficulty: 2,
  weight: 1,
  estimatedMinutes: 8,
  skills: [
    { id: "type-conversion", role: "primary" },
    { id: "strings", role: "secondary" },
  ],
  prerequisites: ["signal-parsing"],
  briefing:
    "The core's boost sequence keeps crashing at the same line. The power sensor delivers its reading over the wire as text, exactly as sensors do, and the boost controller adds a plain number to it. Python refuses: it will not guess whether you meant arithmetic or gluing text together. The reading has to be turned into a number before the maths, and the result turned back into text before it can be printed next to a label. Fix both sides of the boundary.",
  objective:
    "Make the script run without error. `total` must be the sensor reading plus the boost as an int (a whole number), and the printed line must contain the word Power followed by the numeric total. Convert `power_reading` with int() before adding, and build the printed text with str() or an f-string. Keep `boost` as it is.",
  predictPrompt:
    "Before you press run: which line crashes first, the addition or the print? And what could \"73\" + 12 even mean to Python?",
  starterCode: `# Sensor feed — every reading arrives as text, even the numbers
power_reading = "73"
boost = 12

# BUG: the next two lines crash. The sensor gives text, the boost is a number.
# TODO: convert at the boundary so the maths is numeric and the print is text
total = power_reading + boost
print("Power: " + total)
`,
  referenceSolution: `power_reading = "73"
boost = 12

total = int(power_reading) + boost
print("Power: " + str(total))
`,
  tests: {
    visible: `
def test_total_is_a_number():
    "total is a whole number, not text"
    t = getattr(solution, "total", None)
    check(type(t) is int, "total should be a whole number (int); the sensor text has to become a number before the addition")

def test_total_adds_reading_and_boost():
    "total is the reading plus the boost"
    check(solution.total == int(solution.power_reading) + solution.boost, "total should be the sensor reading and the boost added together as numbers")

def test_power_line_is_printed():
    "A Power line with the total is printed"
    out = solution_stdout
    check("Power" in out, "The output should contain a Power label")
    check(str(solution.total) in out, "The numeric total should appear in the printed line")
`,
    hidden: `
import re

def test_total_is_not_text_glued_together():
    check(not isinstance(solution.total, str), "total should be arithmetic, not two pieces of text placed side by side")

def test_total_includes_the_reading():
    check(solution.total > solution.boost, "total should include the sensor reading, not just the boost")

def test_power_label_is_followed_by_digits():
    check(re.search(r"Power:\\s*\\d+", solution_stdout) is not None, "The printed line should read as a Power label followed by the numeric total")

def test_boost_unchanged():
    check(solution.boost == 12 and type(solution.boost) is int, "boost should be left as the whole number it was")
`,
  },
  hints: [
    "Two different kinds of value are meeting at one plus sign. Python will add two numbers, and it will join two pieces of text, but it will never mix the two without being told which one you mean.",
    "The tools for crossing that boundary are int() to turn text into a whole number and str() to turn a number into text. An f-string does the second conversion for you inside the braces.",
    "Tiny unrelated example: retries = \"3\" then int(retries) + 1 is 4. And \"Retries: \" + str(4) is the text \"Retries: 4\", as is f\"Retries: {4}\".",
    "Shape: on the addition line, wrap the sensor text in int() before adding the boost. On the print line, either wrap total in str() before the plus, or replace the whole thing with an f-string.",
    "total = int(power_reading) + boost fixes the maths. For the print, either \"Power: \" + str(total) or f\"Power: {total}\".",
    "Full walkthrough: int(power_reading) converts the text \"73\" into the number 73, so int(power_reading) + boost is real arithmetic and total becomes an int. print(\"Power: \" + str(total)) converts the number back to text so it can be glued to the label; f\"Power: {total}\" does the same conversion implicitly.",
  ],
  errorExplanations: [
    {
      match: "can only concatenate str",
      title: "Text plus number is not allowed",
      explanation:
        "The left side of the + is text and the right side is a number. Python does not know whether you want maths or joined text. Convert the sensor text with int() before adding, or convert the number with str() before joining.",
    },
    {
      match: "unsupported operand type",
      title: "Number plus text is not allowed",
      explanation:
        "This is the same boundary problem from the other direction: a number on the left, text on the right. Make both sides the same type, int() for arithmetic or str() for text.",
    },
    {
      match: "invalid literal for int",
      title: "That text is not a whole number",
      explanation:
        "int() only accepts text that looks like a whole number, such as \"73\". If you passed the whole label or a value with letters, spaces or a decimal point, int() cannot read it. Convert only the reading itself.",
    },
  ],
  anchors: ["type-conversion", "strings"],
  explainWhy: {
    question: "Why does \"73\" + 12 crash while int(\"73\") + 12 works?",
    options: [
      "Python only allows numbers below 100 to be added",
      "\"73\" is text, and + on text means join; int(\"73\") is the number 73, and + on numbers means add, so the types finally agree",
      "The quotes make the value negative",
      "int() removes the plus sign from the expression",
    ],
    correctIndex: 1,
    explanation:
      "The + operator does different jobs for different types: joining for text, adding for numbers. Python refuses to guess when the two sides disagree. int() makes the sensor value a number so both sides are numeric and + means addition.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "comms-tower", level: 2 },
    { kind: "layer", layer: "core-lights", level: 2 },
    { kind: "stat", stat: "systems_online", add: 1 },
  ],
  artifacts: [],
};

export default mission;
