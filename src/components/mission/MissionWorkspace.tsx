"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, RotateCcw, ChevronLeft, CheckCircle2, Clock, Flag } from "lucide-react";
import type { ClientMission, World } from "@content/schema";
import type { CompletionResult } from "@/server/complete";
import type { RunOutcome } from "@/engine/runner/protocol";
import { getRunner, type RunnerStatus } from "@/engine/runner/pyodideClient";
import { coachError, type CoachedError } from "@/engine/errorCoach";
import { Badge, Button, Kbd } from "@/components/ui";
import { useTutorStore } from "@/components/tutor/tutorStore";
import { Editor } from "./Editor";
import { OutputPanel } from "./Console";
import { HintLadder } from "./HintLadder";
import { ConceptCard } from "./ConceptCard";
import { ErrorCoachCard } from "./ErrorCoachCard";
import { PredictStep } from "./PredictStep";
import { CompletionOverlay } from "./CompletionOverlay";

export interface WorkspaceProps {
  mission: ClientMission;
  world: Pick<World, "id" | "name" | "accent" | "scene" | "codename">;
  anchors: { id: string; name: string; anchor: string; description: string }[];
  initialCode: string;
  alreadyPassed: boolean;
  artifactNames: Record<string, string>;
  mode: "mission" | "review";
  reviewItemId?: string;
  skillNames: string[];
  prevMissionId?: string | null;
  nextMissionId?: string | null;
}

interface Attempt {
  id: string;
  runs: number;
  hintsUsed: number;
  maxHintLevel: number;
  predicted: string | null;
  startedAt: string;
  status: string;
}

const REVIEW_SCAFFOLD = (m: ClientMission) => `# REPAIR MISSION — rebuild from memory.\n# Objective: ${m.objective.replace(/\n/g, "\n# ")}\n\n`;

export function MissionWorkspace(p: WorkspaceProps) {
  const isReview = p.mode === "review";
  const starter = isReview ? (p.initialCode || REVIEW_SCAFFOLD(p.mission)) : p.mission.starterCode;
  const [code, setCode] = useState(starter);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [coached, setCoached] = useState<CoachedError | null>(null);
  const [running, setRunning] = useState(false);
  const [runnerStatus, setRunnerStatus] = useState<RunnerStatus>(getRunner().getStatus());
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [runsThisSession, setRunsThisSession] = useState(0);
  const completedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setCtx = useTutorStore((s) => s.setCtx);
  const clearCtx = useTutorStore((s) => s.clearCtx);
  const nudge = useTutorStore((s) => s.nudge);
  const router = useRouter();
  const [elapsedOk, setElapsedOk] = useState(false);

  // Runner status
  useEffect(() => {
    const r = getRunner();
    r.warm().catch(() => {});
    const unsub = r.subscribe(setRunnerStatus);
    return () => {
      unsub();
    };
  }, []);

  // Hints requested through the tutor panel land on the ladder too
  useEffect(() => {
    const onHint = (e: Event) => {
      const level = (e as CustomEvent<{ level: number }>).detail?.level ?? 0;
      setAttempt((a) => (a && level > a.maxHintLevel ? { ...a, maxHintLevel: level, hintsUsed: Math.max(a.hintsUsed, level) } : a));
    };
    window.addEventListener("architect:hint", onHint);
    return () => window.removeEventListener("architect:hint", onHint);
  }, []);

  // Full-solution gate: 10 minutes on the mission (checked every 30 s)
  useEffect(() => {
    if (!attempt) return;
    const check = () => setElapsedOk(Date.now() - new Date(attempt.startedAt).getTime() >= 10 * 60_000);
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [attempt]);

  // Start / resume attempt
  useEffect(() => {
    let cancelled = false;
    fetch("/api/attempts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ missionId: p.mission.id, mode: p.mode, reviewItemId: p.reviewItemId }) })
      .then((r) => r.json())
      .then((a: Attempt) => {
        if (!cancelled) setAttempt(a);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [p.mission.id, p.mode, p.reviewItemId]);

  // Tutor context
  useEffect(() => {
    setCtx({ attemptId: attempt?.id, missionId: p.mission.id, missionTitle: p.mission.title, code, lastError: outcome?.error ?? null, hintsUsed: attempt?.hintsUsed ?? 0, lastTests: outcome ? JSON.stringify({ visible: outcome.visible, hidden: outcome.hidden }) : null });
  }, [attempt, code, outcome, p.mission.id, p.mission.title, setCtx]);
  useEffect(() => {
    return () => {
      clearCtx();
    };
  }, [clearCtx]);

  // Autosave (missions only; review code is not persisted so the next review starts blank)
  const onChange = useCallback(
    (v: string) => {
      setCode(v);
      if (isReview) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        fetch("/api/autosave", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ missionId: p.mission.id, code: v }) })
          .then((r) => r.json())
          .then((j) => setSavedAt(j.savedAt))
          .catch(() => {});
      }, 700);
    },
    [isReview, p.mission.id],
  );

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setCoached(null);
    try {
      const out = await getRunner().run(code, p.mission.tests, p.mission.timeoutMs);
      setOutcome(out);
      setRunsThisSession((n) => n + 1);
      const runs = (attempt?.runs ?? 0) + 1;
      if (attempt) {
        setAttempt({ ...attempt, runs });
        fetch(`/api/attempts/${attempt.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "run", passed: out.passed, code }) }).catch(() => {});
      }
      if (out.error) {
        const c = coachError(out.error, out.errorType, out.errorLine, p.mission.errorExplanations);
        setCoached(c);
        nudge(c.title);
      } else {
        nudge(null);
      }
      if (out.passed && attempt && !completedRef.current) {
        completedRef.current = true;
        const visiblePassed = out.visible.filter((t) => t.status === "pass").length;
        const res = await fetch(`/api/attempts/${attempt.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "complete", code, runs, hintsUsed: attempt.hintsUsed, maxHintLevel: attempt.maxHintLevel,
            durationMs: Math.max(0, Date.now() - new Date(attempt.startedAt).getTime()),
            testSummary: { visiblePassed, visibleTotal: out.visible.length, hiddenPassed: out.hidden.passed, hiddenTotal: out.hidden.total },
          }),
        });
        const result = (await res.json()) as CompletionResult & { alreadyPassed?: boolean };
        if ("xpGained" in result) setCompletion(result);
        else completedRef.current = false;
      }
    } catch (e) {
      setOutcome({ executed: false, error: `RuntimeError: ${(e as Error).message}`, errorType: "RuntimeError", errorLine: null, passed: false, visible: [], hidden: { passed: 0, total: 0, firstFailure: null }, solutionStdout: "", stdout: "", stderr: "", durationMs: 0, timedOut: false });
    } finally {
      setRunning(false);
    }
  }, [attempt, code, nudge, p.mission.errorExplanations, p.mission.tests, p.mission.timeoutMs, running]);

  const reveal = (level: number) => {
    if (!attempt) return;
    const next = { ...attempt, hintsUsed: Math.max(attempt.hintsUsed, level), maxHintLevel: Math.max(attempt.maxHintLevel, level) };
    setAttempt(next);
    fetch(`/api/attempts/${attempt.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "hint", level }) }).catch(() => {});
  };

  const reset = () => {
    if (code !== starter && !window.confirm("Restore the starter code? Your current edits will be discarded (attempt history is kept).")) return;
    setCode(starter);
    setOutcome(null);
    setCoached(null);
    if (!isReview) fetch("/api/autosave", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ missionId: p.mission.id }) }).catch(() => {});
  };

  const giveUpReview = async () => {
    if (!attempt || !window.confirm("Mark this repair as failed? The skill's next repair will be scheduled sooner.")) return;
    await fetch(`/api/attempts/${attempt.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "fail-review", hintsUsed: attempt.hintsUsed }) });
    router.push("/");
  };

  const canRevealFull = (attempt?.runs ?? 0) + runsThisSession >= 3 || elapsedOk;
  const fullReason = "Available after 3 runs or 10 minutes on this mission.";
  const hintsRevealed = attempt?.maxHintLevel ?? 0;
  const errorLine = outcome?.errorLine ?? null;
  const tests = useMemo(() => ({ visible: p.mission.tests.visible, hidden: p.mission.tests.hidden }), [p.mission.tests]);
  void tests;

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/worlds/${p.world.id}`} className="flex items-center gap-1 font-mono text-[11.5px] uppercase tracking-wider text-fg-3 hover:text-cyan">
          <ChevronLeft className="h-4 w-4" /> {p.world.name}
        </Link>
        <span className="text-fg-4">/</span>
        <span className="font-mono text-[11.5px] text-fg-3">{p.mission.codename}</span>
        <div className="ml-auto flex items-center gap-2">
          {isReview && <Badge tone="amber">Repair mission</Badge>}
          {p.mission.kind === "boss" && <Badge tone="violet">Boss challenge</Badge>}
          {p.alreadyPassed && !isReview && (
            <Badge tone="emerald">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </Badge>
          )}
          {!p.alreadyPassed && !isReview && <Badge tone="cyan">In progress</Badge>}
          <span className="flex items-center gap-1 font-mono text-[11px] text-fg-3">
            <Clock className="h-3.5 w-3.5" /> ~{p.mission.estimatedMinutes} min
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        {/* Left: objective */}
        <div className="flex flex-col gap-4">
          <div className="panel hud">
            <h1 className="font-display text-[22px] font-semibold leading-tight tracking-wide">{isReview ? `Repair: ${p.mission.title}` : `Mission: ${p.mission.title}`}</h1>
            <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">{p.mission.briefing}</p>
            <div className="label mt-4 mb-1.5">Objective</div>
            <p className="text-[13.5px] leading-relaxed text-fg">{p.mission.objective}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {p.skillNames.map((s) => (
                <Badge key={s} tone="neutral">{s}</Badge>
              ))}
            </div>
          </div>
          {p.mission.predictPrompt && !isReview && !outcome && (
            <PredictStep
              prompt={p.mission.predictPrompt}
              initial={attempt?.predicted ?? null}
              onCommit={(text) => attempt && fetch(`/api/attempts/${attempt.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "predict", text }) })}
            />
          )}
          <ConceptCard anchors={p.anchors} />
        </div>

        {/* Center: editor + output */}
        <div className="flex min-h-[640px] flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] text-fg-3">main.py</span>
            <span className="ml-auto font-mono text-[10.5px] text-fg-4">{savedAt ? "saved" : isReview ? "not saved in repair mode" : "autosave on"}</span>
          </div>
          <div className="min-h-[360px] flex-1">
            <Editor value={code} onChange={onChange} onRun={run} errorLine={errorLine} />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={run} disabled={running || runnerStatus === "error"}>
              <Play className="h-4 w-4" /> {running ? "Running…" : "Run"}
            </Button>
            <Kbd>⌘⏎</Kbd>
            <Button variant="secondary" onClick={reset}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            {isReview && (
              <Button variant="danger" onClick={giveUpReview} className="ml-2">
                <Flag className="h-4 w-4" /> Can&apos;t recall
              </Button>
            )}
            <span className="ml-auto font-mono text-[11px] text-fg-4">Python 3.14 · runs {(attempt?.runs ?? 0)}</span>
          </div>
          <div className="h-[240px]">
            <OutputPanel outcome={outcome} running={running} runnerStatus={runnerStatus} />
          </div>
        </div>

        {/* Right: hints + coach */}
        <div className="flex flex-col gap-4">
          {coached && <ErrorCoachCard coached={coached} onAskTutor={() => document.querySelector<HTMLButtonElement>('[aria-label="Open teaching assistant"]')?.click()} />}
          <HintLadder hints={p.mission.hints} revealed={hintsRevealed} onReveal={reveal} canRevealFull={canRevealFull} fullReason={fullReason} />
          <div className="panel !p-4">
            <div className="label mb-2">World consequence</div>
            <ul className="flex flex-col gap-1 text-[12.5px] text-fg-2">
              {p.mission.onComplete.map((d, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                  {d.kind === "layer" ? `${p.world.scene.layers.find((l) => l.id === d.layer)?.label ?? d.layer} → level ${d.level}` : `${d.stat.replace("_", " ")} +${d.add}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {completion && <CompletionOverlay result={completion} mission={p.mission} world={p.world} artifactNames={p.artifactNames} reviewMode={isReview} onClose={() => setCompletion(null)} />}
    </div>
  );
}
