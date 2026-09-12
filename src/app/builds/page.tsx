import { Lock } from "lucide-react";
import { ArtifactCard } from "@/components/builds/ArtifactCard";
import { Badge, Panel, Stat } from "@/components/ui";
import { getSnapshot } from "@/server/state";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const FINAL_BUILD_COMBINES = ["Python fundamentals", "API design", "Validation", "Async", "Logging", "LLM interaction", "RAG"];

export default function BuildsPage() {
  const snapshot = getSnapshot();
  const { artifacts, stats } = snapshot;
  const built = artifacts.filter((a) => a.unlocked).length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 animate-rise">
      <header>
        <h1 className="font-display text-[26px] font-semibold tracking-wide">Builds</h1>
        <p className="mt-1 text-fg-3">Evidence of capability. Every artifact is real code you wrote.</p>
      </header>

      <Panel hud className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Stat
          value={
            <>
              {built}
              <span className="text-fg-4"> / {artifacts.length}</span>
            </>
          }
          label="artifacts built"
        />
        <Stat value={stats.linesOfCode.toLocaleString("en-GB")} label="lines of code you authored" tone="emerald" />
        <Stat value={stats.missionsPassed} label="missions passed" tone="sky" />
      </Panel>

      <section aria-labelledby="artifacts-heading">
        <div className="label mb-4" id="artifacts-heading">
          Artifact gallery
        </div>
        {artifacts.length === 0 ? (
          <Panel>
            <p className="text-[13px] text-fg-3">No artifacts are defined yet.</p>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {artifacts.map((a) => (
              <ArtifactCard
                key={a.id}
                id={a.id}
                name={a.name}
                description={a.description}
                icon={a.icon}
                worldName={a.worldName}
                unlocked={a.unlocked}
                builtLabel={formatDate(a.unlockedAt)}
                code={a.code}
                architectureNotes={a.architectureNotes}
                missingMissionIds={a.missingMissionIds}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="final-build-heading">
        <div className="label mb-4" id="final-build-heading">
          Final build
        </div>
        <article className="flex flex-col gap-4 rounded-[14px] border border-dashed border-violet/40 bg-panel/40 p-6 md:flex-row md:items-center md:gap-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-violet/30 bg-violet/10 text-violet-2">
            <Lock className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-display text-[18px] font-semibold tracking-wide text-fg-2">AI Security Assistant</h3>
              <Badge tone="violet">Locked</Badge>
            </div>
            <p className="mt-1 font-mono text-[12px] text-fg-3">unlocks at World 16 · Autonomous Command</p>
            <p className="mt-3 text-[13px] leading-relaxed text-fg-3">
              The capstone combines everything the previous fifteen worlds installed: {FINAL_BUILD_COMBINES.slice(0, -1).join(", ")} and {FINAL_BUILD_COMBINES.at(-1)} — one assistant that reads, reasons and acts within limits you define.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:max-w-[260px] md:justify-end">
            {FINAL_BUILD_COMBINES.map((c) => (
              <span key={c} className="rounded-md border border-line-2 bg-bg-deep px-2 py-0.5 font-mono text-[10.5px] text-fg-3">
                {c}
              </span>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
