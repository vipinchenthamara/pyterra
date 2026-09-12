import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { getSnapshot } from "@/server/state";
import { WorldMap } from "@/components/dashboard/WorldMap";
import { SessionSelector } from "@/components/dashboard/SessionSelector";
import { Briefing } from "@/components/dashboard/Briefing";
import { SkillHealth } from "@/components/dashboard/SkillHealth";
import { WhatYouBuilt } from "@/components/dashboard/WhatYouBuilt";
import { SystemEvents } from "@/components/dashboard/SystemEvents";
import { Button, Badge } from "@/components/ui";
import { operationalLine } from "@/engine/voice";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const session = Number(sp.session) || undefined;
  const snapshot = getSnapshot({ sessionMinutes: session });
  const nodes = snapshot.worlds.map((w) => ({ id: w.world.id, order: w.world.order, name: w.world.name, codename: w.world.codename, pct: w.computed.operationalPct, visual: w.visual, accent: w.world.accent }));
  const next = snapshot.next;
  const current = snapshot.profile.lastWorldId ?? next?.mission.worldId ?? null;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      {/* Hero + map */}
      <section className="panel hud relative overflow-hidden p-6 md:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="max-w-md shrink-0">
            <h1 className="font-display text-[34px] font-semibold leading-[1.05] tracking-wide">
              Architect Online.
              <br />
              <span className="text-fg-2">Your world is </span>
              <span className="glow-cyan text-cyan">{snapshot.overallPct}%</span>
              <span className="text-fg-2"> operational.</span>
            </h1>
            <p className="sr-only">{operationalLine(snapshot.overallPct)}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {next ? (
                <Link href={`/missions/${next.mission.id}`}>
                  <Button>
                    Continue Mission <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Badge tone="emerald">All authored worlds complete</Badge>
              )}
              <Suspense>
                <SessionSelector />
              </Suspense>
            </div>
            {next && (
              <div className="mt-4 rounded-lg border border-line bg-bg-deep/60 px-3.5 py-3">
                <div className="label !text-[0.6rem]">Recommended next</div>
                <div className="mt-1 font-display text-[15px] font-semibold text-fg">{next.mission.title}</div>
                <div className="mt-0.5 text-[12.5px] text-fg-3">
                  {next.worldName} · about {next.mission.estimatedMinutes} minutes · {next.mission.kind === "boss" ? "boss challenge" : `${next.mission.codename}`}
                </div>
                {next.unlocksLine && <div className="mt-1.5 text-[12.5px] text-amber-2">{next.unlocksLine}</div>}
              </div>
            )}
            {snapshot.maintenanceLine && <p className="mt-3 text-[12.5px] text-amber-2/90">{snapshot.maintenanceLine}</p>}
            <p className="mt-6 font-display text-[12.5px] italic text-fg-3">“Code turns ideas into worlds.” — You</p>
          </div>
          <div className="min-w-0 flex-1">
            <WorldMap nodes={nodes} currentId={current} />
          </div>
        </div>
      </section>

      {/* Row of four */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Briefing snapshot={snapshot} />
        <SkillHealth snapshot={snapshot} />
        <WhatYouBuilt snapshot={snapshot} />
        <SystemEvents snapshot={snapshot} />
      </section>
    </div>
  );
}
