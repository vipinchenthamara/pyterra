/* Pyterra — Pyodide runner worker (ES module worker, served from public/, not bundled).
 * Protocol: see src/engine/runner/protocol.ts. Timeouts are enforced by the client
 * (terminate + respawn); this worker only executes and streams output. */
var PYODIDE_INDEX = self.location.origin + "/py/vendor/";
import { loadPyodide, version as PYODIDE_VERSION } from "/py/vendor/pyodide.mjs";

var pyodide = null;
var runJob = null;
var current = null; // { id, stdout: [], stderr: [], size }
var STDOUT_LIMIT = 65536;

function push(kind, chunk) {
  if (!current) return;
  var arr = current[kind];
  if (current.size > STDOUT_LIMIT) return;
  current.size += chunk.length;
  arr.push(chunk);
  postMessage({ type: kind, id: current.id, chunk: chunk });
}

async function init() {
  pyodide = await loadPyodide({
    indexURL: PYODIDE_INDEX,
    stdout: function (line) { push("stdout", line + "\n"); },
    stderr: function (line) { push("stderr", line + "\n"); },
  });
  var res = await fetch("/py/harness.py", { cache: "no-cache" });
  var src = await res.text();
  pyodide.runPython(src);
  runJob = pyodide.globals.get("run_job");
  postMessage({ type: "ready", version: PYODIDE_VERSION });
}

self.onmessage = async function (ev) {
  var msg = ev.data;
  try {
    if (msg.type === "init") {
      await init();
      return;
    }
    if (msg.type === "run") {
      if (!runJob) {
        postMessage({ type: "fatal", message: "Runtime not ready" });
        return;
      }
      current = { id: msg.id, stdout: [], stderr: [], size: 0 };
      var started = performance.now();
      var json = runJob(msg.code, msg.tests.visible || "", msg.tests.hidden || "");
      var result = JSON.parse(json);
      var out = current.stdout.join("");
      var err = current.stderr.join("");
      if (current.size > STDOUT_LIMIT) out += "\n[output truncated]\n";
      current = null;
      postMessage({ type: "result", id: msg.id, result: result, stdout: out, stderr: err, durationMs: Math.round(performance.now() - started) });
    }
  } catch (e) {
    current = null;
    postMessage({ type: "fatal", message: String(e && e.message ? e.message : e) });
  }
};
