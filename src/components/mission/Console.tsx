"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Lock } from "lucide-react";
import type { RunOutcome } from "@/engine/runner/protocol";
import { cn } from "@/lib/cn";

export function OutputPanel({ outcome, running, runnerStatus }: { outcome: RunOutcome | null; running: boolean; runnerStatus: string }) {
  const [tab, setTab] = useState<"output" | "tests">("output");
  const visible = outcome?.visible ?? [];
  const hidden = outcome?.hidden;
  const passedCount = visible.filter((t) => t.status === "pass").length + (hidden?.passed ?? 0);
  const total = visible.length + (hidden?.total ?? 0);
  return (
    <div className="panel flex h-full min-h-[220px] flex-col overflow-hidden !p-0">
      <div className="flex items-center border-b border-line px-2">
        {(["output", "tests"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("relative px-3 py-2.5 font-display text-[13px] font-semibold capitalize tracking-wide", tab === t ? "text-cyan" : "text-fg-3 hover:text-fg-2")}
          >
            {t}
            {t === "tests" && outcome && (
              <span className={cn("ml-1.5 readout text-[10.5px]", outcome.passed ? "text-emerald-2" : "text-amber-2")}>
                {passedCount}/{total}
              </span>
            )}
            {tab === t && <span className="absolute inset-x-2 bottom-0 h-[2px] bg-cyan" />}
          </button>
        ))}
        <span className="label ml-auto pr-3 !text-[0.58rem]">
          {running ? <span className="text-amber-2">running…</span> : runnerStatus === "loading" ? <span className="text-amber-2">loading python…</span> : runnerStatus === "ready" ? <span className="text-emerald-2">python 3.14 · ready</span> : runnerStatus}
        </span>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {tab === "output" ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-fg-2">
            {outcome === null && <span className="text-fg-4">Press Run (⌘⏎) to execute your code.</span>}
            {outcome?.stdout}
            {outcome?.stderr && <span className="text-rose">{outcome.stderr}</span>}
            {outcome?.error && <span className="text-rose">{outcome.error}</span>}
            {outcome && !outcome.stdout && !outcome.error && !outcome.stderr && <span className="text-fg-4">(no output)</span>}
            {outcome && (
              <span className="mt-2 block text-[11px] text-fg-4">
                — finished in {outcome.durationMs} ms
              </span>
            )}
          </pre>
        ) : (
          <ul className="flex flex-col gap-2">
            {!outcome && <li className="text-[12.5px] text-fg-4">Tests run every time you press Run.</li>}
            {visible.map((t) => (
              <li key={t.id} className="flex items-start gap-2 text-[13px]">
                {t.status === "pass" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-2" /> : t.status === "fail" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-2" />}
                <div>
                  <div className={cn(t.status === "pass" ? "text-fg-2" : "text-fg")}>{t.name}</div>
                  {t.status !== "pass" && <div className="font-mono text-[11.5px] text-fg-3">{t.message}</div>}
                </div>
              </li>
            ))}
            {hidden && hidden.total > 0 && (
              <li className="mt-1 flex items-start gap-2 border-t border-line pt-2 text-[13px]">
                <Lock className={cn("mt-0.5 h-4 w-4 shrink-0", hidden.passed === hidden.total ? "text-emerald-2" : "text-fg-3")} />
                <div>
                  <div className="text-fg-2">
                    Hidden checks <span className="readout text-[11.5px] text-fg-3">{hidden.passed}/{hidden.total}</span>
                  </div>
                  {hidden.firstFailure && <div className="font-mono text-[11.5px] text-fg-3">{hidden.firstFailure}</div>}
                </div>
              </li>
            )}
            {outcome && !outcome.executed && <li className="text-[12.5px] text-rose">Tests did not run: the code raised before it finished loading.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
