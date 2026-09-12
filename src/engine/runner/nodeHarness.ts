/**
 * Node-side harness loader used by vitest (content verification). The browser uses
 * public/py/worker.js instead; both execute the same public/py/harness.py.
 */
import fs from "node:fs";
import path from "node:path";
import { loadPyodide } from "pyodide";
import type { RunResult } from "./protocol";

export type HarnessRunner = (code: string, tests: { visible: string; hidden: string }) => RunResult;

let cached: Promise<HarnessRunner> | null = null;

export function loadHarness(): Promise<HarnessRunner> {
  if (cached) return cached;
  cached = (async () => {
    const py = await loadPyodide({ stdout: () => {}, stderr: () => {} });
    const src = fs.readFileSync(path.resolve(process.cwd(), "public/py/harness.py"), "utf8");
    py.runPython(src);
    const runJob = py.globals.get("run_job") as (c: string, v: string, h: string) => string;
    return (code, tests) => JSON.parse(runJob(code, tests.visible, tests.hidden)) as RunResult;
  })();
  return cached;
}
