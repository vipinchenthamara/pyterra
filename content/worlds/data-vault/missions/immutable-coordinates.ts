import type { MissionInput } from "../../../schema";

const mission: MissionInput = {
  id: "immutable-coordinates",
  version: 1,
  worldId: "data-vault",
  order: 4,
  title: "Immutable Coordinates",
  codename: "DV-04",
  kind: "choose-tool",
  difficulty: 2,
  weight: 1,
  estimatedMinutes: 8,
  skills: [
    { id: "tuples", role: "primary" },
    { id: "lists", role: "secondary" },
  ],
  prerequisites: ["build-lookup-logic"],
  briefing:
    "Three perimeter sensors were surveyed to the centimetre and their positions signed off by the security lead. Last night the calibration script overwrote sensor A's name and nudged its latitude, and the shield map now shows a gate in the river. The Vault keeps those records in a container that happily accepts edits. The survey must live in something that refuses to change after it is written, while still letting the console read name, latitude and longitude by position.",
  objective:
    "Store `sensor_a` as an immutable record holding the name, latitude and longitude in that order. Unpack it into three top-level names `name`, `lat` and `lon`. Write `sensor_label(sensor)` that takes any such record and returns a string shaped like \"<name> @ <lat>,<lon>\". Any attempt to assign into `sensor_a` by position must raise an error rather than silently succeed.",
  predictPrompt:
    "The calibration script runs sensor_a[0] = \"tampered\". With the record exactly as the starter stores it, what does the console print afterwards, and what should happen instead?",
  starterCode: `# Perimeter sensor survey: name, latitude, longitude. Signed off. Must never change.
sensor_a = ["north-gate", 51.5, -0.12]
# TODO 1: the record above is in the wrong container. Pick one that refuses edits after it is written.

# TODO 2: unpack the record into three names: name, lat, lon

def sensor_label(sensor):
    # TODO 3: return text shaped like  north-gate @ 51.5,-0.12
    ...

print(sensor_label(sensor_a))
`,
  referenceSolution: `sensor_a = ("north-gate", 51.5, -0.12)

name, lat, lon = sensor_a

def sensor_label(sensor):
    return f"{sensor[0]} @ {sensor[1]},{sensor[2]}"

print(sensor_label(sensor_a))
print(f"{name} surveyed at {lat}, {lon}")
`,
  tests: {
    visible: `
def test_record_is_immutable_type():
    "sensor_a is stored in a container that refuses edits"
    check(isinstance(solution.sensor_a, tuple), "sensor_a should be an immutable record type, not an editable list")

def test_unpacked_names():
    "name, lat and lon are unpacked from the record"
    for n in ("name", "lat", "lon"):
        check(hasattr(solution, n), "The record should be unpacked into name, lat and lon at the top level")
    check(solution.name == solution.sensor_a[0], "name should hold the first field of the record")
    check(solution.lat == solution.sensor_a[1] and solution.lon == solution.sensor_a[2], "lat and lon should hold the second and third fields of the record")

def test_label_shape():
    "sensor_label renders name, latitude and longitude"
    out = solution.sensor_label(("east-gate", 12.5, -3.25))
    check(isinstance(out, str), "sensor_label should return text")
    check("east-gate" in out and "12.5" in out and "-3.25" in out, "The label should include the sensor name, latitude and longitude")
    check("@" in out, "The label should separate the name from the coordinates with an @ sign")

def test_write_attempt_fails_loudly():
    "Assigning into the record by position raises instead of succeeding"
    try:
        solution.sensor_a[0] = "tampered"
    except TypeError:
        return
    check(False, "sensor records must be immutable: writing to a position should raise, not silently change the survey")
`,
    hidden: `
def test_label_for_own_record():
    out = solution.sensor_label(solution.sensor_a)
    check(solution.name in out, "The label of sensor_a should contain its own name")
    check(str(solution.lat) in out and str(solution.lon) in out, "The label of sensor_a should contain its own coordinates")

def test_record_has_three_fields():
    check(len(solution.sensor_a) == 3, "The record should hold exactly name, latitude and longitude")

def test_label_exact_layout():
    check(solution.sensor_label(("s", 1.0, 2.0)) == "s @ 1.0,2.0", "The label should read: name, space, @, space, then lat and lon separated by a comma with no spaces")

def test_no_list_editing_methods():
    check(not hasattr(solution.sensor_a, "append"), "The record should not expose list-style editing methods")

def test_original_survey_intact():
    check(solution.sensor_a[0] == "north-gate" and solution.sensor_a[1] == 51.5, "The surveyed name and latitude should be unchanged by the rebuild")
`,
  },
  hints: [
    "The record has a fixed shape: three fields in a fixed order, and it must never change after the survey. You need a sequence you can read by position but cannot write into.",
    "That is the tuple. Round brackets instead of square: (\"a\", 1, 2). Indexing works exactly like a list, but item assignment raises TypeError. A tuple can also be unpacked into separate names in one line.",
    "Tiny example: node = (\"edge-7\", 10.0, 20.0); host, x, y = node gives three separate names; node[0] = \"z\" raises TypeError: 'tuple' object does not support item assignment.",
    "Shape: change the square brackets around the record to round ones; write name, lat, lon = sensor_a; inside sensor_label build an f-string from sensor[0], sensor[1] and sensor[2] with @ and a comma between them.",
    `sensor_a = ("north-gate", 51.5, -0.12)
name, lat, lon = sensor_a

def sensor_label(sensor):
    return f"{sensor[0]} @ ..."  # finish with sensor[1] and sensor[2], comma between`,
    "Full walkthrough: sensor_a = (\"north-gate\", 51.5, -0.12) creates a tuple; the round brackets are what make it immutable. name, lat, lon = sensor_a unpacks the three fields into three names in one step; the count on the left must match the tuple length. sensor_label returns f\"{sensor[0]} @ {sensor[1]},{sensor[2]}\", reading each field by position exactly as you would from a list. The test that tries sensor_a[0] = \"tampered\" now raises TypeError, which is the behaviour the security lead asked for.",
  ],
  errorExplanations: [
    {
      match: "'tuple' object does not support item assignment",
      title: "The immutability is doing its job",
      explanation:
        "Something in your code writes into sensor_a after it became a tuple. That is exactly what the survey must prevent. If a new survey arrives, build a new tuple instead of editing the old one.",
    },
    {
      match: "not enough values to unpack|too many values to unpack",
      title: "Unpacking count does not match the record",
      explanation:
        "name, lat, lon = sensor_a needs exactly three fields on the right. Check the record still holds name, latitude and longitude and nothing more or less.",
    },
    {
      match: "'tuple' object has no attribute 'append'",
      title: "Tuples do not grow",
      explanation:
        "append belongs to lists. A tuple is fixed at creation, so put all three fields inside the round brackets when you write it.",
    },
  ],
  anchors: ["tuples", "lists"],
  explainWhy: {
    question: "Why is a tuple the right container for a surveyed position rather than a list?",
    options: [
      "Tuples can hold floats and lists cannot",
      "Tuples cannot be modified after creation, so a stray write fails loudly instead of corrupting the survey",
      "Tuples sort their fields automatically",
      "Tuples are the only type that can be unpacked",
    ],
    correctIndex: 1,
    explanation:
      "A list is for data that legitimately changes. A surveyed position must not, so a tuple turns an accidental edit into an immediate TypeError at the line that tried it, instead of a gate quietly moving into the river.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "vault-lights", level: 1 },
    { kind: "layer", layer: "vault-shield", level: 1 },
    { kind: "stat", stat: "security", add: 10 },
  ],
  artifacts: [],
};

export default mission;
