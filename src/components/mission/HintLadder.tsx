"use client";

import { Lightbulb, Lock, ChevronRight } from "lucide-react";
import type { HintLadder as Ladder } from "@content/schema";
import { cn } from "@/lib/cn";

const LEVEL_NAMES = ["Nudge", "Concept", "Example", "Shape", "Partial code", "Full walkthrough"];

export function HintLadder({ hints, revealed, onReveal, canRevealFull, fullReason }: { hints: Ladder; revealed: number; onReveal: (level: number) => void; canRevealFull: boolean; fullReason: string }) {
  return (
    <div className="panel !p-4">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-amber-2" />
        <h3 className="font-display text-[14px] font-semibold tracking-wide">Hints</h3>
        <span className="label ml-auto !text-[0.58rem]">{revealed}/6 used</span>
      </div>
      <ol className="flex flex-col gap-2">
        {hints.map((h, i) => {
          const level = i + 1;
          const isRevealed = level <= revealed;
          const isNext = level === revealed + 1;
          const isFull = level === 6;
          const locked = !isRevealed && !isNext;
          return (
            <li key={level} className={cn("rounded-lg border px-3 py-2.5 transition-colors", isRevealed ? "border-line bg-bg-deep/60" : isNext ? "border-line-2 bg-panel-2" : "border-transparent opacity-50")}>
              <div className="flex items-center gap-2">
                <span className={cn("readout text-[11px]", isRevealed ? "text-amber-2" : "text-fg-4")}>0{level}</span>
                <span className="text-[12.5px] font-medium text-fg-2">{LEVEL_NAMES[i]}</span>
                {locked && <Lock className="ml-auto h-3.5 w-3.5 text-fg-4" />}
                {isNext && (
                  <button
                    onClick={() => {
                      if (isFull) {
                        if (!canRevealFull) return;
                        if (!window.confirm("Reveal the complete solution? This counts as all six hints and lowers the independence score for this skill.")) return;
                      }
                      onReveal(level);
                    }}
                    disabled={isFull && !canRevealFull}
                    title={isFull && !canRevealFull ? fullReason : undefined}
                    className="ml-auto flex items-center gap-1 rounded-md border border-amber/40 bg-amber/10 px-2 py-1 font-mono text-[10.5px] uppercase tracking-wider text-amber-2 hover:bg-amber/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reveal <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              {isRevealed && <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-fg">{h}</p>}
              {isNext && isFull && !canRevealFull && <p className="mt-1 text-[11.5px] text-fg-3">{fullReason}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
