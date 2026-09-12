import { Badge, Panel, ProgressBar, type Tone } from "@/components/ui";
import { HEALTH_LABEL, type SkillHealth } from "@/engine/mastery";
import { getSnapshot, type SkillView } from "@/server/state";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const HEALTH_TONE: Record<SkillHealth, Tone> = { dormant: "neutral", fragile: "amber", developing: "sky", stable: "emerald", mastered: "cyan" };

const DIMS: { key: "understanding" | "recall" | "application" | "independence"; short: string; name: string; what: string }[] = [
  { key: "understanding", short: "U", name: "Understanding", what: "Can you explain why it works? Moves when you pass with few runs and few hints." },
  { key: "recall", short: "R", name: "Recall", what: "Can you reproduce it later? Moves on spaced repairs; decays 1 point a day after 3 idle days." },
  { key: "application", short: "A", name: "Application", what: "Can you use it in a new context? Moves on every mission that exercises the skill." },
  { key: "independence", short: "I", name: "Independence", what: "Can you do it without hints? Rises on zero-hint passes, drops when hints exceed four." },
];

function relativeTime(iso: string, nowIso: string): string {
  const diffMs = new Date(iso).getTime() - new Date(nowIso).getTime();
  if (diffMs <= 0) return "due now";
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 14) return `in ${days} ${days === 1 ? "day" : "days"}`;
  const weeks = Math.round(days / 7);
  return `in ${weeks} ${weeks === 1 ? "week" : "weeks"}`;
}

function SkillRow({ skill, nowIso }: { skill: SkillView; nowIso: string }) {
  const dormant = skill.health === "dormant";
  return (
    <article id={skill.skillId} className={cn("panel scroll-mt-20 p-5", dormant && "opacity-55")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-[16px] font-semibold tracking-wide">{skill.name}</h3>
            <Badge tone={HEALTH_TONE[skill.health]}>{HEALTH_LABEL[skill.health]}</Badge>
          </div>
          <p className="mt-1 font-mono text-[12.5px] italic text-fg-3">{skill.anchor}</p>
          <dl className="mt-3 grid grid-cols-4 gap-3">
            {DIMS.map((d) => (
              <div key={d.key}>
                <div className="mb-1 flex items-baseline justify-between font-mono text-[11px]">
                  <dt className="text-fg-3" title={d.name}>
                    {d.short}
                  </dt>
                  <dd className="readout text-fg-2">{Math.round(skill[d.key])}</dd>
                </div>
                <ProgressBar value={skill[d.key]} tone={dormant ? "neutral" : HEALTH_TONE[skill.health]} height="h-1" />
              </div>
            ))}
          </dl>
        </div>
        <div className="flex shrink-0 items-center gap-6 md:w-[220px] md:flex-col md:items-end md:gap-2">
          <div className="text-right">
            <div className={cn("readout font-display text-[28px] font-semibold leading-none", dormant ? "text-fg-3" : "text-fg")}>{skill.mastery}</div>
            <div className="label mt-1 !text-[0.6rem]">Mastery</div>
          </div>
          <div className="text-right font-mono text-[11.5px] text-fg-3">
            <div>
              {skill.timesPracticed === 0 ? "not yet practised" : `practised ${skill.timesPracticed}×`}
            </div>
            {skill.nextReviewAt && <div className={cn(relativeTime(skill.nextReviewAt, nowIso) === "due now" && "text-amber-2")}>next repair {relativeTime(skill.nextReviewAt, nowIso)}</div>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SkillsPage() {
  const snapshot = getSnapshot();
  const worldsInOrder = [...snapshot.worlds].sort((a, b) => a.world.order - b.world.order);
  const byWorld = new Map<string | null, SkillView[]>();
  for (const s of snapshot.skills) {
    const list = byWorld.get(s.worldId) ?? [];
    list.push(s);
    byWorld.set(s.worldId, list);
  }
  const groups: { key: string; title: string; codename: string | null; skills: SkillView[] }[] = [];
  for (const w of worldsInOrder) {
    const list = byWorld.get(w.world.id);
    if (list?.length) groups.push({ key: w.world.id, title: w.world.name, codename: w.world.codename, skills: list });
  }
  const unassigned = byWorld.get(null);
  if (unassigned?.length) groups.push({ key: "unassigned", title: "Not yet placed in a world", codename: null, skills: unassigned });

  const practised = snapshot.skills.filter((s) => s.timesPracticed > 0).length;
  const counts = snapshot.skills.reduce<Record<SkillHealth, number>>((acc, s) => ({ ...acc, [s.health]: acc[s.health] + 1 }), { dormant: 0, fragile: 0, developing: 0, stable: 0, mastered: 0 });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 animate-rise">
      <header>
        <h1 className="font-display text-[26px] font-semibold tracking-wide">Skills</h1>
        <p className="mt-1 text-fg-3">Mastery is four things: understanding, recall, application, independence.</p>
      </header>

      <Panel hud>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="label mb-3">How mastery is scored</div>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {DIMS.map((d) => (
                <div key={d.key} className="flex gap-3 text-[13px]">
                  <dt className="readout w-5 shrink-0 font-display font-semibold text-cyan">{d.short}</dt>
                  <dd className="text-fg-2">
                    <span className="font-medium text-fg">{d.name}.</span> {d.what}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 font-mono text-[11.5px] text-fg-3">mastery = 0.3·U + 0.2·R + 0.3·A + 0.2·I</p>
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-[300px] lg:justify-end">
            {(Object.keys(HEALTH_LABEL) as SkillHealth[]).map((h) => (
              <Badge key={h} tone={HEALTH_TONE[h]}>
                {HEALTH_LABEL[h]} <span className="readout opacity-80">{counts[h]}</span>
              </Badge>
            ))}
            <span className="mt-1 w-full text-right font-mono text-[11.5px] text-fg-3">
              {practised} of {snapshot.skills.length} skills practised
            </span>
          </div>
        </div>
      </Panel>

      {groups.map((g) => (
        <section key={g.key} aria-labelledby={`world-${g.key}`}>
          <div className="mb-4 flex items-baseline gap-3">
            {g.codename && <span className="font-mono text-[12px] text-cyan">{g.codename}</span>}
            <h2 id={`world-${g.key}`} className="font-display text-[15px] font-semibold tracking-wide">
              {g.title}
            </h2>
            <span className="font-mono text-[11.5px] text-fg-4">{g.skills.length} skills</span>
          </div>
          <div className="flex flex-col gap-3">
            {g.skills.map((s) => (
              <SkillRow key={s.skillId} skill={s} nowIso={snapshot.now} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
