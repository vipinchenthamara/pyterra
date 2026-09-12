import { NoteEditor } from "@/components/library/NoteEditor";
import { EmptyState, SectionTitle } from "@/components/ui";
import { GENERIC_RULES } from "@/engine/errorCoach";
import { getSnapshot, type SkillView } from "@/server/state";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

/** Display order and labels for skill domains (mirrors content/schema.ts SkillDomain). */
const DOMAIN_LABEL: Record<string, string> = {
  core: "Core language", data: "Data structures", control: "Control flow", functions: "Functions", errors: "Errors", files: "Files",
  network: "Network", oop: "Objects & classes", runtime: "Runtime", async: "Async", services: "Services", deploy: "Deploy", ai: "AI",
};
const DOMAIN_ORDER = Object.keys(DOMAIN_LABEL);

export default function LibraryPage() {
  const snapshot = getSnapshot();
  const byDomain = new Map<string, SkillView[]>();
  for (const s of snapshot.skills) {
    const list = byDomain.get(s.domain) ?? [];
    list.push(s);
    byDomain.set(s.domain, list);
  }
  const domains = [...byDomain.keys()].sort((a, b) => {
    const ia = DOMAIN_ORDER.indexOf(a);
    const ib = DOMAIN_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const practised = snapshot.skills.filter((s) => s.timesPracticed > 0);
  const notes = snapshot.profile.settings.notes ?? {};

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 animate-rise">
      <header>
        <h1 className="font-display text-[26px] font-semibold tracking-wide">Library</h1>
        <p className="mt-1 text-fg-3">Memory anchors, error explanations and your own notes.</p>
      </header>

      <section aria-labelledby="anchors-heading" className="panel p-5">
        <SectionTitle right={<span className="font-mono text-[11.5px] text-fg-3">{practised.length} of {snapshot.skills.length} practised</span>}>
          <span id="anchors-heading">Memory anchors</span>
        </SectionTitle>
        <p className="mb-5 text-[13px] text-fg-3">One-line mental models. A cyan dot marks a skill you have practised at least once.</p>
        <div className="flex flex-col gap-6">
          {domains.map((d) => (
            <div key={d}>
              <div className="label mb-3">{DOMAIN_LABEL[d] ?? d}</div>
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {byDomain.get(d)!.map((s) => {
                  const done = s.timesPracticed > 0;
                  return (
                    <li key={s.skillId} id={s.skillId} className={cn("panel-inset scroll-mt-20 flex gap-3 p-3", !done && "opacity-70")}>
                      <span
                        className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", done ? "bg-cyan shadow-glow-cyan" : "bg-line-2")}
                        aria-label={done ? "practised" : "not yet practised"}
                        role="img"
                      />
                      <div className="min-w-0">
                        <div className="font-display text-[14px] font-semibold tracking-wide">{s.anchor}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-fg-4">{s.name}</div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-fg-2">{s.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="errors-heading" className="panel p-5">
        <SectionTitle right={<span className="font-mono text-[11.5px] text-fg-3">{GENERIC_RULES.length} patterns</span>}>
          <span id="errors-heading">Errors explained</span>
        </SectionTitle>
        <p className="mb-5 text-[13px] text-fg-3">The tracebacks the error coach recognises without any AI, and what each one actually means.</p>
        <ul className="flex flex-col gap-3">
          {GENERIC_RULES.map((r, i) => (
            <li key={i} className="panel-inset p-4">
              <div className="font-display text-[14px] font-semibold tracking-wide">{r.title}</div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-fg-2">{r.explanation}</p>
              <code className="mt-2 block overflow-x-auto whitespace-pre font-mono text-[10.5px] text-fg-4">{r.match.source}</code>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="notes-heading" className="panel p-5">
        <SectionTitle right={<span className="font-mono text-[11.5px] text-fg-3">saved on blur</span>}>
          <span id="notes-heading">Notes</span>
        </SectionTitle>
        {practised.length === 0 ? (
          <EmptyState title="No notes yet" body="Notes appear once a skill has been practised. Pass a mission and the skill gets a notebook line here." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {practised.map((s) => (
              <NoteEditor key={s.skillId} skillId={s.skillId} skillName={s.name} anchor={s.anchor} initialValue={notes[s.skillId] ?? ""} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
