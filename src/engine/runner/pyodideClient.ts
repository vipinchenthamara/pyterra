/**
 * Browser-side runner client. Owns two workers: an active one and a warm spare.
 * On timeout the active worker is terminated and the spare is promoted, so an infinite
 * loop costs the learner nothing but the timeout itself.
 */
import { TIMED_OUT_MESSAGE, type RunOutcome, type WorkerRequest, type WorkerResponse } from "./protocol";

export type RunnerStatus = "idle" | "loading" | "ready" | "running" | "error";

type Listener = (s: RunnerStatus) => void;

interface ManagedWorker {
  worker: Worker;
  ready: Promise<void>;
}

class PyodideClient {
  private active: ManagedWorker | null = null;
  private spare: ManagedWorker | null = null;
  private status: RunnerStatus = "idle";
  private listeners = new Set<Listener>();
  private busy = false;
  private queue: Array<() => void> = [];

  getStatus() {
    return this.status;
  }
  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  private setStatus(s: RunnerStatus) {
    this.status = s;
    for (const l of this.listeners) l(s);
  }

  private spawn(): ManagedWorker {
    const worker = new Worker("/py/worker.js");
    const ready = new Promise<void>((resolve, reject) => {
      const onMsg = (ev: MessageEvent<WorkerResponse>) => {
        if (ev.data.type === "ready") {
          worker.removeEventListener("message", onMsg);
          resolve();
        } else if (ev.data.type === "fatal") {
          worker.removeEventListener("message", onMsg);
          reject(new Error(ev.data.message));
        }
      };
      worker.addEventListener("message", onMsg);
      worker.addEventListener("error", (e) => reject(new Error(e.message)));
    });
    worker.postMessage({ type: "init" } satisfies WorkerRequest);
    return { worker, ready };
  }

  /** Warm the runtime. Safe to call many times. */
  async warm(): Promise<void> {
    if (typeof window === "undefined") return;
    if (this.active) return this.active.ready;
    this.setStatus("loading");
    this.active = this.spawn();
    try {
      await this.active.ready;
      this.setStatus("ready");
      this.spare = this.spawn();
      this.spare.ready.catch(() => {
        this.spare = null;
      });
    } catch (e) {
      this.active = null;
      this.setStatus("error");
      throw e;
    }
  }

  private promoteSpare() {
    this.active = this.spare;
    this.spare = this.spawn();
    this.spare.ready.catch(() => {
      this.spare = null;
    });
    if (!this.active) {
      this.active = this.spawn();
    }
  }

  async run(code: string, tests: { visible: string; hidden: string }, timeoutMs = 5000, onOutput?: (kind: "stdout" | "stderr", chunk: string) => void): Promise<RunOutcome> {
    await this.warm();
    if (this.busy) await new Promise<void>((r) => this.queue.push(r));
    this.busy = true;
    this.setStatus("running");
    const id = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const active = this.active!;
    await active.ready;
    const started = performance.now();
    try {
      return await new Promise<RunOutcome>((resolve) => {
        let stdout = "";
        let stderr = "";
        const finish = (outcome: RunOutcome) => {
          clearTimeout(timer);
          active.worker.removeEventListener("message", onMsg);
          resolve(outcome);
        };
        const onMsg = (ev: MessageEvent<WorkerResponse>) => {
          const m = ev.data;
          if ("id" in m && m.id !== id) return;
          if (m.type === "stdout") {
            stdout += m.chunk;
            onOutput?.("stdout", m.chunk);
          } else if (m.type === "stderr") {
            stderr += m.chunk;
            onOutput?.("stderr", m.chunk);
          } else if (m.type === "result") {
            finish({ ...m.result, stdout: m.stdout, stderr: m.stderr, durationMs: m.durationMs, timedOut: false });
          } else if (m.type === "fatal") {
            active.worker.terminate();
            this.promoteSpare();
            finish({
              executed: false, error: `RuntimeError: ${m.message}`, errorType: "RuntimeError", errorLine: null, passed: false,
              visible: [], hidden: { passed: 0, total: 0, firstFailure: null }, solutionStdout: stdout, stdout, stderr, durationMs: Math.round(performance.now() - started), timedOut: false,
            });
          }
        };
        const timer = setTimeout(() => {
          active.worker.terminate();
          this.promoteSpare();
          finish({
            executed: false, error: TIMED_OUT_MESSAGE, errorType: "TimeoutError", errorLine: null, passed: false,
            visible: [], hidden: { passed: 0, total: 0, firstFailure: null }, solutionStdout: stdout, stdout, stderr, durationMs: timeoutMs, timedOut: true,
          });
        }, timeoutMs);
        active.worker.addEventListener("message", onMsg);
        active.worker.postMessage({ type: "run", id, code, tests, timeoutMs } satisfies WorkerRequest);
      });
    } finally {
      this.busy = false;
      this.setStatus(this.active ? "ready" : "error");
      this.queue.shift()?.();
    }
  }
}

const g = globalThis as unknown as { __pyodideClient?: PyodideClient };
export function getRunner(): PyodideClient {
  if (!g.__pyodideClient) g.__pyodideClient = new PyodideClient();
  return g.__pyodideClient;
}
