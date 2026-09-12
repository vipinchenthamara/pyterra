/** Messages exchanged between the app and the Pyodide worker (public/py/worker.js). */

export interface TestResult {
  id: string;
  name: string;
  status: "pass" | "fail" | "error";
  message: string;
}

/** Shape returned by harness.py run_job (JSON). */
export interface RunResult {
  executed: boolean;
  error: string | null;
  errorType: string | null;
  errorLine: number | null;
  passed: boolean;
  visible: TestResult[];
  hidden: { passed: number; total: number; firstFailure: string | null };
  solutionStdout: string;
}

export interface RunOutcome extends RunResult {
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

export type WorkerRequest =
  | { type: "init" }
  | { type: "run"; id: string; code: string; tests: { visible: string; hidden: string }; timeoutMs: number };

export type WorkerResponse =
  | { type: "ready" }
  | { type: "stdout"; id: string; chunk: string }
  | { type: "stderr"; id: string; chunk: string }
  | { type: "result"; id: string; result: RunResult; stdout: string; stderr: string; durationMs: number }
  | { type: "fatal"; message: string };

export const TIMED_OUT_MESSAGE = "Execution halted — your code did not finish in time. Look for a loop that never ends.";
