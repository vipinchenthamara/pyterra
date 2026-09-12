import type { MissionInput } from "../../../schema";

/**
 * FD-01 — Power On. The learner gives the district its first state: four named values
 * of four different kinds, then reports them.
 */
const mission: MissionInput = {
  id: "power-on",
  version: 1,
  worldId: "foundation-district",
  order: 1,
  title: "Power On",
  codename: "FD-01",
  kind: "build",
  difficulty: 1,
  weight: 1,
  estimatedMinutes: 6,
  skills: [
    { id: "variables", role: "primary" },
    { id: "numeric-types", role: "secondary" },
  ],
  prerequisites: [],
  briefing:
    "The district is dark. The power core is spinning, but when the control room asks it for a status it has nothing to answer with: no name to report, no citizen count, no reading for the core, not even a yes or no on whether the district is online. Nothing can be built on top of a system that cannot refer to its own values. Give the district four things it can name, then have it announce them.",
  objective:
    "Assign four top-level variables: `district_name` (text), `population` (a whole number), `power_level` (a decimal percentage from 0.0 to 100.0) and `online` (True or False). Then print each of the four values so all four appear in the output, one per line.",
  predictPrompt:
    "Before you run: if you write population = \"1240\" with quotes around it, is that a number the district can count with, or a piece of text that happens to look like one?",
  starterCode: `# Foundation District — power-on sequence.
# The district has no state yet. Nothing here has a name or a number.

# TODO: replace each ... with a real value of the right kind
district_name = ...   # the district's name (text)
population = ...      # citizens living here (a whole number)
power_level = ...     # core output as a percentage, 0.0 to 100.0 (a decimal)
online = ...          # is the district online? (True or False)

# TODO: print each of the four values so the control room can see them
`,
  referenceSolution: `district_name = "Foundation District"
population = 1240
power_level = 25.0
online = True

print(district_name)
print(population)
print(power_level)
print(online)
`,
  tests: {
    visible: `
def test_district_has_a_name():
    "The district has a name"
    name = getattr(solution, "district_name", None)
    check(isinstance(name, str), "district_name should hold text (a value in quotes)")
    check(name.strip() != "", "district_name should not be empty")

def test_population_is_a_whole_number():
    "Population is a whole number"
    pop = getattr(solution, "population", None)
    check(type(pop) is int, "population should be a whole number (an int: no quotes, no decimal point)")
    check(pop > 0, "population should be a positive count of citizens")

def test_power_level_is_a_measurement():
    "Power level is a decimal percentage"
    lvl = getattr(solution, "power_level", None)
    check(type(lvl) is float, "power_level should be a decimal measurement (a float with a decimal point, not a whole number or text)")
    check(0.0 <= lvl <= 100.0, "power_level should be a percentage between 0.0 and 100.0")

def test_online_is_a_flag():
    "Online is a yes/no flag"
    flag = getattr(solution, "online", None)
    check(type(flag) is bool, "online should be True or False, not text or a number")

def test_values_are_reported():
    "All four values appear in the output"
    out = solution_stdout
    check(solution.district_name in out, "The district name should be printed")
    check(str(solution.population) in out, "The population should be printed")
    check(str(solution.power_level) in out, "The power level should be printed")
    check(str(solution.online) in out, "The online flag should be printed")
`,
    hidden: `
def test_name_is_real_text():
    name = solution.district_name
    check(any(ch.isalpha() for ch in name), "district_name should contain letters, not just symbols or spaces")

def test_population_is_not_text():
    check(not isinstance(solution.population, str), "population should be a number the district can count with, not text in quotes")

def test_power_level_is_not_text():
    check(not isinstance(solution.power_level, str), "power_level should be a number, not text in quotes")

def test_online_is_a_real_boolean():
    check(solution.online is True or solution.online is False, "online should be the value True or False, not those words in quotes")

def test_output_has_one_line_per_value():
    lines = [l for l in solution_stdout.splitlines() if l.strip()]
    check(len(lines) >= 4, "Each of the four values should be printed on its own line")
`,
  },
  hints: [
    "The control room needs to refer to each value by a name. In Python you attach a name to a value with a single equals sign, and from then on the name stands in for the value.",
    "This is a variable: name = value. The kind of value matters too. Text goes in quotes, whole numbers have no decimal point, measurements have one, and yes/no is spelled True or False.",
    "Tiny example from another system: server_name = \"edge-gateway\", cpu_cores = 8, load = 0.75, healthy = True. Four names, four different kinds of value.",
    "Shape: four assignment lines, one per variable, then four print lines. district_name gets text in quotes, population a whole number, power_level a number with a decimal point, online either True or False.",
    "district_name = \"Foundation District\" and population = 1240 cover the first two. For the core reading write something like power_level = 25.0 (the .0 makes it a decimal), and online = True. Then print(district_name) and so on for each.",
    "Full walkthrough: district_name = \"Foundation District\" stores text. population = 1240 stores an int, a whole count. power_level = 25.0 stores a float, a measurement that can have a fraction. online = True stores a bool. Finish with print(district_name), print(population), print(power_level), print(online) so each value lands on its own line.",
  ],
  errorExplanations: [
    {
      match: "name '(true|false)' is not defined",
      title: "Python's yes/no values are capitalised",
      explanation:
        "true and false in lower case are just unknown names to Python. The two boolean values are spelled True and False with a capital letter.",
    },
    {
      match: "invalid syntax",
      title: "Text needs quotes",
      explanation:
        "If you wrote district_name = Foundation District, Python reads two bare words and cannot make sense of them. Text values go inside quotes: \"Foundation District\".",
    },
    {
      match: "is not defined",
      title: "That name has not been assigned yet",
      explanation:
        "You printed or used a name Python has never seen. Either the assignment line is missing, it comes after the print, or the spelling differs (population vs Population are different names).",
    },
  ],
  anchors: ["variables", "numeric-types"],
  explainWhy: {
    question: "Why should power_level be written as 25.0 rather than 25?",
    options: [
      "Python refuses to store the number 25 in a variable",
      "The decimal point makes it a float, a measurement that can hold fractions like 25.5, which is what a percentage reading needs",
      "Adding .0 makes the number print in bold",
      "Whole numbers cannot be printed",
    ],
    correctIndex: 1,
    explanation:
      "25 is an int, a whole count. 25.0 is a float, a measurement. A core reading can sit at 25.5 or 99.9, so it needs the type that can carry a fraction.",
  },
  reviewVariant: {
    briefing:
      "A new VPN gateway has been racked in the east region and the NOC dashboard shows a blank tile for it. The gateway cannot register until it can name its own hostname, how many tunnels it is carrying, how long it has been up, and whether the latest patch is on it. Give it those four values and have it announce them.",
    objective:
      "Assign four top-level variables: `gateway_name` (text), `active_tunnels` (a whole number), `uptime_hours` (a decimal number of hours) and `patched` (True or False). Print each of the four values so all four appear in the output, one per line.",
    starterCode: `# NOC registration for a new VPN gateway. Nothing is named yet.
# TODO: replace each ... with a value of the right kind
gateway_name = ...     # the gateway's hostname (text)
active_tunnels = ...   # tunnels currently up (a whole number)
uptime_hours = ...     # hours since the last reboot (a decimal)
patched = ...          # is the latest patch applied? (True or False)

# TODO: print all four values, one per line
`,
    referenceSolution: `gateway_name = "vpn-gw-east"
active_tunnels = 42
uptime_hours = 312.5
patched = True

print(gateway_name)
print(active_tunnels)
print(uptime_hours)
print(patched)
`,
    tests: {
      visible: `
def test_gateway_has_a_hostname():
    "The gateway has a hostname"
    name = getattr(solution, "gateway_name", None)
    check(isinstance(name, str) and name.strip() != "", "gateway_name should hold non-empty text")

def test_tunnels_is_a_whole_number():
    "Tunnel count is a whole number"
    t = getattr(solution, "active_tunnels", None)
    check(type(t) is int, "active_tunnels should be a whole number (an int, no quotes and no decimal point)")
    check(t >= 0, "active_tunnels should not be negative")

def test_uptime_is_a_decimal():
    "Uptime is a decimal measurement"
    u = getattr(solution, "uptime_hours", None)
    check(type(u) is float, "uptime_hours should be a decimal (a float with a decimal point)")
    check(u >= 0.0, "uptime_hours should not be negative")

def test_patched_is_a_flag():
    "Patched is a yes/no flag"
    p = getattr(solution, "patched", None)
    check(type(p) is bool, "patched should be True or False, not text or a number")

def test_values_are_announced():
    "All four values appear in the output"
    out = solution_stdout
    check(solution.gateway_name in out, "The hostname should be printed")
    check(str(solution.active_tunnels) in out, "The tunnel count should be printed")
    check(str(solution.uptime_hours) in out, "The uptime should be printed")
    check(str(solution.patched) in out, "The patched flag should be printed")
`,
      hidden: `
def test_hostname_has_letters():
    check(any(ch.isalpha() for ch in solution.gateway_name), "gateway_name should contain letters, not just digits or symbols")

def test_tunnels_not_text():
    check(not isinstance(solution.active_tunnels, str), "active_tunnels should be a number the NOC can add up, not text in quotes")

def test_uptime_not_text():
    check(not isinstance(solution.uptime_hours, str), "uptime_hours should be a number, not text in quotes")

def test_patched_is_real_boolean():
    check(solution.patched is True or solution.patched is False, "patched should be the value True or False, not those words in quotes")

def test_one_line_per_value():
    lines = [l for l in solution_stdout.splitlines() if l.strip()]
    check(len(lines) >= 4, "Each of the four values should be printed on its own line")
`,
    },
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "ground-grid", level: 1 },
    { kind: "layer", layer: "power-core", level: 1 },
    { kind: "layer", layer: "core-lights", level: 1 },
    { kind: "stat", stat: "power", add: 25 },
  ],
  artifacts: [],
};

export default mission;
