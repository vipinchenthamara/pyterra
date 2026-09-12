import Link from "next/link";
import { Wrench, Target, AlertTriangle, Boxes, Flame, ArrowRight } from "lucide-react";
import type { Snapshot } from "@/server/state";
import { Panel, SectionTitle } from "@/components/ui";
import { cn } from "@/lib/cn";

export function Briefing({ snapshot }: { snapshot: Snapshot }) {
  const missionById = new Map(snapshot.worlds.flatMap(() => []));
  void missionById;
  const skillName = (id: string) => snapshot.skills.find((s) => s.skillId === id)?.name ?? id;
  const artifactName = (id: string) => snapshot.artifacts.find((a) => a.id === id)?.name ?? id;
  const cards = snapshot.briefing;
  return (
    <Panel>
      <SectionTitle right={<span className="label">{new Date(snapshot.now).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</span>}>Today&apos;s Briefing</SectionTitle>
      {cards.length === 0 && <p className="text-[13px] text-fg-3">Nothing scheduled. Enter a world to start building.</p>}
      <ol className="flex flex-col gap-2">
        {cards.map((c, i) => {
          let icon = Target;
          let tone = "text-cyan";
          let title = "";
          let sub = "";
          let href = "";
          switch (c.kind) {
            case "review": {
              icon = Wrench; tone = "text-amber-2";
              title = `Repair: ${skillName(c.skillId)} recall`;
              sub = `${c.overdueDays > 0 ? `${c.overdueDays}d overdue · ` : ""}about ${c.minutes} minutes`;
              href = `/review/${c.reviewId}`;
              break;
            }
            case "mission": {
              const m = snapshot.next?.mission.id === c.missionId ? snapshot.next : null;
              icon = Target; tone = "text-cyan";
              title = `Next: ${m?.mission.title ?? c.missionId}`;
              sub = `${m ? `${m.worldName} · ` : ""}about ${c.minutes} minutes${c.reasons.length ? ` · ${c.reasons[0]}` : ""}`;
              href = `/missions/${c.missionId}`;
              break;
            }
            case "fragile": {
              icon = AlertTriangle; tone = "text-rose";
              title = `${skillName(c.skillId)} needs practice`;
              sub = c.missionId ? "Re-run the cheapest mission that uses it" : "Practise it in the next mission";
              href = c.missionId ? `/missions/${c.missionId}` : "/skills";
              break;
            }
            case "artifact": {
              icon = Boxes; tone = "text-violet-2";
              title = `One mission from a new build: ${artifactName(c.artifactId)}`;
              sub = "Complete it to add the artifact to Builds";
              href = `/missions/${c.missionId}`;
              break;
            }
            case "streak": {
              icon = Flame; tone = "text-amber-2";
              title = `${c.days}-day streak`;
              sub = "Soft streak. A missed day never erases progress.";
              href = "/profile";
            }
          }
          const Icon = icon;
          return (
            <li key={i}>
              <Link href={href} className="group flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-line hover:bg-panel-3">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-deep", tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-fg">{title}</span>
                  <span className="block truncate text-[12px] text-fg-3">{sub}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-fg-4 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan" />
              </Link>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
