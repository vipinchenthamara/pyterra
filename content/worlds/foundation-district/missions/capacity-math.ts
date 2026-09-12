import type { MissionInput } from "../../../schema";

/**
 * FD-02 — Capacity Math. Subtraction, true division, floor division and modulo
 * applied to power-core capacity and shift scheduling.
 */
const mission: MissionInput = {
  id: "capacity-math",
  version: 1,
  worldId: "foundation-district",
  order: 2,
  title: "Capacity Math",
  codename: "FD-02",
  kind: "build",
  difficulty: 2,
  weight: 1,
  estimatedMinutes: 8,
  skills: [
    { id: "operators", role: "primary" },
    { id: "numeric-types", role: "secondary" },
  ],
  prerequisites: ["power-on"],
  briefing:
    "The power core now reports its numbers: 640 MW of capacity, 415 MW of demand, and a 26-hour maintenance window. Operations wants three answers before the next shift change and nobody wants to work them out on a whiteboard: how much headroom is left, what fraction of the core is in use, and how many complete 8-hour crew shifts fit in the window with how many hours left dangling. The answers must be in the right form, a whole number of shifts is a whole number, not four-and-a-bit.",
  objective:
    "Using the given `capacity_mw`, `demand_mw` and `shift_hours`, assign: `surplus_mw` (capacity minus demand), `utilisation_pct` (demand as a percentage of capacity, a float, not rounded), `full_shifts` (how many complete 8-hour shifts fit in `shift_hours`, a whole number) and `leftover_hours` (the hours remaining after those full shifts). Print all four. Do not change the three input values.",
  predictPrompt:
    "Before you run: 26 / 8, 26 // 8 and 26 % 8 are three different numbers. Which one tells you how many complete shifts fit, and which one tells you the leftover?",
  starterCode: `# Power core telemetry for this maintenance window
capacity_mw = 640
demand_mw = 415
shift_hours = 26

# TODO: capacity left after demand is met
surplus_mw = ...

# TODO: demand as a percentage of capacity (a decimal, do not round)
utilisation_pct = ...

# TODO: how many complete 8-hour shifts fit in shift_hours (a whole number)
full_shifts = ...

# TODO: the hours left over once those complete shifts are taken out
leftover_hours = ...

print("Surplus MW:", surplus_mw)
print("Utilisation %:", utilisation_pct)
print("Full shifts:", full_shifts)
print("Leftover hours:", leftover_hours)
`,
  referenceSolution: `capacity_mw = 640
demand_mw = 415
shift_hours = 26

surplus_mw = capacity_mw - demand_mw
utilisation_pct = demand_mw / capacity_mw * 100
full_shifts = shift_hours // 8
leftover_hours = shift_hours % 8

print("Surplus MW:", surplus_mw)
print("Utilisation %:", utilisation_pct)
print("Full shifts:", full_shifts)
print("Leftover hours:", leftover_hours)
`,
  tests: {
    visible: `
def test_surplus_is_the_headroom():
    "Surplus is the capacity left after demand"
    s = getattr(solution, "surplus_mw", None)
    check(type(s) in (int, float), "surplus_mw should be a number")
    check(s == solution.capacity_mw - solution.demand_mw, "surplus_mw should be whatever capacity remains once demand is subtracted")

def test_utilisation_is_a_percentage():
    "Utilisation is demand as a percentage of capacity"
    u = getattr(solution, "utilisation_pct", None)
    check(type(u) is float, "utilisation_pct should be a decimal (a float), which is what true division produces")
    expected = solution.demand_mw / solution.capacity_mw * 100
    check(abs(u - expected) < 0.01, "utilisation_pct should be demand divided by capacity, scaled up to a percentage")

def test_full_shifts_is_a_whole_count():
    "Full shifts is a whole number of complete shifts"
    fs = getattr(solution, "full_shifts", None)
    check(type(fs) is int, "full_shifts should be a whole number of shifts with no fraction (which operator keeps only the whole part?)")
    check(fs == solution.shift_hours // 8, "full_shifts should be how many complete 8-hour shifts fit inside shift_hours")

def test_leftover_hours_is_the_remainder():
    "Leftover hours is what does not fill a shift"
    lh = getattr(solution, "leftover_hours", None)
    check(type(lh) is int, "leftover_hours should be a whole number of hours")
    check(0 <= lh < 8, "leftover_hours should be less than one full shift")
    check(lh == solution.shift_hours % 8, "leftover_hours should be the hours remaining after the full shifts are taken out")

def test_results_are_reported():
    "All four results appear in the output"
    out = solution_stdout
    check(str(solution.surplus_mw) in out, "The surplus should be printed")
    check(str(solution.full_shifts) in out, "The number of full shifts should be printed")
    check(str(solution.leftover_hours) in out, "The leftover hours should be printed")
`,
    hidden: `
def test_shifts_and_leftover_reassemble_the_window():
    check(solution.full_shifts * 8 + solution.leftover_hours == solution.shift_hours, "full shifts times 8 plus the leftover hours should add back up to the whole window")

def test_utilisation_is_a_percentage_not_a_fraction():
    check(0 < solution.utilisation_pct < 100, "utilisation_pct should be a percentage, not a fraction between 0 and 1 and not above 100")

def test_utilisation_keeps_its_decimal_part():
    u = solution.utilisation_pct
    check(u != int(u), "utilisation_pct should keep its decimal part; do not round it or use floor division")

def test_inputs_unchanged():
    check(solution.capacity_mw == 640 and solution.demand_mw == 415 and solution.shift_hours == 26, "The three telemetry inputs should be left exactly as the core reported them")

def test_utilisation_is_reported():
    check(str(solution.utilisation_pct)[:4] in solution_stdout, "The utilisation percentage should be printed")
`,
  },
  hints: [
    "Four questions, four arithmetic operators. Headroom is a subtraction. Utilisation is a division scaled to a percentage. The shift questions are about splitting 26 into groups of 8: how many whole groups, and what is left.",
    "Python has three division-flavoured operators: / gives the exact answer as a decimal, // gives only the whole number of times one fits in the other, and % gives the remainder. The shift questions want // and %.",
    "Tiny unrelated example: 17 / 5 is 3.4, 17 // 5 is 3, and 17 % 5 is 2. Three whole fives fit into 17 with 2 left over.",
    "Shape: surplus is capacity minus demand. Utilisation is demand divided by capacity, times 100. full_shifts is shift_hours floor-divided by 8. leftover_hours is shift_hours modulo 8.",
    "surplus_mw = capacity_mw - demand_mw and utilisation_pct = demand_mw / capacity_mw * 100 handle the power side. For the shifts, use // for the count and % for the remainder, both with 8.",
    "Full walkthrough: surplus_mw = capacity_mw - demand_mw. utilisation_pct = demand_mw / capacity_mw * 100 (true division, so it stays a float). full_shifts = shift_hours // 8 keeps only the whole number of shifts. leftover_hours = shift_hours % 8 keeps only the remainder. The prints are already in place.",
  ],
  errorExplanations: [
    {
      match: "unsupported operand type",
      title: "A placeholder is still in the calculation",
      explanation:
        "One of the values in your arithmetic is not a number. Most likely a ... placeholder is still there, or a variable was assigned text in quotes. Every operand in a sum needs to be an int or float.",
    },
    {
      match: "is not defined",
      title: "That name is used before it exists",
      explanation:
        "You referred to a variable that has not been assigned yet, or spelled it differently from the assignment. Check that surplus_mw, utilisation_pct, full_shifts and leftover_hours are each assigned above the prints.",
    },
    {
      match: "ZeroDivisionError",
      title: "Dividing by zero",
      explanation:
        "One of the divisions has zero on the right-hand side. Check the order: utilisation is demand divided by capacity, and the shift maths divides by 8, never by a value that could be zero.",
    },
  ],
  anchors: ["operators", "numeric-types"],
  explainWhy: {
    question: "Why is shift_hours // 8 the right operator for counting full shifts, rather than shift_hours / 8?",
    options: [
      "// is faster than / on large numbers",
      "/ returns a decimal like 3.25, but a crew cannot work a quarter of a shift; // drops the fraction and keeps the whole count",
      "/ only works on floats and shift_hours is an int",
      "// rounds to the nearest whole number, which is always what you want",
    ],
    correctIndex: 1,
    explanation:
      "26 / 8 is 3.25. Floor division 26 // 8 keeps only the whole number of times 8 fits, which is the number of complete shifts. The % operator then recovers the 2 hours that did not fit.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "hab-blocks", level: 1 },
    { kind: "layer", layer: "power-core", level: 2 },
    { kind: "stat", stat: "structures", add: 2 },
  ],
  artifacts: [],
};

export default mission;
