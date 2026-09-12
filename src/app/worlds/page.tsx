import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { getSnapshot } from "@/server/state";
import { WorldMap } from "@/components/dashboard/WorldMap";
import { Badge, ProgressBar, type Tone } from "@/components/ui";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const VISUAL_TONE: Record<string, Tone> = { complete: "cyan", active: "amber", unstable: "rose", available: "cyan", locked: "violet" };
const VISUAL_LABEL: Record<string, string> = { complete: "Operational", active: "Under construction", unstable: "Needs repair", available: "Ready to enter", locked: "Signal lost" };

export default async function WorldsPage() {
  const s = getSnapshot();
  const nodes = s.worlds.map((w) => ({ id: w.world.id, order: w.world.order, name: w.world.name, codename: w.world.codename, pct: w.computed.operationalPct, visual: w.visual, accent: w.world.accent }));
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header>
        <h1 className="font-display text-[26px] font-semibold tracking-wide">Worlds</h1>
        <p className="text-[13.5px] text-fg-3">Sixteen districts. Each one unlocks when the previous is fully operational.</p>
      </header>
      <section className="panel hud p-4">
        <WorldMap nodes={nodes} currentId={s.profile.lastWorldId} />
      </section>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {s.worlds.map((w) => {
          const locked = w.visual === "locked";
          const tone = VISUAL_TONE[w.visual];
          return (
            <Link key={w.world.id} href={`/worlds/${w.world.id}`} className={cn("panel group flex flex-col gap-3 !p-4 transition-colors hover:border-line-2", locked && "opacity-70")}>
              <div className="flex items-center gap-2">
                <span className="readout text-[11px] text-fg-3">{w.world.codename}</span>
                <Badge tone={tone} className="ml-auto">{locked && <Lock className="h-3 w-3" />} {VISUAL_LABEL[w.visual]}</Badge>
              </div>
              <div>
                <div className="font-display text-[17px] font-semibold tracking-wide group-hover:text-cyan">{w.world.name}</div>
                <div className="text-[12.5px] text-fg-3">{w.world.tagline}</div>
              </div>
              <p className="line-clamp-2 text-[12.5px] leading-relaxed text-fg-2">{w.world.builds}</p>
              <div className="mt-auto">
                <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-fg-3">
                  <span>{locked ? "—" : `${w.passedCount}/${w.missionCount} missions`}</span>
                  <span className={locked ? "" : "text-fg-2"}>{locked ? "" : `${w.computed.operationalPct}%`}</span>
                </div>
                <ProgressBar value={locked ? 0 : w.computed.operationalPct} tone={tone} />
              </div>
              {!locked && w.nextMissionId && (
                <span className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-cyan">
                  Continue <ArrowRight className="h-3 w-3" />
                </span>
              )}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
