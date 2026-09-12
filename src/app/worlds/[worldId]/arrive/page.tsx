import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Target, Boxes, BookOpen } from "lucide-react";
import { getSkill, getWorld, missionsForWorld } from "@content/registry";
import { getSnapshot } from "@/server/state";
import * as repo from "@/db/repos";
import { WorldScene } from "@/components/world/WorldScene";
import { EnterDistrictButton } from "@/components/world/EnterDistrictButton";
import { Badge, type Tone } from "@/components/ui";

export const dynamic = "force-dynamic";

const ACCENT_TONE: Record<string, Tone> = { cyan: "cyan", violet: "violet", amber: "amber", emerald: "emerald", rose: "rose", orange: "orange", sky: "sky" };

/**
 * World arrival: shown the first time the learner steps into a district (and any time from the world page).
 * Answers three questions before any code: why this world exists, what you will learn, what you will build.
 */
export default async function ArrivePage({ params }: PageProps<"/worlds/[worldId]/arrive">) {
  const { worldId } = await params;
  const world = getWorld(worldId);
  if (!world) notFound();
  const s = getSnapshot();
  const wv = s.worlds.find((w) => w.world.id === world.id)!;
  const passed = repo.passedMissionIds();
  const missions = missionsForWorld(world.id);
  const first = wv.nextMissionId ?? missions[0]?.id;
  const skills = world.skillIds.map((id) => getSkill(id));
  const totalMinutes = missions.reduce((a, m) => a + m.estimatedMinutes, 0);
  const tone = ACCENT_TONE[world.accent] ?? "cyan";
  const locked = !wv.computed.unlocked;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <Link href="/worlds" className="font-mono text-[11.5px] uppercase tracking-wider text-fg-3 hover:text-cyan">‹ Worlds</Link>

      <section className="panel hud overflow-hidden !p-0">
        <div className="relative aspect-[21/9] w-full bg-bg-deep">
          <WorldScene world={world} layers={wv.computed.layers} locked={locked} className="h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-panel to-transparent px-8 pb-5 pt-16">
            <div className="flex items-center gap-2">
              <Badge tone={tone}>{world.codename}</Badge>
              <span className="label">Arrival · World {world.order} of 16</span>
            </div>
            <h1 className="mt-2 font-display text-[36px] font-semibold leading-none tracking-wide">{world.name}</h1>
            <p className="mt-1 font-display text-[16px] text-fg-2">{world.tagline}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-6">
            <div>
              <div className="label mb-2">Why you are here</div>
              <p className="text-[15px] leading-relaxed text-fg">{world.arrivalScene}</p>
            </div>
            <div>
              <div className="label mb-2 flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> What you will learn</div>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {skills.map((sk) => (
                  <li key={sk.id} className="panel-inset px-3.5 py-3">
                    <div className="font-display text-[14px] font-semibold text-fg">{sk.name}</div>
                    <div className="mt-0.5 font-mono text-[11.5px] italic text-cyan">{sk.anchor}</div>
                    <div className="mt-1 text-[12.5px] leading-relaxed text-fg-3">{sk.description}</div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12.5px] text-fg-3">Each concept is introduced with a short, free primer right before the first mission that needs it. Hints only cost you after that.</p>
            </div>
            <div>
              <div className="label mb-2 flex items-center gap-2"><Boxes className="h-3.5 w-3.5" /> What you will build</div>
              <p className="text-[14px] leading-relaxed text-fg-2">{world.builds}</p>
              {world.artifacts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {world.artifacts.map((a) => (
                    <Badge key={a.id} tone="violet">{a.name}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="panel-inset p-4">
              <div className="label mb-3 flex items-center gap-2"><Target className="h-3.5 w-3.5" /> The path</div>
              <ol className="flex flex-col gap-2">
                {missions.map((m, i) => (
                  <li key={m.id} className="flex items-center gap-3 text-[13px]">
                    <span className={`readout w-5 text-[11px] ${passed.has(m.id) ? "text-emerald-2" : "text-fg-4"}`}>{m.kind === "boss" ? "★" : String(i + 1).padStart(2, "0")}</span>
                    <span className={passed.has(m.id) ? "text-fg-3 line-through" : "text-fg"}>{m.title}</span>
                    <span className="ml-auto flex items-center gap-1 font-mono text-[10.5px] text-fg-4"><Clock className="h-3 w-3" /> {m.estimatedMinutes}m</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 border-t border-line pt-3 font-mono text-[11px] text-fg-3">About {totalMinutes} minutes across {missions.length} missions. Most take 5 to 12.</div>
            </div>
            <div className="panel-inset p-4 text-[13px] leading-relaxed text-fg-2">
              <div className="label mb-2">How a mission works</div>
              <ol className="list-decimal space-y-1 pl-4">
                <li><span className="text-fg">Brief</span>: the world problem and what your code must do.</li>
                <li><span className="text-fg">Learn</span>: a short primer with snippets you can run, when a concept is new to you.</li>
                <li><span className="text-fg">Build</span>: write Python, press Run, read the tests. Hints are there if you stall.</li>
                <li><span className="text-fg">Done</span>: the district changes, your skill state updates, the next mission unlocks.</li>
              </ol>
            </div>
            {world.quote && <p className="px-1 font-display text-[13px] italic text-fg-3">“{world.quote}”</p>}
            {locked ? (
              <Badge tone="violet" className="w-fit">Locked until {world.unlockedBy.map((id) => getWorld(id)?.name).join(", ")} is 100% operational</Badge>
            ) : first ? (
              <EnterDistrictButton worldId={world.id} href={`/missions/${first}`} label={passed.size && wv.passedCount > 0 ? "Continue the district" : "Enter the district"} />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
