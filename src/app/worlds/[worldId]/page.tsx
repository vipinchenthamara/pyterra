import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Circle, Lock, Clock, Boxes, Wrench } from "lucide-react";
import { getSkill, getWorld, missionsForWorld } from "@content/registry";
import { getSnapshot } from "@/server/state";
import * as repo from "@/db/repos";
import { ArtScene } from "@/components/world/ArtScene";
import { artForWorld } from "@/server/art";
import { Badge, Button, ProgressBar, type Tone } from "@/components/ui";
import { HEALTH_TONE } from "@/components/dashboard/SkillHealth";
import { HEALTH_LABEL } from "@/engine/mastery";
import { missionUnlocked } from "@/engine/worldState";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const ACCENT_TONE: Record<string, Tone> = { cyan: "cyan", violet: "violet", amber: "amber", emerald: "emerald", rose: "rose", orange: "orange", sky: "sky" };

export default async function WorldPage({ params, searchParams }: PageProps<"/worlds/[worldId]">) {
  const { worldId } = await params;
  const sp = await searchParams;
  const tab = (typeof sp.tab === "string" ? sp.tab : "missions") as "missions" | "about" | "skills" | "gallery";
  const world = getWorld(worldId);
  if (!world) notFound();
  const s = getSnapshot();
  const wv = s.worlds.find((w) => w.world.id === world.id)!;
  const passed = repo.passedMissionIds();
  const missions = missionsForWorld(world.id);
  const boss = missions.find((m) => m.kind === "boss");
  const tone = ACCENT_TONE[world.accent] ?? "cyan";
  const locked = !wv.computed.unlocked;
  const prereqNames = world.unlockedBy.map((id) => getWorld(id)?.name ?? id);
  const skills = world.skillIds.map((id) => s.skills.find((x) => x.skillId === id)!).filter(Boolean);
  const artifacts = s.artifacts.filter((a) => a.worldId === world.id);
  const dueHere = s.reviewsDue.filter((r) => missions.some((m) => m.id === r.missionId));
  const stats = wv.computed.stats;
  const nextWorld = s.worlds.find((w) => w.world.unlockedBy.includes(world.id));
  const art = artForWorld(world.id);

  const TABS = ["missions", "about", "skills", "gallery"] as const;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5">
      <Link href="/worlds" className="font-mono text-[11.5px] uppercase tracking-wider text-fg-3 hover:text-cyan">‹ Worlds</Link>

      {/* Hero */}
      <section className="panel hud grid grid-cols-1 gap-0 overflow-hidden !p-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="relative min-h-[340px] bg-bg-deep">
          <ArtScene world={world} art={art} operationalPct={wv.computed.operationalPct} layers={wv.computed.layers} locked={locked} parallax className="h-full w-full" />
          <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2 rounded-lg border border-line bg-bg-deep/80 p-3 backdrop-blur md:grid-cols-4">
            <Metric label="Operational" value={`${wv.computed.operationalPct}%`} />
            <Metric label="Structures" value={String(Object.values(wv.computed.layers).filter((l) => l > 0).length)} sub={`/ ${world.scene.layers.length}`} />
            <Metric label="Integrity" value={`${Math.min(100, stats.data_integrity ?? stats.security ?? stats.power ?? 0)}%`} />
            <Metric label="Citizens" value={(stats.citizens ?? 0).toLocaleString()} />
          </div>
        </div>
        <div className="flex flex-col gap-4 p-6 md:p-8">
          <div className="flex items-center gap-2">
            <Badge tone={tone}>{world.codename}</Badge>
            {locked ? <Badge tone="violet"><Lock className="h-3 w-3" /> Signal lost</Badge> : wv.computed.operationalPct >= 100 ? <Badge tone="emerald">Operational</Badge> : <Badge tone="amber">Under construction</Badge>}
            {wv.fragileSkills.length > 0 && <Badge tone="rose"><Wrench className="h-3 w-3" /> Needs repair</Badge>}
          </div>
          <div>
            <h1 className="font-display text-[30px] font-semibold leading-tight tracking-wide">
              World {world.order}: {world.name}
            </h1>
            <p className={cn("font-display text-[15px]", `text-${world.accent === "cyan" ? "cyan" : world.accent === "violet" ? "violet-2" : world.accent === "amber" ? "amber-2" : world.accent === "emerald" ? "emerald-2" : world.accent}`)}>{world.tagline}</p>
          </div>
          <p className="text-[13.5px] leading-relaxed text-fg-2">{world.builds}</p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((sk) => (
              <Link key={sk.skillId} href={`/skills#${sk.skillId}`}>
                <Badge tone={sk.timesPracticed > 0 ? HEALTH_TONE[sk.health] : "neutral"}>{sk.name}</Badge>
              </Link>
            ))}
          </div>
          {locked ? (
            <div className="rounded-lg border border-violet/30 bg-violet/5 px-3.5 py-3 text-[13px] text-fg-2">
              Unlock rule: <span className="text-fg">{prereqNames.join(" and ")}</span> must be 100% operational.
              {world.status === "locked-preview" && <span className="block text-fg-3">Missions for this district arrive in a later milestone.</span>}
            </div>
          ) : (
            wv.nextMissionId && (
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/missions/${wv.nextMissionId}`}>
                  <Button>
                    Continue Mission <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/worlds/${world.id}/arrive`} className="font-mono text-[11px] uppercase tracking-wider text-fg-3 hover:text-cyan">Read the arrival briefing</Link>
              </div>
            )
          )}
          <nav className="mt-auto flex gap-1 border-b border-line" aria-label="World sections">
            {TABS.map((t) => (
              <Link key={t} href={`/worlds/${world.id}?tab=${t}`} className={cn("relative px-3 py-2 font-display text-[13.5px] font-semibold capitalize tracking-wide", tab === t ? "text-cyan" : "text-fg-3 hover:text-fg-2")}>
                {t}
                {tab === t && <span className="absolute inset-x-2 -bottom-px h-[2px] bg-cyan" />}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3">
          {tab === "missions" && (
            <>
              {missions.length === 0 && <div className="panel text-[13.5px] text-fg-3">No missions authored yet for this district.</div>}
              {missions
                .filter((m) => m.kind !== "boss")
                .map((m) => {
                  const done = passed.has(m.id);
                  const unlocked = !locked && missionUnlocked(m, passed);
                  const isNext = m.id === wv.nextMissionId;
                  return (
                    <Link
                      key={m.id}
                      href={unlocked ? `/missions/${m.id}` : "#"}
                      aria-disabled={!unlocked}
                      className={cn("panel flex items-center gap-4 !p-4 transition-colors", unlocked ? "hover:border-line-2" : "cursor-not-allowed opacity-60", isNext && "border-emerald/40 shadow-glow-emerald")}
                    >
                      {done ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-2" /> : unlocked ? <Circle className={cn("h-6 w-6 shrink-0", isNext ? "text-emerald-2" : "text-fg-3")} /> : <Lock className="h-6 w-6 shrink-0 text-fg-4" />}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="readout text-[11px] text-fg-3">{m.codename}</span>
                          <span className="font-display text-[15px] font-semibold tracking-wide text-fg">{m.title}</span>
                          <Badge tone="neutral" className="hidden sm:inline-flex">{m.kind.replace("-", " ")}</Badge>
                        </div>
                        <div className="mt-0.5 truncate text-[12.5px] text-fg-3">{m.objective}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 font-mono text-[11px] text-fg-3">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {m.estimatedMinutes}m</span>
                        <ArrowRight className={cn("h-4 w-4", unlocked ? "text-cyan" : "text-fg-4")} />
                      </div>
                    </Link>
                  );
                })}
              {boss && (
                <BossCard
                  boss={boss}
                  done={passed.has(boss.id)}
                  unlocked={!locked && missionUnlocked(boss, passed)}
                  missing={boss.prerequisites.filter((p) => !passed.has(p)).map((id) => missions.find((m) => m.id === id)?.title ?? id)}
                  nextWorldName={nextWorld?.world.name}
                />
              )}
            </>
          )}
          {tab === "about" && (
            <div className="panel flex flex-col gap-4">
              <div>
                <div className="label mb-1.5">Arrival</div>
                <p className="text-[14px] leading-relaxed text-fg">{world.arrivalScene}</p>
              </div>
              <div>
                <div className="label mb-1.5">What you build</div>
                <p className="text-[13.5px] leading-relaxed text-fg-2">{world.builds}</p>
              </div>
              <div>
                <div className="label mb-1.5">Structures</div>
                <ul className="grid grid-cols-2 gap-1.5 text-[12.5px] sm:grid-cols-3">
                  {world.scene.layers.map((l) => (
                    <li key={l.id} className="flex items-center gap-2 text-fg-2">
                      <span className={cn("h-1.5 w-1.5 rounded-full", (wv.computed.layers[l.id] ?? 0) > 0 ? "bg-cyan" : "bg-fg-4")} /> {l.label}
                      <span className="readout ml-auto text-[10.5px] text-fg-4">{wv.computed.layers[l.id] ?? 0}/{l.maxLevel}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {world.quote && <p className="font-display text-[13px] italic text-fg-3">“{world.quote}”</p>}
            </div>
          )}
          {tab === "skills" && (
            <div className="panel flex flex-col gap-3">
              {skills.map((sk) => (
                <div key={sk.skillId} className="flex items-center gap-3">
                  <div className="w-44 shrink-0">
                    <Link href={`/skills#${sk.skillId}`} className="text-[13.5px] font-medium text-fg hover:text-cyan">{sk.name}</Link>
                    <div className="font-mono text-[11px] italic text-fg-3">{sk.anchor}</div>
                  </div>
                  <ProgressBar value={sk.mastery} tone={HEALTH_TONE[sk.health]} className="flex-1" />
                  <Badge tone={HEALTH_TONE[sk.health]} className="w-28 justify-center">{HEALTH_LABEL[sk.health]}</Badge>
                </div>
              ))}
            </div>
          )}
          {tab === "gallery" && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {artifacts.length === 0 && <div className="panel text-[13.5px] text-fg-3">No artifacts declared for this district yet.</div>}
              {artifacts.map((a) => (
                <div key={a.id} className={cn("panel flex flex-col gap-2 !p-4", !a.unlocked && "opacity-60")}>
                  <div className="flex items-center gap-2">
                    <Boxes className={cn("h-4 w-4", a.unlocked ? "text-violet-2" : "text-fg-4")} />
                    <span className="font-display text-[14px] font-semibold">{a.name}</span>
                    <Badge tone={a.unlocked ? "violet" : "neutral"} className="ml-auto">{a.unlocked ? "built" : `${a.missingMissionIds.length} missions away`}</Badge>
                  </div>
                  <p className="text-[12.5px] text-fg-2">{a.description}</p>
                  {a.unlocked && <Link href="/builds" className="font-mono text-[11px] uppercase tracking-wider text-cyan">View in Builds →</Link>}
                </div>
              ))}
              <div className="panel md:col-span-2">
                <div className="label mb-2">Snapshot</div>
                <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-bg-deep">
                  <ArtScene world={world} art={art} operationalPct={wv.computed.operationalPct} layers={wv.computed.layers} locked={locked} className="h-full w-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right rail */}
        <aside className="flex flex-col gap-4">
          {dueHere.length > 0 && (
            <div className="rounded-[14px] border border-amber/30 bg-amber/5 p-4">
              <div className="mb-2 flex items-center gap-2 font-display text-[14px] font-semibold"><Wrench className="h-4 w-4 text-amber-2" /> Maintenance due</div>
              {dueHere.map((r) => (
                <Link key={r.id} href={`/review/${r.id}`} className="flex items-center justify-between py-1 text-[13px] text-fg-2 hover:text-amber-2">
                  <span>{r.skillName} recall</span>
                  <span className="font-mono text-[11px]">~3 min →</span>
                </Link>
              ))}
            </div>
          )}
          <div className="panel !p-4">
            <div className="mb-3 font-display text-[14px] font-semibold tracking-wide">Memory Anchors</div>
            <ul className="flex flex-col gap-3">
              {world.skillIds.map((id) => {
                const sk = getSkill(id);
                return (
                  <li key={id} className="flex items-start gap-2.5">
                    <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-sm", passed.size && skills.find((x) => x.skillId === id)?.timesPracticed ? "bg-cyan" : "bg-fg-4")} />
                    <div>
                      <div className="font-display text-[13px] font-semibold text-fg">{sk.anchor}</div>
                      <div className="text-[12px] text-fg-3">{sk.description}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="panel !p-4">
            <div className="label mb-2">District status</div>
            <StatusRow label="Structures" value={Object.values(wv.computed.layers).filter((l) => l > 0).length} max={world.scene.layers.length} tone={tone} />
            <StatusRow label="Missions" value={wv.passedCount} max={wv.missionCount} tone={tone} />
            <StatusRow label="Systems online" value={stats.systems_online ?? 0} max={Math.max(stats.systems_online ?? 0, 3)} tone={tone} />
            <StatusRow label="Data integrity" value={Math.min(100, stats.data_integrity ?? 0)} max={100} tone={tone} />
          </div>
          {world.quote && <p className="px-2 font-display text-[13px] italic leading-relaxed text-fg-3">“{world.quote}”</p>}
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="label !text-[0.56rem]">{label}</div>
      <div className="readout font-display text-[18px] font-semibold text-fg">
        {value} {sub && <span className="text-[11px] text-fg-3">{sub}</span>}
      </div>
    </div>
  );
}

function StatusRow({ label, value, max, tone }: { label: string; value: number; max: number; tone: Tone }) {
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex justify-between font-mono text-[11px] text-fg-3">
        <span>{label}</span>
        <span className="text-fg-2">{max === 100 ? `${value}%` : `${value}/${max}`}</span>
      </div>
      <ProgressBar value={max ? (value / max) * 100 : 0} tone={tone} />
    </div>
  );
}

function BossCard({ boss, done, unlocked, missing, nextWorldName }: { boss: { id: string; title: string; estimatedMinutes: number; objective: string }; done: boolean; unlocked: boolean; missing: string[]; nextWorldName?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[14px] border p-4", unlocked ? "border-violet/50 bg-violet/5 shadow-glow-violet" : "border-line bg-panel", done && "border-emerald/40")}>
      <div className="flex items-center gap-4">
        {done ? <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-2" /> : unlocked ? <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet/20 text-violet-2">★</span> : <Lock className="h-7 w-7 shrink-0 text-fg-4" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone="violet">Boss challenge</Badge>
            <span className="font-display text-[16px] font-semibold tracking-wide text-fg">{boss.title}</span>
          </div>
          <div className="mt-0.5 text-[12.5px] text-fg-3">{done ? "Cleared. The district is fully operational." : unlocked ? `Multi-concept. Minimal hints. About ${boss.estimatedMinutes} minutes.${nextWorldName ? ` Clearing it unlocks ${nextWorldName}.` : ""}` : `Unlock rule: complete ${missing.join(", ")}.`}</div>
        </div>
        {unlocked && !done && (
          <Link href={`/missions/${boss.id}`}>
            <Button variant="secondary">Enter <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        )}
        {done && (
          <Link href={`/missions/${boss.id}`} className="font-mono text-[11px] uppercase tracking-wider text-fg-3 hover:text-cyan">Replay</Link>
        )}
      </div>
    </div>
  );
}
