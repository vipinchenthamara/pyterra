import { describe, expect, it, beforeAll } from "vitest";
import { loadHarness, type HarnessRunner } from "./nodeHarness";

let run: HarnessRunner;
beforeAll(async () => {
  run = await loadHarness();
});

const tests = {
  visible: `
def test_dedupes():
    "Removes repeated alerts"
    out = solution.dedupe(["disk", "cpu", "disk"])
    check(sorted(out) == ["cpu", "disk"], "Each alert should appear exactly once")
`,
  hidden: `
def test_empty():
    check(solution.dedupe([]) == [], "An empty feed should stay empty")
def test_type():
    check(isinstance(solution.dedupe(["a"]), list), "Expected a list back")
`,
};

describe("harness", () => {
  it("passes a correct solution", () => {
    const r = run("def dedupe(a):\n    return list(set(a))\n", tests);
    expect(r.executed).toBe(true);
    expect(r.passed).toBe(true);
    expect(r.visible[0].status).toBe("pass");
    expect(r.hidden).toEqual({ passed: 2, total: 2, firstFailure: null });
  });
  it("reports behaviour messages on failure", () => {
    const r = run("def dedupe(a):\n    return a\n", tests);
    expect(r.passed).toBe(false);
    expect(r.visible[0]).toMatchObject({ status: "fail", message: "Each alert should appear exactly once" });
    expect(r.hidden.passed).toBe(2);
  });
  it("captures a learner traceback with line number", () => {
    const r = run('x = 1\nprint("Power: " + x)\n', tests);
    expect(r.executed).toBe(false);
    expect(r.errorType).toBe("TypeError");
    expect(r.errorLine).toBe(2);
    expect(r.error).toContain('File "<solution>", line 2');
    expect(r.error).not.toContain("harness");
  });
  it("captures stdout for tests and reports syntax errors", () => {
    const r = run('print("hello vault")\n', { visible: 'def test_out():\n    check("hello" in solution_stdout, "Should print a greeting")\n', hidden: "" });
    expect(r.passed).toBe(true);
    expect(r.solutionStdout).toContain("hello vault");
    const s = run("def broken(\n", tests);
    expect(s.errorType).toBe("SyntaxError");
    expect(s.errorLine).toBe(1);
  });
  it("does not let learner code see the tests", () => {
    const r = run("import sys\nprint([k for k in globals() if 'test' in k])\nfound = 'check' in globals()\n", {
      visible: "def test_hidden():\n    check(solution.found is False, 'Tests must be invisible to learner code')\n",
      hidden: "",
    });
    expect(r.passed).toBe(true);
  });
});
