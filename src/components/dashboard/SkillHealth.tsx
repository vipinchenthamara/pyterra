import Link from "next/link";
import type { Snapshot } from "@/server/state";
import { Badge, Panel, ProgressBar, SectionTitle, type Tone } from "@/components/ui";
import { HEALTH_LABEL, type SkillHealth as H } from "@/engine/mastery";

export const HEALTH_TONE: Record<H, Tone> = { dormant: "neutral", fragile: "amber", developing: "sky", stable: "emerald", mastered: "cyan" };

export function SkillHealth({ snapshot }: { snapshot: Snapshot }) {
  const practised = snapshot.skills.filter((s) => s.timesPracticed > 0);
  const order: H[] = ["fragile", "developing", "stable", "mastered", "dormant"];
  const shown = [...practised].sort((a, b) => order.indexOf(a.health) - order.indexOf(b.health) || a.mastery - b.mastery).slice(0, 5);
  const nextLocked = snapshot.skills.find((s) => s.timesPracticed === 0);
  return (
    <Panel>
      <SectionTitle right={<Link href="/skills" className="label hover:text-cyan">All skills →</Link>}>Skill Health</SectionTitle>
      {shown.length === 0 ? (
        <p className="text-[13px] text-fg-3">No skills demonstrated yet. Your first mission introduces {nextLocked?.name ?? "variables"}.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((s) => (
            <li key={s.skillId}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <Link href={`/skills#${s.skillId}`} className="truncate text-[13.5px] font-medium text-fg hover:text-cyan">{s.name}</Link>
                <Badge tone={HEALTH_TONE[s.health]}>{HEALTH_LABEL[s.health]}</Badge>
              </div>
              <ProgressBar value={s.mastery} tone={HEALTH_TONE[s.health]} />
            </li>
          ))}
          {nextLocked && (
            <li className="flex items-center justify-between text-[13px] text-fg-4">
              <span>{nextLocked.name}</span>
              <Badge tone="neutral">Locked</Badge>
            </li>
          )}
        </ul>
      )}
    </Panel>
  );
}
