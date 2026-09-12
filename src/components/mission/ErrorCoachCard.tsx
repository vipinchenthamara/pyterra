"use client";

import { ShieldAlert, Sparkles } from "lucide-react";
import type { CoachedError } from "@/engine/errorCoach";

export function ErrorCoachCard({ coached, onAskTutor }: { coached: CoachedError; onAskTutor: () => void }) {
  if (coached.source === "none") return null;
  return (
    <div className="rounded-[14px] border border-rose/30 bg-rose/5 p-4 animate-rise">
      <div className="mb-1.5 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-rose" />
        <h3 className="font-display text-[14px] font-semibold tracking-wide text-fg">{coached.title}</h3>
        {coached.line && <span className="readout ml-auto text-[11px] text-rose">line {coached.line}</span>}
      </div>
      <p className="text-[13px] leading-relaxed text-fg-2">{coached.explanation}</p>
      <button onClick={onAskTutor} className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-fg-3 hover:text-cyan">
        <Sparkles className="h-3.5 w-3.5" /> Ask Claude why
      </button>
    </div>
  );
}
