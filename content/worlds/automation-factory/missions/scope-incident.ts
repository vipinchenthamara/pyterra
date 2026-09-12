import type { MissionInput } from "../../../schema";

/**
 * AF-03 — Scope Incident. Fix-bug: a function that assigns to a local expecting to change a module
 * variable, a function that prints instead of returning, and a call with swapped positional arguments.
 * The starter raises UnboundLocalError on its first call; that is the point.
 */
const mission: MissionInput = {
  id: "scope-incident",
  version: 1,
  worldId: "automation-factory",
  order: 3,
  title: "Scope Incident",
  codename: "AF-03",
  kind: "fix-bug",
  difficulty: 3,
  weight: 1,
  estimatedMinutes: 9,
  skills: [
    { id: "functions", role: "primary" },
    { id: "arguments", role: "secondary" },
  ],
  prerequisites: ["parameters-and-defaults"],
  briefing:
    "The patch-window runbook ran clean on the author's laptop and fell over on the first real night. The patched-host counter never moves, or crashes trying. The window text reaches the caller as nothing at all, so the banner line dies. And the notification goes to a channel named after a server. Three machines on this line, and none of them keeps its promise to the caller.",
  objective:
    "Make the script run and return the right values. `bump(current)` must return current plus one, and the module-level `count` must advance by assigning what bump returns (`count = bump(count)`), not by writing to a global from inside the function. `patch_window(host, hours)` must return its text instead of printing it. The call that builds `notice` must hand the host and the channel to the right parameters of `notify(host, channel)`; use keyword arguments so the order can never be mistaken again.",
  predictPrompt:
    "Before you press run: the first call is bump(). Does it raise, or does count quietly stay at zero? And what value lands in window?",
  starterCode: `# Patch-window runbook. It ran on the author's laptop; it does not survive a real night.
count = 0


def bump():
    # BUG 1: this assigns to a brand-new local count; the module-level count never changes.
    # TODO: take the current value as a parameter and RETURN the new one. Do not use global.
    count = count + 1


def patch_window(host, hours):
    # BUG 2: prints the result instead of returning it, so the caller receives None
    print(f"{host} patches in {hours}h")


def notify(host, channel):
    return f"[{channel}] {host} ready for patching"


bump()
bump()

window = patch_window("edge-fw-01", 4)
banner = "Window: " + window

# BUG 3: the two arguments are in the wrong order. Fix it with keyword arguments.
notice = notify("#ops-alerts", "core-db-02")

print("patched:", count)
print(banner)
print(notice)
`,
  referenceSolution: `count = 0


def bump(current):
    return current + 1


def patch_window(host, hours):
    return f"{host} patches in {hours}h"


def notify(host, channel):
    return f"[{channel}] {host} ready for patching"


count = bump(count)
count = bump(count)

window = patch_window("edge-fw-01", 4)
banner = "Window: " + window

notice = notify(host="core-db-02", channel="#ops-alerts")

print("patched:", count)
print(banner)
print(notice)
`,
  tests: {
    visible: `
def test_bump_returns_next_value():
    "bump hands back the incremented value"
    check(solution.bump(4) == 5, "bump should return the value it was given plus one")

def test_counter_advanced_through_return():
    "count moved once per bump call"
    check(solution.count == 2, "count should have advanced once for each bump call, via the returned value")

def test_patch_window_returns_text():
    "patch_window returns its text instead of printing it"
    out = solution.patch_window("core-db-02", 6)
    check(isinstance(out, str), "patch_window should return a string; a function that only prints returns None")
    check("core-db-02" in out and "6" in out, "The returned text should mention the host and the hours")

def test_notice_uses_right_parameters():
    "notice has the channel in brackets and the host after it"
    check(solution.notice == solution.notify(host="core-db-02", channel="#ops-alerts"), "notice should be what notify returns when core-db-02 is the host and #ops-alerts is the channel")
`,
    hidden: `
import io
import contextlib
import inspect

def test_bump_computes_from_parameter():
    before = solution.count
    out = solution.bump(10)
    check(out == 11, "bump should compute from its parameter, not from the module-level count")
    check(solution.count == before, "Calling bump must not silently change the module-level count; the caller assigns the returned value")

def test_bump_accepts_the_current_value():
    params = inspect.signature(solution.bump).parameters
    check(len(params) == 1, "bump should take the current value as its one parameter")

def test_patch_window_is_silent():
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        out = solution.patch_window("h", 1)
    check(buf.getvalue() == "", "patch_window should not print; it should return the text for the caller to use")
    check(out is not None, "patch_window should return a value")

def test_banner_built_from_window():
    check(isinstance(solution.banner, str) and solution.window in solution.banner, "banner should be the window text with its label in front")

def test_notice_channel_first():
    check(solution.notice.startswith("[#ops-alerts]"), "The channel should be the thing inside the brackets, with the host after it")

def test_count_is_a_number():
    check(type(solution.count) is int, "count should remain a whole number")
`,
  },
  hints: [
    "Each of the three machines breaks the same promise in a different way: what goes in and what comes out. Read every def and ask what the caller actually receives.",
    "A name assigned inside a function is local to that function, for the whole function. Printing is not returning. Positional arguments are matched by position; keyword arguments are matched by name.",
    "Tiny unrelated example: def next_id(current): return current + 1 and then last = next_id(last). And connect(port=443, host=\"db\") works in either order because the names carry the meaning.",
    "Shape: bump takes current and returns current + 1; the two call lines become count = bump(count). patch_window keeps its f-string but returns it. The notify call names its arguments: notify(host=..., channel=...).",
    `def bump(current):
    return current + 1


def patch_window(host, hours):
    return f"{host} patches in {hours}h"


count = bump(count)
count = bump(count)
# notice = notify(host=..., channel=...)`,
    "Full walkthrough: inside the old bump, count = count + 1 makes count a local for the whole function, so reading it on the right side fails before anything is assigned. def bump(current): return current + 1 takes the value in and hands the new one out; count = bump(count) writes it back at module level. patch_window printed and then fell off the end, which returns None, so \"Window: \" + None crashed; return f\"...\" fixes it. notify(host=\"core-db-02\", channel=\"#ops-alerts\") binds each value to the named parameter regardless of order.",
  ],
  errorExplanations: [
    {
      match: "UnboundLocalError|referenced before assignment|not associated with a value",
      title: "count inside bump is a different count",
      explanation:
        "Because bump assigns to count, Python treats count as local to bump everywhere in the function, and the read on the right side happens before that local exists. Do not reach for global. Give bump a parameter, return current + 1, and let the caller write count = bump(count).",
    },
    {
      match: "NoneType",
      title: "The caller received None",
      explanation:
        "patch_window prints its text and then ends without a return statement, so the caller gets None and the + on the banner line has nothing to join. Replace print(...) inside patch_window with return ...",
    },
    {
      match: "takes 0 positional arguments",
      title: "bump still has no parameter",
      explanation:
        "The tests, and the fixed call lines, hand bump the current value. Declare it: def bump(current): and return current + 1.",
    },
  ],
  anchors: ["functions", "arguments"],
  explainWhy: {
    question: "Why does count = count + 1 inside bump raise instead of updating the module-level count?",
    options: [
      "Functions cannot read module-level variables at all",
      "Any assignment to a name inside a function makes that name local for the whole function, so the read on the right side finds a local that has no value yet",
      "Python only allows one variable named count per file",
      "The plus operator is not allowed inside functions",
    ],
    correctIndex: 1,
    explanation:
      "Python decides scope when it compiles the function: a name that is assigned anywhere in the body is local. The right-hand count is then the local one, still unassigned. Passing the value in and returning the new one avoids the whole question.",
  },
  timeoutMs: 3000,
  onComplete: [
    { kind: "layer", layer: "worker-drones", level: 1 },
    { kind: "layer", layer: "assembly-halls", level: 2 },
    { kind: "stat", stat: "systems_online", add: 1 },
  ],
  artifacts: [],
  reviewVariant: {
    briefing:
      "The login-lockout helper has the same two faults in a different uniform. The failed-attempt counter never rises, and the lockout message reaches the caller as None, so the notification line has nothing to send.",
    objective:
      "Fix `register_failure(current)` so it returns current plus one, and advance the module-level `failed` three times through the returned value so it ends at three. Fix `lockout_message(user, minutes)` so it returns its text instead of printing it. Do not use global.",
    starterCode: `failed = 0


def register_failure():
    # BUG: assigns to a local; the module-level failed never moves. Take the value in, return the new one.
    failed = failed + 1


def lockout_message(user, minutes):
    # BUG: prints instead of returning
    print(f"{user} locked for {minutes} minutes")


register_failure()
register_failure()
register_failure()

message = lockout_message("ana", 15)
`,
    referenceSolution: `failed = 0


def register_failure(current):
    return current + 1


def lockout_message(user, minutes):
    return f"{user} locked for {minutes} minutes"


failed = register_failure(failed)
failed = register_failure(failed)
failed = register_failure(failed)

message = lockout_message("ana", 15)
`,
    tests: {
      visible: `
def test_register_failure_returns_next():
    "register_failure returns the incremented value"
    check(solution.register_failure(2) == 3, "register_failure should return the value it was given plus one")

def test_failed_counter_advanced():
    "failed moved once per call"
    check(solution.failed == 3, "failed should have advanced once for each call, through the returned value")

def test_lockout_message_returns():
    "lockout_message returns text"
    out = solution.lockout_message("bo", 5)
    check(isinstance(out, str) and "bo" in out and "5" in out, "lockout_message should return text naming the user and the minutes")
`,
      hidden: `
import io
import contextlib

def test_register_failure_does_not_touch_module():
    before = solution.failed
    solution.register_failure(40)
    check(solution.failed == before, "Calling register_failure must not change the module-level counter by itself")

def test_lockout_message_silent():
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        out = solution.lockout_message("cy", 1)
    check(buf.getvalue() == "" and out is not None, "lockout_message should return rather than print")

def test_message_variable_is_text():
    check(isinstance(solution.message, str), "message should hold the returned text, not None")
`,
    },
  },
};

export default mission;
