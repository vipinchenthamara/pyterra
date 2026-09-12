"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, RotateCcw, ChevronLeft, CheckCircle2, Flag, Lightbulb, BookOpen, ListChecks, Circle, XCircle } from "lucide-react";
import type { ClientMission, World } from "@content/schema";
import type { CompletionResult } from "@/server/complete";
import type { RunOutcome } from "@/engine/runner/protocol";
import { getRunner, type RunnerStatus } from "@/engine/runner/pyodideClient";
import { coachError, type CoachedError } from "@/engine/errorCoach";
import { Badge, Button, Kbd } from "@/components/ui";
import { useTutorStore } from "@/components/tutor/tutorStore";
import { cn } from "@/lib/cn";
import { Editor } from "./Editor";
import { OutputPanel } from "./Console";
import { HintLadder } from "./HintLadder";
import { ErrorCoachCard } from "./ErrorCoachCard";
import { CompletionOverlay } from "./CompletionOverlay";
import { BriefStep } from "./BriefStep";
import { PrimerStep, type PrimerView } from "./PrimerStep";

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
  skills: { id: string; name: string; isNew: boolean }[];
  primers: PrimerView[];
  /** Visible test names (docstrings), in order. */
  checks: string[];
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

type Step = "brief" | "learn" | "build";

const REVIEW_SCAFFOLD = (m: ClientMission) => `# REPAIR MISSION — rebuild from memory.\n# Objective: ${m.objective.replace(/\n/g, "\n# ")}\n\n`;

export function MissionWorkspace(p: WorkspaceProps) {
  const isReview = p.mode === "review";
  const starter = isReview ? p.initialCode || REVIEW_SCAFFOLD(p.mission) : p.mission.starterCode;
  const hasEdits = !isReview && p.initialCode.trim() !== p.mission.starterCode.trim();
  const hasNewSkills = p.skills.some((s) => s.isNew);
  const [step, setStep] = useState<Step>(isReview || hasEdits || p.alreadyPassed ? "build" : "brief");
  const [rail, setRail] = useState<"checks" | "hints" | "concept">(hasNewSkills ? "checks" : "checks");
  const [code, setCode] = useState(starter);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [coached, setCoached] = useState<CoachedError | null>(null);
  const [running, setRunning] = useState(false);
  const [runnerStatus, setRunnerStatus] = useState<RunnerStatus>(getRunner().getStatus());
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [runsThisSession, setRunsThisSession] = useState(0);
  const [elapsedOk, setElapsedOk] = useState(false);
  const completedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setCtx = useTutorStore((s) => s.setCtx);
  const clearCtx = useTutorStore((s) => s.clearCtx);
  const nudge = useTutorStore((s) => s.nudge);
  const router = useRouter();

  useEffect(() => {
    const r = getRunner();
    r.warm().catch(() => {});
    const unsub = r.subscribe(setRunnerStatus);
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    const onHint = (e: Event) => {
      const level = (e as CustomEvent<{ level: number }>).detail?.level ?? 0;
      setAttempt((a) => (a && level > a.maxHintLevel ? { ...a, maxHintLevel: level, hintsUsed: Math.max(a.hintsUsed, level) } : a));
      setRail("hints");
    };
    window.addEventListener("architect:hint", onHint);
    return () => window.removeEventListener("architect:hint", onHint);
  }, []);

  useEffect(() => {
    if (!attempt) return;
    const check = () => setElapsedOk(Date.now() - new Date(attempt.startedAt).getTime() >= 10 * 60_000);
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [attempt]);

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

  useEffect(() => {
    setCtx({ attemptId: attempt?.id, missionId: p.mission.id, missionTitle: p.mission.title, code, lastError: outcome?.error ?? null, hintsUsed: attempt?.hintsUsed ?? 0, lastTests: outcome ? JSON.stringify({ visible: outcome.visible, hidden: outcome.hidden }) : null });
  }, [attempt, code, outcome, p.mission.id, p.mission.title, setCtx]);
  useEffect(() => {
    return () => {
      clearCtx();
    };
  }, [clearCtx]);

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
        setRail("checks");
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
    setAttempt({ ...attempt, hintsUsed: Math.max(attempt.hintsUsed, level), maxHintLevel: Math.max(attempt.maxHintLevel, level) });
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
  const hintsRevealed = attempt?.maxHintLevel ?? 0;
  const errorLine = outcome?.errorLine ?? null;
  const checksPassed = outcome?.visible.filter((t) => t.status === "pass").length ?? 0;

  const STEPS: { id: Step; label: string; n: number; show: boolean }[] = [
    { id: "brief", label: "Brief", n: 1, show: !isReview },
    { id: "learn", label: "Learn", n: 2, show: p.primers.length > 0 },
    { id: "build", label: "Build", n: isReview ? 1 : p.primers.length > 0 ? 3 : 2, show: true },
  ];

  return (
    <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
      {/* Header + stepper */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/worlds/${p.world.id}`} className="flex items-center gap-1 font-mono text-[11.5px] uppercase tracking-wider text-fg-3 hover:text-cyan">
          <ChevronLeft className="h-4 w-4" /> {p.world.name}
        </Link>
        <span className="text-fg-4">/</span>
        <span className="font-display text-[14px] font-semibold tracking-wide text-fg">{isReview ? `Repair: ${p.mission.title}` : p.mission.title}</span>
        <nav className="ml-auto flex items-center gap-1 rounded-lg border border-line bg-bg-deep p-0.5" aria-label="Mission steps">
          {STEPS.filter((s) => s.show).map((s) => (
            <button key={s.id} onClick={() => setStep(s.id)} aria-current={step === s.id ? "step" : undefined} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 font-display text-[12.5px] font-semibold tracking-wide transition-colors", step === s.id ? "bg-cyan/15 text-cyan" : "text-fg-3 hover:text-fg-2")}>
              <span className="readout text-[10.5px] opacity-70">{s.n}</span> {s.label}
              {s.id === "learn" && hasNewSkills && step !== "learn" && <span className="h-1.5 w-1.5 rounded-full bg-amber" />}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isReview && <Badge tone="amber">Repair</Badge>}
          {p.alreadyPassed && !isReview && (
            <Badge tone="emerald"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>
          )}
        </div>
      </div>

      {step === "brief" && (
        <BriefStep
          mission={p.mission}
          worldName={p.world.name}
          checks={p.checks}
          skills={p.skills}
          hasPrimers={p.primers.length > 0}
          hasNewSkills={hasNewSkills}
          predicted={attempt?.predicted ?? null}
          onPredict={(text) => attempt && fetch(`/api/attempts/${attempt.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "predict", text }) })}
          onLearn={() => setStep("learn")}
          onBuild={() => setStep("build")}
        />
      )}

      {step === "learn" && <PrimerStep primers={p.primers} onContinue={() => setStep("build")} />}

      {step === "build" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Editor + output */}
          <div className="flex min-h-[640px] flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[12px] text-fg-3">main.py</span>
              <span className="truncate text-[12.5px] text-fg-3">· {p.mission.objective.length > 110 ? p.mission.objective.slice(0, 110) + "…" : p.mission.objective}</span>
              <span className="ml-auto shrink-0 font-mono text-[10.5px] text-fg-4">{savedAt ? "saved" : isReview ? "repair mode" : "autosave on"}</span>
            </div>
            <div className="min-h-[380px] flex-1">
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
              <span className="ml-auto font-mono text-[11px] text-fg-4">runs {attempt?.runs ?? 0}</span>
            </div>
            <div className="h-[240px]">
              <OutputPanel outcome={outcome} running={running} runnerStatus={runnerStatus} />
            </div>
          </div>

          {/* Right rail: one thing at a time */}
          <div className="flex flex-col gap-3">
            {coached && <ErrorCoachCard coached={coached} onAskTutor={() => document.querySelector<HTMLButtonElement>('[aria-label="Open teaching assistant"]')?.click()} />}
            <div className="panel flex flex-col !p-0">
              <div className="flex border-b border-line" role="tablist" aria-label="Help">
                {(
                  [
                    { id: "checks", label: "Checks", icon: ListChecks, extra: outcome ? `${checksPassed}/${p.checks.length}` : undefined },
                    { id: "hints", label: "Hints", icon: Lightbulb, extra: hintsRevealed ? `${hintsRevealed}/6` : undefined },
                    { id: "concept", label: "Concept", icon: BookOpen, extra: undefined },
                  ] as const
                ).map((t) => (
                  <button key={t.id} role="tab" aria-selected={rail === t.id} onClick={() => setRail(t.id)} className={cn("relative flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 font-display text-[12.5px] font-semibold tracking-wide", rail === t.id ? "text-cyan" : "text-fg-3 hover:text-fg-2")}>
                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                    {t.extra && <span className="readout text-[10px] text-fg-3">{t.extra}</span>}
                    {rail === t.id && <span className="absolute inset-x-3 bottom-0 h-[2px] bg-cyan" />}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {rail === "checks" && (
                  <div>
                    <p className="mb-3 text-[13px] leading-relaxed text-fg-2">{p.mission.objective}</p>
                    <ul className="flex flex-col gap-2">
                      {p.checks.map((c, i) => {
                        const st = outcome?.visible[i]?.status;
                        return (
                          <li key={i} className="flex items-start gap-2 text-[13px]">
                            {st === "pass" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-2" /> : st ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-fg-4" />}
                            <div>
                              <div className={cn(st === "pass" ? "text-fg-3" : "text-fg")}>{c}</div>
                              {st && st !== "pass" && outcome?.visible[i]?.message && <div className="mt-0.5 font-mono text-[11px] text-fg-3">{outcome.visible[i].message}</div>}
                            </div>
                          </li>
                        );
                      })}
                      {outcome && outcome.hidden.total > 0 && (
                        <li className="mt-1 flex items-start gap-2 border-t border-line pt-2 text-[12.5px] text-fg-3">
                          {outcome.hidden.passed === outcome.hidden.total ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-2" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-fg-4" />}
                          <div>
                            Hidden checks {outcome.hidden.passed}/{outcome.hidden.total}
                            {outcome.hidden.firstFailure && <div className="mt-0.5 font-mono text-[11px]">{outcome.hidden.firstFailure}</div>}
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                {rail === "hints" && <HintLadder hints={p.mission.hints} revealed={hintsRevealed} onReveal={reveal} canRevealFull={canRevealFull} fullReason="Available after 3 runs or 10 minutes on this mission." embedded />}
                {rail === "concept" && (
                  <div className="flex flex-col gap-3">
                    {p.anchors.map((a) => (
                      <div key={a.id}>
                        <div className="font-display text-[13.5px] font-semibold text-cyan">{a.anchor}</div>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-3">{a.description}</p>
                      </div>
                    ))}
                    {p.primers.length > 0 && (
                      <button onClick={() => setStep("learn")} className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-cyan hover:underline">
                        <BookOpen className="h-3.5 w-3.5" /> Reopen the primer (free)
                      </button>
                    )}
                    <div className="border-t border-line pt-3">
                      <div className="label mb-1.5">When you finish</div>
                      <ul className="flex flex-col gap-1 text-[12.5px] text-fg-3">
                        {p.mission.onComplete.map((d, i) => (
                          <li key={i}>{d.kind === "layer" ? `${p.world.scene.layers.find((l) => l.id === d.layer)?.label ?? d.layer} → level ${d.level}` : `${d.stat.replace("_", " ")} +${d.add}`}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {completion && <CompletionOverlay result={completion} mission={p.mission} world={p.world} artifactNames={p.artifactNames} reviewMode={isReview} onClose={() => setCompletion(null)} />}
    </div>
  );
}
