"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Trophy, Boxes, Sparkles } from "lucide-react";
import type { CompletionResult } from "@/server/complete";
import type { ClientMission, World } from "@content/schema";
import { Button, Badge } from "@/components/ui";
import { WorldScene } from "@/components/world/WorldScene";
import { cn } from "@/lib/cn";

export function CompletionOverlay({ result, mission, world, artifactNames, onClose, reviewMode }: { result: CompletionResult; mission: ClientMission; world: Pick<World, "id" | "name" | "accent" | "scene">; artifactNames: Record<string, string>; onClose: () => void; reviewMode: boolean }) {
  const [choice, setChoice] = useState<number | null>(null);
  const ew = mission.explainWhy;
  const nextHref = result.nextMissionId ? `/missions/${result.nextMissionId}` : result.worldUnlocked ? `/worlds/${result.worldUnlocked}` : `/worlds/${world.id}`;
  const nextLabel = result.nextMissionId ? "Continue to next mission" : result.worldUnlocked ? "Enter the next world" : "Back to the world";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-deep/80 p-4 backdrop-blur-sm" role="dialog" aria-modal aria-label="Mission complete">
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }} className="panel hud w-full max-w-4xl overflow-hidden !p-0">
        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
          <div className="relative min-h-[260px] bg-bg-deep">
            <WorldScene world={world} layers={result.worldAfter.layers} previousLayers={result.worldBefore.layers} className="h-full w-full" showLabels={false} />
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <Badge tone="cyan">{world.name}</Badge>
              <span className="readout text-[12px] text-fg-2">
                {result.worldBefore.operationalPct}% → <span className="text-cyan">{result.worldAfter.operationalPct}%</span> operational
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <div>
              <div className="flex items-center gap-2 text-amber-2">
                <Trophy className="h-5 w-5" />
                <span className="readout font-display text-[22px] font-semibold">+{result.xpGained} XP</span>
                {result.alreadyPassed && <Badge tone="neutral">re-run</Badge>}
              </div>
              <h2 className="mt-1 font-display text-[22px] font-semibold tracking-wide">{reviewMode ? "Repair complete." : `${mission.title} complete.`}</h2>
              {result.statements.map((s, i) => (
                <p key={i} className="mt-1 text-[13.5px] text-fg-2">{s}</p>
              ))}
            </div>
            {result.skillChanges.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {result.skillChanges.map((c) => (
                  <li key={c.skillId} className="flex items-center gap-2 text-[13px]">
                    <span className="w-36 truncate text-fg-2">{c.name}</span>
                    <span className="readout text-fg-3">{c.before}</span>
                    <ArrowRight className="h-3 w-3 text-fg-4" />
                    <span className={cn("readout", c.after > c.before ? "text-cyan" : "text-fg-2")}>{c.after}</span>
                    <Badge tone={c.health === "fragile" ? "amber" : c.health === "stable" ? "emerald" : c.health === "mastered" ? "cyan" : "sky"} className="ml-auto">{c.health}</Badge>
                  </li>
                ))}
              </ul>
            )}
            {result.newArtifacts.length > 0 && (
              <div className="rounded-lg border border-violet/30 bg-violet/5 px-3 py-2.5">
                <div className="flex items-center gap-2 text-violet-2">
                  <Boxes className="h-4 w-4" />
                  <span className="font-display text-[13.5px] font-semibold">New build unlocked</span>
                </div>
                {result.newArtifacts.map((a) => (
                  <div key={a} className="mt-0.5 text-[13px] text-fg">{artifactNames[a] ?? a}</div>
                ))}
              </div>
            )}
            {result.worldUnlocked && (
              <div className="rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-2.5 text-[13px] text-cyan">
                <Sparkles className="mr-1.5 inline h-4 w-4" />
                A new district is reachable.
              </div>
            )}
            {ew && !reviewMode && (
              <div className="panel-inset p-3">
                <div className="label mb-1.5 !text-[0.58rem]">Explain why</div>
                <p className="text-[13px] text-fg">{ew.question}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {ew.options.map((o, i) => {
                    const picked = choice === i;
                    const correct = i === ew.correctIndex;
                    return (
                      <li key={i}>
                        <button
                          disabled={choice !== null}
                          onClick={() => setChoice(i)}
                          className={cn(
                            "w-full rounded-md border px-2.5 py-1.5 text-left text-[12.5px] transition-colors",
                            choice === null ? "border-line hover:border-cyan/50" : picked && correct ? "border-emerald/60 bg-emerald/10 text-emerald-2" : picked ? "border-rose/60 bg-rose/10 text-rose" : correct ? "border-emerald/40 text-fg-2" : "border-line opacity-60",
                          )}
                        >
                          {o}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {choice !== null && <p className="mt-2 text-[12.5px] text-fg-2">{ew.explanation}</p>}
              </div>
            )}
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
              <Link href={nextHref}>
                <Button>
                  {nextLabel} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" onClick={onClose}>Stay here</Button>
              <Link href="/" className="ml-auto font-mono text-[11px] uppercase tracking-wider text-fg-3 hover:text-cyan">Dashboard</Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
