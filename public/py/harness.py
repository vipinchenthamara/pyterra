"""
Architect Online test harness. Loaded once into the Pyodide runtime (browser worker or Node tests).

run_job(code, visible_src, hidden_src) -> JSON string:
{
  "executed": bool,          # learner code ran without raising
  "error": str | None,       # learner-facing traceback (harness frames removed)
  "errorType": str | None,   # e.g. "NameError"
  "errorLine": int | None,   # line in the learner's code, if known
  "passed": bool,            # every visible + hidden test passed
  "visible": [ {"id","name","status","message"} ],
  "hidden": {"passed": int, "total": int, "firstFailure": str | None},
  "solutionStdout": str
}

Test authoring contract:
  - Tests are Python source defining functions named test_*.
  - The namespace provides `solution` (the learner's module), `check(cond, message)`,
    and `solution_stdout` (everything the learner's code printed while loading).
  - Messages describe expected BEHAVIOUR, never the literal expected value.
  - Tests are injected AFTER learner code has executed, in a separate namespace,
    so learner code cannot read or edit them.
"""
import builtins
import io
import json
import sys
import traceback
import types


class CheckFailed(AssertionError):
    pass


def check(cond, message="Check failed"):
    if not cond:
        raise CheckFailed(message)


_BUILTINS_SNAPSHOT = dict(vars(builtins))


def _restore_builtins():
    for k, v in _BUILTINS_SNAPSHOT.items():
        setattr(builtins, k, v)
    for k in list(vars(builtins)):
        if k not in _BUILTINS_SNAPSHOT:
            try:
                delattr(builtins, k)
            except Exception:
                pass


class _Tee(io.TextIOBase):
    def __init__(self, primary, buffer, limit=65536):
        self._primary = primary
        self._buffer = buffer
        self._limit = limit
        self._truncated = False

    def write(self, s):
        if self._primary is not None:
            try:
                self._primary.write(s)
            except Exception:
                pass
        if len(self._buffer.getvalue()) < self._limit:
            self._buffer.write(s)
        elif not self._truncated:
            self._buffer.write("\n[output truncated]\n")
            self._truncated = True
        return len(s)

    def flush(self):
        if self._primary is not None:
            try:
                self._primary.flush()
            except Exception:
                pass


def _learner_traceback(exc):
    etype = type(exc)
    frames = [
        f
        for f in traceback.extract_tb(exc.__traceback__)
        if f.filename in ("<solution>", "<tests>")
    ]
    lines = []
    if frames:
        lines.append("Traceback (most recent call last):")
        for f in frames:
            lines.append(f'  File "{f.filename}", line {f.lineno}, in {f.name}')
            if f.line:
                lines.append(f"    {f.line}")
    lines.extend(l.rstrip("\n") for l in traceback.format_exception_only(etype, exc))
    line_no = None
    if isinstance(exc, SyntaxError) and exc.filename == "<solution>":
        line_no = exc.lineno
    else:
        for f in frames:
            if f.filename == "<solution>":
                line_no = f.lineno
    return "\n".join(lines), etype.__name__, line_no


def _run_suite(src, sol, solution_stdout):
    ns = {
        "solution": sol,
        "check": check,
        "solution_stdout": solution_stdout,
        "__name__": "tests",
    }
    try:
        exec(compile(src, "<tests>", "exec"), ns)
    except Exception as e:  # authoring error in the tests themselves
        return [
            {
                "id": "suite",
                "name": "Test suite failed to load",
                "status": "error",
                "message": f"{type(e).__name__}: {e}",
            }
        ]
    results = []
    for name, fn in list(ns.items()):
        if not (name.startswith("test_") and callable(fn)):
            continue
        label = (fn.__doc__ or name.replace("test_", "").replace("_", " ")).strip()
        try:
            fn()
            results.append({"id": name, "name": label, "status": "pass", "message": ""})
        except CheckFailed as e:
            results.append({"id": name, "name": label, "status": "fail", "message": str(e)})
        except Exception as e:
            results.append(
                {
                    "id": name,
                    "name": label,
                    "status": "error",
                    "message": f"{type(e).__name__}: {e}",
                }
            )
    return results


def run_job(code, visible_src="", hidden_src=""):
    _restore_builtins()
    result = {
        "executed": False,
        "error": None,
        "errorType": None,
        "errorLine": None,
        "passed": False,
        "visible": [],
        "hidden": {"passed": 0, "total": 0, "firstFailure": None},
        "solutionStdout": "",
    }
    sol = types.ModuleType("solution")
    sol.__dict__["__name__"] = "__main__"
    sol.__dict__["__builtins__"] = builtins

    buf = io.StringIO()
    original_stdout = sys.stdout
    sys.stdout = _Tee(original_stdout, buf)
    try:
        try:
            exec(compile(code, "<solution>", "exec"), sol.__dict__)
            result["executed"] = True
        except BaseException as e:  # includes SystemExit from learner code
            if isinstance(e, KeyboardInterrupt):
                raise
            tb, etype, line = _learner_traceback(e)
            result["error"] = tb
            result["errorType"] = etype
            result["errorLine"] = line
            return json.dumps(result)
    finally:
        sys.stdout = original_stdout
    solution_stdout = buf.getvalue()
    result["solutionStdout"] = solution_stdout

    # Tests run with stdout silenced so learner output stays clean.
    sys.stdout = io.StringIO()
    try:
        visible = _run_suite(visible_src, sol, solution_stdout) if visible_src.strip() else []
        hidden = _run_suite(hidden_src, sol, solution_stdout) if hidden_src.strip() else []
    finally:
        sys.stdout = original_stdout

    result["visible"] = visible
    hidden_passed = sum(1 for r in hidden if r["status"] == "pass")
    result["hidden"] = {
        "passed": hidden_passed,
        "total": len(hidden),
        "firstFailure": next((r["message"] for r in hidden if r["status"] != "pass"), None),
    }
    result["passed"] = all(r["status"] == "pass" for r in visible + hidden)
    return json.dumps(result)
