import type { Snapshot } from "@/server/state";
import { Panel, SectionTitle } from "@/components/ui";
import { relativeTime } from "@/lib/time";
import { cn } from "@/lib/cn";

const DOT: Record<string, string> = { mission: "bg-cyan", world: "bg-emerald", artifact: "bg-violet-2", unlock: "bg-amber", skill: "bg-sky", review: "bg-amber", hint: "bg-fg-4" };

export function SystemEvents({ snapshot }: { snapshot: Snapshot }) {
  const now = new Date(snapshot.now);
  return (
    <Panel>
      <SectionTitle>System Events</SectionTitle>
      {snapshot.events.length === 0 ? (
        <p className="text-[13px] text-fg-3">The log is empty. Your first run writes the first entry.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {snapshot.events.map((e) => (
            <li key={e.id} className="flex items-start gap-2.5 text-[12.5px]">
              <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", DOT[e.type] ?? "bg-fg-3")} />
              <span className="min-w-0 flex-1 text-fg-2">{e.title}</span>
              <span className="readout shrink-0 text-[11px] text-fg-4">{relativeTime(e.createdAt, now)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
