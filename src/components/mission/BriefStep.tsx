"use client";

import { ArrowRight, BookOpen, Clock, ListChecks } from "lucide-react";
import type { ClientMission } from "@content/schema";
import { Badge, Button } from "@/components/ui";
import { PredictStep } from "./PredictStep";

export function BriefStep({ mission, worldName, checks, skills, hasPrimers, hasNewSkills, predicted, onPredict, onLearn, onBuild }: {
  mission: ClientMission;
  worldName: string;
  checks: string[];
  skills: { id: string; name: string; isNew: boolean }[];
  hasPrimers: boolean;
  hasNewSkills: boolean;
  predicted: string | null;
  onPredict: (t: string) => void;
  onLearn: () => void;
  onBuild: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <section className="panel hud">
        <div className="flex flex-wrap items-center gap-2">
          <span className="label">{worldName} · {mission.codename}</span>
          {mission.kind === "boss" && <Badge tone="violet">Boss challenge</Badge>}
          <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-fg-3"><Clock className="h-3.5 w-3.5" /> about {mission.estimatedMinutes} min</span>
        </div>
        <h1 className="mt-2 font-display text-[28px] font-semibold leading-tight tracking-wide">{mission.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-fg">{mission.briefing}</p>
      </section>
      <section className="panel">
        <div className="label mb-2">Your objective</div>
        <p className="text-[14px] leading-relaxed text-fg-2">{mission.objective}</p>
        {checks.length > 0 && (
          <>
            <div className="label mb-2 mt-4 flex items-center gap-2"><ListChecks className="h-3.5 w-3.5" /> The checks your code must pass</div>
            <ul className="flex flex-col gap-1.5">
              {checks.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[13.5px] text-fg">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" /> {c}
                </li>
              ))}
              <li className="flex items-start gap-2 text-[12.5px] text-fg-3"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-fg-4" /> plus hidden checks that confirm the behaviour holds in edge cases</li>
            </ul>
          </>
        )}
      </section>
      <section className="panel !py-4">
        <div className="label mb-2">Concepts in play</div>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <Badge key={s.id} tone={s.isNew ? "amber" : "neutral"}>{s.name}{s.isNew ? " · new" : ""}</Badge>
          ))}
        </div>
        {hasNewSkills && <p className="mt-2 text-[12.5px] text-fg-3">A concept here is new to you. The Learn step introduces it with snippets you can run, at no hint cost.</p>}
      </section>
      {mission.predictPrompt && <PredictStep prompt={mission.predictPrompt} initial={predicted} onCommit={onPredict} />}
      <div className="flex flex-wrap items-center gap-2">
        {hasPrimers && (
          <Button onClick={onLearn} variant={hasNewSkills ? "primary" : "secondary"}>
            <BookOpen className="h-4 w-4" /> {hasNewSkills ? "Learn the concept first" : "Refresh the concept"}
          </Button>
        )}
        <Button onClick={onBuild} variant={hasNewSkills && hasPrimers ? "secondary" : "primary"}>
          Start building <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
